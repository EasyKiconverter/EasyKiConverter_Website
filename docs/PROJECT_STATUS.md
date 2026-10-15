# 项目现状与计划

[English](PROJECT_STATUS_en.md)

最后核对：2026-10-16。本文根据当前仓库、GitHub PR/CI、Release API 和线上只读检查更新；外部状态可能变化，执行前须重新核实。

## 项目目标

以中英文官网清楚说明 EasyKiConverter 的真实工作流，展示真实软件界面和可追溯转换证据，引导访客获取当前稳定版；保持可访问、响应式、轻量，并将重型 CAD 展示运行时隔离在 3D Lab。

## 当前阶段

项目处于 V0.0.1 稳定维护与用户体验持续改进阶段。2026-10-15，PR #343 将 Lab 布局回归测试与大型模型资源请求隔离；独立审批及 PR 检查通过后合入 `version/V0.0.1`（`28247b2`），合并后 Site Quality run `38748776076` 成功（202 passed、4 skipped）。当前 `master` 为 `d0c4b59`，其合并后 Site Quality run `38745725230` 成功（202 passed、4 skipped）。首页唯一标题修复已在源码及 `master`，但线上首页仍有重复标题；生产未部署。真实手机与网络性能仍未验证。

随后 PR #345 经 Feng083 独立审评并合入 `version/V0.0.1`（merge `74f8437`），修复 reduced-motion 下 Lab 标题/模型舞台重叠及控件定位；PR Site Quality、Dependency Review 和合并后 Site Quality run `38756881636` 均通过。生产未部署。

随后 PR #349 将 Lab 中“过去”轨迹的 18 个模型网格副本移到当前几何后方，新增深度方向测试；PR 与合并后 Site Quality run `38775991721` 均通过（210 passed、4 skipped），并合入 `version/V0.0.1`（merge `5184429`）。PR #350 将暴露本机输出路径的公开截图替换为仅清空路径栏的派生资产，并覆盖首页、Lab 与社交预览；经 Feng083 独立审批后合并（merge `a4eb250`），PR Site Quality `38781120997`、Dependency Review `38781121168` 和合并后 Site Quality `38781625268` 均通过（214 passed、4 skipped）。未部署生产。

本轮 WEB-04 的 reduced-motion 审查发现，桌面模型视图的高特异性定位覆盖静态布局，标题与模型舞台重叠约 252px，视图切换栏/控制栏也未留在舞台内。已为所有模型视图统一重置定位，并将控件锚定在舞台上下方；双语 1440/768/390px、六种模型视图的几何回归通过。`pnpm run check`、`pnpm build`（Astro 0 errors/warnings/hints）、完整 Playwright（204 passed、4 skipped）、8 页面校验、模型资产检查及 `git diff --check` 均通过。Release API 返回 403，构建使用已检查的 `v3.1.13` 回退。未部署生产或验证真机。

本轮键盘审查发现 Formats/Cases 共用布局中的跳转链接可以滚动到 `<main>`，但目标未获焦点，键盘导航会回到 `body`。给共享 main 增加 `tabindex="-1"` 后，中英文 Formats/Cases 四条路由均能将焦点交给正文；回归测试在 Chromium 与 Chromium Mobile 均通过。`pnpm run check`、`pnpm build` 及聚焦浏览器回归通过；未部署生产。

同轮检查本地预览请求时发现，共享导航/页脚图标、favicon 与 Lab 产品截图通过生产域名加载；Chromium 会挂起这些远程请求并使 `networkidle` 测试超时。站内静态资源现改用 `BASE_URL` 路径，并新增 8 路由同源回归；首页网络空闲在 823ms 内完成且无外部请求。全套 Playwright 为 208 passed、4 skipped；卡片布局用例也改为等待 DOM 就绪。未部署生产。

本轮继续 WEB-04 并扩展标题巡检至 320px：中文 3D Lab 标题在 320px 被拆成“真实几何，独立实 / 验。”；移动断点下略微缩小该页标题字号后，中英文首页、格式、案例和 Lab 标题在 320/360/390px 的孤字回归通过。PR #323（merge `4901a8b`）合入 `version/V0.0.1` 后，Site Quality run `38656977540` 为 200 passed、4 skipped；随后 PR #325 将其晋级 `master`（merge `b4cba0e`），master push CI `38658741923` 也通过（200 passed、4 skipped）。不同字体度量会令案例标题排成两行、英文首页/格式标题最多三行；仅放宽 320px 行数上限，保留中文孤字检测及 360/390px 紧凑度约束。此次仅属浏览器视口验证，不代表真机测试。

本次 WEB-04 视觉审查发现 3D Lab 双语视图切换按钮在桌面窄舞台中折行，中文标签逐字竖排。已调整为标签不换行，并在空间不足时允许控件横向滚动；扩展桌面/平板/移动双语 Playwright 回归。PR #328 已由独立子账号审批并合入 `version/V0.0.1`（merge `8e0d78b`）；PR Site Quality run `38663549115` 与合并后 run `38664077716` 均通过（200 passed、4 skipped）。本地构建、Astro 检查、8 路由站点校验、模型资产检查也均通过。Release API 因 403 rate limit 使用已检查的 `v3.1.13` 回退数据；未部署生产，也未做真机验证。

继续检查同一 Lab 舞台时，发现双语模型元信息/视图工具栏、高级控制入口与底部切片面板/叙述字幕在部分尺寸相撞，字幕还会遮挡模型。PR #331 将工具区分层、底部面板归组，并把冗余字幕保留为屏幕阅读器可访问的实时文本但视觉裁切。首轮 CI `38670306796` 暴露回归测试重复等待 3D 网格导致 120 秒超时；改为只验证布局所需的 DOM/CSS 后，PR CI `38671723118` 与版本合并后 CI `38672074526` 均通过（各 202 passed、4 skipped）。PR #331 经独立审批合入 `version/V0.0.1`，merge `c9e7238`；窄/桌面双语布局回归、构建、8 路由和模型资产检查均通过。Release API 本地请求 403，构建使用 `v3.1.13` 回退。未部署生产或验证真机。

随后 PR #332 将上述验证结果补入中英文状态与质量基线；PR #333 经独立审查后将已验证版本晋级 `master`，当前 merge commit 为 `614485c`。master 合并后 Site Quality run `38673808283` 通过（202 passed、4 skipped）。本地构建、8 路由校验和模型资产检查通过；生产站仍未部署，真机仍未验证。

本轮只读生产检查中，资产检查器的 8 个目标均返回 HTTP 200，但部署验收器使用 Python 默认请求头时收到 Cloudflare HTTP 403；同一 GET 改用资产检查器已有的 `EasyKiConverter-production-check` 标识后返回 HTTP 200，并继续检测出线上首页仍有两个 `<title>`。PR #337 经独立审查合入 `version/V0.0.1`（merge `6f87852`），并由 PR #341 晋级至 `master`（merge `d0c4b59`）；版本分支 run `38739192646` 与 master run `38745725230` 均通过（各 202 passed、4 skipped），6 项部署工具单元测试也通过。线上未部署，首页重复标题问题仍存在；生产部署仍需针对本次操作明确批准。

## 里程碑与任务

状态更新（2026-10-16）：PR #355 已合入 `version/V0.0.1`（merge `48251d3`），PR Site Quality run `38807819176`、Dependency Review `38807819227` 和合并后 Site Quality run `38808569106` 均成功；合并后浏览器测试 224 passed、4 skipped。随后首页双语 CTA 复核发现英文下载按钮在 320px 下折为两行，而中文为一行。PR #356 首轮 Site Quality run `38811418997` 证实 GitHub Runner 字体下英文标签仍折行；进一步精简文案后，本机聚焦与完整 Playwright（226 passed、4 skipped）均通过。首页、Lab、Formats、Cases 的版本下载入口统一为紧凑的双语文案，并添加 320px 单行回归。构建、Astro 检查、8 路由校验、模型资源检查、6 项 Python 单测通过；英文前后图见 `.github/pr-evidence/home-cta-{before,after}-en-320.png`。首次本地 Release 同步遇到 403 并回退到已检查的 `v3.1.13`；后续构建同步成功。改动面向 `version/V0.0.1`，未更改 `master` 或生产站；真机和网络性能仍未验证。

PR #347 将 3D Lab 的环境光、补光和正面光强度调低，以改善板体及浅色元件的层次；未改模型资产或几何。经 Feng083 审批后合入 `version/V0.0.1`（merge `b737278`），PR 与合并后 Site Quality run `38766117318`、`38766745155` 均通过（208 passed、4 skipped）；`pnpm build`、8 路由校验、模型资产检查亦通过。Release API 本机返回 403 并按规则使用回退数据。截图仍有明显亮线，来源当时尚未确认；继续列为部分完成。未部署生产或验证真机。

继续排查确认，亮线来自默认“过去”时间轨迹所复制的 18 个 GLB 网格线框，而非 STEP 源模型。PR #349 将过去副本放到当前模型之后、未来副本放到前方；PR #351 再将过去/现在/未来轨迹透明度上限从 0.26/0.055/0.30 调低至 0.06/0.012/0.07，并改用普通混合；新增纯函数回归约束峰值与进度边界。PR #351 经 Feng083 独立审批后合入 `version/V0.0.1`（merge `09dea67`）；PR 检查与合并后 Site Quality run `38791228566` 均通过（216 passed、4 skipped）。未部署生产或验证真机。

随后案例页截图发现桌面卡片等高拉伸，导致较短的 Altium 卡片在摘要与证据之间出现大块空白。本轮改为卡片自然高度，并让证据区紧跟摘要；中英文桌面/移动专项回归和截图复核通过。`pnpm run check`、`pnpm run build`（8 页面，Astro 诊断为零）、`python3 tools/validate_site.py`（8 页面）、`pnpm run assets:check`、Python 单测（6 项）、完整 Playwright（218 passed、4 skipped）及 `git diff --check` 均通过。前后截图位于 `.github/pr-evidence/cases-{before,after}-*`。构建时 Release API 返回 403，使用已检查的 `v3.1.13` 回退。PR #352 经 Feng083 独立审批、必需检查通过后合入 `version/V0.0.1`（merge `6949e4b`）；合并后 Site Quality run `38795306114` 通过（218 passed、4 skipped）。生产未部署，真机未验证。

继续核对 Formats 内容时发现计数语义容易混淆：11 个表格目标实际由 2 个稳定版主要目标与 9 个其他登记目标组成，原来的 “9 registered targets” 徽标与“已注册目标”表题容易使人误以为少了两行。PR #353 将徽标改为“其他目标”，表题明确总计 11 个，并新增中英文回归验证分类数和表格行数一致；经 Feng083 独立审批及必需检查通过后，合入 `version/V0.0.1`（merge `b2f1160`），合并后 Site Quality run `38798839827` 通过（220 passed、4 skipped）。构建时 Release API 返回 403，使用已检查的 `v3.1.13` 回退。未部署生产。

随后键盘可访问性复核发现 Lab 独立布局的跳转链接只滚动到正文，焦点落回 `body`。中英文 `<main id="lab-main">` 增加 `tabindex="-1"` 并补回归；聚焦 Chromium/Chromium Mobile 两项及完整本地 Playwright（222 passed、4 skipped）、构建、Astro 检查、8 路由校验、模型资源校验、6 项 Python 单测和 `git diff --check` 均通过。未部署生产或验证真机。

首页与真实工作台复用的截图曾暴露本机输出路径。PR #350 已生成单独的去路径截图资产，只清空路径输入框；中英文 Hero/工作台统一引用，替代文本和图注均向访客说明路径已隐藏。其余 UI 保持来源截图原样；PR 检查及合并后 Site Quality 均通过（214 passed、4 skipped）。未部署生产。

| ID / 优先级 | 目标、范围与交付 | 依赖、步骤与验收 | 状态 |
| --- | --- | --- | --- |
| WEB-01 / P1 | 修正首页双语品牌大小写、格式支持说明和下载引导。 | 双语文案/样式回归；构建、站点校验、完整 Playwright；PR #285/#286。 | 已完成并晋级 `master`；未部署生产 |
| WEB-02 / P1 | 将已在 `master` 的首页唯一标题修复同步至正式站，并验证 8 路由及首页标题。 | 先核对远端备份/回滚与当前版本；仅在项目所有者明确批准此次生产部署后执行；逐路由检查 HTTP、标题数、语言互链、资源和浏览器冒烟。 | 源码已修复；部署脚本会校验构建产物、发布后的 8 路由和 SEO 元数据，并在验证失败时回滚。2026-10-15 只读复查：8 路由均 HTTP 200、canonical 正确，但 `/` 与 `/en/` 各有两个 `<title>`；生产部署仍需针对本次操作明确批准 |
| WEB-03 / P2 | 测量真实手机和不同网络环境下的加载、缓存与交互性能，形成可复现记录。 | 收集设备/网络型号、浏览器、缓存状态和测试步骤；测首屏/模型加载、下载与交互，记录原始数据。 | 等待真实设备及可控网络；未验证 |
| WEB-04 / P1 | 持续审查 Home → Formats → Cases → Lab → Download 的双语信息、证据范围、CTA 和视觉一致性；仅对证据支持的问题实施成组修复。 | PR #291 补充其他包型入口；PR #292/#294 将首页、Lab、Formats、Cases 的 CTA 明确为打开版本发布页选择安装包；PR #311/#312 对齐首页实际四步工作流；PR #313/#315 修复并晋级 Cases 窄屏溢出；PR #320 修复 Formats 320px CTA 列溢出；PR #323/#325 修正并晋级窄屏标题；PR #331/#333 修复并晋级 Lab 控件重叠；PR #343 稳定布局回归；PR #345 修复 reduced-motion 下 Lab 标题/模型重叠；PR #349/#351 调整时间回声；PR #350 清理公开截图中的本机路径；PR #352 收紧案例卡片证据间距；PR #353 澄清格式矩阵计数；PR #354 修复 Lab 键盘跳转焦点。 | 持续进行；PR #352/#353/#354 均经独立审查合入 `version/V0.0.1`，合并后 Site Quality run `38801904869` 通过（222 passed、4 skipped）。本轮发现 3D Lab 宽屏主标题在 1440px 出现单字“换，”孤行；已调整桌面文字栏/字号，并新增双语断行回归。构建、Astro 检查、8 路由校验、模型资产检查、6 项 Python 单测、完整 Playwright（224 passed、4 skipped）和双语桌面截图复核均通过。生产未部署，真机未验证；此改动尚未晋级 `master` |
| WEB-05 / P1 | 让格式矩阵每个目标链接到准确的专属验证依据，并准确描述自动测试和人工规程的覆盖边界。 | 11 行双语链接回归；构建、站点校验、资产检查、完整 Playwright；PR #287/#288 CI 和独立审查。 | 已完成并晋级 `master` |

## 关键风险与控制

1. **生产与源码不同步。** 2026-10-15 线上只读复查中 8 路由均 HTTP 200、canonical 正确，但两个首页各有两个 `<title>`；响应 `Last-Modified` 为 2026-10-13 00:20 UTC。版本分支/`master` CI 通过不等于已部署；部署仍需明确批准。
2. **实机证据缺失。** Chromium Mobile 和视口截图不能代替真实手机、受限网络、缓存和设备性能测试；WEB-03 保持未验证。
3. **Release API 受限。** 本地构建可能退回 `v3.1.13` 快照；CI 设置 `RELEASE_SYNC_REQUIRED=1` 并负责验证实时 Release 同步。不得把本地快照当成 Release 已更新。

## 后续执行顺序

1. 继续 WEB-04，审查 Home → Formats → Cases → Lab 的证据范围、内容层级和双语视觉一致性，基于新证据按同类问题成组处理。
2. WEB-02 只在获得针对这次生产部署的明确批准后执行，使用仓库现有备份/回滚流程；未获批准时继续其他官网工作。
3. 获得设备与网络条件后完成 WEB-03，保留测量数据和环境信息。

## 状态更新规则

代码变更后同步更新双语文档和回归测试。每项完成状态附可复现命令、PR/CI 或线上证据。计划、源码修复、CI 通过、生产部署和实机验证分别记录，不能相互替代。任何外部状态在执行前重新核对。
