# Optimization Backlog

[中文](OPTIMIZATION_BACKLOG.md)

Roughly rank opportunities by impact × confidence × urgency / (cost × risk). Each factor is estimated from 1–5; scores are comparative, not measurements.

| Priority | Opportunity | Estimate (impact × confidence × urgency / cost × risk) | Status |
| --- | --- | --- | --- |
| P1 | Keep bilingual homepage Hero overlays fully visible at phone, tablet, and desktop widths | 4×5×3 / (2×2) = 15 | Complete; input/output cards are covered by browser geometry checks at 390/768/1440px |
| P1 | Add browser regression tests for Chinese/English pages, mobile navigation, reduced motion, and release links | 4×5×3 / (3×2) = 10 | Complete; `pnpm run test:browser` and CI Site Quality pass |
| P1 | Ensure each public route emits exactly one HTML `<title>` and track production parity | 4×5×4 / (1×2) = 40 | Version-branch source keeps the shared SEO title and adds all-route regression coverage; production homepages still duplicate titles and await stable promotion approval; no production deployment was run |
| P2 | Add an offline STEP-source-to-optimized-GLB pipeline to reduce browser download and parsing costs | 5×4×3 / (5×3) = 4 | Core loop complete; generator, GLB assets, and `pnpm run assets:check` are gated; visual decimation remains a separate assessment |
| P2 | Remove legacy page sections hidden by the new narrative and their related styles | 3×4×2 / (2×3) = 4 | Isolated at `/lab/` and `/en/lab/`; asset migration remains a follow-up |
| P1 | Unify the brand header and asset guidance across the homepage, content pages, and 3D Lab | 4×4×3 / (2×2) = 12 | Complete; icon, GitHub entry, bilingual guidance, and size copy are aligned and covered by browser regression tests |
| P1 | Show the input → output route directly on conversion cases to reduce mobile scanning cost | 4×5×3 / (2×2) = 15 | Complete; all three bilingual cases use data-driven route labels covered by browser regression tests |
| P1 | Fix Lab mobile view controls obscuring the real model | 5×5×3 / (2×2) = 18.75 | Complete; the default mobile view switcher is above the model and covered by a geometry-visibility layout test |
| P1 | Prevent Lab story chapters from overlapping model controls during mobile scroll | 5×5×3 / (2×2) = 18.75 | Complete; bilingual 390/360px layouts and all three story steps have non-overlap geometry coverage, with the final step handing off to the real-app screenshot |
| P1 | Increase mobile 3D Lab model presence and front-facing legibility | 4×5×3 / (2×2) = 15 | Implemented; enlarged the mobile model stage, fit the camera to actual geometry, and limited narrow-screen narrative rotation to a half-turn; bilingual 360/390px layout regression is covered |
| P2 | Prevent orphaned characters in Chinese mobile homepage, format, and case titles | 3×5×3 / (1×2) = 22.5 | Complete; shortened three bilingual titles and added 390/360px line-box regression to keep Chinese lines from ending with a single character |
| P2 | Add an evidence-reading order to conversion cases | 3×4×3 / (2×2) = 9 | Complete; the case page now explains the bilingual choose route → open fixture → review test sequence |
| P2 | Align bilingual architecture labels in the homepage platform summary | 2×3×3 / (2×2) = 4.5 | Complete; Chinese platform summaries and download cards use “Apple 芯片” while English retains the engineering label |
| P2 | Promote the stable download in the Lab intro actions | 3×4×3 / (2×2) = 9 | Complete; both bilingual Lab pages place the stable download first and keep secondary entries as text links |
| P2 | Correct the desktop Chinese case-title wrap | 2×3×3 / (2×2) = 4.5 | Complete; the case title has enough width to avoid an orphan final character while retaining natural mobile wrapping |
| P2 | Align the homepage quick-start external-arrow treatment | 2×3×3 / (2×2) = 4.5 | Complete; bilingual quick-start links use the same external-arrow structure as the rest of the site |
| P2 | Align in-site navigation arrow semantics | 3×4×3 / (2×2) = 9 | Complete; in-site entries use `→`, external links keep `↗`, consistently across the bilingual homepage and Lab |
| P2 | Match text-link hover motion to arrow semantics | 3×4×3 / (2×2) = 9 | Complete; in-site, external and downward-anchor links use direction-matched motion |
| P2 | Complete homepage-specific in-site arrow motion | 2×4×3 / (2×2) = 6 | Complete; workbench and format-card entries use horizontal hover feedback |
| P2 | Complete the download-section external-release cue | 2×4×3 / (2×2) = 6 | Complete; the bilingual all-releases entry shows the external arrow and matching hover motion |
| P2 | Align the bilingual Hero downward cue | 2×4×3 / (2×2) = 6 | Complete; the bilingual “See how it works” entry uses a separate arrow and matching hover motion |
| P1 | Improve visible 3D model surface detail | 4×4×3 / (3×2) = 8 | Partially complete; GLB/edge budgets and lighting depth have improved, but local screenshots still show prominent white structural lines in the source geometry. Continue with asset-level and browser comparisons; do not substitute denser wireframes for better geometry quality |
| P2 | Add 3D detail-generation feedback | 3×4×3 / (1×2) = 18 | Complete; the bilingual Lab distinguishes a usable model from detail still being generated |
| P2 | Unify external-navigation cues across the site | 3×4×3 / (2×2) = 9 | Complete; the header docs and footer external entries now show `↗` with matching hover motion and bilingual regression coverage |
| P2 | Compact repeated format-matrix status copy | 3×4×3 / (1×2) = 18 | Complete; use short mobile row labels while retaining full meaning in the legend, guidance, and accessible name |
| P2 | Refine bilingual conversion-case copy | 3×4×3 / (1×2) = 18 | Complete; align single input → output routes and explain the BOM evidence as repeatable GUI/CLI checking |
| P2 | Improve narrow-screen hierarchy for case evidence paths | 3×4×3 / (1×2) = 18 | Complete; separate filenames from directories while retaining the full accessible path and external-link semantics |
| P2 | Consolidate brand tokens and accessibility-layer responsibilities | 3×4×3 / (1×2) = 18 | Complete; homepage, content pages, and Lab share the base brand tokens without accessibility-layer color overrides |
| P2 | Reorder the Lab loading guidance for scanning | 4×4×3 / (2×2) = 12 | Complete; bilingual mobile layouts separate GLB sizes, delivery priority, and the STEP/WASM fallback boundary |
| P2 | Unify the bilingual workbench next-step CTA | 3×5×3 / (2×2) = 11.25 | Complete; the shared CTA makes the real interface → conversion evidence → 3D delivery path explicit |
| P2 | Replace the homepage screenshot source path with visitor-facing provenance copy | 3×4×3 / (1×1) = 36 | Implemented; PR #272 has independent approval and required CI; removed the internal path, added bilingual regression coverage, and did not deploy production |

The resolved Dependency Review workflow issue is documented in the [optimization log](OPTIMIZATION_LOG_en.md) and is not repeated here.

This iteration corrected the README homepage architecture, directory and asset-path errors; see the [optimization log](OPTIMIZATION_LOG_en.md).
