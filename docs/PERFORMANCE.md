# 性能验证记录

[English](PERFORMANCE_en.md)

## 当前实现

- STEP 源文件：约 11 MB，保留为源资产。
- WASM 解析器：`occt-import-js` 0.0.23，约 7.3 MB。
- 网格预算：桌面最多 75,000 个三角形，窄屏最多 36,000 个三角形。
- DPR：最高 1.7。
- 首屏：正文与布局先可见，STEP/WASM 在脚本初始化后异步加载。
- 渲染循环：仅在 Hero 进入视口且页面可见时持续运行；离开视口或切到后台会暂停，返回时唤醒。
- Three.js：使用 `BufferGeometry`、顶点色和标准材质渲染真实模型。
- Qt Quick 主截图：页面加载约 158 KB WebP；原始 PNG 保留在 `public/assets/showcase/` 用于溯源。

## 浏览器实测

使用本地 HTTP 页面和 Chrome 153 的 Lighthouse 12.8.2（`--throttling-method=provided`、桌面视口、软件 WebGL）分别检查中文首页与英文首页：

| 页面 | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 中文 `/` | 100 | 100 | 100 | 100 | 0.53 s | 0.53 s | 0 | 0 ms |
| English `/en/` | 100 | 100 | 100 | 100 | 0.48 s | 0.48 s | 0 | 0 ms |

同时使用浏览器 CDP 观察真实 STEP 解析完成后的 3 秒窗口：

- `TaskDuration`: 约 0.175 秒
- `ScriptDuration`: 约 0.023 秒
- `JSHeapUsedSize`: 约 5.8 MB
- 控制台：无 error/warning
- `model-loaded`: true，`model-fallback`: false

OCCT 初始化、STEP 读取、三角化和网格整理在 `src/js/step-worker.ts` 中运行；主线程只接收可转移的顶点缓冲并交给 `src/js/model-viewer.ts` 的 Three.js 场景。Lighthouse 在 Worker 改造前曾测得约 36.9 秒 TBT，改造后两种语言页面均为 0 ms。

这些是当前开发机和当前模型的单次观测；仍需在真实自有服务器、集成显卡、Retina、4K 和移动真机上补充 Chrome Performance、FPS 和网络瀑布测试。

直接以 `file://` 打开页面时，脚本会跳过 STEP 和 Release API 请求；本地 HTTP 预览也不访问 GitHub Release API，以避免开发机 rate limit 产生 403 噪声，页面使用同一稳定版回退。部署到真实 HTTP(S) 域名后才启用 Release API。
