# AI Development Rules

[中文](AI_DEVELOPMENT_RULES.md)

This website follows the [AI collaboration policy](https://github.com/EasyKiconverter/EasyKiConverter/blob/master/docs/developer/ai-development/policy/AI_POLICY.md), [AGENTS.md](https://github.com/EasyKiconverter/EasyKiConverter/blob/master/AGENTS.md), and applicable Skills from the [EasyKiConverter main repository](https://github.com/EasyKiconverter/EasyKiConverter). This page turns the upstream rules into an executable checklist for the Astro website; review it whenever the upstream rules change.

## Rule Priority and Scope

1. Current-branch source, tests, workflows, and CI are factual sources; issues, historical reviews, and plans cannot override current evidence.
2. Before editing, inspect the branch, baseline, and `git status --short`; preserve other contributors' changes. Never use destructive reset, force-push, or user-file deletion.
3. When `.codegraph/` exists, run `codegraph explore` first to understand symbols, call paths, and page boundaries before reading implementation files.
4. Do not present page copy, a code entry point, or an exporter as complete EDA compatibility. Report automated tests, structural checks, and commercial EDA validation separately.

## Website Rules

- Keep the homepage lightweight; load STEP, WASM, and Three.js only on demand in the isolated 3D Lab.
- Keep pages, components, styles, scripts, public assets, and tools in their existing responsibility directories; do not scatter files in the repository root.
- Maintain Chinese and English documentation together with reciprocal links; use Mermaid text for architecture, workflow, dependency, and state relationships.
- Preserve semantic HTML, keyboard access, `prefers-reduced-motion`, and no-JavaScript fallbacks.
- Use mocks or static fixtures for network tests; local regression tests must not depend on live network services.

## Verification and Delivery

For page or workflow changes, run at least `pnpm run check`, `pnpm run build`, `python3 tools/validate_site.py`, `pnpm run test:browser`, and `git diff --check`. Reports must separate executed checks, unexecuted checks, environment blockers, CI results, and external-domain/commercial-EDA validation. Use Conventional Commits; PRs target `version/V0.0.1`, merge only after review and CI, and reach `master` only after the version is stable.
