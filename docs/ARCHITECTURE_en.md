# Website Architecture

[中文](ARCHITECTURE.md)

This project is a dependency-free static website with a small, fixed directory structure:

```text
index.html
src/css/
src/js/
assets/
docs/
.github/workflows/
```

## File Ownership

- `index.html`: the main website entry point and page structure. Add additional HTML pages only when they have a clear page-level purpose.
- `src/css/`: global styles, component styles, and independent visual effects. Use kebab-case filenames such as `easter-eggs.css`.
- `src/js/`: browser-side interaction scripts. Split larger behavior by responsibility, for example `navigation.js` and `animations.js`.
- `assets/`: images, icons, fonts, and other runtime resources. Subdivide into `images/`, `icons/`, or `fonts/` when needed.
- `docs/`: architecture, contribution, and maintenance documentation; do not place runtime resources here.
- `.github/`: issue/PR configuration and GitHub Actions; do not place website source code here.

Keep the root directory limited to entry points, project metadata, documentation indexes, and tool configuration. After moving files, update every reference in `index.html` and verify the site through a local HTTP server.
