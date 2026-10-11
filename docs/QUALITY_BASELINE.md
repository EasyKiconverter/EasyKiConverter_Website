# 质量基线

[English](QUALITY_BASELINE_en.md)

记录日期：2026-10-11。本文只记录可由当前仓库和 CI 复现的事实，不把域名部署或真机性能推测为已完成。

## 已验证

- Astro 静态构建生成 `/`、`/en/`、`/lab/`、`/en/lab/`、`/formats/`、`/en/formats/`、`/cases/`、`/en/cases/` 八个页面。
- `python3 tools/validate_site.py` 检查最终 `dist/` 的重复 ID、片段链接、语义地标、本地资源和未发布 PNG。
- `pnpm run test:browser` 覆盖中英文首页、桌面/移动 Chromium、移动菜单、reduced-motion、Release 版本、格式矩阵、Lab 路由隔离和控制台错误。
- Release 数据由 `tools/sync_release.py` 在构建期生成；CI 设置 `RELEASE_SYNC_REQUIRED=1`，网络或 API 异常会让构建失败。
- `master` 与 `version/V0.0.1` 已启用 PR、至少一名审批、强制通过 `Static site checks` 与 `Dependency Review`、禁止强推和会话解决门禁。
- 2026-10-11 已在 `https://easykiconverter.org.cn/` 验证八个生产路由返回 HTTP 200；首页不加载 3D 运行时，`/lab/` 与 `/en/lab/` 的同源模型资源可访问，旧版根路径 `.msix` 下载链接仍可用。
- 2026-10-11 使用 Chromium SwiftShader 访问生产 `/lab/`，真实 STEP 模型成功加载（`278,784` 个三角面、无 fallback、无控制台错误），工具入口初始化完成且默认收起。

## 资源边界

首页不加载 STEP、WASM 或 Three.js 模型运行时；这些资源只由独立 3D Lab 按需使用。原始 Qt 截图在 `src/assets/source/`，WebP 派生文件在 `public/assets/showcase/`。

## 尚未完成的验证

真实移动设备上的性能和不同网络条件下的缓存表现仍需单独记录；这些不能由静态构建、CI 或桌面 SwiftShader 结果替代。
