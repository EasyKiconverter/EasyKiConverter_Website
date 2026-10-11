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


ROOT = Path(__file__).resolve().parents[1]


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
    }


def validate_configuration(config: dict[str, str], *, dry_run: bool) -> None:
    if not config["host"]:
        raise SystemExit("Error: set DEPLOY_HOST to the production server hostname or IP")
    key = Path(config["key"])
    if not key.is_file() or not os.access(key, os.R_OK):
        raise SystemExit(f"Error: SSH key is not readable: {key}")
    for executable in ("pnpm", "ssh"):
        if shutil.which(executable) is None:
            raise SystemExit(f"Error: required executable not found: {executable}")
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


def upload_dist(config: dict[str, str], stage: str) -> None:
    command = ssh_command(config) + [f"tar -C {shlex.quote(stage)} -xf -"]
    print(f"+ {command_text(command)}")
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    try:
        with tarfile.open(fileobj=process.stdin, mode="w|") as archive:
            archive.add(ROOT / "dist", arcname=".")
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise subprocess.CalledProcessError(process.returncode or 1, command)


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
    swap = " ".join(
        [
            "set -eu;",
            f"previous={shlex.quote(previous)};",
            f"if [ -e {shlex.quote(config['root'])} ]; then sudo mv {shlex.quote(config['root'])} \"$previous\"; fi;",
            f"sudo mv {shlex.quote(stage)} {shlex.quote(config['root'])};",
            f"if ! sudo nginx -t; then sudo rm -rf {shlex.quote(config['root'])}; "
            f"if [ -e \"$previous\" ]; then sudo mv \"$previous\" {shlex.quote(config['root'])}; fi; exit 1; fi;",
            "sudo systemctl reload nginx;",
            f"printf 'Deployed. Backup: %s\\n' {shlex.quote(backup)}",
        ]
    )
    remote(config, swap)
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
    deploy(config, deploy_id)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, subprocess.CalledProcessError, tarfile.TarError) as error:
        print(f"Deployment failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
