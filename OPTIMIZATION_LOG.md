# 优化记录

[English](OPTIMIZATION_LOG_en.md)

## 2026-09-22 — Dependency Review 工作流故障核验

- **问题：** Actions run `35737032681` 的 `Dependency Review` 因仓库未启用 GitHub Dependency Graph 而失败；日志原文为 “Dependency review is not supported on this repository”。
- **处理：** 当前版本分支已在 `c45e03f` 将工作流改为仅在 PR 修改依赖清单时运行 Dependency Review。当前修复分支继承了该改动；本轮未重复修改工作流，也未推送远程。
- **验证：** 当前分支相对 `upstream/version/V0.0.1` 未修改依赖清单，检测逻辑输出 `dependency manifests unchanged: review is skipped`。`pnpm run check`、`pnpm run build`、`python3 tools/validate_site.py` 均通过，Astro 0 error / 0 warning / 0 hint。
- **风险与回滚：** 本轮仅新增记录文件；若需撤销，可回滚本轮文档提交，不影响站点运行。
- **限制：** 未重跑 GitHub Actions；本地结果验证工作流分支条件与网站构建，不代表远程 run 状态。

## 2026-09-22 — 校正仓库结构文档

- **选择原因：** 中英文 README 均把不存在的根目录 `assets/` 列为资源位置，并遗漏 `src/components/` 与 `tools/`；这可能导致贡献者把新文件放错位置。修复成本低、证据明确，不改变运行行为。
- **修改：** 同步更新中英文项目树和资源归属说明，修正中文 README 的官方图标路径与模型文档语言入口；在优化待办中调整后续机会优先级。
- **验证：** `pnpm run check` 与 `pnpm run build` 通过（Astro 0 errors / 0 warnings / 0 hints）；`python3 tools/validate_site.py` 通过；`git diff --check` 通过。没有独立 test、lint 或 benchmark 脚本；本轮仅改文档，未做浏览器测试。
- **风险与回滚：** 仅文档变化；如目录描述有误，可单独回滚 README 与本条记录，不影响站点运行。
- **下一步：** 优先评估浏览器回归测试，其次量测 STEP → GLB 管线收益。
