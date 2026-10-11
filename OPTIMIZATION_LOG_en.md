# Optimization Log

[中文](OPTIMIZATION_LOG.md)

## 2026-09-22 — Dependency Review workflow failure verified

- **Issue:** Actions run `35737032681` failed in `Dependency Review` because GitHub Dependency Graph is disabled for this repository. The log says, “Dependency review is not supported on this repository.”
- **Resolution:** The current version branch already changed the workflow in `c45e03f` to run Dependency Review only when a pull request changes a dependency manifest. This local fix branch inherits that change. No duplicate workflow edit or remote push was made in this iteration.
- **Validation:** No dependency manifests differ between this branch and `upstream/version/V0.0.1`; the guard reports `dependency manifests unchanged: review is skipped`. `pnpm run check`, `pnpm run build`, and `python3 tools/validate_site.py` passed, with Astro reporting 0 errors, 0 warnings, and 0 hints.
- **Risk and rollback:** This iteration only adds documentation; reverting its documentation commit does not affect the site.
- **Limit:** GitHub Actions was not rerun. Local checks validate the workflow condition and site build, not the status of a remote run.

## 2026-09-22 — Correct repository structure documentation

- **Why:** Both READMEs pointed contributors to a nonexistent root-level `assets/` directory and omitted `src/components/` and `tools/`. This could place new files in the wrong locations. The documentation fix is low-cost, evidence-based, and behavior-neutral.
- **Changes:** Updated both project trees and asset ownership guidance; corrected the Chinese README's official icon path and localized model-guide link; reprioritized remaining opportunities in the backlog.
- **Validation:** `pnpm run check` and `pnpm run build` passed (Astro: 0 errors, 0 warnings, 0 hints); `python3 tools/validate_site.py` and `git diff --check` passed. No separate test, lint, or benchmark scripts are defined. No browser test was needed for this docs-only change.
- **Risk and rollback:** Documentation-only change. Revert the README and log entry independently if the paths are incorrect; runtime behavior is unaffected.
- **Next:** Assess browser regression coverage first, then measure whether an offline STEP → GLB pipeline is worthwhile.

## 2026-10-11 — Add a GLB delivery-asset quality gate

- **Issue:** The STEP-to-GLB generator existed, but the build did not validate the GLB container, normals, source-model metadata, or triangle growth; the desktop asset was missing metadata that the generator writes.
- **Changes:** Regenerated the desktop GLB with `tools/prepare_model_asset.py`; added the cross-platform Python validator `tools/check_model_assets.py` to check the STEP source, GLB structure, 303 normal sets, source-size metadata, and desktop/mobile budgets of 300,000/250,000 triangles; exposed `pnpm run assets:check` in the README and Site Quality workflow.
- **Validation:** The desktop asset is 9,989,676 bytes / 278,784 triangles and the mobile asset is 8,431,996 bytes / 228,004 triangles; `pnpm run build`, `python3 tools/validate_site.py`, `pnpm run assets:check`, and `pnpm run test:browser` all pass (26 browser tests).
- **Boundary:** The budgets catch accidental asset growth; they do not decimate geometry. Visual simplification remains a separate decision requiring silhouette, connector, and pad-detail comparison.

## 2026-10-11 — Unify content-page and 3D Lab branding

- **Issue:** The homepage used the icon, GitHub entry, and product-style brand header, while Formats, Cases, and the 3D Lab used different text-only headers; the Lab's bilingual asset-size guidance also lagged behind the actual GLB assets.
- **Changes:** Added the shared brand icon and GitHub entry to content pages; brought the Lab header to the same icon and hierarchy; updated desktop/mobile GLB guidance to about 10.0/8.4 MB. The compact mobile layout keeps the GitHub text entry hidden to avoid crowding.
- **Validation:** `pnpm run build`, `python3 tools/validate_site.py`, `pnpm run assets:check`, and `pnpm run test:browser` all pass; the browser suite now has 28 tests covering desktop and mobile header behavior.

## 2026-10-11 — Apply the paper-grain layer to every public page

- **Issue:** The Chinese homepage had the `.grain` texture layer, but the English homepage, Formats, Cases, and both Lab pages did not; changing language or entering a child page changed the surface texture.
- **Changes:** Added the same `grain` layer to the English homepage, shared content-page layout, and both Lab pages without changing page structure or runtime loading paths.
- **Validation:** `pnpm run build`, `python3 tools/validate_site.py`, `pnpm run assets:check`, and `pnpm run test:browser` all pass; the browser suite now has 30 tests and confirms one grain layer on all eight public routes.

## 2026-10-11 — Align interaction rhythm across bilingual homepages

- **Issue:** The English homepage lacked the magnetic class on its download button, matching reveal delays on story/workflow/platform sections, and the shared hover-animation structure for the GitHub arrow.
- **Changes:** Matched the English homepage `magnetic` and `reveal-delay` classes and GitHub arrow markup, added an accessible label to the English scroll cue, and added a browser regression test for bilingual interaction rhythm.
- **Validation:** Run the build, static site checks, and browser suite after the change; both homepages continue to share the same visual and interaction states.

## 2026-10-11 — Complete homepage download and feature-card motion parity

- **Issue:** The English homepage download button lacked the magnetic and arrow motion, its hero arrow did not use the shared animated markup, and its three colored feature cards lacked the staggered reveal rhythm used by the Chinese page.
- **Changes:** Matched the English download button classes, arrow markup, and feature-card reveal delays; expanded bilingual browser coverage across the hero, feature, and download sections.
- **Validation:** Run the build, static site checks, GLB asset gate, and both-browser regression suite; the change remains presentation-only.

## 2026-10-11 — Add a shared next-step CTA to content pages

- **Issue:** Formats and Cases pages present capability evidence and conversion cases, but offer no clear download or homepage action after reading; their action hierarchy was weaker than the homepage.
- **Changes:** Added a bilingual dark CTA to the shared content-page layout with the current stable release, a Release download, and a homepage route; all content pages now reuse one structure and visual treatment.
- **Validation:** Added browser coverage for the four bilingual content routes and ran the build, site validation, asset gate, and full browser suite.

## 2026-10-11 — Connect the 3D Lab to product navigation

- **Issue:** The Lab explains its isolated loading and technical-validation boundary, but users had no prominent homepage or format-matrix action after entering the experiment; the return path between the experiment and product story was too quiet.
- **Changes:** Added the same bilingual “Back to product” and “View format matrix” action group to the Lab intro without changing experiment controls, model loading, or route structure.
- **Validation:** Added bilingual Lab navigation-bridge coverage and ran the build, site validation, asset gate, and full browser suite.

## 2026-10-11 — Clarify the Lab advanced-control hierarchy

- **Issue:** Advanced Lab experiments were collapsed by default, but the entry only said “TOOLS +”, did not describe the available experiments, and did not connect the toggle to its explanatory region with `aria-controls`.
- **Changes:** Renamed the bilingual entry to “ADVANCED/高级工具”, described topology, orbit, and cross-tab experiments, synchronized the expanded state text, and completed the accessible control relationship.
- **Validation:** Added bilingual Lab control-hierarchy coverage and ran the build, site validation, asset gate, and full browser suite.
## 2026-10-11 — Unify the Lab navigation shell
- Issue: The 3D Lab used a separate navigation without the shared GitHub entry, current-page state, skip link, or the same narrow-screen behavior as the Formats and Cases pages.
- Changes: Reused the content-page navigation shell on both Lab pages, adding the GitHub link, current-page state, skip link, and shared mobile layout.
- Validation: Added bilingual Lab navigation coverage and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Unify secondary-page mobile navigation
- Issue: Formats, Cases, and 3D Lab did not reuse the homepage menu button, Escape close behavior, or focus restoration on narrow screens.
- Changes: Connected the content pages and Lab to the same mobile navigation structure and `app.ts` behavior while preserving desktop navigation and synchronizing current-page state, language switching, and the GitHub entry.
- Validation: Added content-page and Lab mobile-navigation coverage and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Make the format matrix a decision entry point
- Issue: The matrix showed targets and evidence status, but users had to scroll to the footer to find tested cases and Release notes; primary and verification-required targets also lacked a clear visual hierarchy.
- Changes: Added tested-case and Release-note actions near the matrix heading, introduced a bilingual status legend, and marked each target with its stable or registered tier.
- Validation: Added bilingual format-matrix action and status-count coverage and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Clarify the evidence boundary of case studies
- Issue: Case cards already linked fixtures and tests, but the heading lacked format-matrix and source-evidence paths, and the distinction between automated evidence and manual acceptance was not immediately visible.
- Changes: Added bilingual case-study actions, marked each card as automated evidence, and retained the manual-acceptance disclaimer at the bottom.
- Validation: Added bilingual case-path and evidence-scope coverage and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Align bilingual homepage navigation
- Issue: The Chinese homepage mixed `Formats`, `3D Lab`, and `Docs` in its navigation and footer, while the English Download entry already existed; adding a duplicate entry was unnecessary.
- Changes: Localized the Chinese desktop, mobile, and footer entries to “格式矩阵”, “3D 实验室”, and “文档” while preserving the same product destinations in both languages.
- Validation: Added bilingual homepage navigation-destination coverage and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Correct download asset architecture labels
- Issue: The homepage download cards mislabeled the Windows x86_64, Linux x86_64, and macOS Apple Silicon assets, and called the SHA256 file “Release notes”.
- Changes: Rendered the actual Release asset labels, aligned platform architecture naming, and renamed the checksum entry to SHA256 checks.
- Validation: Added bilingual download-architecture coverage and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Align current stable-release entry points
- Issue: The homepage showed the current stable version while its hero CTA still opened the generic Release list; the format matrix did the same.
- Changes: Pointed the hero, download, content-page, and format-matrix CTAs to the current Release data, and made runtime Release refresh update every stable-release entry.
- Validation: Added stable-release link assertions for the hero and format matrix, then ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Expose every platform architecture download
- Issue: The platform list named multiple architectures, but the homepage download cards exposed only the first asset for each platform.
- Changes: Rendered every verified Windows, Linux, and macOS Release asset, then updated the bilingual guidance and regression coverage.
- Validation: Confirmed 8 download entries (7 platform assets plus SHA256SUMS) and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Keep runtime Release asset links in sync
- Issue: When the GitHub API returned a newer Release, the version CTA could update while architecture assets and SHA256 still pointed to the build-time Release.
- Changes: Added stable keys for every platform asset and updated package/checksum links at runtime by matching verified Release filename suffixes; the switch and cache occur only after the complete asset set passes validation.
- Validation: Added version coverage for all 8 asset links and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Localize Chinese homepage editorial labels
- Issue: The Chinese homepage body copy was localized, but its hero and section kickers remained mostly English, creating an uneven language hierarchy.
- Changes: Localized the Chinese hero, section labels, and Qt Quick caption while keeping technical names such as KiCad, Altium, GUI, and CLI unchanged.
- Validation: Added Chinese-label regression coverage and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Localize the Chinese 3D Lab entry label
- Issue: The Chinese 3D Lab kicker still used `EXPERIMENTAL 3D`, unlike the surrounding Chinese entry copy.
- Changes: Changed the high-level entry label to “实验性 3D” while retaining technical control and data terminology inside the Lab.
- Validation: Added Chinese and English Lab entry-label assertions and ran the build, site validation, asset gate, and browser tests.
## 2026-10-11 — Align Chinese 3D Lab narrative labels
- Issue: Chapter numbers, component-output labels, and expanded experiment controls in the Chinese Lab still appeared in English, creating an uneven language hierarchy beside the translated body copy.
- Changes: Localized the Chinese chapter labels, symbol/footprint/3D-model labels, and orbit, section, and topology experiment controls while retaining technical names such as STEP, Qt Quick, KiCad, and Altium.
- Validation: Added bilingual Lab-narrative assertions and ran the build, site validation, asset gate, and 52 browser tests.
## 2026-10-11 — Align Chinese homepage visual microcopy
- Issue: The homepage body copy was localized, but Hero overlays, marquee labels, story-card stages, and output status still mixed in English, weakening the first-screen language hierarchy.
- Changes: Localized the Chinese homepage component-library, BOM status, output, story-stage, and completion labels while retaining technical abbreviations such as GUI, CLI, and EDA.
- Validation: Added Chinese homepage microcopy assertions and ran the build, site validation, asset gate, and 54 browser tests.
## 2026-10-11 — Finish Chinese homepage and evidence copy
- Issue: The download stamp still showed an English slogan, and Chinese case summaries exposed `CAD fixture` and `BOM fixture` instead of the page's localized evidence terminology.
- Changes: Changed the homepage stamp to “开源工具 / 为工程师而做” and localized fixture terminology in Chinese summaries while retaining the real repository paths in evidence links.
- Validation: Added homepage-stamp and case-summary assertions and ran the build, site validation, asset gate, and 56 browser tests.
## 2026-10-11 — Add a format-matrix capability summary
- Issue: The matrix exposed row-level statuses, but users had to count stable and registered targets themselves, and the status column did not state its release-oriented meaning directly.
- Changes: Added a bilingual target-count summary near the heading, renamed the table column to “Release status / 版本状态”, and retained the visual distinction between stable targets and targets requiring Release verification.
- Validation: Added bilingual summary and header assertions and ran the build, site validation, asset gate, and 56 browser tests.
## 2026-10-11 — Match content-page CTAs to reading context
- Issue: The Formats and Cases pages shared the same generic CTA, so readers saw only “READY TO USE” after reviewing either a target list or evidence cases.
- Changes: The Formats CTA now leads users to choose a target and keep the evidence close; the Cases CTA leads users to verify fixtures and tests before downloading the stable release, with the same bilingual layout and actions.
- Validation: Added Formats/Cases CTA-copy assertions and ran the build, site validation, asset gate, and 56 browser tests.

## 2026-10-11 — Keep the platform summary aligned with Release assets

- **Issue**: The homepage platform section used a hand-written architecture summary while the download area was driven by current Release assets, allowing the two to drift.
- **Change**: The bilingual homepages now derive platform summaries from `latestRelease.assets`; the Chinese page localizes installer labels while retaining every available architecture and package type.
- **Validation**: Added a bilingual homepage platform-summary test; build, site validation, and browser tests run with this PR.
## 2026-10-12 — Unify bilingual footer navigation across public pages

- **Issue**: The homepage exposed the full site navigation, while Formats, Cases and 3D Lab only offered copyright and a home link.
- **Change**: Extracted a bilingual `SiteFooter` component with shared GitHub, Formats, Cases, 3D Lab, Docs, Contribute and Issues entry points, reused across all eight public routes.
- **Validation**: Added a footer-consistency test covering all eight bilingual routes; build, site validation, asset checks and browser tests pass.

## 2026-10-12 — Unify the bilingual Header across content and Lab pages

- **Issue**: Formats, Cases and 3D Lab maintained separate Header templates, creating drift risk in navigation, current-page state and the Lab brand marker.
- **Change**: Extracted a shared `InnerPageHeader` component for the six inner routes, covering desktop navigation, mobile navigation, language switching and current-page state.
- **Validation**: Added an inner-page Header consistency test; build, site validation, asset checks and browser tests pass.

## 2026-10-12 — Make the Formats and Cases evidence baseline explicit

- **Issue**: The Formats matrix and conversion cases linked Release and test evidence, but users had to infer which version range the evidence described.
- **Change**: Added a shared bilingual evidence-summary strip showing the current Release baseline and the number of targets or traceable cases.
- **Validation**: Added evidence-summary assertions for both pages; build, site validation, asset checks and browser tests pass.
