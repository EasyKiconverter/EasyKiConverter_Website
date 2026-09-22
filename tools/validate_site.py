#!/usr/bin/env python3
"""Small source and asset checks for the Astro static website."""
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
pages = [ROOT / "src/pages/index.astro", ROOT / "src/pages/en/index.astro"]
errors = []
accessibility_css = (ROOT / "src/css/accessibility.css").read_text(encoding="utf-8")
if ":focus-visible" not in accessibility_css:
    errors.append("src/css/accessibility.css: missing visible keyboard focus rule")
if "prefers-reduced-motion" not in (ROOT / "src/css/styles.css").read_text(encoding="utf-8"):
    errors.append("src/css/styles.css: missing reduced-motion rule")

for page in pages:
    text = page.read_text(encoding="utf-8")
    id_values = re.findall(r'id=["\']([^"\']+)["\']', text)
    ids = set(id_values)
    if len(ids) != len(id_values):
        errors.append(f"{page}: duplicate HTML id")
    if "Xpedition" in text:
        errors.append(f"{page}: stable homepage must not claim Xpedition")
    if "data-model-stage" not in text or "model-canvas" not in text:
        errors.append(f"{page}: missing interactive model stage")
    for marker in ("name=\"description\"", "rel=\"canonical\"", "property=\"og:title\"", "name=\"twitter:card\"", "application/ld+json", "hreflang=\"en\"", "hreflang=\"zh-CN\""):
        if marker not in text:
            errors.append(f"{page}: missing SEO marker {marker}")
    if "model-fallback-copy" not in text or "menu-button" not in text:
        errors.append(f"{page}: missing accessible interaction fallback or mobile navigation")
    if "aria-label=" not in text or "<main" not in text or "<footer" not in text:
        errors.append(f"{page}: missing semantic/accessibility landmarks")
    for marker in ("download-links", "Windows", "Linux", "macOS", "SHA256"):
        if marker not in text:
            errors.append(f"{page}: missing download marker {marker}")
    for label in re.findall(r'aria-labelledby=["\']([^"\']+)["\']', text):
        if label not in ids:
            errors.append(f"{page}: missing aria-labelledby target #{label}")
    for attribute in ("href", "src"):
        for value in re.findall(rf"{attribute}=[\"']([^\"']+)[\"']", text):
            parsed = urlparse(value)
            if value.startswith("#"):
                if value[1:] and value[1:] not in ids:
                    errors.append(f"{page}: missing fragment target {value}")
                continue
            if parsed.scheme or value.startswith("data:"):
                continue
            relative_path = parsed.path.lstrip("/")
            public_path = relative_path.removeprefix("../")
            if public_path.startswith("assets/") or public_path in {"robots.txt", "sitemap.xml"}:
                target = (ROOT / "public" / public_path).resolve()
            else:
                target = (page.parent / parsed.path).resolve()
            if not target.exists():
                errors.append(f"{page}: missing {attribute} target {value}")

for required in ("robots.txt", "sitemap.xml", "assets/model/README.md", "assets/model/Easykiconverter_展示模型.step", "assets/vendor/occt-import-js.js", "assets/vendor/occt-import-js.wasm"):
    if not (ROOT / "public" / required).exists():
        errors.append(f"missing required file: {required}")
for required in ("src/js/app.ts", "src/js/model-viewer.ts", "src/js/step-worker.ts"):
    if not (ROOT / required).exists():
        errors.append(f"missing required source: {required}")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"validated {len(pages)} pages and required assets")
