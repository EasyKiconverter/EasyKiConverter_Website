# Developer Documentation

[中文](README.md)

This directory is the entry point for EasyKiConverter Website development rules. Contributors and automation agents should read the relevant rules before changing the code.

## Rule Index

- [Development Guidelines](DEVELOPMENT_GUIDELINES_en.md) / [中文](DEVELOPMENT_GUIDELINES.md): code, directory, compatibility, and resource constraints.
- [Development Workflow](DEVELOPMENT_WORKFLOW_en.md) / [中文](DEVELOPMENT_WORKFLOW.md): issue, branch, testing, version, and merge process.

## Required Principles

1. Start new work on `feature/<name>`; do not develop directly on `master` or a version branch.
2. Verify a feature locally before merging it into `version/V0.0.1`.
3. Merge a version branch into `master` only after the version is stable.
4. Maintain Chinese and English versions of every document with reciprocal language links.
5. Put every file in a clearly owned directory; do not accumulate source, assets, or documentation in the repository root.
