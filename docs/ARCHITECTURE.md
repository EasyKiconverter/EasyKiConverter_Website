# 网站项目架构

[English](ARCHITECTURE_en.md)

本项目是由 Astro 构建的静态网站。产品首页与 3D 技术实验室是两个明确的加载边界：

```text
src/pages/index.astro
src/pages/en/index.astro
src/pages/lab/index.astro
src/pages/en/lab/index.astro
src/css/
src/js/
public/assets/
docs/
.github/workflows/
```

## 文件归属

- `src/pages/`：Astro 中文页和英文页入口。
- `src/pages/index.astro`、`src/pages/en/index.astro`：轻量产品首页，不导入 STEP/WASM 或 `MotionNarrative`。
- `src/pages/lab/`、`src/pages/en/lab/`：独立 3D 技术实验室；仅这些路由挂载 `MotionNarrative` 和模型脚本。
- `src/components/MotionNarrative.astro`：实验室共用的双语滚动叙事与模型控制面板。
- `src/css/`：全局样式、组件样式和独立视觉效果。`accessibility.css` 负责键盘焦点与降级态。
- `src/css/motion-narrative.css`：实验室的粘性舞台、章节状态、移动端重排和减少动态效果静态布局。
- `src/js/app.ts`：页面交互、同源 Release 刷新、发布版本回退和导航行为。
- `src/js/model-viewer.ts`：Three.js 场景、相机、材质和交互式模型渲染；读取单一滚动进度驱动模型姿态。
- `src/js/step-worker.ts`：在 Web Worker 中执行 STEP/WASM 解析和网格准备。
- `public/assets/`：图片、图标、模型、字体和实验室浏览器运行时资源。
- `public/assets/model/`：STEP 源资产与模型说明。
- `public/assets/vendor/`：固定版本的 `occt-import-js` 浏览器运行时及其许可证。
- `docs/`：架构、贡献和维护说明，不放运行时资源。
- `.github/`：Issue/PR 配置和 GitHub Actions，不放网站源码。

首页和实验室页面都维护 canonical、hreflang 与 Open Graph；首页的 SoftwareApplication JSON-LD 使用构建期生成的 Release 数据。构建同时生成 `public/data/latest-release.json`，浏览器只从本站同源刷新 Release 资产，Git 中的 `src/data/release.ts` 继续作为回退。部署到自有域名时，按[部署说明](DEPLOYMENT.md)一起替换域名。

根目录只保留项目说明、许可证和工具配置。修改页面或资源目录后，必须运行 `pnpm run build` 并通过 Astro 预览服务器验证页面加载。
