# Development Workflow

[中文](DEVELOPMENT_WORKFLOW.md)

## Branch Responsibilities

- `master`: stable production branch; it accepts merges only from stable version branches.
- `version/V0.0.1`: current version branch; it accepts completed and verified features.
- `feature/<name>`: new feature branch created from the current version branch.
- `fix/<name>`: bug-fix branch created for a version branch.

## Standard Flow

1. Create `feature/<name>` or `fix/<name>` from the latest `version/V0.0.1`.
2. Implement one clear objective and keep commits easy to review.
3. Start the site locally and check desktop, mobile, navigation, external links, console errors, and reduced-motion behavior.
4. Open a pull request into `version/V0.0.1` with the change summary, test results, and screenshots when the UI changes.
5. Merge into the version branch only after review and verification are complete.
6. Merge the version branch into `master` only after full regression testing confirms that the version is stable.

See the [development workflow diagram](../diagrams/development-workflow.mmd). It is written as Mermaid text and can be rendered by Marmimind or a Markdown viewer with Mermaid support.

## Command Example

```bash
git fetch origin
git switch version/V0.0.1
git pull --ff-only
git switch -c feature/improve-download-section
python3 -m http.server 4173
```

## Commits and Pull Requests

Use short, imperative commit messages, with one clear intent per commit, for example: `feat: improve mobile hero layout`. A PR must describe the related issue when applicable, validation steps, scope, and follow-up risks. Documentation changes must update Chinese and English versions together.

## Prohibited Actions

Do not commit unverified features directly to `master` or a version branch, bypass pull-request review, or promote an unconfirmed version to `master`.
