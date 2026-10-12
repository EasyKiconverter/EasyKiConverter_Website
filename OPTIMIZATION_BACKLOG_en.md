# Optimization Backlog

[中文](OPTIMIZATION_BACKLOG.md)

Roughly rank opportunities by impact × confidence × urgency / (cost × risk). Each factor is estimated from 1–5; scores are comparative, not measurements.

| Priority | Opportunity | Estimate (impact × confidence × urgency / cost × risk) | Status |
| --- | --- | --- | --- |
| P1 | Add browser regression tests for Chinese/English pages, mobile navigation, reduced motion, and release links | 4×5×3 / (3×2) = 10 | Complete; `pnpm run test:browser` and CI Site Quality pass |
| P2 | Add an offline STEP-source-to-optimized-GLB pipeline to reduce browser download and parsing costs | 5×4×3 / (5×3) = 4 | Core loop complete; generator, GLB assets, and `pnpm run assets:check` are gated; visual decimation remains a separate assessment |
| P2 | Remove legacy page sections hidden by the new narrative and their related styles | 3×4×2 / (2×3) = 4 | Isolated at `/lab/` and `/en/lab/`; asset migration remains a follow-up |
| P1 | Unify the brand header and asset guidance across the homepage, content pages, and 3D Lab | 4×4×3 / (2×2) = 12 | Complete; icon, GitHub entry, bilingual guidance, and size copy are aligned and covered by browser regression tests |
| P1 | Show the input → output route directly on conversion cases to reduce mobile scanning cost | 4×5×3 / (2×2) = 15 | Complete; all three bilingual cases use data-driven route labels covered by browser regression tests |
| P1 | Fix Lab mobile view controls obscuring the real model | 5×5×3 / (2×2) = 18.75 | Complete; the default mobile view switcher is above the model and covered by a geometry-visibility layout test |

The resolved Dependency Review workflow issue is documented in the [optimization log](OPTIMIZATION_LOG_en.md) and is not repeated here.

This iteration corrected the README homepage architecture, directory and asset-path errors; see the [optimization log](OPTIMIZATION_LOG_en.md).
