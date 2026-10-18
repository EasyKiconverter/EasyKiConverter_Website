# Performance Baseline

[中文](PERFORMANCE.md)

## Current boundaries

- The Chinese homepage `/` and English homepage `/en/` use WebP product screenshots and CSS depth above the fold, with no STEP or OpenCascade/WASM request. Only near the conversion story do they load the approximately 2.19 MB Meshopt GLB and Three.js renderer code.
- The 3D Lab at `/lab/` and `/en/lab/` selects about 9.6 MB of desktop GLB or about 8.1 MB of mobile GLB by viewport; it falls back to about 11 MB of STEP and about 7.3 MB of WASM only when the GLB path fails. These experimental assets are not part of the homepage baseline.
- Homepage delivery uses `public/assets/showcase/*.webp`; original PNG, STEP and WASM files remain for provenance or the lab and have not yet been moved out of the published asset tree.
- `src/js/app.ts` handles visibility, viewport-size and live `prefers-reduced-motion` changes. The actual 3D parts move through assembled → separated → assembled states only with scroll; reduced-motion fixes the model in its assembled state and stops continuous animation.

## Repeatable checks

```bash
pnpm run build
python3 tools/validate_site.py
pnpm run test:browser
```

The build validator checks the final `dist/` pages for duplicate IDs, fragment targets, semantic landmarks and local resources. Playwright checks both homepages, mobile navigation, reduced motion, the Release version and console errors. CI also serves the generated site and checks `/`, `/en/`, `/robots.txt` and `/sitemap.xml`.

## Evidence boundary

Older STEP/WASM, Worker, Lighthouse 100 and TBT 0 ms observations describe the former 3D narrative experiment. They do not describe the current homepage and are not production SLAs. A future performance report must measure homepage and Lab separately, including network waterfall, LCP, CLS, TBT, memory, FPS and real-device results; do not add inferred numbers before those measurements exist.

## Asset decision

STEP remains the Lab's engineering source asset, while `tools/prepare_model_asset.py` generates the base GLB. The homepage story GLB is further Meshopt-compressed by `pnpm run assets:story-model`, preserving 303 meshes and 278,784 triangles under a 2.5 MB / 300,000-triangle delivery budget. The homepage does no browser-side CAD triangulation and falls back to the static WebP if its model or WebGL is unavailable.

## Production Chromium observation

On 2026-10-11, desktop Chromium and a 390px mobile viewport were observed against production: the homepage transferred about 175 KB and requested neither GLB nor WASM; the Lab's raw GLBs are about 9.99 MB and 8.43 MB, while sampled gzip response bodies were about 4.03 MB and 3.27 MB. After compression was enabled, a single sample reached model-ready in about 7.5 seconds and 9.1 seconds respectively; network and SwiftShader/CAD scene initialization can vary substantially. This is browser emulation, not a real-device SLA; mobile hardware measurement is still required.
