# Development Guidelines

[中文](DEVELOPMENT_GUIDELINES.md)

## Scope

These rules apply to changes to HTML, CSS, JavaScript, static assets, maintenance documentation, and GitHub Actions.

## Directories and Files

- Keep page entry points in `src/pages/`; the Chinese entry is `src/pages/index.astro`, the English entry is `src/pages/en/index.astro`, and 3D Lab entries live under `src/pages/{lab,en/lab}/`.
- Keep styles in `src/css/`, scripts in `src/js/`, published assets in `public/assets/`, and source-only assets in `src/assets/source/`.
- Put architecture, workflow, and maintenance documentation in `docs/`; every document must have both `.md` and `_en.md` versions.
- Keep GitHub Actions and PR configuration in `.github/` only.
- Use lowercase kebab-case filenames, such as `download-card.css` and `navigation.js`.

## Code and Compatibility

- Use two-space indentation in Astro, CSS, and TypeScript. Keep interactive modules typed and preserve semantic HTML, accessible labels and progressive enhancement.
- Prefer semantic HTML, accessible labels, and progressive enhancement. Preserve `target="_blank"` with `rel="noreferrer"` on external links.
- Respect `prefers-reduced-motion` when adding animations.
- When changing resource paths, also check the Astro page, `public/assets/` and the production build preview.

## Documentation and Assets

When adding or changing documentation, update the Chinese and English versions together and add reciprocal language links at the top. Put images, icons, and fonts in the appropriate `public/assets/` subdirectory; keep non-published originals in `src/assets/source/`, and do not replace reusable assets with repeated inline content.

## Build and verification

```bash
pnpm run check
pnpm run build
python3 tools/validate_site.py
pnpm run test:browser
```

`pnpm run build` synchronizes GitHub Release data at build time. If the network is unavailable, it uses the verified repository fallback; set `RELEASE_SYNC_REQUIRED=1` in CI-equivalent checks to fail instead.

## Flowcharts and Architecture Diagrams

Use Mermaid text that can be read by Marmimind for flowcharts, architecture diagrams, sequence diagrams, and dependency graphs. Prefer a `mermaid` code block in Markdown, or store standalone diagrams under `docs/diagrams/*.mmd`. Do not submit only PNGs, screenshots, or unreviewable proprietary formats; diagram nodes and important notes should be provided in both Chinese and English.

## CodeGraph Index

The project uses CodeGraph to build a code relationship index. Keep `.codegraph/.gitignore` in the repository, but keep the database, logs, and runtime files local. After changing JavaScript or GitHub Actions, run `codegraph sync` to update the index and `codegraph status` to verify that it is current.

## Security

Never commit secrets, tokens, personal configuration, or build output. Verify that every new external link, script, or font is trustworthy and necessary.
