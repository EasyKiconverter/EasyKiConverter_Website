# EasyKiConverter Website

[中文](README.md)

The official EasyKiConverter website, built with native HTML, CSS, and JavaScript.

## Project Structure

```text
.
├── index.html              # Entry point for GitHub Pages and local preview
├── src/
│   ├── css/                # Page styles and visual effects
│   └── js/                 # Browser interaction logic
├── assets/                 # Images, fonts, and other static resources
├── docs/                   # Project maintenance documentation
└── .github/workflows/      # GitHub Actions workflows
```

Keep page styles in `src/css/`, scripts in `src/js/`, and images or fonts in `assets/`. Do not continue adding source files or resources directly to the repository root.

See the [architecture guide](docs/ARCHITECTURE_en.md) and [developer documentation](docs/developer/README_en.md) for the complete rules.

## Local Preview

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173> in a browser.

## Design Direction

The page uses a warm paper background, abstract fluid shapes, and elastic easing to provide smooth Qt-like feedback while keeping the static site lightweight and maintainable.

## Branch Development

- `master`: stable production branch.
- `version/V0.0.1`: current release-development branch.
- `feature/<name>`: new feature branch created from the current version branch.

Features must be tested before merging into the version branch. A version branch may merge into `master` only after it is stable.
