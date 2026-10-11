# Website Architecture

[中文](ARCHITECTURE.md)

This project is an Astro-generated static website with two explicit loading boundaries: a lightweight product homepage and an isolated 3D technology lab.

```text
src/pages/index.astro
src/pages/en/index.astro
src/pages/lab/index.astro
src/pages/en/lab/index.astro
src/css/
src/js/
public/assets/
docs/
.github/workflows/
```

## File Ownership

- `src/pages/`: Astro entry pages for Chinese and English.
- `src/pages/index.astro`, `src/pages/en/index.astro`: lightweight product pages; they do not import STEP/WASM or `MotionNarrative`.
- `src/pages/lab/`, `src/pages/en/lab/`: isolated 3D technology lab routes; only these routes mount `MotionNarrative` and the model script.
- `src/components/MotionNarrative.astro`: the shared bilingual lab narrative and model control panel.
- `src/css/`: global styles, component styles and independent visual effects. `accessibility.css` owns keyboard focus and degraded rendering states.
- `src/css/motion-narrative.css`: lab sticky-stage styling, chapter states, mobile reflow, and the reduced-motion static layout.
- `src/js/app.ts`: page interaction, same-origin Release refresh, release fallback and navigation behavior.
- `src/js/model-viewer.ts`: the Three.js scene, camera, materials and interactive model rendering; it maps one scroll progress value to the model pose.
- `src/js/step-worker.ts`: STEP/WASM parsing and mesh preparation in a Web Worker.
- `public/assets/`: images, icons, fonts, model files and lab browser runtimes.
- `public/assets/model/`: the STEP source asset plus provenance and regeneration notes.
- `public/assets/vendor/`: the pinned `occt-import-js` browser runtime and its license.
- `docs/`: architecture, contribution, and maintenance documentation; do not place runtime resources here.
- `.github/`: issue/PR configuration and GitHub Actions; do not place website source code here.

Homepage and lab pages maintain canonical, hreflang and Open Graph metadata. The homepage SoftwareApplication JSON-LD uses build-time Release data. The build also emits `public/data/latest-release.json`; browsers refresh Release assets from the same origin, while the checked-in `src/data/release.ts` remains the fallback. When self-hosting, update the domain values together as described in [deployment](DEPLOYMENT_en.md).

Keep the root directory limited to project metadata, documentation indexes, and tool configuration. After moving files, run `pnpm run build` and verify the generated site through Astro preview.
