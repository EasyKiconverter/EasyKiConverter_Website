# 3D model pipeline

The STEP source is stored beside this document as `Easykiconverter_展示模型.step`. It is an ASCII STEP file from EasyEDA Pro / Open CASCADE 7.8. The uncompressed desktop and mobile GLB intermediates are kept in `src/assets/source/model/`; optimized browser delivery GLBs are stored beside this document. A direct STEP parse found 48,420 `CARTESIAN_POINT` records and a bounding range of approximately 60.74 × 47.28 × 18.00 mm.

[中文](README_zh.md)

The isolated 3D Lab loads the optimized desktop or mobile GLB on demand with Three.js `GLTFLoader` and its Meshopt decoder. The homepage uses a static WebP above the fold, then lazily loads `public/assets/showcase/easyki-conversion-story.glb` near its scroll narrative. Lab and homepage delivery models use Meshopt compression and preserve the source meshes for part separation. Source GLBs are generated offline from STEP; the story and Lab delivery assets are then optimized offline. If GLB, WebGL, or the loader fails, the Lab falls back to the pinned `occt-import-js` 0.0.23 OpenCascade/WASM runtime and parses STEP in a Web Worker. If all runtime assets fail, the Lab keeps its content and uses the styled visual fallback.

The GLB includes generated vertex normals, and the browser delivery path reuses them instead of recomputing normals for every mesh. The STEP fallback computes normals after transferring mesh data from the Worker.

The source GLBs contain 303 meshes: desktop has 278,784 triangles and mobile has 228,004. Meshopt browser delivery currently produces approximately 2.19 MB desktop and 1.87 MB mobile GLBs; actual transfer size depends on server HTTP compression. `tools/check_model_assets.py` caps desktop/mobile/story models at 300,000 / 250,000 / 300,000 triangles and desktop/mobile/story delivery files at 2.5 / 2.1 / 2.5 MB. The desktop conversion uses `linearUnit: millimeter`, `linearDeflectionType: bounding_box_ratio`, `linearDeflection: 0.004`, and `angularDeflection: 0.16`; only linear deflection is reduced for mobile. Viewports up to 760px or stages below 520px select the mobile GLB. The STEP fallback uses `0.007` below the 520px stage width. These values affect tessellation quality; the guard catches accidental growth but does not simplify geometry. Source STEP SHA256: `4310cdcbb920625dfdea4baac3855ec2fce4b7281ce335762c10791f0da939ce`.

The vendored runtime is `occt-import-js` 0.0.23 under LGPL-2.1; its license is stored beside the runtime. Runtime SHA256 values: JS `3fb44ce11d00611f9b3f3c5775d520ebab48930c1f08279b7b1316f05f0d3379`, WASM `33391fc9d94ea5c869a6718488bf0a9a464222bac9bdc764dfe1690cef281952`.

## Production derivation

1. Run `python3 tools/prepare_model_asset.py` to generate the desktop source GLB in `src/assets/source/model/`.
2. Run `python3 tools/prepare_model_asset.py --linear-deflection 0.007 --output src/assets/source/model/Easykiconverter_展示模型-mobile.glb` to generate the mobile source GLB.
3. Run `pnpm run assets:lab-models` to create the Lab's Meshopt-compressed desktop and mobile delivery GLBs in `public/assets/model/`.
4. Run `pnpm run assets:story-model` to create the homepage's Meshopt-compressed asset from the desktop source GLB.
5. The STEP converter uses the pinned repository `occt-import-js` runtime and records source-size metadata.
6. Run `pnpm run assets:check` to compare source and delivery geometry and verify normals, metadata, compression and size budgets.
7. Decimate only after comparing silhouette and connector/pad detail; update explicit budgets only with that review.
8. After changing any model, run `pnpm run build`, `python3 tools/validate_site.py`, `pnpm run assets:check`, and `pnpm run test:browser`.
9. Before release, verify the STEP/WASM Lab fallback when GLB is missing, the homepage WebP fallback, mobile behavior, and reduced-motion behavior while retaining the STEP source.

The website does not claim that the WebGL triangulation is a lossless CAD render. This keeps the source/derived-asset boundary auditable.

When the page is opened directly with `file://`, browser security prevents local STEP fetches. The script detects that protocol, skips both STEP/API requests, and leaves the page usable with its visual fallback. Use `pnpm dev`, `pnpm run preview` or a deployed HTTP(S) host to enable the real model.
