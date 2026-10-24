# 3D 模型资产流程

[English](README.md)

STEP 源资产 `Easykiconverter_展示模型.step` 与本文档位于同一目录。未压缩的桌面和移动 GLB 中间资产保存在 `src/assets/source/model/`，优化后的浏览器交付 GLB 保存在本文档旁。STEP 是来自 EasyEDA Pro / Open CASCADE 7.8 的 ASCII 文件；直接解析发现 48,420 条 `CARTESIAN_POINT` 记录，边界尺寸约为 60.74 × 47.28 × 18.00 mm。

独立的 3D Lab 按需加载经过 Meshopt 压缩的桌面或移动 GLB，通过 Three.js `GLTFLoader` 和 Meshopt 解码器渲染。官网首屏使用静态 WebP，滚动接近叙事区后才懒加载首页叙事 GLB。Lab 与首页交付模型均使用 Meshopt 压缩，并保留源网格以呈现零件分解。未压缩 GLB 从 STEP 离线生成，随后分别优化为首页和 Lab 交付资产。如果 Lab 的 GLB、WebGL 或加载器不可用，会回退到固定版本的 `occt-import-js` 0.0.23 OpenCascade/WASM，在 Web Worker 中读取 STEP；如果所有运行时资产都不可用，Lab 内容仍保留并显示样式化回退画面。

GLB 已包含生成好的顶点法线，浏览器交付路径会直接复用，不再为每个网格重复计算；STEP 回退路径则在 Worker 传输网格后重新计算法线。

压缩 GLB 依赖 `EXT_meshopt_compression` 和 `KHR_mesh_quantization`。`GLTFLoader` 必须设置 Three.js 的 `MeshoptDecoder`；将归一化整数属性复制到 Float32 缓冲区时，应通过 `BufferAttribute` 访问器读取，让 glTF 归一化规则生效。

源 GLB 均包含 303 个网格：桌面版有 278,784 个三角面，移动版有 228,004 个。当前 Meshopt 浏览器交付资产约为桌面 2.19 MB、移动 1.87 MB；实际传输体积还受服务器 HTTP 压缩影响。`tools/check_model_assets.py` 将桌面、移动和叙事模型的三角面上限分别设为 300,000、250,000 和 300,000，交付文件体积上限分别为 2.5、2.1 和 2.5 MB。桌面生成参数为 `linearUnit: millimeter`、`linearDeflectionType: bounding_box_ratio`、`linearDeflection: 0.004`、`angularDeflection: 0.16`；移动端仅降低线性偏差。屏幕宽度不超过 760px 或 stage 小于 520px 时选择移动 GLB；STEP Worker 的窄屏参数只用于 GLB 加载失败时的回退路径。这些参数影响三角化精度；校验器会捕获资产意外膨胀，但不会自动简化几何。STEP 源文件 SHA256：`4310cdcbb920625dfdea4baac3855ec2fce4b7281ce335762c10791f0da939ce`。

随附运行时为 LGPL-2.1 许可的 `occt-import-js` 0.0.23，许可证保存在运行时目录。运行时 SHA256：JS `3fb44ce11d00611f9b3f3c5775d520ebab48930c1f08279b7b1316f05f0d3379`，WASM `33391fc9d94ea5c869a6718488bf0a9a464222bac9bdc764dfe1690cef281952`。

## 生产派生资产

1. 运行 `python3 tools/prepare_model_asset.py`，从 STEP 源文件生成 `src/assets/source/model/` 中的桌面源 GLB。
2. 运行 `python3 tools/prepare_model_asset.py --linear-deflection 0.007 --output src/assets/source/model/Easykiconverter_展示模型-mobile.glb`，生成移动源 GLB。
3. 运行 `pnpm run assets:lab-models`，生成 `public/assets/model/` 中经过 Meshopt 压缩的 Lab 桌面和移动交付 GLB。
4. 运行 `pnpm run assets:story-model`，从桌面源 GLB 生成首页 Meshopt 压缩资产。
5. STEP 转换器使用仓库固定的 `occt-import-js` 运行时，并记录源模型尺寸元数据。
6. 运行 `pnpm run assets:check`，对比源与交付几何，并验证法线、元数据、压缩格式和体积预算。
7. 只有在对比轮廓、连接器和焊盘细节后才进行简化；同步调整预算前须先完成该审查。
8. 更新任一模型后运行 `pnpm run build`、`python3 tools/validate_site.py`、`pnpm run assets:check` 和 `pnpm run test:browser`。
9. 发布前验证 Lab 缺失 GLB 时的 STEP/WASM 回退、首页静态 WebP 回退、移动端和 reduced-motion 行为，同时保留 STEP 源文件。

网站不宣称当前 WebGL 三角化结果是无损 CAD 渲染，以便审计源资产与派生资产的边界。

直接通过 `file://` 打开页面时，浏览器安全策略会阻止本地 STEP 请求。脚本会检测该协议、跳过 STEP/Release API 请求并保留可用的回退画面。使用 `pnpm dev`、`pnpm run preview` 或部署后的 HTTP(S) 主机才能启用真实模型。
