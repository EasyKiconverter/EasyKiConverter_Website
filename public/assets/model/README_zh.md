# 3D 模型资产流程

[English](README.md)

源资产 `Easykiconverter_展示模型.step` 与本文档位于同一目录。它是来自 EasyEDA Pro / Open CASCADE 7.8 的 ASCII STEP 文件；源文件包含 48,420 条 `CARTESIAN_POINT` 记录，边界尺寸约为 60.74 × 47.28 × 18.00 mm。

独立的 3D Lab 默认按需加载旁路生成的 `Easykiconverter_展示模型.glb`，通过 Three.js `GLTFLoader` 渲染。官网首屏使用静态 WebP，滚动接近叙事区后才懒加载 `public/assets/showcase/easyki-conversion-story.glb`；该 Meshopt 资产约 2.19 MB，并保留 303 个源网格以呈现零件分解。基础 GLB 由 `tools/prepare_model_asset.py` 从 STEP 派生，首页叙事 GLB 则由 `pnpm run assets:story-model` 压缩生成，两者均保留归一化网格、材质组和源模型尺寸元数据。如果 Lab 的 GLB、WebGL 或加载器不可用，会回退到固定版本的 `occt-import-js` 0.0.23 OpenCascade/WASM，在 Web Worker 中读取 STEP；如果所有运行时资源都不可用，Lab 内容仍保留并显示样式化回退画面。

GLB 已包含生成好的顶点法线，浏览器交付路径会直接复用，不再为每个网格重复计算；STEP 回退路径则在 Worker 传输网格后重新计算法线。

桌面 GLB 当前包含 303 个网格和 278,784 个三角面；移动 GLB 包含 303 个网格和 228,004 个三角面，约 8.1 MB。首页叙事 GLB 以 `EXT_meshopt_compression` 压缩后约 2.19 MB，保留 303 个网格与 278,784 个三角面。`tools/check_model_assets.py` 将桌面、移动和叙事模型的三角面上限分别设为 300,000、250,000 和 300,000，叙事资产体积上限为 2.5 MB。桌面生成参数为 `linearUnit: millimeter`、`linearDeflectionType: bounding_box_ratio`、`linearDeflection: 0.004`、`angularDeflection: 0.16`；移动端仅降低线性偏差。屏幕宽度不超过 760px 或 stage 小于 520px 时选择移动 GLB；STEP Worker 的窄屏参数只用于 GLB 加载失败时的回退路径。这些参数影响三角化精度；校验器会捕获资产意外膨胀，但不会自动简化几何。源文件 SHA256：`4310cdcbb920625dfdea4baac3855ec2fce4b7281ce335762c10791f0da939ce`。

随附运行时为 LGPL-2.1 许可的 `occt-import-js` 0.0.23，许可证保存在运行时目录。运行时 SHA256：JS `3fb44ce11d00611f9b3f3c5775d520ebab48930c1f08279b7b1316f05f0d3379`，WASM `33391fc9d94ea5c869a6718488bf0a9a464222bac9bdc764dfe1690cef281952`。

## 生产派生资产

1. 运行 `python3 tools/prepare_model_asset.py`，从 STEP 源文件生成桌面 GLB。
2. 运行 `python3 tools/prepare_model_asset.py --linear-deflection 0.007 --output public/assets/model/Easykiconverter_展示模型-mobile.glb`，生成移动 GLB。
3. 运行 `pnpm run assets:story-model`，从桌面 GLB 生成首页 Meshopt 压缩资产。
4. 工具会使用仓库固定的 `occt-import-js` 运行时，并记录源模型尺寸元数据。
5. 运行 `pnpm run assets:check`，验证 GLB 容器、生成法线、源模型元数据、压缩格式和交付预算。
6. 只有在对比轮廓、连接器和焊盘细节后才进行简化；如果批准新的资产策略，再同步调整明确的预算。
7. 更新任一模型后运行 `pnpm run build`、`python3 tools/validate_site.py`、`pnpm run assets:check` 和 `pnpm run test:browser`。
8. 发布前验证 Lab 缺失 GLB 时的 STEP/WASM 回退、首页静态 WebP 回退、移动端和 reduced-motion 行为，同时保留 STEP 源文件。

网站不宣称当前 WebGL 三角化结果是无损 CAD 渲染，以便审计源资产与派生资产的边界。

直接通过 `file://` 打开页面时，浏览器安全策略会阻止本地 STEP 请求。脚本会检测该协议、跳过 STEP/Release API 请求并保留可用的回退画面。使用 `pnpm dev`、`pnpm run preview` 或部署后的 HTTP(S) 主机才能启用真实模型。
