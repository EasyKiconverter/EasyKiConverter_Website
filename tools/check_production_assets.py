#!/usr/bin/env python3
"""Verify production routes and cache/MIME headers for Lab assets."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass
class AssetResult:
    path: str
    status: int
    content_type: str
    content_length: str
    cache_control: str


def fetch(base: str, path: str) -> AssetResult:
    request = Request(f"{base.rstrip('/')}{path}", method="HEAD", headers={"User-Agent": "EasyKiConverter-production-check"})
    try:
        with urlopen(request, timeout=15) as response:
            headers = response.headers
            return AssetResult(
                path=path,
                status=response.status,
                content_type=headers.get("Content-Type", ""),
                content_length=headers.get("Content-Length", ""),
                cache_control=headers.get("Cache-Control", ""),
            )
    except (HTTPError, URLError) as error:
        raise SystemExit(f"production request failed for {path}: {error}") from error


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://easykiconverter.org.cn")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()
    assets = [
        "/",
        "/en/",
        "/lab/",
        "/en/lab/",
        "/assets/model/Easykiconverter_%E5%B1%95%E7%A4%BA%E6%A8%A1%E5%9E%8B.glb",
        "/assets/model/Easykiconverter_%E5%B1%95%E7%A4%BA%E6%A8%A1%E5%9E%8B.step",
        "/assets/vendor/occt-import-js.wasm",
    ]
    results = [fetch(args.base_url, path) for path in assets]
    errors: list[str] = []
    for result in results:
        if result.status != 200:
            errors.append(f"{result.path}: expected HTTP 200, got {result.status}")
    glb = next(result for result in results if result.path.endswith(".glb"))
    wasm = next(result for result in results if result.path.endswith(".wasm"))
    if not glb.content_type.startswith("model/gltf-binary"):
        errors.append(f"{glb.path}: expected model/gltf-binary, got {glb.content_type or 'missing'}")
    if not wasm.content_type.startswith("application/wasm"):
        errors.append(f"{wasm.path}: expected application/wasm, got {wasm.content_type or 'missing'}")
    for asset in (glb, wasm):
        if not {"public", "immutable"}.issubset({part.strip() for part in asset.cache_control.split(",")}):
            errors.append(f"{asset.path}: expected public, immutable cache policy, got {asset.cache_control or 'missing'}")
        if "max-age=" not in asset.cache_control:
            errors.append(f"{asset.path}: expected an explicit max-age cache policy")
    if args.as_json:
        print(json.dumps({"base_url": args.base_url, "assets": [asdict(result) for result in results], "errors": errors}, ensure_ascii=False, indent=2))
    else:
        for result in results:
            print(f"{result.status} {result.path} · {result.content_type} · {result.cache_control or 'no-cache-header'}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("production asset checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
