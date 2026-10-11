# AI 开发约束

[English](AI_DEVELOPMENT_RULES_en.md)

本网站项目沿用 [EasyKiConverter 主项目的 AI 协作政策](https://github.com/EasyKiconverter/EasyKiConverter/blob/master/docs/developer/ai-development/policy/AI_POLICY.md)、[AGENTS.md](https://github.com/EasyKiconverter/EasyKiConverter/blob/master/AGENTS.md) 和相关 Skills。本页把适用于 Astro 网站的规则收敛为可执行清单；主项目规则更新后，应同步复核本页。

## 规则优先级与工作边界

1. 当前分支的源码、测试、工作流和 CI 是事实来源；Issue、历史审查和计划不能覆盖当前证据。
2. 开始前检查分支、基线和 `git status --short`，保留其他贡献者的修改；禁止破坏性 reset、强推和删除用户文件。
3. 仓库存在 `.codegraph/` 时，先运行 `codegraph explore` 理解符号、调用关系和页面边界，再读取具体源码。
4. 不把页面文案、代码入口或导出器存在误写成完整 EDA 兼容；自动化测试、结构检查和商业 EDA 实机验证必须分别报告。

## 网站实现规则

- 首页保持轻量；STEP、WASM 和 Three.js 只在独立 3D Lab 按需加载。
- 页面、组件、样式、脚本、公开资源和工具放入已有职责目录，不在根目录散落文件。
- 中文和英文长期文档必须成对更新并互相链接；架构、流程、依赖和状态关系使用 Mermaid 文本。
- 保持语义 HTML、键盘可用性、`prefers-reduced-motion` 和无 JavaScript 回退。
- 网络测试使用 Mock 或静态 fixture；不得把真实网络请求作为本地回归测试前提。

## 验证与交付

页面或工作流变更至少运行 `pnpm run check`、`pnpm run build`、`python3 tools/validate_site.py`、`pnpm run test:browser` 和 `git diff --check`。报告必须分别列出已执行、未执行、环境阻塞、CI 结果和外部域名/商业 EDA 未验证项。提交使用 Conventional Commit；PR 必须指向 `version/V0.0.1`，通过审查和 CI 后才能合并，稳定版本才能进入 `master`。
