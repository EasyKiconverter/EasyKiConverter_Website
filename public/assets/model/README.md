# 3D model pipeline

The source asset is stored beside this document as `Easykiconverter_展示模型.step`. It is an ASCII STEP file from EasyEDA Pro / Open CASCADE 7.8. A direct parse of the source found 48,420 `CARTESIAN_POINT` records and a bounding range of approximately 60.74 × 47.28 × 18.00 mm.

[中文](README_zh.md)

The current website loads the source directly in the browser with the pinned `occt-import-js` 0.0.23 OpenCascade/WASM runtime. `src/js/step-worker.ts` performs loading, triangulation, bounds calculation and mesh normalization in a Web Worker; `src/js/model-viewer.ts` receives transferable vertex/index buffers and renders them through Three.js. The browser never needs a CAD application, and the original STEP file is not replaced or deleted. If WebGL, WASM, the Worker or the STEP asset fails, the page keeps its content and uses the styled visual fallback.

Runtime parameters are `linearUnit: millimeter`, `linearDeflectionType: bounding_box_ratio`, and `angularDeflection: 0.16`. `linearDeflection` is `0.004` when the stage is at least 520px wide and `0.007` below that threshold. These values affect tessellation quality; they do not impose a hard triangle cap. The worker currently transfers all generated renderable triangles. Source SHA256: `4310cdcbb920625dfdea4baac3855ec2fce4b7281ce335762c10791f0da939ce`.

The vendored runtime is `occt-import-js` 0.0.23 under LGPL-2.1; its license is stored beside the runtime. Runtime SHA256 values: JS `3fb44ce11d00611f9b3f3c5775d520ebab48930c1f08279b7b1316f05f0d3379`, WASM `33391fc9d94ea5c869a6718488bf0a9a464222bac9bdc764dfe1690cef281952`.

## Production derivation

1. Open the source STEP in a licensed Open CASCADE/FreeCAD conversion environment when a portable GLB is required.
2. Validate units, origin, orientation, solids, normals and material groups.
3. Export GLB/glTF with the source file name and a recorded converter version.
4. Decimate only after comparing silhouette and connector/pad detail; target a mobile-safe triangle budget.
5. Add the derived GLB beside this file, update the relevant Astro page and retain the STEP source.
6. Verify context-loss, missing-asset, mobile and reduced-motion fallbacks before release.

The website does not claim that the WebGL triangulation is a lossless CAD render. This keeps the source/derived-asset boundary auditable.

When the page is opened directly with `file://`, browser security prevents local STEP fetches. The script detects that protocol, skips both STEP/API requests, and leaves the page usable with its visual fallback. Use `pnpm dev`, `pnpm run preview` or a deployed HTTP(S) host to enable the real model.
