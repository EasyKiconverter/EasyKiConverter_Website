# 质量基线

[English](QUALITY_BASELINE_en.md)

记录日期：2026-10-14。本文只记录可由当前仓库和 CI 复现的事实，不把域名部署或真机性能推测为已完成。

## 已验证

- Astro 静态构建生成 `/`、`/en/`、`/lab/`、`/en/lab/`、`/formats/`、`/en/formats/`、`/cases/`、`/en/cases/` 八个页面。
- `python3 tools/validate_site.py` 检查最终 `dist/` 的重复 ID、片段链接、语义地标、本地资源和未发布 PNG。
- `pnpm run test:browser` 覆盖中英文首页、桌面/移动 Chromium、移动菜单、reduced-motion、Release 版本、格式矩阵、Lab 路由隔离和控制台错误。
- Release 数据由 `tools/sync_release.py` 在构建期生成；CI 设置 `RELEASE_SYNC_REQUIRED=1`，网络或 API 异常会让构建失败。
- `master` 与 `version/V0.0.1` 已启用 PR、至少一名审批、强制通过 `Static site checks` 与 `Dependency Review`、禁止强推和会话解决门禁。
- 2026-10-14，PR #266（版本分支）已通过 `Static site checks`、`Dependency Review` 和审批并合并；本地构建、资产校验、最终站点校验通过，浏览器套件为 184 passed、4 skipped。
- 2026-10-14，首页浮卡已在中英文 390/768/1440px 视口验证完整留在屏幕内；CI 的必需 Release 同步成功，本地 Release API 请求曾返回 403并使用静态回退数据。
- 2026-10-14，3D Lab 手机滚动故事在中英文 390×844 与 360×640 视口的三个章节状态均验证章节内容不遮挡模型控件；最终章节隐藏模型舞台，完整交接至真实软件截图和下一步入口。Chromium/Chromium Mobile 回归通过，真实滚动截图已复核。
- 2026-10-14，CI 首轮发现英文 360×640 第二步仍与模型舞台重叠；下移短屏模型舞台后，聚焦回归与完整浏览器套件均通过（186 passed、4 skipped）。
- 2026-10-14，版本分支合并 PR #269 后的 `Site Quality` run `38552835300` 全部成功；该版本分支浏览器套件为 188 passed、4 skipped。此结果不代表生产已部署。
- 2026-10-14，移动端标题行盒审查发现中文首页展示标题、格式矩阵标题和案例标题分别在 390/360/390px 出现末尾孤字；精简三处双语标题后，390/360px 行盒回归在 Chromium 与 Chromium Mobile 通过，完整浏览器套件为 188 passed、4 skipped。
- 2026-10-14，正式域名八个公开路由均 HTTP 200；但中文与英文首页 HTML 各含两个重复 `<title>`。当前 `origin/master` 仍有重复显式标题，`version/V0.0.1` 构建仅有一个；已补全路由唯一标题回归，生产尚未更新，须待版本稳定并获准晋级后处理。
- 2026-10-11 已在 `https://easykiconverter.org.cn/` 验证八个生产路由返回 HTTP 200；首页不加载 3D 运行时，`/lab/` 与 `/en/lab/` 的同源模型资源可访问，旧版根路径 `.msix` 下载链接仍可用。
- 2026-10-11 使用 Chromium SwiftShader 访问生产 `/lab/`，由 STEP 几何生成的 GLB 模型成功加载（`278,784` 个三角面、无 fallback、无控制台错误），工具入口初始化完成且默认收起。
- 2026-10-11 生产桌面 GLB 与移动 GLB 均返回 `model/gltf-binary`，分别约 9.6 MB 与 8.1 MB，并带有 `max-age=2592000`；WASM 返回 `application/wasm` 并带有同等长期缓存策略。

## 资源边界

首页不加载 STEP、WASM 或 Three.js 模型运行时；这些资源只由独立 3D Lab 按需使用。原始 Qt 截图在 `src/assets/source/`，WebP 派生文件在 `public/assets/showcase/`。

## 尚未完成的验证

真实移动设备上的性能和不同网络条件下的缓存表现仍需单独记录；单次生产响应头检查不能替代不同网络条件下的实测。
