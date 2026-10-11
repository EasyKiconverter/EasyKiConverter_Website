# 性能基线

[English](PERFORMANCE_en.md)

## 当前边界

- 中文首页 `/` 和英文首页 `/en/` 使用 WebP 产品截图、CSS 空间效果和少量页面脚本，不加载 STEP、OpenCascade/WASM 或 Three.js 模型运行时。
- 3D Lab `/lab/` 与 `/en/lab/` 才会加载约 11 MB STEP、约 7.3 MB WASM 和模型脚本；这是按需的实验资源，不是首页基线。
- 首页首屏资源使用 `public/assets/showcase/*.webp`；原始 PNG、STEP 和 WASM 仍保留用于溯源或实验室，尚未从发布目录迁移。
- `src/js/app.ts` 的交互只在页面可见时维护动画，并对 `prefers-reduced-motion` 提供静态路径。

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

STEP 是实验室的工程源资产，GLB 离线交付管线仍是后续优化项。首页不应重新引入浏览器 CAD 三角化；若 Lab 成为正式产品功能，必须单独建立模型体积、三角形预算和 fallback 的浏览器基准。
