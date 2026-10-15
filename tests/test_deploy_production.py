"""Unit tests for deployment verification and rollback behavior (no SSH/deploy)."""

from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
import unittest
from unittest.mock import patch

from tools import deploy_production


class SmokeTestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self.server.request_user_agents.append(self.headers.get("User-Agent"))  # type: ignore[attr-defined]
        path = self.path
        known_routes = set(deploy_production.PUBLIC_ROUTES)
        if path not in known_routes:
            self.send_error(404)
            return
        failures_remaining = self.server.temporary_failures.get(path, 0)  # type: ignore[attr-defined]
        if failures_remaining:
            self.server.temporary_failures[path] = failures_remaining - 1  # type: ignore[attr-defined]
            self.send_error(503)
            return

        base_url = f"http://{self.headers['Host']}"
        chinese_route, english_route = next(
            pair for pair in deploy_production.LANGUAGE_ROUTE_PAIRS if path in pair
        )
        title = f"Page {path}"
        title_tags = f"<title>{title}</title>"
        if path in self.server.duplicate_title_routes:  # type: ignore[attr-defined]
            title_tags += f"<title>Duplicate {title}</title>"
        canonical = f"{base_url}{path}"
        if path in self.server.bad_canonical_routes:  # type: ignore[attr-defined]
            canonical = f"{base_url}/wrong/"
        body = (
            "<!doctype html><html><head>"
            f"{title_tags}"
            f'<link rel="canonical" href="{canonical}">'
            f'<link rel="alternate" hreflang="zh-CN" href="{base_url}{chinese_route}">'
            f'<link rel="alternate" hreflang="en" href="{base_url}{english_route}">'
            f'<link rel="alternate" hreflang="x-default" href="{base_url}{chinese_route}">'
            "</head><body><main>Content</main></body></html>"
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        pass


class PublicSiteVerificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = HTTPServer(("127.0.0.1", 0), SmokeTestHandler)
        cls.server.duplicate_title_routes = set()  # type: ignore[attr-defined]
        cls.server.bad_canonical_routes = set()  # type: ignore[attr-defined]
        cls.server.temporary_failures = {}  # type: ignore[attr-defined]
        cls.server.request_user_agents = []  # type: ignore[attr-defined]
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def setUp(self) -> None:
        self.server.duplicate_title_routes = set()  # type: ignore[attr-defined]
        self.server.bad_canonical_routes = set()  # type: ignore[attr-defined]
        self.server.temporary_failures = {}  # type: ignore[attr-defined]
        self.server.request_user_agents = []  # type: ignore[attr-defined]

    def test_accepts_all_routes_with_one_title_and_valid_language_metadata(self) -> None:
        deploy_production.verify_public_site(
            self.base_url,
            timeout=2,
            attempts=1,
            retry_interval=0,
        )
        self.assertEqual(
            self.server.request_user_agents,
            [deploy_production.SITE_CHECK_USER_AGENT] * len(deploy_production.PUBLIC_ROUTES),
        )

    def test_rejects_duplicate_homepage_title(self) -> None:
        self.server.duplicate_title_routes = {"/"}  # type: ignore[attr-defined]
        with self.assertRaisesRegex(RuntimeError, r"/.*expected exactly one <title>, found 2"):
            deploy_production.verify_public_site(
                self.base_url,
                timeout=2,
                attempts=1,
                retry_interval=0,
            )

    def test_rejects_wrong_canonical_url(self) -> None:
        self.server.bad_canonical_routes = {"/en/"}  # type: ignore[attr-defined]
        with self.assertRaisesRegex(RuntimeError, r"/en/.*canonical"):
            deploy_production.verify_public_site(
                self.base_url,
                timeout=2,
                attempts=1,
                retry_interval=0,
            )

    def test_retries_transient_http_failure(self) -> None:
        self.server.temporary_failures = {"/": 1}  # type: ignore[attr-defined]
        deploy_production.verify_public_site(
            self.base_url,
            timeout=2,
            attempts=2,
            retry_interval=0,
        )


class DeploymentRollbackTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = {
            "host": "example.test",
            "user": "deploy",
            "port": "22",
            "key": "/unused/test-key",
            "root": "/var/www/site",
            "backup_root": "/var/backups",
            "base_url": "https://example.test",
        }

    def test_successful_deployment_runs_public_check_after_swap(self) -> None:
        events: list[tuple[str, str]] = []

        def remote(_config: dict[str, str], script: str, *, stdin=None) -> None:
            events.append(("remote", script))

        def upload(_config: dict[str, str], stage: str) -> None:
            events.append(("upload", stage))

        def verify(base_url: str) -> None:
            events.append(("verify", base_url))

        with (
            patch.object(deploy_production, "remote", side_effect=remote),
            patch.object(deploy_production, "upload_dist", side_effect=upload),
            patch.object(deploy_production, "verify_public_site", side_effect=verify),
        ):
            backup = deploy_production.deploy(self.config, "test-id")

        self.assertEqual(backup, "/var/backups/easykiconverter-website-test-id")
        self.assertEqual([event[0] for event in events], ["remote", "upload", "remote", "verify"])
        self.assertEqual(events[-1], ("verify", "https://example.test"))

    def test_failed_public_check_restores_previous_site(self) -> None:
        scripts: list[str] = []

        def remote(_config: dict[str, str], script: str, *, stdin=None) -> None:
            scripts.append(script)

        with (
            patch.object(deploy_production, "remote", side_effect=remote),
            patch.object(deploy_production, "upload_dist"),
            patch.object(
                deploy_production,
                "verify_public_site",
                side_effect=RuntimeError("duplicate homepage title"),
            ),
        ):
            with self.assertRaisesRegex(RuntimeError, "previous site was restored"):
                deploy_production.deploy(self.config, "test-id")

        self.assertEqual(len(scripts), 3)
        self.assertIn("site.previous-test-id", scripts[-1])
        self.assertIn("site.failed-test-id", scripts[-1])
        self.assertIn("sudo nginx -t", scripts[-1])
        self.assertIn("sudo systemctl reload nginx", scripts[-1])


if __name__ == "__main__":
    unittest.main()
