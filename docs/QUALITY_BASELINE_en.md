# Quality Baseline

[中文](QUALITY_BASELINE.md)

Recorded: 2026-10-15. This document records facts reproducible from the repository, CI, or an explicitly identified live check; it does not treat domain deployment or real-device performance as complete without evidence.

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
- On 2026-10-14, the post-PR #269 `Site Quality` run on the version branch (`38552835300`) passed all steps; its browser suite reported 188 passed / 4 skipped. This does not mean production was deployed.
- On 2026-10-14, mobile line-box review found orphaned final characters in the Chinese homepage showcase, format, and case titles at 390/360/390px; after tightening the three bilingual titles, 390/360px line-box checks passed in Chromium and Chromium Mobile, and the full suite reported 188 passed / 4 skipped.
- On 2026-10-14, all eight production routes returned HTTP 200, but both Chinese and English homepages contain two duplicate `<title>` elements. Current `origin/master` retains an explicit duplicate; the `version/V0.0.1` build emits one. An all-route unique-title regression has been added; production remains unchanged until the version is stable and approved for promotion.
- On 2026-10-15, PR #282 reduced the 3D Lab asynchronous edge-detail candidate cap from 160 to 96 without reducing primary GLB geometry. Local generation took about 10.9 seconds under 4× CPU throttling (about 24 seconds for the prior 160-mesh baseline); a 390×844 screenshot confirmed the silhouette and key details remained clear. Browser tests reported 190 passed / 4 skipped; PR #282 merged to the version branch and promotion PR #283 merged to `master`, with all required CI checks passing.
- On 2026-10-15, `master` was `a7b0dbf`, `version/V0.0.1` was `8211c71`, and the main project’s latest Release via GitHub API was `v3.1.13`. A new read-only check found all eight production routes returning HTTP 200; `/` and `/en/` still each contain two `<title>` elements, while the other six routes contain one. The source fix is in `master`; production remains pending approved deployment.
- On 2026-10-15, PR #284 added bilingual project status, risks, and next tasks. Site Quality and Dependency Review passed before merging to `version/V0.0.1` at `194768f`. PR checks and local build/browser validation are recorded separately; no production deployment was performed.
- On 2026-10-11, all eight production routes at `https://easykiconverter.org.cn/` returned HTTP 200; the homepage did not load the 3D runtime, same-origin model assets worked on `/lab/` and `/en/lab/`, and the legacy root-level `.msix` download remained available.
- On 2026-10-11, Chromium with SwiftShader loaded the GLB model generated from STEP geometry on production `/lab/` (278,784 triangles, no fallback, and no console errors); the tools entry initialized and remained collapsed by default.
- On 2026-10-11, both production desktop and mobile GLBs returned `model/gltf-binary`, approximately 9.6 MB and 8.1 MB, with `max-age=2592000`; WASM returned `application/wasm` with the same long-lived cache policy.

## Asset boundary

The homepage does not load STEP, WASM or the Three.js model runtime; those assets are used on demand only by the isolated 3D Lab. Original Qt screenshots live in `src/assets/source/`; WebP derivatives live in `public/assets/showcase/`.

## Verification still pending

Real-device performance and cache behavior under different network conditions still need separate measurements; a single production-header check cannot replace varied-network measurements.
