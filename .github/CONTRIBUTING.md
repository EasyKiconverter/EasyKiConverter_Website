# 贡献指南 / Contributing Guide

[English](#english) | [中文](#中文)

## 中文

感谢你为 EasyKiConverter Website 做贡献。

### 开始之前

1. 阅读[开发者文档](../docs/developer/README.md)。
2. 搜索已有 Issue 和 Pull Request，避免重复工作。
3. 新功能从 `version/V0.0.1` 创建 `feature/<name>` 分支；缺陷修复使用 `fix/<name>`。

### 提交代码

- 保持每个分支只完成一个清晰目标。
- 遵守[项目开发规范](../docs/developer/DEVELOPMENT_GUIDELINES.md)和[开发流程规范](../docs/developer/DEVELOPMENT_WORKFLOW.md)。
- 文档必须同时维护中英文版本；流程图和架构图使用 Mermaid 文本。
- Pull Request 目标分支为 `version/V0.0.1`，稳定版本才允许合并到 `master`。

### 本地验证

```bash
python3 -m http.server 4173
```

请检查桌面端和移动端布局、页面导航、外部链接、浏览器控制台、`prefers-reduced-motion`，以及资源路径是否正确。

## English

Thank you for contributing to EasyKiConverter Website.

### Before You Start

1. Read the [developer documentation](../docs/developer/README_en.md).
2. Search existing issues and pull requests before starting duplicate work.
3. Create `feature/<name>` from `version/V0.0.1` for features, or `fix/<name>` for bug fixes.

### Code Contributions

- Keep each branch focused on one clear objective.
- Follow the [development guidelines](../docs/developer/DEVELOPMENT_GUIDELINES_en.md) and [workflow](../docs/developer/DEVELOPMENT_WORKFLOW_en.md).
- Maintain Chinese and English documentation together; use Mermaid text for flowcharts and architecture diagrams.
- Target `version/V0.0.1` with pull requests. Merge into `master` only after a version is stable.

### Local Validation

```bash
python3 -m http.server 4173
```

Check desktop and mobile layouts, navigation, external links, browser-console errors, `prefers-reduced-motion`, and resource paths.
