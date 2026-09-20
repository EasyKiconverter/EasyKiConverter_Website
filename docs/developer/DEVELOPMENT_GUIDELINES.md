# 项目开发规范

[English](DEVELOPMENT_GUIDELINES_en.md)

## 适用范围

本规范适用于网站 HTML、CSS、JavaScript、静态资源、维护文档和 GitHub Actions 的所有修改。

## 目录与文件

- 页面入口放在根目录或明确的页面目录中；当前主入口是 `index.html`。
- 样式放在 `src/css/`，脚本放在 `src/js/`，运行时资源放在 `assets/`。
- 架构、流程和维护说明放在 `docs/`；每份文档必须有 `.md` 与 `_en.md` 两个版本。
- GitHub Actions 和 PR 配置只放在 `.github/`。
- 文件名使用小写 kebab-case，例如 `download-card.css`、`navigation.js`。

## 编码与兼容性

- HTML、CSS、JavaScript 使用两个空格缩进，保持现有原生实现，不为简单交互引入依赖。
- 优先使用语义化 HTML、可访问标签和渐进增强；外部链接保留 `target="_blank"` 与 `rel="noreferrer"`。
- 新增动画必须尊重 `prefers-reduced-motion`。
- 修改资源路径时，同时检查 `index.html` 和本地 HTTP 预览。

## 文档与资源

新增或修改文档时，必须同步更新中英文版本，并在顶部互相添加语言链接。图片、图标和字体放入 `assets/` 对应子目录，不要以内联重复内容代替可复用资源。

## 流程图与架构图

流程图、架构图、时序图和依赖关系图统一使用 Marmimind 可读取的 Mermaid 文本格式：优先使用 Markdown 中的 `mermaid` 代码块，或将独立图表保存为 `docs/diagrams/*.mmd`。禁止只提交 PNG、截图或无法审查的专有格式；图表中的节点和关键说明应同时提供中英文。

## CodeGraph 索引

项目使用 CodeGraph 建立代码关系索引。`.codegraph/.gitignore` 必须保留在仓库中，但数据库、日志和运行时文件只保存在本地。修改 JavaScript 或 GitHub Actions 后，可运行 `codegraph sync` 更新索引，并用 `codegraph status` 检查索引是否最新。

## 安全

不得提交密钥、令牌、个人配置或构建产物。新增外部链接、脚本或字体前，必须确认来源可信且确有必要。
