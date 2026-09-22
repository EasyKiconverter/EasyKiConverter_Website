# EasyKiConverter Website

[English](README_en.md)

EasyKiConverter 官方网站，使用 Astro、TypeScript、Three.js 与 OpenCascade/WASM 构建，提供中文首页与可索引的英文入口。

## 项目结构

```text
.
├── src/pages/index.astro   # 中文网站入口
├── src/pages/en/index.astro # English website entry
├── public/assets/          # 图片、模型和 WASM 等静态资源
├── src/
│   ├── css/                # 页面样式与彩蛋样式
│   └── js/                 # 页面交互逻辑
├── assets/                 # 图片、字体等静态资源
├── docs/                   # 项目维护文档
└── .github/workflows/      # GitHub Actions 工作流
```

首页使用固定版本的 OpenCascade/WASM STEP 解析器在浏览器中生成真实网格；`src/js/step-worker.ts` 把解析和网格准备放在 Web Worker 中，`src/js/model-viewer.ts` 使用 Three.js 负责渲染，避免阻塞首屏主线程。原始 `public/assets/model/Easykiconverter_展示模型.step` 与模型说明放在同一目录中，模型来源、尺寸测量、三角形预算和后续 STEP → GLB 流程见 [3D model pipeline](public/assets/model/README.md)。

新增页面放入 `src/pages/`；样式放入 `src/css/`，脚本放入 `src/js/`，图片、模型和运行时资源放入 `public/assets/`，不要把源码或资源继续堆在根目录。

详细架构约束见：[项目架构](docs/ARCHITECTURE.md) | [开发者文档](docs/developer/README.md)。

## 本地预览

```bash
pnpm install
pnpm dev
```

构建发布版本：

```bash
pnpm run build
pnpm run preview
```

不要双击页面使用 `file://`，浏览器会阻止 STEP/WASM 资源读取，导致本地效果与发布效果不一致。

自有服务器部署和发布前检查见：[部署与预览一致性](docs/DEPLOYMENT.md)。如果服务器使用子路径，可在仓库父目录启动 HTTP 服务并访问 `http://localhost:4174/EasyKiConverter_Website/`，模拟线上路径。

## 设计方向

页面采用温暖的纸张底色、抽象流体图形和弹性缓动动画，强调像 Qt 软件一样顺滑的操作反馈，同时保留轻量、易维护的静态站点结构。

## 品牌资源

官网复用了 EasyKiConverter 主项目中的官方应用图标，来源为主项目的 `resources/icons/app_icon.svg` 与 `app_icon_dark.svg`，当前副本位于 `assets/icons/`。

## 分支开发流程

- `master`：稳定生产分支，只接收已经验证稳定的版本分支。
- `version/V0.0.1`：当前版本分支，功能完成并通过测试后合并到这里。
- `feature/<功能名称>`：新功能开发分支，从当前版本分支创建；开发完成后先测试，再合并回版本分支。

示例：

```bash
git switch version/V0.0.1
git switch -c feature/improve-download-section
# 开发并测试完成后，将 feature 分支合并回 version/V0.0.1
```

版本分支稳定后，才允许合并到 `master`。
