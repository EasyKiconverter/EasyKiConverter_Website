# EasyKiConverter Website

[English](README_en.md)

EasyKiConverter 官方网站，使用 Astro、TypeScript 和静态资源构建，提供中文首页与可索引的英文入口；独立的 3D 技术实验室按需加载 Three.js 与 OpenCascade/WASM。

## 项目结构

```text
.
├── src/
│   ├── components/         # 中英文共用页面组件
│   ├── pages/              # 中文页、英文页及 SEO 路由
│   ├── css/                # 页面样式与视觉效果
│   └── js/                 # 页面交互；3D Lab 的渲染与 STEP Worker
├── public/assets/          # 图标、模型、截图和运行时资源
├── tools/                  # 本地构建与站点校验脚本
├── docs/                   # 架构、开发、部署和性能文档
└── .github/workflows/      # GitHub Actions 工作流
```

`public/data/latest-release.json` 是构建期生成的同源 Release 资产快照；浏览器从本站刷新它，`src/data/release.ts` 保留静态回退。

首页是轻量的产品展示：使用真实 Qt Quick 截图、CSS 空间层次和下载入口，不加载 CAD 解析运行时。格式能力见[EDA 格式矩阵](src/pages/formats/index.astro)，可追溯样本见[真实转换案例](src/pages/cases/index.astro)。旧的 STEP/Three.js 研究功能集中在独立的 [`/lab/`](src/pages/lab/index.astro) 页面；默认使用离线生成的 GLB，`src/js/step-worker.ts` 保留为回退路径，`src/js/model-viewer.ts` 负责实验室渲染。模型来源、尺寸测量和 STEP → GLB 工具见[3D 模型资产流程](public/assets/model/README_zh.md)。

新增页面放入 `src/pages/`，可复用页面区块放入 `src/components/`；样式放入 `src/css/`，脚本放入 `src/js/`，图片、模型、图标和运行时资源统一放入 `public/assets/`，构建生成的同源数据放入 `public/data/`。仓库没有根目录 `assets/`；不要把源码或资源继续堆在根目录。

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

检查浏览器交付模型的 GLB 结构、法线、源模型元数据和三角面预算：

```bash
pnpm run assets:check
```

不要双击页面使用 `file://`。首页可直接查看静态内容；若要验证 3D Lab，必须通过 Astro HTTP 服务器访问，以允许 STEP/WASM 同源加载。

自有服务器部署和发布前检查见：[部署与预览一致性](docs/DEPLOYMENT.md)。如果服务器使用子路径，可在仓库父目录启动 HTTP 服务并访问 `http://localhost:4174/EasyKiConverter_Website/`，模拟线上路径。

## 设计方向

页面采用温暖的纸张底色、抽象流体图形和弹性缓动动画，强调像 Qt 软件一样顺滑的操作反馈，同时保留轻量、易维护的静态站点结构。

## 品牌资源

官网复用了 EasyKiConverter 主项目中的官方应用图标，来源为主项目的 `resources/icons/app_icon.svg` 与 `app_icon_dark.svg`，当前副本位于 `public/assets/icons/`。

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
