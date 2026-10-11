#!/usr/bin/env python3
"""Validate the checked-in STEP source and browser-delivery GLB assets."""

from __future__ import annotations

import argparse
import json
import struct
from dataclasses import asdict, dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODEL_ROOT = ROOT / "public/assets/model"
STEP_PATH = MODEL_ROOT / "Easykiconverter_展示模型.step"
ASSETS = {
    "desktop": MODEL_ROOT / "Easykiconverter_展示模型.glb",
    "mobile": MODEL_ROOT / "Easykiconverter_展示模型-mobile.glb",
}
GLB_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


@dataclass(frozen=True)
class AssetReport:
    name: str
    path: str
    bytes: int
    meshes: int
    primitives: int
    triangles: int
    normals: int
    source_span_mm: float | None


def read_glb(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError(f"{path}: GLB header is incomplete")
    magic, version, declared_length = struct.unpack_from("<III", data, 0)
    if magic != GLB_MAGIC or version != 2:
        raise ValueError(f"{path}: expected glTF 2.0 binary container")
    if declared_length != len(data):
        raise ValueError(f"{path}: header length {declared_length} != file length {len(data)}")

    offset = 12
    document: dict | None = None
    binary_length = 0
    while offset + 8 <= len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        if len(chunk) != chunk_length:
            raise ValueError(f"{path}: truncated GLB chunk")
        if chunk_type == JSON_CHUNK:
            document = json.loads(chunk.rstrip(b" \t\r\n").decode("utf-8"))
        elif chunk_type == BIN_CHUNK:
            binary_length = chunk_length
        offset += chunk_length
    if document is None or binary_length == 0:
        raise ValueError(f"{path}: missing JSON or binary GLB chunk")
    buffers = document.get("buffers", [])
    if not buffers or int(buffers[0].get("byteLength", 0)) > binary_length:
        raise ValueError(f"{path}: declared buffer does not fit binary chunk")
    return document


def inspect_asset(name: str, path: Path) -> AssetReport:
    document = read_glb(path)
    accessors = document.get("accessors", [])
    meshes = document.get("meshes", [])
    primitives = 0
    triangles = 0
    normals = 0
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            primitives += 1
            attributes = primitive.get("attributes", {})
            position_index = attributes.get("POSITION")
            if not isinstance(position_index, int) or position_index >= len(accessors):
                raise ValueError(f"{path}: primitive is missing a valid POSITION accessor")
            normal_index = attributes.get("NORMAL")
            if not isinstance(normal_index, int) or normal_index >= len(accessors):
                raise ValueError(f"{path}: primitive is missing a valid NORMAL accessor")
            normals += 1
            if primitive.get("mode", 4) != 4:
                raise ValueError(f"{path}: only TRIANGLES primitives are supported")
            index = primitive.get("indices")
            count = accessors[index]["count"] if isinstance(index, int) else accessors[position_index]["count"]
            triangles += int(count) // 3

    extras = document.get("asset", {}).get("extras", {})
    span = extras.get("sourceModelSpanMm")
    if not isinstance(span, (int, float)) or span <= 0:
        raise ValueError(f"{path}: missing positive sourceModelSpanMm metadata")
    if len(extras.get("sourceModelCenterMm", [])) != 3:
        raise ValueError(f"{path}: missing sourceModelCenterMm metadata")
    return AssetReport(name, str(path.relative_to(ROOT)), path.stat().st_size, len(meshes), primitives, triangles, normals, float(span))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-desktop-triangles", type=int, default=300_000)
    parser.add_argument("--max-mobile-triangles", type=int, default=250_000)
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()
    errors: list[str] = []
    reports: list[AssetReport] = []
    if not STEP_PATH.is_file():
        errors.append(f"missing STEP source: {STEP_PATH.relative_to(ROOT)}")
    elif STEP_PATH.stat().st_size == 0:
        errors.append("STEP source is empty")
    for name, path in ASSETS.items():
        if not path.is_file():
            errors.append(f"missing {name} GLB: {path.relative_to(ROOT)}")
            continue
        try:
            reports.append(inspect_asset(name, path))
        except (OSError, ValueError, KeyError, IndexError, json.JSONDecodeError) as error:
            errors.append(str(error))
    limits = {"desktop": args.max_desktop_triangles, "mobile": args.max_mobile_triangles}
    for report in reports:
        if report.triangles > limits[report.name]:
            errors.append(f"{report.name}: {report.triangles:,} triangles exceed {limits[report.name]:,} budget")
        if report.normals != report.primitives:
            errors.append(f"{report.name}: every primitive must provide generated normals")
    if args.as_json:
        print(json.dumps({"assets": [asdict(report) for report in reports], "errors": errors}, ensure_ascii=False, indent=2))
    else:
        for report in reports:
            print(f"{report.name}: {report.bytes:,} bytes · {report.meshes} meshes · {report.triangles:,} triangles · {report.normals} normal sets")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("model asset checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
