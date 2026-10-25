# Performance Baseline

[中文](PERFORMANCE.md)

## Current boundaries

- The Chinese homepage `/` and English homepage `/en/` show a WebP product preview first. The approximately 2.19 MB Meshopt GLB and Three.js renderer load when the conversion scene enters a 420px viewport margin. The current layout places that scene inside the initial viewport at 390×844, 768×1024, 1440×900, and 1920×1080, so those sizes generally request the GLB on the first visit. The homepage still does not request STEP or OpenCascade/WASM; the static WebP remains visible until the model is ready and when WebGL is unavailable.
- The 3D Lab at `/lab/` and `/en/lab/` selects about 2.19 MB of desktop GLB or about 1.87 MB of mobile GLB by viewport, both decoded with Meshopt; it falls back to about 11 MB of STEP and about 7.3 MB of WASM only when the GLB path fails. These experimental assets are not part of the homepage baseline. This optimization is only on the current development branch; production has not yet been verified or updated.
- While the Lab model loads or interactive loading fails, a static model poster is shown: about 45 KB on desktop or 17 KB on narrow screens. It improves visual continuity during the wait; it does not make the model ready sooner or replace WebGL after a successful load.
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

STEP remains the Lab's engineering source asset. Uncompressed desktop/mobile source GLBs live in `src/assets/source/model/` and are generated offline by `tools/prepare_model_asset.py`; `pnpm run assets:lab-models` creates the Lab's Meshopt delivery files and updates `src/data/lab-model-sizes.json`, and `pnpm run assets:story-model` creates the corresponding homepage asset. The Lab's compressed desktop/mobile outputs preserve 303 meshes and 278,784 / 228,004 triangles in about 2.19 / 1.87 MB. The page labels read from this manifest, and `pnpm run assets:check` verifies its byte counts against the delivered files. The homepage does no browser-side CAD triangulation and falls back to the static WebP if its model or WebGL is unavailable.

## Local Chromium performance sample

On 2026-10-25, before Lab asset compression, Chromium was measured against the local static preview at 390×844. Without throttling, LCP was 380ms and the static WebP was the largest-contentful element; cumulative Resource Timing transfer size was about 3.31 MB after 2.2 seconds, including 2,190,156 bytes for the story GLB. With 4× CPU throttling, 150ms latency, and 200,000 bytes/second downstream throughput, LCP was 964ms; after 9.98 seconds, cumulative transfer size was about 0.90 MB and the GLB was still loading. Two long tasks of 164ms and 94ms were observed. Both are single local browser-emulation samples, not a production SLA or real-device result.

On 2026-10-26, Chromium emulated a Pixel 5 (390×844) against the local static preview with 4× CPU throttling, 120ms latency, 1.5 Mbps downstream, and 750 Kbps upstream. The mobile GLB was 1,866,712 bytes; its first frame appeared at about 19.2 seconds while surface-detail processing was still underway. Five long tasks were observed: 229ms, 90ms, 92ms, 357ms, and 268ms. All 15 resource requests succeeded, with no console or page errors. This single emulation shows the static poster covering a long wait; it does not reduce GLB download or first-frame time and is not a real-device or SLA result.

## Historical production Chromium observation (2026-10-11)

On 2026-10-11, desktop Chromium and a 390px mobile viewport were observed against production: the homepage transferred about 175 KB and requested neither GLB nor WASM; the Lab's raw GLBs are about 9.99 MB and 8.43 MB, while sampled gzip response bodies were about 4.03 MB and 3.27 MB. After compression was enabled, a single sample reached model-ready in about 7.5 seconds and 9.1 seconds respectively; network and SwiftShader/CAD scene initialization can vary substantially. This is browser emulation, not a real-device SLA; mobile hardware measurement is still required.
