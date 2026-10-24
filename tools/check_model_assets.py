#!/usr/bin/env python3
"""Validate the STEP/source GLBs and optimized browser-delivery assets."""

from __future__ import annotations

import argparse
import json
import struct
from dataclasses import asdict, dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODEL_ROOT = ROOT / "public/assets/model"
SOURCE_MODEL_ROOT = ROOT / "src/assets/source/model"
STEP_PATH = MODEL_ROOT / "Easykiconverter_展示模型.step"
SOURCE_ASSETS = {
    "desktop": SOURCE_MODEL_ROOT / "Easykiconverter_展示模型.glb",
    "mobile": SOURCE_MODEL_ROOT / "Easykiconverter_展示模型-mobile.glb",
}
ASSETS = {
    "desktop": MODEL_ROOT / "Easykiconverter_展示模型.glb",
    "mobile": MODEL_ROOT / "Easykiconverter_展示模型-mobile.glb",
    "story": ROOT / "public/assets/showcase/easyki-conversion-story.glb",
}
SIZE_MANIFEST = ROOT / "src/data/lab-model-sizes.json"
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


def inspect_asset(name: str, path: Path, require_meshopt: bool) -> AssetReport:
    document = read_glb(path)
    if require_meshopt and "EXT_meshopt_compression" not in document.get("extensionsRequired", []):
        raise ValueError(f"{path}: browser-delivery GLB must require Meshopt geometry compression")
    extensions_used = set(document.get("extensionsUsed", []))
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
            if accessors[position_index].get("componentType") != 5126 and "KHR_mesh_quantization" not in extensions_used:
                raise ValueError(f"{path}: quantized positions must declare KHR_mesh_quantization")
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
    parser.add_argument("--max-story-triangles", type=int, default=300_000)
    parser.add_argument("--max-desktop-bytes", type=int, default=2_500_000)
    parser.add_argument("--max-mobile-bytes", type=int, default=2_100_000)
    parser.add_argument("--max-story-bytes", type=int, default=2_500_000)
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()
    errors: list[str] = []
    reports: list[AssetReport] = []
    source_reports: dict[str, AssetReport] = {}
    if not STEP_PATH.is_file():
        errors.append(f"missing STEP source: {STEP_PATH.relative_to(ROOT)}")
    elif STEP_PATH.stat().st_size == 0:
        errors.append("STEP source is empty")
    for name, path in SOURCE_ASSETS.items():
        if not path.is_file():
            errors.append(f"missing {name} source GLB: {path.relative_to(ROOT)}")
            continue
        try:
            source_reports[name] = inspect_asset(name, path, require_meshopt=False)
        except (OSError, ValueError, KeyError, IndexError, json.JSONDecodeError) as error:
            errors.append(str(error))
    for name, path in ASSETS.items():
        if not path.is_file():
            errors.append(f"missing {name} GLB: {path.relative_to(ROOT)}")
            continue
        try:
            reports.append(inspect_asset(name, path, require_meshopt=True))
        except (OSError, ValueError, KeyError, IndexError, json.JSONDecodeError) as error:
            errors.append(str(error))
    try:
        size_manifest = json.loads(SIZE_MANIFEST.read_text(encoding="utf-8"))
        for name in ("desktop", "mobile"):
            report = next((item for item in reports if item.name == name), None)
            if report is not None and size_manifest.get(name) != report.bytes:
                errors.append(
                    f"{name}: size manifest has {size_manifest.get(name)!r} bytes, "
                    f"but the delivery GLB has {report.bytes:,} bytes"
                )
    except (OSError, json.JSONDecodeError) as error:
        errors.append(f"invalid Lab model size manifest {SIZE_MANIFEST.relative_to(ROOT)}: {error}")
    limits = {"desktop": args.max_desktop_triangles, "mobile": args.max_mobile_triangles, "story": args.max_story_triangles}
    byte_limits = {"desktop": args.max_desktop_bytes, "mobile": args.max_mobile_bytes, "story": args.max_story_bytes}
    for report in reports:
        if report.triangles > limits[report.name]:
            errors.append(f"{report.name}: {report.triangles:,} triangles exceed {limits[report.name]:,} budget")
        if report.bytes > byte_limits[report.name]:
            errors.append(f"{report.name}: {report.bytes:,} bytes exceed {byte_limits[report.name]:,} delivery budget")
        if report.normals != report.primitives:
            errors.append(f"{report.name}: every primitive must provide generated normals")
        source = source_reports.get(report.name)
        if source and (report.meshes, report.primitives, report.triangles, report.normals) != (
            source.meshes,
            source.primitives,
            source.triangles,
            source.normals,
        ):
            errors.append(f"{report.name}: optimized GLB geometry counts differ from its source GLB")
        if source and report.source_span_mm is not None and source.source_span_mm is not None:
            if abs(report.source_span_mm - source.source_span_mm) > 1e-5:
                errors.append(f"{report.name}: optimized GLB source span differs from its source GLB")
    if args.as_json:
        print(json.dumps({"source_assets": [asdict(report) for report in source_reports.values()], "assets": [asdict(report) for report in reports], "errors": errors}, ensure_ascii=False, indent=2))
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
