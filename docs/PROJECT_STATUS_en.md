# Project Status and Plan

[中文](PROJECT_STATUS.md)

Last checked: 2026-10-15. This status is based on the current repository, GitHub PRs/checks, Release API, and read-only live-site checks. External state can change and must be rechecked before action.

## Project Goal

Explain EasyKiConverter’s real workflow in Chinese and English, show the actual application and traceable conversion evidence, and guide visitors to the current stable release. Keep the site accessible, responsive, and lightweight, with the heavy CAD viewer runtime isolated in the 3D Lab.

## Current Stage

The project is in V0.0.1 stability maintenance and ongoing visitor-experience improvement. This cycle started from `master`=`80d603e` and `version/V0.0.1`=`44ff2a0`, both matching GitHub when checked. PR #291 added bilingual directions to the remaining package formats and per-file checksums, and merged into the version branch; this cycle’s CTA wording refinement is implemented and locally validated, pending version-branch PR review. The main project’s latest Release, checked through the GitHub API, is `v3.1.13`.

The site generates eight public routes. PR #286 promoted homepage copy and status records; PR #287 merged format-matrix evidence mappings to the version branch, and PR #288 promoted them to `master`; PR #291 merged the download-asset guidance into `version/V0.0.1`. Independent approval, required `Static site checks`, and `Dependency Review` passed for these PRs. PR #291 CI runs `38609570312` / `38609570346` passed. This worktree’s build reports zero Astro errors/warnings/hints; eight-page site validation and model-asset checks pass; Playwright reports 192 passed and 4 skipped. The local Release API returned 403, so the build used the checked-in fallback data; CI’s required Release sync passed.

This cycle’s 390px bilingual screenshots covered Home, Formats, Cases, and Lab. The Lab was also checked at three actual-scroll chapter states and its final handoff to the real-app screenshot. No new layout defect justified a style change. Chromium checks are not real-device tests.

## Milestones and Tasks

| ID / Priority | Objective, scope, and deliverable | Dependencies, steps, and acceptance | Status |
| --- | --- | --- | --- |
| WEB-01 / P1 | Correct bilingual brand casing, format-support guidance, and download direction on the homepage. | Bilingual copy/style regression; build, site validation, full Playwright suite; PRs #285/#286. | Complete and promoted to `master`; not deployed |
| WEB-02 / P1 | Deploy the unique-title fix already on `master`, then verify all eight routes and homepage title counts. | Recheck remote backup/rollback and current version; act only after explicit owner approval for this production deployment; verify each route’s HTTP status, title count, assets, and browser smoke test. | Source fixed; production deployment approval-gated. The last successful live check recorded two `<title>` elements on each homepage; this cycle’s refresh returned 403, so current live state is unconfirmed |
| WEB-03 / P2 | Measure loading, caching, and interaction on real phones and varied networks, and record reproducible results. | Record device/network models, browser, cache state, and steps; measure first view/model load, downloads, and interaction with raw data. | Waiting for physical devices and controllable network conditions; unverified |
| WEB-04 / P1 | Continue reviewing bilingual information, evidence scope, calls to action, and visual consistency along Home → Formats → Cases → Lab → Download; implement grouped fixes only when supported by evidence. | PR #291 clarified where to find additional assets in the actual Release. This cycle found that homepage and Lab “Download” buttons open a version Release page rather than a direct file; labels now say “View downloads” / “View stable downloads.” Validate bilingual desktop/mobile CTAs, actual link targets, build, and full browser regression. | Ongoing; the CTA wording is implemented and locally validated; not deployed |
| WEB-05 / P1 | Link every format-matrix target to the correct target-specific evidence and describe automated-test/manual-procedure scope accurately. | Bilingual regression for all 11 rows; build, site validation, asset checks, full Playwright; PR #287/#288 CI and independent review. | Complete and promoted to `master` |

## Key Risks and Controls

1. **Production may differ from source.** The previous successful read-only live check found two `<title>` elements on `/` and `/en/`; this cycle’s external requests returned 403, which does not establish the current live state. The deployment script was not run. Green CI on the version branch or `master` does not mean deployed.
2. **No real-device evidence.** Chromium Mobile and viewport screenshots do not replace tests on real phones, constrained networks, cache states, or device performance. Keep WEB-03 unverified.
3. **Release API access is limited.** Local builds may fall back to the checked-in `v3.1.13` snapshot; CI sets `RELEASE_SYNC_REQUIRED=1` and verifies live Release synchronization. Do not describe the local snapshot as an updated Release.

## Execution Order

1. Continue WEB-04 by checking evidence scope, content hierarchy, and bilingual visual consistency across Home → Formats → Cases → Lab, grouping fixes by issue type.
2. Execute WEB-02 only after explicit approval for this production deployment, using the repository’s existing backup/rollback procedure. Until then, continue other website work.
3. Complete WEB-03 when device and network conditions are available; preserve measurements and environment details.

## Status Update Rules

Update paired documentation and regression tests after code changes. Attach reproducible commands, PR/CI, or live evidence when marking work complete. Track planned, source-fixed, CI-passed, deployed, and real-device-verified states separately. Recheck all external state before acting.
