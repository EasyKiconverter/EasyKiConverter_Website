# Performance Record

[中文](PERFORMANCE.md)

## Current implementation

- STEP source: about 11 MB, retained as the source asset.
- WASM importer: `occt-import-js` 0.0.23, about 7.3 MB.
- Mesh budget: at most 75,000 triangles on desktop and 36,000 on narrow screens.
- DPR: capped at 1.7.
- First view: text and layout appear first; STEP/WASM loading starts asynchronously after script initialization.
- Render loop: it runs continuously only while the hero is visible and the page is active; it pauses off-screen or in the background and wakes on return.
- Three.js: the real model is rendered with `BufferGeometry`, vertex colors and standard materials.
- Main Qt Quick screenshot: the page loads an approximately 158 KB WebP; the original PNG remains in `public/assets/showcase/` for provenance.

## Browser observation

Using the local HTTP page and Chrome 153 with Lighthouse 12.8.2 (`--throttling-method=provided`, desktop viewport, software WebGL), both indexable pages were checked:

| Page | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chinese `/` | 100 | 100 | 100 | 100 | 0.53 s | 0.53 s | 0 | 0 ms |
| English `/en/` | 100 | 100 | 100 | 100 | 0.48 s | 0.48 s | 0 | 0 ms |

Browser CDP also observed a three-second window after the real STEP model finished loading:

- `TaskDuration`: about 0.175 s
- `ScriptDuration`: about 0.023 s
- `JSHeapUsedSize`: about 5.8 MB
- Console: no errors or warnings
- `model-loaded`: true, `model-fallback`: false

OCCT initialization, STEP reading, triangulation, and mesh preparation run in `src/js/step-worker.ts`; the main thread only receives a transferable vertex buffer and passes it to the Three.js scene in `src/js/model-viewer.ts`. Before the Worker change Lighthouse measured about 36.9 seconds of TBT; after it both language pages measure 0 ms.

These are single observations on the development machine. Real self-hosted-server, integrated-graphics, Retina, 4K, and mobile-device Chrome Performance, FPS, and network-waterfall checks remain necessary.

When opened directly as `file://`, the script skips STEP and Release API requests. Local HTTP previews also skip the GitHub Release API to avoid development-machine rate-limit 403 noise and use the same stable fallback; the API is enabled on a real HTTP(S) deployment.
