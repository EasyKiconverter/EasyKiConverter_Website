# Website Architecture

[中文](ARCHITECTURE.md)

This project is an Astro-generated static website using TypeScript, Three.js and OpenCascade/WASM:

```text
src/pages/index.astro
src/pages/en/index.astro
src/css/
src/js/
public/assets/
docs/
.github/workflows/
```

## File Ownership

- `src/pages/`: Astro entry pages for Chinese and English.
- `src/css/`: global styles, component styles and independent visual effects. `accessibility.css` owns keyboard focus and degraded rendering states.
- `src/js/app.ts`: page interaction, release fallback and navigation behavior.
- `src/js/model-viewer.ts`: the Three.js scene, camera, materials and interactive model rendering.
- `src/js/step-worker.ts`: STEP/WASM parsing and mesh preparation in a Web Worker.
- `public/assets/`: images, icons, fonts, model files and browser runtimes.
- `public/assets/model/`: the STEP source asset plus provenance and regeneration notes.
- `public/assets/vendor/`: the pinned `occt-import-js` browser runtime and its license.
- `docs/`: architecture, contribution, and maintenance documentation; do not place runtime resources here.
- `.github/`: issue/PR configuration and GitHub Actions; do not place website source code here.

Each page head maintains canonical, hreflang, Open Graph, Twitter Card, and SoftwareApplication JSON-LD metadata. When self-hosting, update the domain values together as described in [deployment](DEPLOYMENT_en.md).

Keep the root directory limited to project metadata, documentation indexes, and tool configuration. After moving files, run `pnpm run build` and verify the generated site through Astro preview.
