# 优化记录

[English](OPTIMIZATION_LOG_en.md)

## 2026-09-22 — Dependency Review 工作流故障核验

- **问题：** Actions run `35737032681` 的 `Dependency Review` 因仓库未启用 GitHub Dependency Graph 而失败；日志原文为 “Dependency review is not supported on this repository”。
- **处理：** 当前版本分支已在 `c45e03f` 将工作流改为仅在 PR 修改依赖清单时运行 Dependency Review。当前修复分支继承了该改动；本轮未重复修改工作流，也未推送远程。
- **验证：** 当前分支相对 `upstream/version/V0.0.1` 未修改依赖清单，检测逻辑输出 `dependency manifests unchanged: review is skipped`。`pnpm run check`、`pnpm run build`、`python3 tools/validate_site.py` 均通过，Astro 0 error / 0 warning / 0 hint。
- **风险与回滚：** 本轮仅新增记录文件；若需撤销，可回滚本轮文档提交，不影响站点运行。
- **限制：** 未重跑 GitHub Actions；本地结果验证工作流分支条件与网站构建，不代表远程 run 状态。

