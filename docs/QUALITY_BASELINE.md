# 质量基线

[English](QUALITY_BASELINE_en.md)

记录日期：2026-10-16。本文只记录可由当前仓库、CI 或明确的线上检查复现的事实，不把域名部署或真机性能推测为已完成。

## 已验证

- 2026-10-16：PR #364 同步 Lab 移动端模型留白修复（#363）的状态/质量记录，合入 `version/V0.0.1`（merge `846ade5`）；PR 与合并后 Site Quality、Dependency Review 均通过。
- 2026-10-16：交互视图截图复核发现 Lab Atlas 的画布标题/统计与通用状态标签碰撞。PR #365 隐藏 Atlas 下重复状态并将轴向标注下移；增加中英文浏览器回归及 390px 中英文、1440px 英文截图。Feng083 独立审评后合入 `version/V0.0.1`（merge `7cc83d3`）；PR Site Quality `38915586537`、Dependency Review `38915586789`、合并后 Site Quality `38916312579` 均通过（232 passed、4 skipped）。本地 Astro 检查、构建、完整 Playwright（232 passed、4 skipped）、8 页面校验、模型资产检查、6 项 Python 单测与 `git diff --check` 均通过。截图：`.github/pr-evidence/lab-atlas-metadata-after-*`。未晋级 `master`、未部署生产或验证真机。
- 2026-10-16：PR #361 修复 Lab 320px 窄屏下长模型状态读数与视图切换器碰撞，并使 reduced-motion 切换器保持单行横向滚动；双语 320/360px 长文本回归覆盖普通/减少动效布局。Feng083 独立审评后合入 `version/V0.0.1`（merge `c131e1b`）。PR Site Quality `38826221413`、Dependency Review `38826221350`、合并后 Site Quality `38826667752` 均通过；本地完整 Playwright 232 passed、4 skipped，构建、Astro 检查、8 页面校验、模型资产检查与 `git diff --check` 通过。截图：`.github/pr-evidence/lab-readout-clearance-after-{zh,en}-320.png`。未晋级 `master`、未部署生产或验证真机。
- 2026-10-16：PR #363 修复 Lab 移动端切换器遮挡真实模型上部的问题；320/390px 双语截图复核模型完整显示，不超过 360px 时收紧状态读数，短屏（高度不超过 700px）扩展模型舞台并压缩章节排版，避免英文故事段落与模型碰撞。初始 Runner 检查复现了状态读数/注记和短屏章节边界问题，修正后加入双语回归。Feng083 独立审评并合入 `version/V0.0.1`（merge `70bc4c9`）；PR Site Quality `38911452427`、`38911454408`，Dependency Review `38911452401`、`38911454092`，合并后 Site Quality `38912132079` 均通过（232 passed、4 skipped）。本地完整 Playwright、Astro 检查、构建、8 页面校验、模型资产检查与 `git diff --check` 通过。截图：`.github/pr-evidence/model-clearance-after-{zh,en}-{320,390}.png`。未晋级 `master`、未部署生产或验证真机。
- 2026-10-16 后续验证：PR #356（merge `eaa19a1`）与 #357（merge `4d14888`）合入后的 Site Quality runs `38813432765`（226 passed、4 skipped）、`38815851191`（228 passed、4 skipped）成功。PR #358 修复首页 851–980px 顶栏越界，经独立审评和必需 CI 后合入（merge `7b925ee`）；合并后 run `38819346037` 成功（232 passed、4 skipped）。Lab 手机审查发现英文模型标签/读数碰撞；PR #359 又依据 Runner 实测修复读数、细节标签与视图切换控件之间的间距，增加 320–428px 双语回归，经 Feng083 独立审评后合入 `version/V0.0.1`（merge `54b078b`）。PR 及合并后 Site Quality run `38823392621` 均通过（232 passed、4 skipped）；本地完整 Playwright 232 passed、4 skipped，构建、8 路由校验、模型资产检查、6 项 Python 单测和聚焦回归通过。只读生产复查仍发现首页重复 `<title>`；资产检查遇到 TLS 握手超时，未能完成全量线上资源确认。未晋级 `master`、未部署生产或验证真机。
- 2026-10-16，PR #355 合入 `version/V0.0.1`（merge `48251d3`）；PR Site Quality `38807819176`、Dependency Review `38807819227` 和合并后 Site Quality `38808569106` 成功（224 passed、4 skipped）。随后双语首页视觉审查发现英文版主下载 CTA 在 320px 折为两行。PR #356 首轮 Site Quality run `38811418997` 在 Runner 字体下复现折行；进一步精简标签后，聚焦浏览器测试（18 passed）及完整 Playwright（226 passed、4 skipped）均通过。首页、Lab、Formats、Cases 的 Release CTA 文案和运行时版本刷新现统一为 `v3.1.13 下载项 / v3.1.13 downloads`，并新增 320px 双语单行回归。英文版 320px 前后截图见 `.github/pr-evidence/home-cta-{before,after}-en-320.png`。`pnpm run build`（8 页面，Astro 诊断为零）、`pnpm run check`、8 路由校验、模型资产检查和 6 项 Python 单测通过。首次本地 Release 同步遇到 403 并使用已检查的 `v3.1.13` 回退；后续构建同步成功。该批次面向 `version/V0.0.1`，未更改 `master` 或生产站；未验证真机和网络性能。

- 2026-10-16，PR #351 将 Lab 时间回声改为更低透明度和普通混合，经独立审评合入 `version/V0.0.1`（merge `09dea67`）；PR 检查及合并后 Site Quality run `38791228566` 均通过（216 passed、4 skipped）。随后案例页截图发现桌面卡片等高拉伸使 Altium 卡片摘要与证据间留白过大。本轮改为卡片自然高度并缩短证据区间距；中英文桌面/移动截图复核通过。`pnpm run check`、`pnpm run build`（8 页面，Astro 诊断为零）、8 路由站点校验、模型资产校验、6 项 Python 单测、Playwright（218 passed、4 skipped）及 `git diff --check` 通过。前后截图见 `.github/pr-evidence/cases-{before,after}-*`。构建时 Release API 返回 403，使用 `v3.1.13` 回退；PR #352 经独立审批、必需检查及合并后 CI 通过，合并提交 `6949e4b`、Site Quality run `38795306114`（218 passed、4 skipped）。生产未部署、真机未验证。

- 2026-10-16，Formats 页 11 行由 2 个 primary 稳定目标和 9 个 registered 目标组成；原徽标/表题对“registered”的不同范围用法容易造成计数不一致的印象。徽标现在标明 9 项为“其他目标”，表题明确总数 11；双语测试检查徽标分类计数和表格行数。`pnpm run build`（8 页面、Astro 无诊断）、`pnpm run check`、8 路由校验、模型资产检查、6 项 Python 单测、完整 Playwright（220 passed、4 skipped）、聚焦 Chromium/Chromium Mobile 回归及 `git diff --check` 均通过；前后截图见 `.github/pr-evidence/formats-{before,after}-*`。构建时 Release API 返回 403，使用已检查的 `v3.1.13` 回退；未部署生产或验证真机。

- 2026-10-16，键盘实测发现中英文 3D Lab 跳转链接改变 URL 片段并滚动到 `main#lab-main`，但焦点返回 `body`。两个 Lab 主内容区增加 `tabindex="-1"`；双语键盘回归验证按 Enter 后焦点进入 main。聚焦 Chromium/Chromium Mobile（2 项）和完整 Playwright（222 passed、4 skipped）、`pnpm run build`（8 页面，Astro 无诊断）、`pnpm run check`、8 路由校验、模型资源检查、6 项 Python 单测及 `git diff --check` 均通过。PR #354 经 Feng083 独立审批后合入 `version/V0.0.1`（merge `ad2f255`）；PR 检查与合并后 Site Quality run `38801904869` 均通过（222 passed、4 skipped）。未部署生产或验证真机。

- 2026-10-16，1440px 3D Lab 截图发现中文叙事主标题出现单字“换，”孤行。首轮 PR CI（run `38806234174`）在 Runner 字体度量下发现英文标题排成 4 行；桌面断点将字号上限调为 64px、文字栏拓宽至 520px。中英文 1440/1024px 回归验证标题行数及中文短语完整呈现，平板/手机断点不变。前后及英文截图见 `.github/pr-evidence/lab-headline-{before,after}-*`。构建、Astro 检查、8 路由校验、模型资产检查、6 项 Python 单测、聚焦双语 Chromium/Chromium Mobile 回归和最终完整 Playwright（224 passed、4 skipped）均通过；Release API 返回 403，使用已检查的 `v3.1.13` 回退。未部署生产或验证真机。

- 2026-10-15，本地预览审查发现 SiteHeader、SiteFooter、favicon 和 Lab 产品截图将站内静态资源生成为正式域名绝对 URL；受限网络下远程请求会挂起并导致 `networkidle` 等待超时。改用带 `BASE_URL` 的路径后，资源随当前预览/部署来源加载；新增回归检查 8 个中英文页面的所有 `<img>` 与 favicon 均为同源。首页现在在 823ms 内达到 network idle，未发现外部请求；完整 Playwright 为 208 passed、4 skipped。首次整套运行在 Chromium 中有 1 项旧卡片布局用例因等待 network idle 超时，改为等待 DOM 就绪；重跑时另有 2 项因外部资源挂起超时，资源隔离后完整套件通过。未部署生产。

- 2026-10-15，键盘审查发现 Formats/Cases 页面“跳转到正文”链接激活后只滚动页面，焦点落回 `body`，无法从正文继续顺序导航。共享布局的 `<main id="content-page-main">` 增加 `tabindex="-1"`，并添加四条中英文路由回归：首次 Tab 聚焦跳转链接，Enter 后正文 main 获得焦点。聚焦 Playwright 在 Chromium 与 Chromium Mobile 通过（2 项）；`pnpm run check` 与 `pnpm build` 通过，构建 8 个页面、Astro 0 errors/warnings/hints。Release API 返回 403，使用已检查的 `v3.1.13` 回退。未部署生产。

- 2026-10-15，reduced-motion 下的桌面模型视图规则覆盖了静态布局，模型舞台上移并与标题重叠约 252px，视图切换栏/控制栏也偏离舞台。新增更高特异性覆盖，重置所有模型视图定位，并将切换栏与控制栏分别锚定在舞台顶部和底部。回归覆盖中英文 Lab、1440/768/390px 及 model/atlas/tomogram/oracle/trinity/morph 六种视图，同时检查标题与舞台、控件与舞台边界及控件互相不重叠。聚焦 Chromium/Chromium Mobile 2 项通过；完整 Playwright 为 204 passed、4 skipped。`pnpm run check`、`pnpm build`（Astro 0 errors/warnings/hints）、`python3 tools/validate_site.py`（8 页面）、`python3 tools/check_model_assets.py`（桌面 303 meshes / 278,784 triangles，移动 303 / 228,004）及 `git diff --check` 通过。Release API 返回 403，使用已检查的 `v3.1.13` 回退。未部署生产或验证真机。

- 2026-10-15，Lab 控件重叠布局回归在 CI 多次因视口切换或舞台 DOM 查询超时；该用例循环访问两种语言和四种视口，原先每次都会启动 3D 资源请求。现仅在此布局测试中拦截 `/assets/model/` 与 `/assets/vendor/` 请求，布局几何与全部碰撞断言保持不变。聚焦测试在 Chromium/Chromium Mobile 连续 10 轮共 20 项通过；完整 Playwright 为 202 passed、4 skipped。`pnpm build` 的 Astro 检查 0 errors/warnings/hints，`python3 tools/validate_site.py` 验证 8 页面，`python3 tools/check_model_assets.py` 通过（桌面 303 meshes / 278,784 triangles，移动 303 / 228,004），`git diff --check` 通过。Release API 返回 403，构建使用已检查的 `v3.1.13` 回退。PR #343 经独立审批合入 `version/V0.0.1`（`28247b2`），合并后 run `38748776076` 通过（202 passed、4 skipped）。未部署生产或验证真机。

- 2026-10-15，线上只读请求确认：`tools/check_production_assets.py` 对 8 个页面/资源均取得 HTTP 200；部署验收器原先使用默认 Python 请求头时首页 GET 收到 Cloudflare 403。同一 GET 使用已有资产检查标识 `EasyKiConverter-production-check` 后为 HTTP 200，并按预期报告首页存在两个 `<title>`。部署验收器现发送该标识，回归测试断言所有 8 路由均携带该请求头；`python3 -B -m unittest tests.test_deploy_production -v` 的 6 项测试及 `git diff --check` 通过。PR #337 经独立审查合入 `version/V0.0.1`（merge `6f87852`），PR #341 晋级 `master`（merge `d0c4b59`）；版本 run `38739192646` 和 master run `38745725230` 均通过（各 202 passed、4 skipped）。线上未部署，重复标题问题仍存在。

- 2026-10-15，PR #332 同步记录 3D Lab 控件重叠修复的验证结果；PR #333 经独立审查将其从 `version/V0.0.1` 晋级 `master`，merge commit `614485c`。master 合并后 Site Quality run `38673808283` 通过（202 passed、4 skipped）。本地 build、8 路由校验和模型资产检查通过；未部署生产，未做真机测试。

- 2026-10-15，3D Lab 后续舞台检查发现中英文模型元信息、视图工具栏、高级入口及底部切片面板/字幕在部分尺寸有碰撞，字幕会遮挡模型。PR #331 分离顶部控制并归组底部面板；动态字幕保留为屏幕阅读器可访问的实时文本，同时从视觉布局裁切。重叠回归首轮 CI `38670306796` 因反复等待重型 3D 网格而在 120 秒超时；缩小到布局 DOM/CSS 后，PR CI `38671723118` 与版本合并后 CI `38672074526` 均通过（各 202 passed、4 skipped）。PR #331 经独立审批合入版本分支，merge `c9e7238`。本地完整套件、构建、8 路由校验、模型资产检查及 `git diff --check` 通过；Release API 本地请求 403，使用已检查的 `v3.1.13` 回退。未部署生产，未做真机测试。

- 2026-10-15，320px 标题行框审查发现中文 3D Lab 标题末行仅剩“验。”。为移动端单独调整 Lab 标题字号，并把双语首页、Formats、Cases、Lab 标题回归扩展到 320/360/390px。前两次 CI 表明字体度量差异使案例标题自然换为两行、英文首页/格式标题最多三行；仅放宽 320px 行数断言，并保留中文孤字检测及较宽视口约束。聚焦 Chromium 与 Chromium Mobile、完整本地 Playwright（200 passed、4 skipped）、`pnpm run check`、`pnpm build`、`python3 tools/validate_site.py`（8 页面）、`pnpm run assets:check` 和 `git diff --check` 通过。PR #323 经独立审查及必需 CI 合入版本分支（merge `4901a8b`），版本 CI `38656977540` 通过；随后 PR #325 晋级 `master`（merge `b4cba0e`），master push CI `38658741923` 通过；两次均为 200 passed、4 skipped。本地 Release API 返回 403，构建使用仓库 `v3.1.13` 数据；未部署生产。
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

- 2026-10-15，本地 3D Lab 桌面截图发现视图切换器中文标签逐字折行；CSS 改为保持单行并在窄舞台内横向滚动，扩展双语桌面/平板/移动回归。构建、Astro 检查、8 路由校验、模型资产检查通过；Playwright 200 passed、4 skipped。PR #328 经独立审批后合入 `version/V0.0.1`，merge `8e0d78b`；PR 与合并后 Site Quality run `38663549115`、`38664077716` 均通过（各 200 passed、4 skipped）。Release API 返回 HTTP 403 rate limit，构建使用仓库 `v3.1.13` 回退数据；未部署或实机验证。

## 资源边界

首页不加载 STEP、WASM 或 Three.js 模型运行时；这些资源只由独立 3D Lab 按需使用。原始 Qt 截图在 `src/assets/source/`，WebP 派生文件在 `public/assets/showcase/`。

## 尚未完成的验证

真实移动设备上的性能和不同网络条件下的缓存表现仍需单独记录；单次生产响应头检查不能替代不同网络条件下的实测。
