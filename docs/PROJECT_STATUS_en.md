# Project Status and Plan

[中文](PROJECT_STATUS.md)

Last checked: 2026-10-15. This status is based on the current repository, GitHub PRs/checks, Release API, and read-only live-site checks. External state can change and must be rechecked before action.

## Project Goal

Explain EasyKiConverter’s real workflow in Chinese and English, show the actual application and traceable conversion evidence, and guide visitors to the current stable release. Keep the site accessible, responsive, and lightweight, with the heavy CAD viewer runtime isolated in the 3D Lab.

## Current Stage

The project is in V0.0.1 stability maintenance and ongoing visitor-experience improvement. Before this round’s content update on 2026-10-15, `master` was `498d0a9` and `version/V0.0.1` was `f3b8868`, both matching GitHub. PR #301 hardened pre-deployment build validation, post-deployment route/SEO verification, and rollback; PR #303 promoted it to `master`. PR #304 fixed a mobile Lab slice-test loading race, and PR #305 promoted that fix to `master`. PR #310 refreshed the bilingual project status. Production was not deployed this cycle. The main project’s latest Release, checked through the GitHub API, is `v3.1.13`.


No new visual or real-device checks were run this cycle. Recent 390px bilingual screenshots covered Home, Formats, Cases, and Lab; the Lab was also checked at three actual-scroll chapter states and its final handoff to the real-app screenshot. No layout defect justified a style change. Chromium checks are not real-device tests.

## Milestones and Tasks

| ID / Priority | Objective, scope, and deliverable | Dependencies, steps, and acceptance | Status |
| --- | --- | --- | --- |
| WEB-01 / P1 | Correct bilingual brand casing, format-support guidance, and download direction on the homepage. | Bilingual copy/style regression; build, site validation, full Playwright suite; PRs #285/#286. | Complete and promoted to `master`; not deployed |
| WEB-02 / P1 | Deploy the unique-title fix already on `master`, then verify all eight routes and homepage title counts. | Recheck remote backup/rollback and current version; act only after explicit owner approval for this production deployment; verify each route’s HTTP status, title count, language alternates, assets, and browser smoke test. | Source fixed; deployment tooling now validates the build before switching, checks all eight routes and SEO metadata afterward, and rolls back on verification failure. Production state has not been rechecked; deployment remains approval-gated |
| WEB-03 / P2 | Measure loading, caching, and interaction on real phones and varied networks, and record reproducible results. | Record device/network models, browser, cache state, and steps; measure first view/model load, downloads, and interaction with raw data. | Waiting for physical devices and controllable network conditions; unverified |
| WEB-04 / P1 | Continue reviewing bilingual information, evidence scope, calls to action, and visual consistency along Home → Formats → Cases → Lab → Download; implement grouped fixes only when supported by evidence. | PR #291 added links to remaining packages; PRs #292/#294 clarified that Home, Lab, Formats, and Cases CTAs open a Release page for package selection. The batch was promoted by PR #296. This round aligned the homepage workflow introduction with its four actual steps and added browser assertions for both languages. | Ongoing; CTA semantics and workflow copy are aligned, with bilingual Playwright coverage; production was not deployed |
| WEB-05 / P1 | Link every format-matrix target to the correct target-specific evidence and describe automated-test/manual-procedure scope accurately. | Bilingual regression for all 11 rows; build, site validation, asset checks, full Playwright; PR #287/#288 CI and independent review. | Complete and promoted to `master` |

## Key Risks and Controls

1. **Production differs from source.** All eight routes returned HTTP 200 in the latest read-only check, but `/` and `/en/` each still have two `<title>` elements; their response `Last-Modified` predates the current master state. Green CI on the version branch or `master` does not mean deployed, and deployment remains approval-gated.
2. **No real-device evidence.** Chromium Mobile and viewport screenshots do not replace tests on real phones, constrained networks, cache states, or device performance. Keep WEB-03 unverified.
3. **Release API access is limited.** Local builds may fall back to the checked-in `v3.1.13` snapshot; CI sets `RELEASE_SYNC_REQUIRED=1` and verifies live Release synchronization. Do not describe the local snapshot as an updated Release.

## Execution Order

1. Continue WEB-04 by checking evidence scope, content hierarchy, and bilingual visual consistency across Home → Formats → Cases → Lab, grouping fixes by issue type.
2. Execute WEB-02 only after explicit approval for this production deployment, using the repository’s existing backup/rollback procedure. Until then, continue other website work.
3. Complete WEB-03 when device and network conditions are available; preserve measurements and environment details.

## Status Update Rules

Update paired documentation and regression tests after code changes. Attach reproducible commands, PR/CI, or live evidence when marking work complete. Track planned, source-fixed, CI-passed, deployed, and real-device-verified states separately. Recheck all external state before acting.
