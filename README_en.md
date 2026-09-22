# EasyKiConverter Website

[中文](README.md)

The official EasyKiConverter website, built with Astro, TypeScript, Three.js and OpenCascade/WASM, with a Chinese homepage and an indexable English entry point.

## Project Structure

```text
.
├── src/pages/index.astro   # Chinese website entry
├── src/pages/en/index.astro # English website entry
├── public/assets/          # Images, models and WASM resources
├── src/
│   ├── css/                # Page styles and visual effects
│   └── js/                 # Browser interaction logic
├── assets/                 # Images, fonts, and other static resources
├── docs/                   # Project maintenance documentation
└── .github/workflows/      # GitHub Actions workflows
```

The homepage uses a pinned OpenCascade/WASM STEP importer to build a real mesh in the browser. `src/js/step-worker.ts` performs parsing and mesh preparation in a Web Worker while `src/js/model-viewer.ts` uses Three.js for rendering, keeping the main thread responsive. The original `public/assets/model/Easykiconverter_展示模型.step` is stored beside its model documentation; its measurements, triangle budget, fallback behavior and planned STEP → GLB pipeline are documented in [3D model pipeline](public/assets/model/README.md).

Keep page styles in `src/css/`, scripts in `src/js/`, and images, models or runtime assets in `public/assets/`. Do not continue adding source files or resources directly to the repository root.

See the [architecture guide](docs/ARCHITECTURE_en.md) and [developer documentation](docs/developer/README_en.md) for the complete rules.

## Local Preview

```bash
pnpm install
pnpm dev
```

For a production build, run `pnpm run build` and preview it with `pnpm run preview`. Do not open the page through `file://`: browsers block STEP/WASM reads, which makes local rendering differ from production.

See [deployment and preview parity](docs/DEPLOYMENT_en.md) for self-hosting and release checks. To simulate a production subpath, serve the repository parent directory and open `http://localhost:4174/EasyKiConverter_Website/`.

## Design Direction

The page uses a warm paper background, abstract fluid shapes, and elastic easing to provide smooth Qt-like feedback while keeping the static site lightweight and maintainable.

## Branch Development

- `master`: stable production branch.
- `version/V0.0.1`: current release-development branch.
- `feature/<name>`: new feature branch created from the current version branch.

Features must be tested before merging into the version branch. A version branch may merge into `master` only after it is stable.
