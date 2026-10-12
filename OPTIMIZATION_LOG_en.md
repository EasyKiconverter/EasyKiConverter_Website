# Optimization Log

[中文](OPTIMIZATION_LOG.md)

## 2026-10-12 — Localize the Chinese footer feedback entry

- **Issue:** The Chinese footer had localized GitHub, docs, and contribution entries, but kept the feedback link as `Issues`, breaking the navigation language hierarchy.
- **Changes:** Show “问题反馈” on Chinese pages while retaining `Issues` on English pages; preserve the existing destination and external-link behavior.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Align Chinese download-card language

- **Issue:** The Chinese homepage’s platform summary used “安装包,” while the actual download cards still showed the English `installer` label, creating an inconsistent language hierarchy on the same page.
- **Changes:** Localize the Windows installer labels to “安装包” on the Chinese cards while retaining technical format names such as AppImage, DEB, and DMG; keep the original Release labels on the English page.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Connect platform guidance to downloads

- **Issue:** The platform section already listed Windows, Linux, macOS, and their architectures, but visitors still had to find the actual download cards by continuing down the page.
- **Changes:** Add a bilingual “查看平台下载项 / See platform downloads” anchor directly below the platform guidance, linking to the stable download area; also remove an extra space in the Chinese format-support note.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

- **Follow-up:** Explicitly preserve the platform paragraph width, color, and spacing after adding the anchor so the former `:last-child` selector cannot cause a visual regression.

## 2026-10-12 — Name the primary EDA destinations in the hero

- **Issue:** The hero explained the LCSC / EasyEDA input but described the output only as “the EDA libraries you already know,” making first-time visitors scroll to the format section to confirm KiCad and Altium.
- **Changes:** Name KiCad and Altium directly in both hero paragraphs while retaining the broader “and the EDA libraries you already know” wording; keep the existing layout and CTAs unchanged.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — State the cross-platform scope directly

- **Issue:** The platform section’s “Your system, it knows it” headline had personality but did not directly state the supported systems, and the Chinese/English headings were not semantically aligned.
- **Changes:** List Windows, Linux and macOS directly in both headings and use the shared “跨平台支持 / CROSS-PLATFORM SUPPORT” hierarchy; retain the architecture download guidance below for the concrete choice.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Use user-facing language for platform downloads

- **Issue:** The homepage platform section called download choices “assets” and exposed GitHub API details in the guidance, making users interpret implementation terminology before choosing a package.
- **Changes:** Use “downloads” and clearer user-facing wording, explicitly tell visitors to match their device architecture, and explain that stable download links remain usable when version information cannot refresh; updated the English page and accessibility labels in parallel.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Establish hierarchy for homepage format and case actions

- **Issue:** The “format matrix” and “conversion cases” links in the multiple-target card shared the same low-contrast text treatment, making the primary path unclear and reducing readability on the dark card.
- **Changes:** Made the format matrix a high-contrast primary button and kept conversion cases as the secondary text action; both languages now share the same structure, spacing and interaction feedback, with hierarchy regression coverage.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Clarify the version boundary of format support

- **Issue:** The homepage described other targets as “the main project also registers”, an internal implementation phrase that could be read as full stable-release support.
- **Changes:** State that the current stable release focuses on KiCad and Altium, and that other targets must be confirmed against the matching Release and format matrix; updated both languages and added copy regression coverage.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Clarify the homepage input-to-output story

- **Issue:** The homepage story section still used the `legacy-story` anchor, while the Chinese kicker “安静的中间地带” and English `THE QUIET MIDDLE` were more abstract than the conversion flow they introduced.
- **Changes:** Use the semantic `#story` anchor across both languages and rename the kicker to “从输入到输出” / `FROM INPUT TO OUTPUT`; added bilingual homepage anchor coverage so navigation and hero CTAs target the same section.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Unify the Chinese conversion-case navigation label

- **Issue:** The Chinese homepage, inner-page Header, and footer pointed to the same case page with three different labels: “案例”, “转换案例”, and “案例”.
- **Changes:** Use “转换案例” consistently for Chinese site navigation while retaining contextual body copy such as “真实转换案例” and “测试案例”; added bilingual public-route navigation terminology coverage.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Keep footer entries readable

- **Issue:** The desktop inner-page footer squeezed its shared Grid column, causing Chinese entries to wrap character by character and splitting the English `3D Lab` label.
- **Changes:** Added a dedicated shared `SiteFooter` stylesheet that lets the link group wrap while keeping each entry on one line; added desktop footer geometry coverage for all eight bilingual public routes.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite.

## 2026-10-12 — Keep Release refresh same-origin

- **Issue:** Every page requested the GitHub Releases API in the browser; API rate limits produced a 403 failed request even though the static fallback remained usable.
- **Changes:** The build now writes the validated Release asset set to `public/data/latest-release.json`; runtime refresh uses the same origin while the checked-in `src/data/release.ts` remains the fallback. Added a same-origin request regression test and updated the architecture notes.
- **Validation:** Run the build, static site checks, asset checks, and the full browser suite, then confirm online that pages no longer request the GitHub Releases API.

## 2026-10-12 — Remove narrow-screen overflow from English secondary pages

- **Issue:** At 390px, the English Formats, Cases, and 3D Lab pages still overflowed horizontally through CTA emphasis text, footer links, and the Lab view switcher.
- **Changes:** Let shared secondary-page CTA and footer content wrap, and make the Lab view switcher wrap on mobile; added overflow coverage for six bilingual secondary routes.
- **Validation:** Run the full build, static site checks, asset checks, and browser suite.

## 2026-10-12 — Remove narrow-screen overflow from the English homepage

- **Issue:** At 390px, the English homepage's long emphasized heading used a no-wrap rule and footer links could not wrap, producing a 507px document width and allowing horizontal dragging.
- **Changes:** Allow emphasized section and download headings to wrap on mobile, and let footer links wrap with readable spacing; added a bilingual homepage overflow regression test.
- **Validation:** Run the full build, static site checks, asset checks, and browser suite.

## 2026-10-12 — Prevent story-card decoration from covering mobile copy

- **Issue:** On narrow screens, the symbols, footprint, and 3D-model labels in the “整理/ORGANIZE” story card overlapped its paragraph; the desktop layout was unaffected.
- **Changes:** Move all three cards' status pills and decorative stacks into normal flow after the copy on mobile, preserving their right alignment, rotation, and staggered visual treatment; added a bilingual all-card geometry regression test.
- **Validation:** Run the build, static site checks, asset checks, the full browser suite, and review a 390px screenshot.

## 2026-10-12 — Close the Dependency Review gate when dependencies are unchanged

- **Issue:** `master` requires the `Dependency Review` status, but the Security workflow did not produce a usable success state for website PRs that changed no dependency manifests, incorrectly blocking normal promotion PRs.
- **Changes:** Keep the audit path for dependency-manifest changes, explicitly succeed when no manifests change, and handle manual workflow dispatches safely.
- **Validation:** Confirm both `Dependency Review` and `Static site checks` succeed on the version PR and the promotion PR before merging.

## 2026-10-12 — Align the homepage capability summary with the format matrix

- **Issue:** The homepage feature card hard-coded a `3D` label even though the shared matrix tracks EDA targets; it also hid the current stable-target and registered-target counts.
- **Changes:** Both homepages now read `src/data/formats.ts`, render KiCad, Altium Designer, and the current registered-target count, while keeping the matrix and Release evidence paths visible.
- **Validation:** Added a bilingual homepage format-summary regression test; the build, static site checks, asset checks, and full browser suite will run for this change.

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

## 2026-10-12 — Show downloadable asset counts in the platform summary

- **Issue**: The homepage platform section listed architectures, but users still had to inspect the download cards to learn how many assets each platform offered; the bilingual summaries lacked the same information hierarchy.
- **Change**: Kept the platform summary derived from `latestRelease.assets` and added the actual asset count for Windows, Linux and macOS, with matching bilingual accessible labels.
- **Validation**: Added assertions for the 2/3/2 platform asset counts; build, site validation, asset checks, desktop/mobile render checks and all 62 browser tests pass.

## 2026-10-12 — Unify the shared Header across home and inner pages

- **Issue**: The homepage and the Formats, Cases and 3D Lab pages maintained separate Headers, allowing brand entry points, language switching and mobile navigation to drift between bilingual routes.
- **Change**: Added a `home/inner` variant-based `SiteHeader` that centralizes the brand, GitHub entry and mobile menu while preserving homepage anchor navigation, inner-page current state and the Lab brand marker.
- **Validation**: Updated static site validation to recognize the shared Header, then reran bilingual navigation, current-state, mobile-menu, build, site validation, asset checks and all 62 browser tests.

## 2026-10-12 — Improve mobile reading of the format matrix

- **Issue**: The format matrix kept a 620px minimum width on narrow screens, forcing horizontal scrolling before users could see the Release status and compare targets continuously.
- **Change**: Kept the table layout on desktop and changed each row into a labeled ID/target/Release-status card below 640px while preserving table semantics and bilingual fields.
- **Validation**: Added a 390px narrow-layout assertion and reran the build, site validation, asset checks and the complete browser suite.

## 2026-10-12 — Clarify the next action for case evidence

- **Issue**: Case cards retained auditable repository paths, but users had to infer which link was the fixture and which was the test evidence.
- **Change**: Added bilingual “Open fixture” and “Open test evidence” action labels above each full path while preserving the real URL, external-link semantics and auditability.
- **Validation**: Added assertions for six case-evidence action labels and reran the build, site validation, asset checks and the complete browser suite.

## 2026-10-12 — Localize release terminology on Chinese pages

- **Issue**: The Chinese homepage, Formats matrix and Cases page still mixed `Release` into ordinary Chinese guidance, forcing users to switch language context and weakening visual copy consistency.
- **Change**: Localized ordinary Chinese guidance as “发布版本”, “发布说明” and “发布页”; English pages retain the precise GitHub ecosystem term `Release`, while technical links and version identifiers remain unchanged.
- **Validation**: Added Chinese-route copy assertions confirming that visible copy on the homepage, Formats and Cases pages no longer exposes an unlocalized `Release`.

## 2026-10-12 — Localize the 3D Lab brand marker

- **Issue**: The shared Header on the Chinese 3D Lab page still rendered the English `Lab` marker, while the navigation and page copy were localized.
- **Change**: The brand marker now follows the page language as `Lab / 实验室`; English keeps the existing wording and all other shared Header entries remain unchanged.
- **Validation**: Updated the bilingual inner-page Header test and reran the full build, site validation, asset checks and browser suite.

## 2026-10-12 — Explain 3D experiment-control readiness

- **Issue**: Some advanced controls remain dependent on model data, scan results or imported content after the panel opens, while the previous note implied that every control was immediately usable.
- **Change**: The bilingual note now explains that controls unlock progressively as model data, scans and imports become available, while keeping the panel collapsed by default.
- **Validation**: Added bilingual readiness-copy assertions and reran the full build, site validation, asset checks and browser suite.

## 2026-10-12 — Localize the footprint-study annotation

- **Issue**: The Chinese Lab footprint-study SVG still displayed `TOP VIEW · NOT TO SCALE`, unlike the surrounding Chinese experiment copy.
- **Change**: Chinese now displays “俯视图 · 非按比例” and “封装焊盘”; English retains the original engineering labels.
- **Validation**: Added bilingual SVG-label assertions and reran the full build, site validation, asset checks and browser suite.

## 2026-10-12 — Localize the schematic-symbol description

- **Issue**: The Chinese Lab schematic-symbol study still displayed `EASYKI COMPONENT`; `COMPONENT` is ordinary explanatory copy rather than a required engineering acronym.
- **Change**: Kept the `EASYKI` brand name and localized the Chinese description as “元件”; electrical net names remain `VCC/GND/IN/OUT`.
- **Validation**: Added bilingual symbol-label assertions and reran the full build, site validation, asset checks and browser suite.

## 2026-10-12 — Correct disabled-control cursor feedback in the 3D Lab

- **Issue**: Lab controls disabled by missing model, scan or import prerequisites still showed a `wait` cursor, which could be read as an active page load.
- **Change**: Scoped disabled buttons and inputs inside the 3D model area now use `not-allowed`, distinguishing unavailable controls from loading states.
- **Validation**: Added bilingual desktop/mobile disabled-cursor assertions and reran the full build, site validation, asset checks and browser suite.

## 2026-10-12 — Make the 3D Lab loading strategy scannable

- **Issue**: The Lab already explained its GLB, STEP/WASM and homepage-isolation behavior, but the information was concentrated in a long paragraph instead of being quickly scannable on entry.
- **Change**: Added a bilingual status summary for “GLB first”, “STEP / WASM fallback” and “homepage isolated”; the narrow layout stacks the facts compactly while preserving the technical copy hierarchy.
- **Validation**: Added bilingual loading-strategy assertions and reran the build, site validation, asset checks and the complete browser suite.

## 2026-10-12 — Repair the 3D Lab view switcher and align delivery copy

- **Issue**: The Lab's Atlas, Tomogram and Oracle buttons were clickable but did not update the stage state or selected marker; the default label also said “A REAL STEP MODEL” even though GLB is the preferred delivery path.
- **Change**: Restored view-state, bilingual label and caption synchronization; the default model now identifies itself as a “GLB DELIVERY MODEL” generated from STEP geometry.
- **Validation**: Added bilingual artifact-switcher regression coverage, updated the performance baseline, and reran the build, site validation, asset checks and the complete browser suite.

## 2026-10-12 — Improve delivery-model material and CAD detail

- **Issue**: GLB meshes were re-uploaded with one fixed material profile, so the source PBR values were discarded; on the light stage, the model could look flat and sharp part boundaries were difficult to read.
- **Change**: Preserve GLB roughness and metalness, add a budgeted sharp-edge detail layer, and introduce a soft front fill so primary geometry remains legible across viewpoints without changing the existing animation or mobile asset selection.
- **Validation**: Added an assertion for generated model-edge segments; build, site validation, asset checks and the complete browser suite remain the gates for this change.

## 2026-10-12 — Restore contrast for the stable-download CTA

- **Issue**: The stable-download button on the bilingual Formats and Cases pages used the dark-button style inside an equally dark CTA container, making the primary download path nearly invisible.
- **Change**: Use the light primary button consistently while retaining the dark CTA surface and white secondary link, aligning the action hierarchy with the homepage.
- **Validation**: Added computed-background and class assertions for all four bilingual content routes, then ran the build, site validation, asset checks and the complete browser suite.

## 2026-10-12 — Rebalance the mobile CTA decoration

- **Issue**: On a 390px viewport, the dark CTA's decorative rings crossed the heading and underline, reducing reading clarity.
- **Change**: Move the rings toward the right-side action area only at the mobile breakpoint, preserving the desktop composition and brand texture while separating the heading, copy and download action.
- **Validation**: Added mobile title/primary-action layout assertions for all four bilingual content routes, then ran the build, site validation, asset checks and the complete browser suite.

## 2026-10-13 — Add a direct download path to the 3D Lab

- **Issue**: The Lab offered technical validation, but users had to return to the homepage before downloading the stable release, adding an unnecessary step between verification and delivery.
- **Change**: Add a current stable-release link to both bilingual Lab intros while retaining the product-home and format-matrix paths; the link reuses the checked-in Release fallback instead of duplicating the version.
- **Validation**: Added bilingual stable-download assertions and ran the build, site validation, asset checks and the complete browser suite.

## 2026-10-13 — Align the 3D Lab download hierarchy

- **Issue**: The stable download is the key next step after technical validation, but the Lab still rendered it as a plain text link; its guidance also called the link “above” while the action was below the warning.
- **Change**: Make the stable download a consistent white primary button in both Lab languages, demote the homepage return to a text link, and correct the bilingual position guidance.
- **Validation**: Updated the Lab action-hierarchy assertion and rechecked desktop/mobile layout, download attributes and bilingual copy.
## 2026-10-13 — Consolidate the format-matrix evidence summary
- **Issue:** The format matrix showed two statistic-pill groups with “registered targets” repeated, unlike the single evidence-summary pattern used by the cases page.
- **Change:** Merged the current Release, stable-target count and registered-target count into one shared `evidence-summary`, removing the duplicate format-summary styling.
- **Validation:** Updated bilingual format-matrix assertions and checked the build, static site validation, desktop/mobile pages and narrow layouts.
## 2026-10-13 — Align bilingual workbench evidence copy
- **Issue:** The Chinese workbench caption named the source file and visible workflow details, while English only said “from the main project”; its accessible alternative text also omitted BOM and export context.
- **Change:** Add the English source path `resources/imgs/screenshot1.png` and describe component entry, BOM import and export settings in the English alternative text.
- **Validation:** Added bilingual workbench-evidence assertions and checked the build, static pages and desktop/mobile presentation.
## 2026-10-13 — Mark the current page in inner mobile navigation
- **Issue:** Desktop inner navigation highlighted the current page, while the mobile menu presented Formats, Cases and 3D Lab like ordinary links.
- **Change:** Give the current inner-page mobile link a lilac background, ink text and bold weight so it matches the desktop navigation state.
- **Validation:** Added assertions for all six bilingual inner pages and checked the build, static validation and narrow layouts.
## 2026-10-13 — Turn the 3D Lab introduction into a product story
- **Issue:** The Lab introduction led with STEP, Three.js and CAD/WASM implementation details without telling visitors what they could actually inspect.
- **Change:** Explain the experience as real STEP geometry becoming a GLB delivery model, followed by the mesh atlas, section tomogram and topology views; retain the homepage isolation and on-demand loading boundary.
- **Validation:** Added bilingual Lab-introduction assertions and checked the build, static validation and desktop/mobile pages.

## 2026-10-13 — Add next-step actions below the real workbench
- **Issue:** After showing the real Qt Quick workbench, the homepage did not give visitors a clear next step to verify a conversion case or inspect the 3D delivery model.
- **Change:** Added a matching bilingual action row below the workbench evidence, linking to conversion cases and the 3D Lab; the mobile layout stacks the actions while preserving the primary hierarchy.
- **Validation:** Added bilingual action assertions and checked desktop/mobile layout and destination links.

## 2026-10-13 — Add input-to-output routes to conversion cases
- **Issue:** Visitors had to read the full case title and paragraph to identify its input source and output target, especially on mobile.
- **Change:** Added a consistent bilingual input → output route block to all three cases, with route facts stored in case data instead of inferred from titles.
- **Validation:** Added bilingual route assertions and checked narrow-card layout, evidence links and the build.

## 2026-10-13 — Recompose the Lab model on mobile
- **Issue:** At 390px, the artifact switcher sat across the center of the loaded GLB model, making the real geometry difficult to inspect.
- **Change:** Move the default model-view switcher above the stage geometry on mobile only, preserving the desktop composition and other experimental views.
- **Validation:** Added a mobile switcher-position assertion and rechecked real model loading, narrow overflow and screenshots.

## 2026-10-13 — Add an evidence-reading order to conversion cases

- **Issue:** The case page exposed the input → output route, fixture and test links, but visitors still had to infer the order for reviewing them.
- **Change:** Add a bilingual three-step guide—choose a route, open the fixture, review the test—while preserving the existing case-card and CTA hierarchy.
- **Validation:** Added bilingual guide-copy assertions and checked narrow-card layout and the page build.

## 2026-10-13 — Align bilingual architecture labels in the homepage platform summary

- **Issue:** The homepage download cards localized the Windows installer label, while the platform summary still exposed `Apple Silicon` directly on the Chinese page.
- **Change:** Use “Apple 芯片” consistently in Chinese platform summaries and download cards, while retaining `Apple Silicon` in English; other architecture names keep their engineering conventions.
- **Validation:** Added bilingual platform-summary assertions and checked narrow-screen overflow and the build.

## 2026-10-13 — Promote the stable download in the Lab intro actions

- **Issue:** The Lab intro used a light primary button, but “Back to product” appeared before the stable download in DOM and visual order, making the next step less explicit on mobile.
- **Change:** Put the stable download first in both bilingual Lab action rows, while retaining product-home and format-matrix links as secondary text actions.
- **Validation:** Added a primary-action order assertion and checked bilingual Lab narrow layouts and download links.

## 2026-10-13 — Correct the desktop Chinese case-title wrap

- **Issue:** The desktop Chinese case title had too little available width, leaving the final “件。” on a lone second line and weakening the hero rhythm.
- **Change:** Widen the case-title container to match the content-page visual measure while keeping natural wrapping on mobile.
- **Validation:** Added a desktop title-height assertion and checked bilingual case-page narrow overflow.

## 2026-10-13 — Align the homepage quick-start external-arrow treatment

- **Issue:** The bilingual homepage quick-start link rendered its external arrow as plain text instead of using the shared text-link arrow structure, so its hover behavior differed from the rest of the site.
- **Change:** Use the shared `<span>↗</span>` structure while preserving the existing destination and external-link safety attributes.
- **Validation:** Added bilingual structure assertions and checked the homepage mobile scroll presentation.

## 2026-10-13 — Align the in-site navigation arrow semantics
- **Issue:** Some internal entries on the homepage and 3D Lab still used the external-link arrow `↗`, making them inconsistent with the shared in-site `→` treatment and less clear at a glance.
- **Change:** Use `→` for the bilingual homepage format/case entries and the Lab format entry, while keeping `↗` for GitHub, Release and quick-start links that leave the site.
- **Validation:** Added bilingual homepage and Lab arrow-semantics assertions and checked the build, static validation and narrow layouts.
