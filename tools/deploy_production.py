#!/usr/bin/env python3
"""Build and deploy the static site to the configured production server.

The local orchestration uses Python's standard library so the same workflow
works on Unix and Windows hosts with Python, pnpm, and OpenSSH installed.
The remote host remains responsible for Nginx and the POSIX deployment swap.
"""

from __future__ import annotations

import argparse
import os
from datetime import datetime
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
from html.parser import HTMLParser
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
LANGUAGE_ROUTE_PAIRS = (
    ("/", "/en/"),
    ("/lab/", "/en/lab/"),
    ("/formats/", "/en/formats/"),
    ("/cases/", "/en/cases/"),
)
PUBLIC_ROUTES = tuple(route for pair in LANGUAGE_ROUTE_PAIRS for route in pair)
SITE_CHECK_USER_AGENT = "EasyKiConverter-production-check"


class PageMetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title_count = 0
        self.title_parts: list[str] = []
        self.in_title = False
        self.canonicals: list[str] = []
        self.alternates: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "title":
            self.title_count += 1
            self.in_title = True
        if tag.lower() != "link":
            return
        values = dict(attrs)
        relations = (values.get("rel") or "").lower().split()
        href = values.get("href")
        if not href:
            return
        if "canonical" in relations:
            self.canonicals.append(href)
        if "alternate" in relations and values.get("hreflang"):
            self.alternates[values["hreflang"]] = href

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)


def expected_language_urls(base_url: str, route: str) -> dict[str, str]:
    base = base_url.rstrip("/")
    for chinese_route, english_route in LANGUAGE_ROUTE_PAIRS:
        if route in (chinese_route, english_route):
            return {
                "zh-CN": f"{base}{chinese_route}",
                "en": f"{base}{english_route}",
                "x-default": f"{base}{chinese_route}",
            }
    raise ValueError(f"unregistered public route: {route}")


def validate_public_route(base_url: str, route: str, *, timeout: float) -> None:
    url = f"{base_url.rstrip('/')}{route}"
    request = Request(url, headers={"Accept": "text/html", "User-Agent": SITE_CHECK_USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        status = response.getcode()
        page = response.read().decode("utf-8", errors="replace")
    if status != 200:
        raise RuntimeError(f"{route}: expected HTTP 200, got {status}")

    parser = PageMetadataParser()
    parser.feed(page)
    if parser.title_count != 1:
        raise RuntimeError(f"{route}: expected exactly one <title>, found {parser.title_count}")
    if not "".join(parser.title_parts).strip():
        raise RuntimeError(f"{route}: <title> is empty")
    expected_canonical = url
    if parser.canonicals != [expected_canonical]:
        raise RuntimeError(
            f"{route}: expected one canonical URL {expected_canonical!r}, found {parser.canonicals!r}"
        )
    for language, expected_url in expected_language_urls(base_url, route).items():
        if parser.alternates.get(language) != expected_url:
            raise RuntimeError(
                f"{route}: hreflang {language!r} should point to {expected_url!r}, "
                f"found {parser.alternates.get(language)!r}"
            )


def verify_public_site(
    base_url: str,
    *,
    timeout: float = 10,
    attempts: int = 5,
    retry_interval: float = 2,
) -> None:
    """Check all deployed routes and SEO metadata, retrying transient failures."""
    if attempts < 1:
        raise ValueError("attempts must be at least one")
    if timeout <= 0 or retry_interval < 0:
        raise ValueError("timeout must be positive and retry_interval cannot be negative")
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            for route in PUBLIC_ROUTES:
                validate_public_route(base_url, route, timeout=timeout)
            print(f"Verified {len(PUBLIC_ROUTES)} public routes, titles, canonicals, and hreflang links")
            return
        except Exception as error:
            last_error = error
            if attempt + 1 < attempts:
                print(f"Public site check attempt {attempt + 1}/{attempts} failed: {error}; retrying")
                time.sleep(retry_interval)
    raise RuntimeError(f"Public site check failed after {attempts} attempts: {last_error}") from last_error


def setting(name: str, default: str) -> str:
    return os.environ.get(name, default)


def command_text(command: list[str]) -> str:
    return shlex.join(command)


def run(command: list[str], *, cwd: Path | None = None) -> None:
    print(f"+ {command_text(command)}")
    subprocess.run(command, cwd=cwd, check=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="validate local configuration and print the deployment plan without changing anything",
    )
    return parser


def configuration() -> dict[str, str]:
    key = setting("DEPLOY_KEY", str(Path.home() / ".ssh" / "ChatGPT_KEY"))
    return {
        "host": setting("DEPLOY_HOST", ""),
        "user": setting("DEPLOY_USER", "dennis"),
        "port": setting("DEPLOY_PORT", "2267"),
        "key": key,
        "root": setting("DEPLOY_ROOT", "/var/www/easykiconverter-website"),
        "backup_root": setting("REMOTE_BACKUP_ROOT", "/var/www/backups"),
        "base_url": setting("DEPLOY_BASE_URL", "https://easykiconverter.org.cn"),
    }


def validate_configuration(config: dict[str, str], *, dry_run: bool) -> None:
    if not config["host"]:
        raise SystemExit("Error: set DEPLOY_HOST to the production server hostname or IP")
    key = Path(config["key"])
    if not key.is_file() or not os.access(key, os.R_OK):
        raise SystemExit(f"Error: SSH key is not readable: {key}")
    for executable in ("pnpm", "scp", "ssh"):
        if shutil.which(executable) is None:
            raise SystemExit(f"Error: required executable not found: {executable}")
    public_url = urlsplit(config["base_url"])
    if (
        public_url.scheme != "https"
        or not public_url.netloc
        or public_url.path not in ("", "/")
        or public_url.query
        or public_url.fragment
        or public_url.username is not None
        or public_url.password is not None
    ):
        raise SystemExit("Error: DEPLOY_BASE_URL must be an HTTPS origin without a path, query, or fragment")
    if not dry_run and not (ROOT / "dist").is_dir():
        raise SystemExit("Error: dist/ is missing; the build must complete before upload")


def ssh_command(config: dict[str, str]) -> list[str]:
    return [
        "ssh",
        "-i",
        config["key"],
        "-p",
        config["port"],
        "-o",
        "BatchMode=yes",
        "-o",
        "StrictHostKeyChecking=accept-new",
        f"{config['user']}@{config['host']}",
    ]


def remote(config: dict[str, str], script: str, *, stdin=None) -> None:
    command = ssh_command(config) + [script]
    print(f"+ {command_text(command)}")
    subprocess.run(command, stdin=stdin, check=True)


def scp_command(config: dict[str, str], source: Path, target: str) -> list[str]:
    return [
        "scp",
        "-q",
        "-i",
        config["key"],
        "-P",
        config["port"],
        "-o",
        "BatchMode=yes",
        "-o",
        "StrictHostKeyChecking=accept-new",
        str(source),
        target,
    ]


def upload_dist(config: dict[str, str], stage: str) -> None:
    upload_id = f"{os.getpid()}-{datetime.now().astimezone().strftime('%H%M%S')}"
    remote_upload_dir = f"/tmp/easyki-website-upload-{upload_id}"
    remote_archive = f"{remote_upload_dir}/dist.tar.gz"
    remote_target = f"{config['user']}@{config['host']}"
    chunk_size = 1024 * 1024
    remote(config, f"mkdir -p {shlex.quote(remote_upload_dir)}")
    try:
        with tempfile.TemporaryDirectory(prefix="easyki-deploy-") as temp_dir:
            archive_path = Path(temp_dir) / "dist.tar.gz"
            with tarfile.open(archive_path, mode="w:gz") as archive:
                archive.add(ROOT / "dist", arcname=".")

            with archive_path.open("rb") as source:
                chunk_index = 0
                while chunk := source.read(chunk_size):
                    chunk_path = Path(temp_dir) / f"part-{chunk_index:04d}"
                    chunk_path.write_bytes(chunk)
                    run(
                        scp_command(
                            config,
                            chunk_path,
                            f"{remote_target}:{remote_upload_dir}/part-{chunk_index:04d}",
                        )
                    )
                    chunk_path.unlink()
                    chunk_index += 1

            remote(
                config,
                f"cat {shlex.quote(remote_upload_dir)}/part-* > {shlex.quote(remote_archive)} && "
                f"sudo tar -C {shlex.quote(stage)} -xzf {shlex.quote(remote_archive)}",
            )
    finally:
        try:
            remote(config, f"rm -rf {shlex.quote(remote_upload_dir)}")
        except (OSError, subprocess.CalledProcessError):
            print(f"Warning: could not clean remote upload directory: {remote_upload_dir}", file=sys.stderr)


def rollback_script(config: dict[str, str], previous: str, failed: str) -> str:
    root = shlex.quote(config["root"])
    previous_path = shlex.quote(previous)
    failed_path = shlex.quote(failed)
    return " ".join(
        [
            "set -eu;",
            f"if [ ! -e {previous_path} ]; then echo 'Previous site directory is unavailable; automatic rollback cannot continue' >&2; exit 1; fi;",
            f"if [ -e {root} ]; then sudo mv {root} {failed_path}; fi;",
            f"sudo mv {previous_path} {root};",
            "sudo nginx -t;",
            "sudo systemctl reload nginx;",
            f"printf 'Previous site restored. Failed release preserved at: %s\\n' {failed_path}",
        ]
    )


def deploy(config: dict[str, str], deploy_id: str) -> str:
    stage = f"/var/www/.easyki-website-stage-{deploy_id}"
    backup = f"{config['backup_root']}/easykiconverter-website-{deploy_id}"
    remote_target = f"{config['user']}@{config['host']}"
    print(f"Deploying {deploy_id} to {remote_target}:{config['root']}")

    setup = (
        f"sudo mkdir -p {shlex.quote(backup)} {shlex.quote(stage)} && "
        f"if [ -d {shlex.quote(config['root'])} ]; then "
        f"sudo cp -a {shlex.quote(config['root'])}/. {shlex.quote(backup)}/; fi && "
        f"sudo chown -R {shlex.quote(config['user'])}:{shlex.quote(config['user'])} "
        f"{shlex.quote(stage)}"
    )
    remote(config, setup)
    upload_dist(config, stage)

    previous = f"{config['root']}.previous-{deploy_id}"
    failed = f"{config['root']}.failed-{deploy_id}"
    swap = " ".join(
        [
            "set -eu;",
            f"previous={shlex.quote(previous)};",
            f"if [ -e {shlex.quote(config['root'])} ]; then sudo mv {shlex.quote(config['root'])} \"$previous\"; fi;",
            f"sudo mv {shlex.quote(stage)} {shlex.quote(config['root'])};",
            f"if ! sudo nginx -t; then sudo mv {shlex.quote(config['root'])} {shlex.quote(failed)}; "
            f"if [ -e \"$previous\" ]; then sudo mv \"$previous\" {shlex.quote(config['root'])}; fi; exit 1; fi;",
            f"if ! sudo systemctl reload nginx; then sudo mv {shlex.quote(config['root'])} {shlex.quote(failed)}; "
            f"if [ -e \"$previous\" ]; then sudo mv \"$previous\" {shlex.quote(config['root'])}; "
            "sudo nginx -t && sudo systemctl reload nginx; fi; exit 1; fi;",
            f"printf 'Deployed. Backup: %s\\n' {shlex.quote(backup)}",
        ]
    )
    remote(config, swap)
    try:
        verify_public_site(config["base_url"])
    except Exception as smoke_error:
        try:
            remote(config, rollback_script(config, previous, failed))
        except Exception as rollback_error:
            raise RuntimeError(
                f"Post-deploy verification failed ({smoke_error}); automatic rollback also failed "
                f"({rollback_error}). Inspect the production host immediately."
            ) from rollback_error
        raise RuntimeError(
            f"Post-deploy verification failed; the previous site was restored: {smoke_error}"
        ) from smoke_error
    return backup


def main() -> int:
    args = build_parser().parse_args()
    config = configuration()
    validate_configuration(config, dry_run=args.dry_run)
    deploy_id = datetime.now().astimezone().strftime("%Y%m%d-%H%M%S")
    if args.dry_run:
        print(f"Deployment plan: {config['user']}@{config['host']}:{config['port']}")
        print(f"Local root: {ROOT}")
        print(f"Remote root: {config['root']}")
        print(f"Deployment ID: {deploy_id}")
        return 0

    run(["pnpm", "run", "build"], cwd=ROOT)
    if not (ROOT / "dist").is_dir():
        raise SystemExit("Error: build completed without producing dist/")
    run([sys.executable, "tools/validate_site.py"], cwd=ROOT)
    deploy(config, deploy_id)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, subprocess.CalledProcessError, tarfile.TarError) as error:
        print(f"Deployment failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
