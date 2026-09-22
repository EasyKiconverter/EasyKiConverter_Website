# Optimization Backlog

[中文](OPTIMIZATION_BACKLOG.md)

Roughly rank opportunities by impact × confidence × urgency / (cost × risk). Each factor is estimated from 1–5; scores are comparative, not measurements.

| Priority | Opportunity | Estimate (impact × confidence × urgency / cost × risk) | Status |
| --- | --- | --- | --- |
| P1 | Add browser regression tests for Chinese/English pages, mobile navigation, reduced motion, and release links | 4×5×3 / (3×2) = 10 | Assess; confirm an acceptable browser-test dependency first |
| P2 | Add an offline STEP-source-to-optimized-GLB pipeline to reduce browser download and parsing costs | 5×4×3 / (5×3) = 4 | Assess; measure asset size, triangle count, and visual quality |
| P2 | Remove legacy page sections hidden by the new narrative and their related styles | 3×4×2 / (2×3) = 4 | Recheck anchor, dynamic release, and CSS dependencies before implementation |

The resolved Dependency Review workflow issue is documented in the [optimization log](OPTIMIZATION_LOG_en.md) and is not repeated here.

This iteration corrected the README directory and asset-path errors; see the [optimization log](OPTIMIZATION_LOG_en.md).
