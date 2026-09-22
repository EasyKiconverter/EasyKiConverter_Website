# 开发流程规范

[English](DEVELOPMENT_WORKFLOW_en.md)

## 分支职责

- `master`：稳定生产分支，只接收稳定版本分支的合并。
- `version/V0.0.1`：当前版本分支，接收已经开发并验证通过的功能。
- `feature/<name>`：新功能分支，从当前版本分支创建。
- `fix/<name>`：针对版本分支的缺陷修复分支。

## 标准流程

1. 从最新的 `version/V0.0.1` 创建 `feature/<name>` 或 `fix/<name>`。
2. 在分支中完成单一目标的开发，保持提交可审查。
3. 本地启动网站并检查桌面端、移动端、导航、外部链接、控制台和 reduced-motion 行为。
4. 提交 Pull Request 到 `version/V0.0.1`，说明改动、测试结果和截图（视觉改动必须提供）。
5. 审查通过且测试完成后，合并到版本分支。
6. 版本分支经过完整回归并确认稳定后，才允许合并到 `master`。

流程图源文件见：[开发流程图](../diagrams/development-workflow.mmd)。该文件使用 Mermaid 文本格式，可在 Marmimind 或支持 Mermaid 的 Markdown 查看器中渲染。

## 命令示例

```bash
git fetch origin
git switch version/V0.0.1
git pull --ff-only
git switch -c feature/improve-download-section
pnpm install
pnpm dev
```

## 提交与 PR

提交信息使用简短、祈使语气，并且一次提交只表达一个清晰意图，例如：`feat: improve mobile hero layout`。PR 必须说明相关 Issue（如有）、验证方式、影响范围和待注意事项；文档修改必须同时包含中英文更新。

## 禁止事项

禁止直接向 `master` 或版本分支提交未验证的功能，禁止绕过 PR 合并，禁止把未确认稳定的版本发布到 `master`。
