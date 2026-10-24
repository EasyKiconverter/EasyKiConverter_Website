#!/usr/bin/env python3
"""Build an uncompressed source GLB from the checked-in STEP source."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "public/assets/model/Easykiconverter_展示模型.step"
DEFAULT_RUNTIME = ROOT / "public/assets/vendor"
DEFAULT_OUTPUT = ROOT / "src/assets/source/model/Easykiconverter_展示模型.glb"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--runtime", type=Path, default=DEFAULT_RUNTIME)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--linear-deflection", type=float, default=0.004)
    args = parser.parse_args()

    node = shutil.which("node")
    if node is None:
        parser.error("Node.js is required because occt-import-js is the checked-in STEP parser")
    for required in (args.input, args.runtime / "occt-import-js.js", args.runtime / "occt-import-js.wasm"):
        if not required.is_file():
            parser.error(f"missing model pipeline input: {required}")

    command = [
        node,
        str(ROOT / "tools/step_to_glb.mjs"),
        "--input",
        str(args.input),
        "--runtime",
        str(args.runtime),
        "--output",
        str(args.output),
        "--linear-deflection",
        str(args.linear_deflection),
    ]
    completed = subprocess.run(command, cwd=ROOT, check=True, text=True, capture_output=True)
    print(json.dumps(json.loads(completed.stdout), ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
