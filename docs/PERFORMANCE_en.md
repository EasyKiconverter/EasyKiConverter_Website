# Performance Baseline

[中文](PERFORMANCE.md)

## Current boundaries

- The Chinese homepage `/` and English homepage `/en/` use WebP product screenshots, CSS depth and a small page script. They do not load STEP, OpenCascade/WASM or the Three.js model runtime.
- The 3D Lab at `/lab/` and `/en/lab/` loads about 9.6 MB of GLB and the model script on demand by default; it falls back to about 11 MB of STEP and about 7.3 MB of WASM only when the GLB path fails. These experimental assets are not part of the homepage baseline.
- Homepage delivery uses `public/assets/showcase/*.webp`; original PNG, STEP and WASM files remain for provenance or the lab and have not yet been moved out of the published asset tree.
- `src/js/app.ts` keeps page animation active only while relevant and provides a static path for `prefers-reduced-motion`.

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

STEP remains the Lab's engineering source asset, while `tools/prepare_model_asset.py` generates the GLB used for default Web delivery. The homepage must not reintroduce browser-side CAD triangulation. If the Lab becomes a product feature, it still needs its own asset-size, triangle-budget and fallback browser baseline.
