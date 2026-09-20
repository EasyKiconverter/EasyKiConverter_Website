# 网站项目架构

[English](ARCHITECTURE_en.md)

本项目是无构建依赖的静态网站，目录职责保持简单且固定：

```text
index.html
src/css/
src/js/
assets/
docs/
.github/workflows/
```

## 文件归属

- `index.html`：唯一的网站入口和页面结构。新增页面较多时，再按页面名称建立明确的 HTML 文件。
- `src/css/`：全局样式、组件样式和独立视觉效果。文件名使用 kebab-case，例如 `easter-eggs.css`。
- `src/js/`：浏览器端交互脚本。按功能拆分文件，例如 `navigation.js`、`animations.js`。
- `assets/`：图片、图标、字体和其他需要被页面引用的静态资源，可继续按 `images/`、`icons/`、`fonts/` 分类。
- `docs/`：架构、贡献和维护说明，不放运行时资源。
- `.github/`：Issue/PR 配置和 GitHub Actions，不放网站源码。

根目录只保留入口文件、项目说明、许可证和工具配置。调整目录后，必须同步检查 `index.html` 中的资源引用，并通过本地 HTTP 服务器验证页面加载。
