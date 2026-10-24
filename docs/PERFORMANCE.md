# 性能基线

[English](PERFORMANCE_en.md)

## 当前边界

- 中文首页 `/` 和英文首页 `/en/` 先显示 WebP 产品预览；当转换场景进入视口上下 420px 的观察范围时，才加载约 2.19 MB 的 Meshopt GLB 和 Three.js 渲染代码。当前布局会让该场景出现在 390×844、768×1024、1440×900 和 1920×1080 的初始视口内，因此这些尺寸通常会在首次访问时请求 GLB。首页仍不请求 STEP 或 OpenCascade/WASM；静态 WebP 会在模型就绪前及 WebGL 不可用时提供画面。
- 3D Lab `/lab/` 与 `/en/lab/` 按视口默认加载约 2.19 MB 桌面 GLB 或约 1.87 MB 移动 GLB，均使用 Meshopt 解码；GLB 缺失时才回退到约 11 MB STEP、约 7.3 MB WASM 的解析路径，这是实验资源，不是首页基线。该优化目前只在当前开发分支，生产站尚未验证或更新。
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

STEP 是实验室的工程源资产，未压缩的桌面/移动源 GLB 保存在 `src/assets/source/model/`，由 `tools/prepare_model_asset.py` 离线生成；`pnpm run assets:lab-models` 为 Lab 生成 Meshopt 交付 GLB，`pnpm run assets:story-model` 为首页生成对应压缩资产。Lab 桌面/移动压缩产物保留 303 个网格和分别 278,784 / 228,004 个三角面，文件大小约 2.19 / 1.87 MB；几何计数和体积由 `pnpm run assets:check` 检查。首页不进行浏览器 CAD 三角化；模型资源或 WebGL 不可用时使用静态 WebP 回退。

## 本地 Chromium 性能采样

2026-10-25 在压缩前的本地静态预览以 Chromium、390×844 视口采样。未限速时，LCP 为 380ms，最大内容元素是静态 WebP；约 2.2 秒时资源计时累计传输约 3.31 MB，其中故事 GLB 为 2,190,156 字节。使用 4× CPU 限速、150ms 延迟和 200,000 字节/秒下行速率时，LCP 为 964ms；9.98 秒时累计传输约 0.90 MB，GLB 仍在加载，观察到 164ms 与 94ms 两个长任务。两组都是单次本地浏览器模拟，不代表线上 SLA 或真机表现。

## 历史 Chromium 生产观测（2026-10-11）

2026-10-11 在生产站点使用桌面 Chromium 与 390px 移动视口模拟：首页传输约 175 KB，且未请求 GLB/WASM；Lab 的原始 GLB 大小约为 9.99 MB 和 8.43 MB，启用 gzip 后实际响应体采样约为 4.03 MB 和 3.27 MB。启用压缩后的单次模型就绪采样约为 7.5 秒和 9.1 秒；网络与 SwiftShader/CAD 场景初始化会造成明显波动。这是浏览器模拟结果，不是真机 SLA；移动端仍需真实设备测量。
