# 3D model pipeline

The source asset is stored beside this document as `Easykiconverter_展示模型.step`. It is an ASCII STEP file from EasyEDA Pro / Open CASCADE 7.8. A direct parse of the source found 48,420 `CARTESIAN_POINT` records and a bounding range of approximately 60.74 × 47.28 × 18.00 mm.

[中文](README_zh.md)

The isolated 3D Lab loads the derived `Easykiconverter_展示模型.glb` on demand with Three.js `GLTFLoader`; the homepage does not load the model runtime. The GLB is generated from the checked-in STEP source by `tools/prepare_model_asset.py` and retains normalized meshes, material groups, and source-size metadata. If GLB, WebGL, or the loader fails, the Lab falls back to the pinned `occt-import-js` 0.0.23 OpenCascade/WASM runtime and parses STEP in a Web Worker. If all runtime assets fail, the Lab keeps its content and uses the styled visual fallback.

The GLB includes generated vertex normals, and the browser delivery path reuses them instead of recomputing normals for every mesh. The STEP fallback computes normals after transferring mesh data from the Worker.

The desktop GLB contains 303 meshes and 278,784 triangles; the mobile GLB contains 303 meshes, 228,004 triangles, and is about 8.1 MB. The delivery guard in `tools/check_model_assets.py` caps the desktop and mobile assets at 300,000 and 250,000 triangles respectively. The desktop conversion uses `linearUnit: millimeter`, `linearDeflectionType: bounding_box_ratio`, `linearDeflection: 0.004`, and `angularDeflection: 0.16`; only linear deflection is reduced for mobile. Viewports up to 760px or stages below 520px select the mobile GLB. The STEP fallback uses `0.007` below the 520px stage width. These values affect tessellation quality; the guard catches accidental growth but does not simplify geometry. Source SHA256: `4310cdcbb920625dfdea4baac3855ec2fce4b7281ce335762c10791f0da939ce`.

The vendored runtime is `occt-import-js` 0.0.23 under LGPL-2.1; its license is stored beside the runtime. Runtime SHA256 values: JS `3fb44ce11d00611f9b3f3c5775d520ebab48930c1f08279b7b1316f05f0d3379`, WASM `33391fc9d94ea5c869a6718488bf0a9a464222bac9bdc764dfe1690cef281952`.

## Production derivation

1. Run `python3 tools/prepare_model_asset.py` to generate the desktop GLB from the STEP source.
2. Run `python3 tools/prepare_model_asset.py --linear-deflection 0.007 --output public/assets/model/Easykiconverter_展示模型-mobile.glb` to generate the mobile GLB.
3. The tool uses the pinned repository `occt-import-js` runtime and records source-size metadata.
4. Run `pnpm run assets:check` to verify the GLB container, generated normals, source metadata, and delivery budgets.
5. Decimate only after comparing silhouette and connector/pad detail; update the explicit budgets if a new asset strategy is approved.
6. After changing either GLB, run `pnpm run build`, `python3 tools/validate_site.py`, `pnpm run assets:check`, and `pnpm run test:browser`.
7. Before release, verify the STEP/WASM fallback when GLB is missing, mobile behavior, and reduced-motion behavior while retaining the STEP source.

The website does not claim that the WebGL triangulation is a lossless CAD render. This keeps the source/derived-asset boundary auditable.

When the page is opened directly with `file://`, browser security prevents local STEP fetches. The script detects that protocol, skips both STEP/API requests, and leaves the page usable with its visual fallback. Use `pnpm dev`, `pnpm run preview` or a deployed HTTP(S) host to enable the real model.
