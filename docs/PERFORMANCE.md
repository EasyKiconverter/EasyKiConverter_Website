# 性能基线

[English](PERFORMANCE_en.md)

## 当前边界

- 中文首页 `/` 和英文首页 `/en/` 首屏使用 WebP 产品截图与 CSS 空间效果，不请求 STEP 或 OpenCascade/WASM；滚动接近转换叙事时，才按需加载约 2.19 MB 的 Meshopt GLB 和 Three.js 渲染代码。
- 3D Lab `/lab/` 与 `/en/lab/` 按视口默认加载约 9.6 MB 桌面 GLB 或约 8.1 MB 移动 GLB；GLB 缺失时才回退到约 11 MB STEP、约 7.3 MB WASM 的解析路径，这是实验资源，不是首页基线。
- 首页首屏资源使用 `public/assets/showcase/*.webp`；原始 PNG、STEP 和 WASM 仍保留用于溯源或实验室，尚未从发布目录迁移。
- `src/js/app.ts` 处理可见性、视口尺寸和运行时 `prefers-reduced-motion` 变化；3D 零件只随滚动在“组合→分解→组合”间变化，减少动态效果时固定为装配态并停止连续动画。

## 可重复检查

```bash
pnpm run build
python3 tools/validate_site.py
pnpm run test:browser
```

构建校验检查最终 `dist/` 中四个页面的重复 ID、片段链接、语义地标和本地资源；Playwright 检查中英文首页、移动导航、reduced-motion、Release 版本与控制台错误。CI 还会启动静态预览并检查 `/`、`/en/`、`/robots.txt` 和 `/sitemap.xml`。

## 记录边界

过去关于 STEP/WASM、Worker、Lighthouse 100 分或 TBT 0 ms 的记录只代表旧版 3D 叙事实验，不代表当前首页，也不能作为生产 SLA。正式性能报告应分别记录首页和 Lab 的网络瀑布、LCP、CLS、TBT、内存、FPS 与真机结果；在取得新数据前不填写推测值。

## 资产决策

STEP 是实验室的工程源资产，基础 GLB 由 `tools/prepare_model_asset.py` 离线生成；首页叙事 GLB 由 `pnpm run assets:story-model` 进一步以 Meshopt 压缩，保留 303 个网格和 278,784 个三角面，交付上限为 2.5 MB / 300,000 个三角面。首页不进行浏览器 CAD 三角化；模型资源或 WebGL 不可用时使用静态 WebP 回退。

## Chromium 生产观测

2026-10-11 在生产站点使用桌面 Chromium 与 390px 移动视口模拟：首页传输约 175 KB，且未请求 GLB/WASM；Lab 的原始 GLB 大小约为 9.99 MB 和 8.43 MB，启用 gzip 后实际响应体采样约为 4.03 MB 和 3.27 MB。启用压缩后的单次模型就绪采样约为 7.5 秒和 9.1 秒；网络与 SwiftShader/CAD 场景初始化会造成明显波动。这是浏览器模拟结果，不是真机 SLA；移动端仍需真实设备测量。
