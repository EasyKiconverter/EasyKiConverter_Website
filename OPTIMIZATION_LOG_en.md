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
