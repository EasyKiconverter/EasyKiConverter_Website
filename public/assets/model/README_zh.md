# 3D 模型资产流程

[English](README.md)

源资产 `Easykiconverter_展示模型.step` 与本文档位于同一目录。它是来自 EasyEDA Pro / Open CASCADE 7.8 的 ASCII STEP 文件；源文件包含 48,420 条 `CARTESIAN_POINT` 记录，边界尺寸约为 60.74 × 47.28 × 18.00 mm。

当前网站通过固定版本的 `occt-import-js` 0.0.23 OpenCascade/WASM 运行时，在浏览器中直接读取 STEP。`src/js/step-worker.ts` 在 Web Worker 中负责加载、三角化、从实际顶点计算边界并归一化网格；`src/js/model-viewer.ts` 接收可转移的顶点/索引缓冲区，再通过 Three.js 渲染。浏览器不需要安装 CAD 软件，原始 STEP 也不会被替换或删除。如果 WebGL、WASM、Worker 或 STEP 资源不可用，页面内容仍保留并显示样式化回退画面。

运行参数为 `linearUnit: millimeter`、`linearDeflectionType: bounding_box_ratio`、`angularDeflection: 0.16`。stage 宽度至少 520px 时 `linearDeflection` 为 `0.004`，低于 520px 时为 `0.007`。这些值影响三角化精度，但不限制三角形总量；当前 Worker 会传输所有生成的可渲染三角形。参数实现位置是 `src/js/model-viewer.ts` 与 `src/js/step-worker.ts`。源文件 SHA256：`4310cdcbb920625dfdea4baac3855ec2fce4b7281ce335762c10791f0da939ce`。

随附运行时为 LGPL-2.1 许可的 `occt-import-js` 0.0.23，许可证保存在运行时目录。运行时 SHA256：JS `3fb44ce11d00611f9b3f3c5775d520ebab48930c1f08279b7b1316f05f0d3379`，WASM `33391fc9d94ea5c869a6718488bf0a9a464222bac9bdc764dfe1690cef281952`。

## 生产派生资产

1. 需要便携 GLB 时，在具备许可的 Open CASCADE/FreeCAD 环境中打开 STEP 源文件。
2. 验证单位、原点、朝向、实体、法线和材质组。
3. 导出 GLB/glTF，并记录转换器版本及源文件名。
4. 只有在对比轮廓、连接器和焊盘细节后才进行简化，并以移动端可接受的网格量为目标。
5. 将派生 GLB 放在本目录旁，更新对应 Astro 页面，同时保留 STEP 源文件。
6. 发布前验证上下文丢失、资源缺失、移动端和 reduced-motion 回退。

网站不宣称当前 WebGL 三角化结果是无损 CAD 渲染，以便审计源资产与派生资产的边界。

直接通过 `file://` 打开页面时，浏览器安全策略会阻止本地 STEP 请求。脚本会检测该协议、跳过 STEP/Release API 请求并保留可用的回退画面。使用 `pnpm dev`、`pnpm run preview` 或部署后的 HTTP(S) 主机才能启用真实模型。
