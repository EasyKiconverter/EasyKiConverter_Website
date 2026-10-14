# 质量基线

[English](QUALITY_BASELINE_en.md)

记录日期：2026-10-15。本文只记录可由当前仓库、CI 或明确的线上检查复现的事实，不把域名部署或真机性能推测为已完成。

## 已验证

- 2026-10-15，320px 标题行框审查发现中文 3D Lab 标题末行仅剩“验。”。为移动端单独调整 Lab 标题字号，并把双语首页、Formats、Cases、Lab 标题回归扩展到 320/360/390px；聚焦 Chromium 与 Chromium Mobile 测试通过。完整 Playwright 为 200 passed、4 skipped，`pnpm run check` 与 `pnpm build` 均为 0 Astro errors/warnings/hints，`python3 tools/validate_site.py`（8 页面）、`pnpm run assets:check`、`git diff --check` 通过。本地 Release API 返回 403，构建使用仓库 `v3.1.13` 数据；修复尚未提交/推送，未部署生产。
- 2026-10-15，320px CTA 专项巡检发现英文 Formats 页的 “Latest Release” 链接超出动作内容列 12px，虽然根文档宽度仍为 320px；仅检查页面 scrollWidth 会漏报。`FormatMatrix` 在不大于 360px 时允许动作换行，空间足够时仍保持单行。中英文 320/360px 边界回归在 Chromium 与 Chromium Mobile 通过；截图确认 320px 换行、360px 单行。完整本地 Playwright 为 200 passed、4 skipped；版本分支合并后 CI run `38652951622` 也通过（200 passed、4 skipped）。`pnpm build` 的 Astro 检查 0 errors/warnings/hints，站点校验与资产检查通过。本地 Release API 返回 403，使用仓库 `v3.1.13` 回退数据；未部署生产。
- 2026-10-15，PR #315 将 320px 双语 Cases CTA 修复晋级至 `master`；版本分支独立审批及必需检查均通过，版本分支 Site Quality run `38647646532` 为 198 passed、4 skipped。PR #316 仅同步 master ancestry，不改变文件树；合并后版本分支为 `4b2b84d`。master 合并提交为 `b7a59c7`，其合并后 Site Quality run `38648150676` 通过（198 passed、4 skipped）。生产未部署。
- 2026-10-15，检查 320px 双语视口发现 `/en/cases/` 的 “View source” CTA 溢出，页面宽度为 353px；在特性分支 `fix/cases-actions-320px` 为不大于 360px 的布局启用换行。中英文 320px 回归在 Chromium 与 Chromium Mobile 共通过 2 项，英文链接完整显示且文档宽度为 320px。`pnpm build`、`pnpm run check`（0 errors/warnings/hints）、`python3 tools/validate_site.py`、`pnpm run assets:check` 通过；Playwright 为 198 passed、4 skipped。Release API 返回 403，本地构建使用已提交的 `v3.1.13` 快照。PR #313 已合入 `version/V0.0.1`（merge `2e23100`），合并后 CI run `38644979827` 通过；之后由 PR #315 晋级 `master`（见首条记录）。生产未部署。
- 2026-10-15 状态复核：`master`=`8f447e7`，`version/V0.0.1`=`eb25b34`；PR #311/#312 已合并，master Site Quality run `38640180490` 成功（196 passed、4 skipped），当前无开放 PR。主项目最新 Release 为 `v3.1.13`。正式站八个路由 HTTP 200、canonical 正确；首页两路由各有两个 `<title>`，其余六路由各一个，Last-Modified 为 2026-10-13 00:20 UTC。未运行生产部署。
- 2026-10-15 状态快照：`master`=`67c45bd`，`version/V0.0.1`=`9b10f58`，二者与远端一致。PR #291–#295 的下载与 CTA 批次由 PR #296 晋级 `master`；PR #298/#299 更新并晋级双语状态文档。PR #299 的必需 checks 和 master push run `38624194781` 均通过，后者 194 passed、4 skipped。PR #297/#300 仅同步祖先历史，未改网站内容。生产未部署。
- 2026-10-15，双语 390px 下载卡截图显示，首页和 Lab 的“下载”主 CTA 打开的是 GitHub 版本发布页，而非直接文件；PR #292 将文案改为“查看下载项 / View downloads”和“查看稳定版下载 / View stable downloads”，并合入 `version/V0.0.1`。目标 Release URL 和直达安装包入口保持不变。工作树构建、完整 Playwright（192 passed、4 skipped）、CI、站点校验、模型资产检查及 `git diff --check` 通过。未验证真机体验，也未部署生产。
- 2026-10-15，Formats 与 Cases 共用页尾 CTA 也被确认会打开版本发布页。PR #294 对齐四个内容路由的中英文按钮和说明，390px 完整页截图显示无横向溢出；四路由 CTA 回归通过。最终版本分支 CI run `38617247841` 为 194 passed、4 skipped；构建、站点校验及模型资产检查通过。CTA 改动在 `version/V0.0.1` 验证；生产未部署。
- 2026-10-15，本轮 390px 双语截图覆盖首页、格式矩阵、案例和 3D Lab；另按实际滚动检查 Lab 三个章节及产品交接状态，未发现新布局缺陷。Chromium Mobile 不代表实机验证。
- 2026-10-15，正式域名只读复核中 8 路由均返回 HTTP 200，canonical 与 hreflang 对应正确；`/` 与 `/en/` 各有两个 `<title>`，其余 6 页各 1 个。首页响应 `Last-Modified` 为 2026-10-13 00:20 UTC；当前 master 首页仅通过共享 `SeoHead` 输出标题，说明生产内容尚未包含该源码修复。没有运行部署脚本。
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
- 2026-10-15，PR #282 将 3D Lab 异步描边候选网格上限从 160 降到 96，不改变主 GLB 几何；4× CPU 限速下本地约 10.9 秒完成（160 网格先前约 24 秒），390×844 截图复核轮廓与关键细节仍清晰。浏览器测试 190 passed、4 skipped；PR #282 合入版本分支，PR #283 晋级 `master`，必需 CI 均通过。
- 2026-10-15，`master` 为 `a7b0dbf`，`version/V0.0.1` 为 `8211c71`，主项目 GitHub API 最新 Release 为 `v3.1.13`。再次只读检查正式域名，八个路由均 HTTP 200；首页 `/` 与 `/en/` 仍各有两个 `<title>`，其余六个路由各一个。源码修复已进入 `master`，生产仍待获准部署。
- 2026-10-15，PR #284 将项目现状、风险和后续任务写入双语状态文档；`Site Quality` 和 `Dependency Review` 均通过后合入 `version/V0.0.1`，分支提交为 `194768f`。PR 检查与本地构建/浏览器验证分别记录，未执行生产部署。
- 2026-10-11 已在 `https://easykiconverter.org.cn/` 验证八个生产路由返回 HTTP 200；首页不加载 3D 运行时，`/lab/` 与 `/en/lab/` 的同源模型资源可访问，旧版根路径 `.msix` 下载链接仍可用。
- 2026-10-11 使用 Chromium SwiftShader 访问生产 `/lab/`，由 STEP 几何生成的 GLB 模型成功加载（`278,784` 个三角面、无 fallback、无控制台错误），工具入口初始化完成且默认收起。
- 2026-10-11 生产桌面 GLB 与移动 GLB 均返回 `model/gltf-binary`，分别约 9.6 MB 与 8.1 MB，并带有 `max-age=2592000`；WASM 返回 `application/wasm` 并带有同等长期缓存策略。

## 资源边界

首页不加载 STEP、WASM 或 Three.js 模型运行时；这些资源只由独立 3D Lab 按需使用。原始 Qt 截图在 `src/assets/source/`，WebP 派生文件在 `public/assets/showcase/`。

## 尚未完成的验证

真实移动设备上的性能和不同网络条件下的缓存表现仍需单独记录；单次生产响应头检查不能替代不同网络条件下的实测。
