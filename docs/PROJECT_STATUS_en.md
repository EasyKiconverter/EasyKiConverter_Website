# Project Status and Plan

[中文](PROJECT_STATUS.md)

Last checked: 2026-10-15. This status is based on the current repository, GitHub PRs/checks, Release API, and read-only live-site checks. External state can change and must be rechecked before action.

## Project Goal

Explain EasyKiConverter’s real workflow in Chinese and English, show the actual application and traceable conversion evidence, and guide visitors to the current stable release. Keep the site accessible, responsive, and lightweight, with the heavy CAD viewer runtime isolated in the 3D Lab.

## Current Stage

The project is in V0.0.1 stability maintenance and ongoing visitor-experience improvement. PRs #311/#312 aligned and promoted the homepage’s bilingual four-step workflow. PR #313 fixed the English Cases CTA overflow at 320px; PR #315 promoted it to `master` after version-branch CI, required checks, and independent approval passed. This 320px review found the English Formats actions extending 12px beyond their content column; PR #320 added narrow-screen wrapping and bilingual regression coverage, merged into the version branch, and its post-merge Site Quality run `38652951622` passed (200 passed, 4 skipped). PRs #316/#319 synchronized promotion ancestry only and did not change the file tree. The main project’s latest Release via the GitHub API is `v3.1.13`. Production was not deployed.


This cycle continued WEB-04 and extended title audits to 320px. The Chinese 3D Lab heading wrapped as “真实几何，独立实 / 验。” at 320px. Slightly reducing this page’s heading size at the mobile breakpoint fixed it; bilingual Home, Formats, Cases, and Lab title regressions check for orphaned Han characters at 320/360/390px. PR #323 merged into `version/V0.0.1` at `4901a8b`; post-merge Site Quality run `38656977540` passed (200 passed / 4 skipped). PR #325 promoted the change to `master` at `b4cba0e`, whose post-merge Site Quality run `38658741923` also passed (200 passed / 4 skipped). Runner font metrics can wrap the case title onto two lines and English Home/Formats titles onto up to three lines at 320px, so only the 320px line limits allow these natural wraps; the Han orphan check and tighter 360/390px limits remain. This is browser viewport evidence, not a real-device test.

This WEB-04 visual review found that the bilingual 3D Lab view-switcher labels wrapped inside the desktop stage, with Chinese labels stacking vertically. The controls now keep labels on one line and scroll horizontally when space is constrained; bilingual desktop/tablet/mobile Playwright coverage was expanded. PR #328 received approval from an independent account and merged into `version/V0.0.1` at `8e0d78b`. PR Site Quality run `38663549115` and post-merge run `38664077716` both passed (200 passed / 4 skipped). Local build, Astro diagnostics, all eight route validations, and model-asset checks passed as well. The Release API rate-limited with HTTP 403, so the checked-in `v3.1.13` fallback was used. No production deployment or physical-device test was performed.

A follow-up review of the same Lab stage found collisions among bilingual model metadata/view controls, the advanced-controls entry, and the bottom slice panel/caption at some viewport sizes; the caption also obscured the model. PR #331 separates the top controls, groups the bottom panel, and keeps the redundant changing caption available as screen-reader live text while visually clipping it. The first CI run (`38670306796`) exposed a 120-second timeout because the regression repeatedly waited for the 3D mesh. After narrowing it to the layout DOM/CSS, PR CI `38671723118` and post-merge version CI `38672074526` both passed (202 passed / 4 skipped each). PR #331 received independent approval and merged into `version/V0.0.1` at `c9e7238`; bilingual responsive regressions, build, eight-route validation, and model-asset checks passed. The local Release API returned 403 and the build used the `v3.1.13` fallback. No production deployment or physical-device test was performed.

## Milestones and Tasks

| ID / Priority | Objective, scope, and deliverable | Dependencies, steps, and acceptance | Status |
| --- | --- | --- | --- |
| WEB-01 / P1 | Correct bilingual brand casing, format-support guidance, and download direction on the homepage. | Bilingual copy/style regression; build, site validation, full Playwright suite; PRs #285/#286. | Complete and promoted to `master`; not deployed |
| WEB-02 / P1 | Deploy the unique-title fix already on `master`, then verify all eight routes and homepage title counts. | Recheck remote backup/rollback and current version; act only after explicit owner approval for this production deployment; verify each route’s HTTP status, title count, language alternates, assets, and browser smoke test. | Source fixed; deployment tooling validates the build before switching, checks all eight routes and SEO metadata afterward, and rolls back on verification failure. Read-only check on 2026-10-15: all eight routes returned HTTP 200 and canonical URLs were correct, but `/` and `/en/` still each have two `<title>` elements. Production deployment remains explicitly approval-gated |
| WEB-03 / P2 | Measure loading, caching, and interaction on real phones and varied networks, and record reproducible results. | Record device/network models, browser, cache state, and steps; measure first view/model load, downloads, and interaction with raw data. | Waiting for physical devices and controllable network conditions; unverified |
| WEB-04 / P1 | Continue reviewing bilingual information, evidence scope, calls to action, and visual consistency along Home → Formats → Cases → Lab → Download; implement grouped fixes only when supported by evidence. | PR #291 added links to remaining packages; PRs #292/#294 clarified that Home, Lab, Formats, and Cases CTAs open a Release page for package selection; PRs #311/#312 aligned the homepage’s actual four-step workflow; PR #313 fixed narrow Cases overflow and PR #315 promoted it to `master`; PR #320 fixed the Formats CTA column overflow at 320px; PRs #323/#325 corrected and promoted the Chinese Lab heading and bilingual narrow-screen title regressions. | Ongoing; Cases, Formats, and Lab title fixes are now promoted to `master`; PR #323's version-branch post-merge CI `38656977540` and PR #325's master push CI `38658741923` both passed (200 passed / 4 skipped). Production was not deployed |
| WEB-05 / P1 | Link every format-matrix target to the correct target-specific evidence and describe automated-test/manual-procedure scope accurately. | Bilingual regression for all 11 rows; build, site validation, asset checks, full Playwright; PR #287/#288 CI and independent review. | Complete and promoted to `master` |

## Key Risks and Controls

1. **Production differs from source.** The 2026-10-15 read-only check found all eight routes returning HTTP 200 with correct canonical URLs, but `/` and `/en/` still each contain two `<title>` elements; their response `Last-Modified` is 2026-10-13 00:20 UTC. Green CI on the version branch or `master` does not mean deployed, and deployment remains approval-gated.
2. **No real-device evidence.** Chromium Mobile and viewport screenshots do not replace tests on real phones, constrained networks, cache states, or device performance. Keep WEB-03 unverified.
3. **Release API access is limited.** Local builds may fall back to the checked-in `v3.1.13` snapshot; CI sets `RELEASE_SYNC_REQUIRED=1` and verifies live Release synchronization. Do not describe the local snapshot as an updated Release.

## Execution Order

1. Continue WEB-04 by checking evidence scope, content hierarchy, and bilingual visual consistency across Home → Formats → Cases → Lab, grouping fixes by issue type.
2. Execute WEB-02 only after explicit approval for this production deployment, using the repository’s existing backup/rollback procedure. Until then, continue other website work.
3. Complete WEB-03 when device and network conditions are available; preserve measurements and environment details.

## Status Update Rules

Update paired documentation and regression tests after code changes. Attach reproducible commands, PR/CI, or live evidence when marking work complete. Track planned, source-fixed, CI-passed, deployed, and real-device-verified states separately. Recheck all external state before acting.
