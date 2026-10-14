# Quality Baseline

[中文](QUALITY_BASELINE.md)

Recorded: 2026-10-14. This document records facts reproducible from the repository and CI; it does not treat domain deployment or real-device performance as complete without evidence.

## Verified

- Astro generates eight static pages: `/`, `/en/`, `/lab/`, `/en/lab/`, `/formats/`, `/en/formats/`, `/cases/`, and `/en/cases/`.
- `python3 tools/validate_site.py` checks final `dist/` output for duplicate IDs, fragment targets, semantic landmarks, local resources and unpublished PNG sources.
- `pnpm run test:browser` covers both homepages, desktop/mobile Chromium, mobile navigation, reduced motion, the Release version, the format matrix, Lab-route isolation and console errors.
- Release data is generated at build time by `tools/sync_release.py`; CI sets `RELEASE_SYNC_REQUIRED=1`, so network or API failure fails the build.
- `master` and `version/V0.0.1` require PRs, at least one approval, `Static site checks` and `Dependency Review`, conversation resolution, and disallow force-pushes.
- On 2026-10-14, version-branch PR #266 passed `Static site checks`, `Dependency Review`, and approval before merging; the local build, asset gate, final-site validation passed, and the browser suite reported 184 passed / 4 skipped.
- On 2026-10-14, bilingual homepage overlays were verified fully in-frame at 390/768/1440px; CI's required Release sync passed. A local Release API request returned 403 and used the static fallback.
- On 2026-10-14, all three bilingual 3D Lab mobile story states were verified without chapter/control overlap at 390×844 and 360×640; the final chapter hides the model stage to hand off cleanly to the real-app screenshot and next-step links. Chromium and Chromium Mobile regression checks passed, and actual-scroll screenshots were reviewed.
- On 2026-10-14, the first CI run caught remaining overlap in the English second story chapter at 360×640; after moving the short-screen model stage lower, both the focused regression and full browser suite passed (186 passed / 4 skipped).
- On 2026-10-11, all eight production routes at `https://easykiconverter.org.cn/` returned HTTP 200; the homepage did not load the 3D runtime, same-origin model assets worked on `/lab/` and `/en/lab/`, and the legacy root-level `.msix` download remained available.
- On 2026-10-11, Chromium with SwiftShader loaded the GLB model generated from STEP geometry on production `/lab/` (278,784 triangles, no fallback, and no console errors); the tools entry initialized and remained collapsed by default.
- On 2026-10-11, both production desktop and mobile GLBs returned `model/gltf-binary`, approximately 9.6 MB and 8.1 MB, with `max-age=2592000`; WASM returned `application/wasm` with the same long-lived cache policy.

## Asset boundary

The homepage does not load STEP, WASM or the Three.js model runtime; those assets are used on demand only by the isolated 3D Lab. Original Qt screenshots live in `src/assets/source/`; WebP derivatives live in `public/assets/showcase/`.

## Verification still pending

Real-device performance and cache behavior under different network conditions still need separate measurements; a single production-header check cannot replace varied-network measurements.
