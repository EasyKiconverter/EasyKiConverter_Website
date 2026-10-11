# Quality Baseline

[中文](QUALITY_BASELINE.md)

Recorded: 2026-10-11. This document records facts reproducible from the repository and CI; it does not treat domain deployment or real-device performance as complete without evidence.

## Verified

- Astro generates eight static pages: `/`, `/en/`, `/lab/`, `/en/lab/`, `/formats/`, `/en/formats/`, `/cases/`, and `/en/cases/`.
- `python3 tools/validate_site.py` checks final `dist/` output for duplicate IDs, fragment targets, semantic landmarks, local resources and unpublished PNG sources.
- `pnpm run test:browser` covers both homepages, desktop/mobile Chromium, mobile navigation, reduced motion, the Release version, the format matrix, Lab-route isolation and console errors.
- Release data is generated at build time by `tools/sync_release.py`; CI sets `RELEASE_SYNC_REQUIRED=1`, so network or API failure fails the build.
- `master` and `version/V0.0.1` require PRs, at least one approval, `Static site checks` and `Dependency Review`, conversation resolution, and disallow force-pushes.
- On 2026-10-11, all eight production routes at `https://easykiconverter.org.cn/` returned HTTP 200; the homepage did not load the 3D runtime, same-origin model assets worked on `/lab/` and `/en/lab/`, and the legacy root-level `.msix` download remained available.
- On 2026-10-11, Chromium with SwiftShader loaded the real STEP model on production `/lab/` (278,784 triangles, no fallback, and no console errors); the tools entry initialized and remained collapsed by default.

## Asset boundary

The homepage does not load STEP, WASM or the Three.js model runtime; those assets are used on demand only by the isolated 3D Lab. Original Qt screenshots live in `src/assets/source/`; WebP derivatives live in `public/assets/showcase/`.

## Verification still pending

Real-device performance and cache behavior under different network conditions still need separate measurements; static builds, CI, and desktop SwiftShader results cannot replace those checks.
