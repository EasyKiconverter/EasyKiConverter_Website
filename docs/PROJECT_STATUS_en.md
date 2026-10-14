# Project Status and Plan

[中文](PROJECT_STATUS.md)

Last checked: 2026-10-15 (before WEB-01). This is an evidence-linked snapshot; branches, CI, Releases, and production can change and must be rechecked against the cited source, commits, checks, and live site.

## Project Goal

Explain EasyKiConverter’s real workflow through a bilingual website, show the actual application and traceable conversion evidence, and guide visitors to the current stable release. Keep the site accessible, responsive, and lightweight, with the heavy CAD viewer runtime isolated in the 3D Lab.

## Current Stage

The project is in V0.0.1 stability maintenance and iterative improvement. Before WEB-01, `master` was at `a7b0dbf` and `version/V0.0.1` at `194768f`; promotion PR #283 passed Dependency Review and both static-site checks, and PR #284 passed Site Quality and Dependency Review before merging to the version branch. At the start of this snapshot there were no open pull requests or issues. The main project’s latest Release was verified through the GitHub API as `v3.1.13`.

The current source generates eight public routes. Playwright covers desktop/mobile Chromium, both languages, navigation, reduced motion, Release data, and Lab behavior. WEB-01 regression reports 192 passed and 4 skipped; build, site validation, and model-asset checks passed. The GitHub API rate limit returned 403 for local Release sync, so the checked-in fallback was used; PR #283's required CI Release sync and PR #284's checks passed. These facts do not prove real-device testing or production deployment.

## Milestones and Work

| Stage | Status | Acceptance evidence |
| --- | --- | --- |
| Bilingual static site and development/CI rules | Established; maintain | Eight routes, paired docs, required CI and review gates |
| Product story, format matrix, cases, and downloads | Ongoing refinement | Bilingual consistency, accurate Release facts, desktop/mobile browser checks |
| Production aligned with repository | Incomplete; owner approval required for deployment | Eight live routes, unique homepage titles, asset and browser checks |
| Real-device and varied-network performance | Unverified | Separate measurements on devices and constrained networks |

## Execution Tasks

| ID / Priority | Objective, scope, and deliverable | Dependency and verification | Status |
| --- | --- | --- | --- |
| WEB-01 / P1 | Review bilingual visitor copy for brand casing, format-support guidance, and download direction; this cycle delivers corrected hero/showcase labels, conversion-support copy, and download wording. | No external dependency; bilingual text/style regression, build, site validation, and full Playwright suite. | Implemented and locally verified; see the optimization log |
| WEB-02 / P1 | Deploy the unique-title fix already on `master`, then verify all eight routes and homepage titles. | Requires explicit owner approval for this production deployment; use the existing backup/rollback procedure. | Approval-gated; do not execute without authorization |
| WEB-03 / P2 | Measure loading, caching, and interaction on real phones and varied network conditions; record reproducible results. | Requires physical devices and controllable network conditions. | External prerequisite unmet; remains unverified |

## Risks and Next Steps

1. **Production title fix is not deployed.** A read-only check of `https://easykiconverter.org.cn/` on 2026-10-15 found all eight routes returning HTTP 200, but `/` and `/en/` each contain two `<title>` elements. Current `master` includes the unique-title fix. Production deployment requires explicit project-owner approval; this status document does not authorize it.
2. **Continue user-visible content and visual consistency work.** Review the visitor path across Home, Formats, Cases, Lab, and Downloads for bilingual hierarchy, terminology, calls to action, and truthful status claims. Group evidence-backed fixes into a focused PR with desktop/mobile screenshots.
3. **Complete device verification.** Automated Chromium checks do not replace real-phone and varied-network measurements for performance, caching, and interaction. Keep these items marked unverified until such evidence exists.

## Status Update Rules

Update paired documentation, tests, and this status after relevant code changes. Attach a reproducible command, CI/PR result, or live evidence whenever an item is marked complete. Track planned, source-fixed, CI-passed, deployed, and real-device-verified states separately.
