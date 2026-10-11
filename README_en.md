# EasyKiConverter Website

[中文](README.md)

The official EasyKiConverter website, built with Astro and TypeScript. The Chinese homepage and indexable English entry point stay lightweight; Three.js and OpenCascade/WASM load on demand in the isolated 3D Lab.

## Project Structure

```text
.
├── src/
│   ├── components/         # Shared components used by both locales
│   ├── pages/              # Chinese, English, and SEO routes
│   ├── css/                # Page styles and visual effects
│   └── js/                 # Interactions; 3D Lab rendering and STEP worker
├── public/assets/          # Icons, models, screenshots, and runtime assets
├── tools/                  # Local build and site-validation scripts
├── docs/                   # Architecture, development, deployment, and performance docs
└── .github/workflows/      # GitHub Actions workflows
```

`public/data/latest-release.json` is the build-generated same-origin Release asset snapshot; browsers refresh it from this site, while `src/data/release.ts` remains the static fallback.

The homepage is a lightweight product presentation using the real Qt Quick screenshot, CSS depth and download links; it does not load the CAD runtime. See the [EDA format matrix](src/pages/formats/index.astro) for capability scope and the [traceable conversion cases](src/pages/cases/index.astro) for test-backed examples. The former STEP/Three.js research work is isolated at [`/lab/`](src/pages/lab/index.astro). It uses the offline-generated GLB by default; `src/js/step-worker.ts` remains the fallback path and `src/js/model-viewer.ts` renders the experiments. The model source, measurements and STEP → GLB tool are documented in [3D model pipeline](public/assets/model/README.md).

Put pages in `src/pages/` and reusable page sections in `src/components/`; keep styles in `src/css/`, scripts in `src/js/`, images, models, icons, or runtime assets in `public/assets/`, and build-generated same-origin data in `public/data/`. There is no root-level `assets/` directory. Do not add source files or resources directly to the repository root.

See the [architecture guide](docs/ARCHITECTURE_en.md) and [developer documentation](docs/developer/README_en.md) for the complete rules.

## Local Preview

```bash
pnpm install
pnpm dev
```

For a production build, run `pnpm run build` and preview it with `pnpm run preview`. Validate the browser-delivery GLB structure, normals, source metadata, and triangle budgets with `pnpm run assets:check`. Do not open the 3D Lab through `file://`; browsers block STEP/WASM reads, which makes local rendering differ from production.

See [deployment and preview parity](docs/DEPLOYMENT_en.md) for self-hosting and release checks. To simulate a production subpath, serve the repository parent directory and open `http://localhost:4174/EasyKiConverter_Website/`.

## Design Direction

The page uses a warm paper background, abstract fluid shapes, and elastic easing to provide smooth Qt-like feedback while keeping the static site lightweight and maintainable.

## Branch Development

- `master`: stable production branch.
- `version/V0.0.1`: current release-development branch.
- `feature/<name>`: new feature branch created from the current version branch.

Features must be tested before merging into the version branch. A version branch may merge into `master` only after it is stable.
