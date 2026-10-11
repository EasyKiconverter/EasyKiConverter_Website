# 3D 模型资产流程

[English](README.md)

源资产 `Easykiconverter_展示模型.step` 与本文档位于同一目录。它是来自 EasyEDA Pro / Open CASCADE 7.8 的 ASCII STEP 文件；源文件包含 48,420 条 `CARTESIAN_POINT` 记录，边界尺寸约为 60.74 × 47.28 × 18.00 mm。

独立的 3D Lab 默认按需加载旁路生成的 `Easykiconverter_展示模型.glb`，通过 Three.js `GLTFLoader` 渲染；官网首页不会加载模型运行时。GLB 由 `tools/prepare_model_asset.py` 从 STEP 源资产生成，保留归一化网格、材质组和源模型尺寸元数据。如果 GLB、WebGL 或加载器不可用，Lab 会回退到固定版本的 `occt-import-js` 0.0.23 OpenCascade/WASM，在 Web Worker 中读取 STEP；如果所有运行时资源都不可用，Lab 内容仍保留并显示样式化回退画面。

GLB 当前包含 303 个网格和 278,784 个三角面；生成参数为 `linearUnit: millimeter`、`linearDeflectionType: bounding_box_ratio`、`linearDeflection: 0.004`、`angularDeflection: 0.16`。STEP Worker 的窄屏参数仍为 `0.007`，只用于 GLB 加载失败时的回退路径；这些参数影响三角化精度，但不限制三角形总量。源文件 SHA256：`4310cdcbb920625dfdea4baac3855ec2fce4b7281ce335762c10791f0da939ce`。

随附运行时为 LGPL-2.1 许可的 `occt-import-js` 0.0.23，许可证保存在运行时目录。运行时 SHA256：JS `3fb44ce11d00611f9b3f3c5775d520ebab48930c1f08279b7b1316f05f0d3379`，WASM `33391fc9d94ea5c869a6718488bf0a9a464222bac9bdc764dfe1690cef281952`。

## 生产派生资产

1. 运行 `python3 tools/prepare_model_asset.py`，从 STEP 源文件生成 GLB。
2. 工具会使用仓库固定的 `occt-import-js` 运行时，并记录源模型尺寸元数据。
3. 只有在对比轮廓、连接器和焊盘细节后才进行简化，并以移动端可接受的网格量为目标。
4. 更新 GLB 后运行 `pnpm run build`、`python3 tools/validate_site.py` 和 `pnpm run test:browser`。
5. 发布前验证 GLB 缺失时的 STEP/WASM 回退、移动端和 reduced-motion 行为，同时保留 STEP 源文件。

网站不宣称当前 WebGL 三角化结果是无损 CAD 渲染，以便审计源资产与派生资产的边界。

直接通过 `file://` 打开页面时，浏览器安全策略会阻止本地 STEP 请求。脚本会检测该协议、跳过 STEP/Release API 请求并保留可用的回退画面。使用 `pnpm dev`、`pnpm run preview` 或部署后的 HTTP(S) 主机才能启用真实模型。
