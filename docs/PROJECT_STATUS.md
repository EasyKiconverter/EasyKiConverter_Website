# 项目现状与计划

[English](PROJECT_STATUS_en.md)

最后核对：2026-10-26。本文根据当前仓库、GitHub PR/CI、正式部署记录和浏览器复核更新；真机与真实网络条件仍未核实。

## 项目目标

以中英文官网清楚说明 EasyKiConverter 的真实工作流，展示真实软件界面和可追溯转换证据，引导访客获取当前稳定版；保持可访问、响应式、轻量，并将重型 CAD 展示运行时隔离在 3D Lab。

## 当前阶段

截至 2026-10-26，`version/V0.0.1` 为 `a599a5a`（PR #422 合并后）；PR #416 以合并提交 `d2e5d43` 晋级至 `master`。PR #420 调整桌面首页产品场景首屏布局，PR [#421](https://github.com/EasyKiconverter/EasyKiConverter_Website/pull/421) 修复 320×760 首页模型场景超出首屏的问题；两者均经 Feng083 独立审批后合入版本分支。PR #421 的 PR 与合并后 Site Quality 均为 277 passed、6 skipped，Dependency Review 通过。截图：[中文修复前](../.github/pr-evidence/mobile-stage-fit-before-zh-320x760.png)、[中文修复后](../.github/pr-evidence/mobile-stage-fit-after-zh-320x760.png)、[英文修复前](../.github/pr-evidence/mobile-stage-fit-before-en-320x760.png)、[英文修复后](../.github/pr-evidence/mobile-stage-fit-after-en-320x760.png)。本地构建生成 8 页且 Astro 0 诊断；格式、页面、模型资产和差异检查通过。正式站已于 2026-10-25 通过仓库部署工具发布，备份为 `/var/www/backups/easykiconverter-website-20261025-061311`；脚本验证 8 个路由 HTTP 200、单一 `<title>`、canonical 和 hreflang 正确。线上 Chromium 复核覆盖 8 路由 × 320/390/768/1440px 共 32 组，无横向溢出、页面/控制台错误或本站资源失败；首页 390/768px 的中英文四阶段均加载真实 WebGL，303 个网格中 302 个可移动，阶段截图无卡片遮挡。Release API 返回 403，构建使用仓库 `v3.1.13` 回退数据。生产部署和桌面模拟浏览器验收完成；真实设备及不同网络条件仍未验证。新一轮本地 P1 候选见质量基线和优化记录，尚未晋级 `master` 或部署。

历史记录（2026-10-17，PR #398）：Lab 手机视图切换栏增加了中英文提示并通过回归；当时尚未部署。当前生产状态以 2026-10-25 部署后审计为准。

### 2026-10-25 部署后审计（PR #416 之后）

正式站由 `tools/deploy_production.py` 完成部署，部署 ID 为 `20261025-061311`。脚本构建并校验后创建远端备份、切换目录并重载 Nginx；线上 smoke test 确认 8 个公开路由、标题、canonical 和 hreflang 均符合要求。Chromium SwiftShader 另复核 32 个路由/视口组合及中英文首页真实 3D 阶段；无控制台/页面错误、本站资源失败或横向溢出，所有首页叙事阶段均加载 WebGL 模型。截图和采样结果保存在本机 `/tmp/easyki-production-check/`、`/tmp/easyki-production-scrolled/` 与 `/tmp/easyki-production-story/`，不作为仓库资源提交。该证据不替代实机和不同网络测试。

### 2026-10-18 追补审计

PR #408 为文档同步 PR，已合并至 `version/V0.0.1`，合并提交 `8b13839`；其中记录的 `ee58d16` 是 PR #407 后的功能代码基线。PR #408 的合并后 Site Quality run `39135450332` 成功。当前版本分支重新构建通过：Astro 37 个文件、0 诊断，生成 8 个页面；`python3 tools/validate_site.py` 与 `pnpm run assets:check` 均通过。本地 `dist/index.html` 与 `dist/en/index.html` 各含一个 `<title>`。Release API 返回 HTTP 403，本地构建使用已核对的 `v3.1.13` 回退数据。

正式站只读复核发现 `/` 与 `/en/` 各返回两个完全相同的本地化 `<title>`；`/lab/` 与 `/en/lab/` 各返回一个。首页响应 `Last-Modified` 为 `Tue, 13 Oct 2026 00:20:00 GMT`，`CF-Cache-Status: DYNAMIC`。这表明线上内容与当前版本构建不同，不能归因于 Cloudflare 静态缓存。当前版本构建本身标题检查通过，但尚未部署；按审批门禁，部署整个版本分支仍需本次操作的明确批准。

平板遮挡与减少动态效果也在当前检出分支复测：`pnpm exec playwright test tests/site.spec.ts -g "conversion scene stays visible with its active narrative on tablet and phones"` 为 2 passed；筛选首页动态偏好用例为 4 passed（Chromium 与 Chromium Mobile）。实际手机/网络性能仍未验证；当前环境没有 `adb`，故无法进行设备级检查。

继续 WEB-04 时，双语 390px 和 1440px Lab 滚动截图都显示“构建元件库 / Build the library”节点的板卡模型接近 95° 侧视，器件细节难以辨认。实测 390px 视口下舞台宽 359px，1440px 视口下舞台宽 700px；移动舞台角度行程从完整关键帧变化的 50% 平滑降到 30%，并把该节点关键帧目标从 3.1rad 调至 2.2rad。模型现在分别约为手机 46°、桌面 69°，板面与主要器件更清楚。中英文 390px 与中文 1440px 真实 GLB 前后截图、姿态单测均已补充。`pnpm run check`、构建、完整 Playwright（242 passed、4 skipped）、8 路由校验、模型资产检查、6 项 Python 单测均通过。Feng083 独立审评后，PR #399 合入 `version/V0.0.1`（merge `4bf7257`）；PR Site Quality `38990293629`、Dependency Review `38990293643` 均通过，合并后 Site Quality `38990624444` 通过（242 passed、4 skipped）。未部署生产或验证真机。

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

PR #361 解决了 320px 窄屏 Lab 模型状态长文本与视图切换器相撞的问题，并让 reduced-motion 下的切换器保持单行、可横向滚动；双语 320/360px 长文本回归覆盖普通/减少动效布局。Feng083 独立审评后合入 `version/V0.0.1`（merge `c131e1b`）；PR Site Quality `38826221413`、Dependency Review `38826221350` 和合并后 Site Quality `38826667752` 均成功。本地完整 Playwright 232 passed、4 skipped，构建、Astro 检查、8 页面验证和模型资产检查通过。中英文 320px 截图见 `.github/pr-evidence/lab-readout-clearance-after-{zh,en}-320.png`。未晋级 `master`、未部署生产或验证真机。

随后 PR #363 修复 Lab 移动端视图切换器遮挡真实模型上部的问题：320/390px 双语截图确认几何完整可见；不超过 360px 时收紧状态读数，短屏（高度不超过 700px）将模型舞台增至至少 320px，并压缩章节文案避免英文叙述与模型相撞。首次 Runner 回归暴露状态读数/注记碰撞及短屏章节边界问题，均已修正并增加/强化双语回归。Feng083 独立审评后合入 `version/V0.0.1`（merge `70bc4c9`）；PR Site Quality `38911452427`、`38911454408`、Dependency Review `38911452401`、`38911454092` 和合并后 Site Quality `38912132079` 均通过（232 passed、4 skipped）。本地构建、Astro 检查、8 页面校验、模型资产检查及完整 Playwright（232 passed、4 skipped）通过。截图见 `.github/pr-evidence/model-clearance-after-{zh,en}-{320,390}.png`。未晋级 `master`、未部署生产或验证真机。

随后 PR #364 将 #363 的实际验证结果同步至中英文项目状态与质量基线文档，并合入 `version/V0.0.1`（merge `846ade5`）；PR 与合并后 Site Quality、Dependency Review 均成功。

继续检查 Lab Atlas 交互视图时发现，画布内标题/网格统计与通用模型标注、表面状态、突触读数在 390px 下叠放；桌面轴向标注也挤在标题行。PR #365 在 Atlas 状态隐藏重复标注并将轴向文字下移，添加中英文回归和 390px/1440px 截图。Feng083 独立审评后合入 `version/V0.0.1`（merge `7cc83d3`）；PR Site Quality `38915586537`、Dependency Review `38915586789` 与合并后 Site Quality `38916312579` 均通过（232 passed、4 skipped）。本地 `pnpm run check`、`pnpm run build`、完整 Playwright（232 passed、4 skipped）、8 页面校验、模型资源检查及 6 项 Python 单测通过。截图见 `.github/pr-evidence/lab-atlas-metadata-after-*`。未晋级 `master`、未部署生产或验证真机。

随后 PR #367 将同一类问题扩展修复到 Tomogram、Oracle、Trinity 与 Morph：画布视图隐藏冗余通用状态，Tomogram 操作改为可换行的窄屏工具栏，并重新排布缩略预览和视图切换器；所有操作仍保留。Feng083 独立审评后合入 `version/V0.0.1`（merge `a2b6c61`）；Dependency Review、PR Site Quality 与合并后 Site Quality run `38924049172` 均通过，最终浏览器套件 234 passed、4 skipped。双语 390px 截图见 `.github/pr-evidence/lab-{tomogram,morph}-layout-after-{en,zh}-390.png`。`master` 未变更，未部署生产或验证真机。

状态更新（2026-10-16）：PR #355 已合入 `version/V0.0.1`（merge `48251d3`），PR Site Quality run `38807819176`、Dependency Review `38807819227` 和合并后 Site Quality run `38808569106` 均成功；合并后浏览器测试 224 passed、4 skipped。随后首页双语 CTA 复核发现英文下载按钮在 320px 下折为两行，而中文为一行。PR #356 首轮 Site Quality run `38811418997` 证实 GitHub Runner 字体下英文标签仍折行；进一步精简文案后，本机聚焦与完整 Playwright（226 passed、4 skipped）均通过。首页、Lab、Formats、Cases 的版本下载入口统一为紧凑的双语文案，并添加 320px 单行回归。构建、Astro 检查、8 路由校验、模型资源检查、6 项 Python 单测通过；英文前后图见 `.github/pr-evidence/home-cta-{before,after}-en-320.png`。首次本地 Release 同步遇到 403 并回退到已检查的 `v3.1.13`；后续构建同步成功。改动面向 `version/V0.0.1`，未更改 `master` 或生产站；真机和网络性能仍未验证。

后续核实：PR #356（merge `eaa19a1`）和 #357（merge `4d14888`）已依次合入 `version/V0.0.1`，对应合并后 Site Quality runs `38813432765`（226 passed、4 skipped）和 `38815851191`（228 passed、4 skipped）均成功。PR #358 修复 851–980px 首页顶栏溢出（保留内容断点），经 Feng083 独立审评和必需 CI 通过后合入（merge `7b925ee`）；合并后 Site Quality run `38819346037` 成功（232 passed、4 skipped）。随后 Lab 移动端截图/边界审查发现英文模型标签与状态读数在 360/390px 相交，中文无碰撞。PR #359 扩展 320–428px 双语碰撞回归，并依据 Runner 实测调整读数、细节标签与视图切换控件间距；Feng083 独立审评后合入 `version/V0.0.1`（merge `54b078b`）。PR 与合并后 Site Quality run `38823392621` 均通过（232 passed、4 skipped）；本地完整 Playwright、构建、8 路由校验、模型资产检查、6 项 Python 单测和聚焦回归通过。英语前后与中文 360px 截图见 `.github/pr-evidence/lab-metadata-{before-en-360,after-en-360,after-zh-360}.png`。未晋级 `master`、未部署生产或验证真机。

PR #347 将 3D Lab 的环境光、补光和正面光强度调低，以改善板体及浅色元件的层次；未改模型资产或几何。经 Feng083 审批后合入 `version/V0.0.1`（merge `b737278`），PR 与合并后 Site Quality run `38766117318`、`38766745155` 均通过（208 passed、4 skipped）；`pnpm build`、8 路由校验、模型资产检查亦通过。Release API 本机返回 403 并按规则使用回退数据。截图仍有明显亮线，来源当时尚未确认；继续列为部分完成。未部署生产或验证真机。

继续排查确认，亮线来自默认“过去”时间轨迹所复制的 18 个 GLB 网格线框，而非 STEP 源模型。PR #349 将过去副本放到当前模型之后、未来副本放到前方；PR #351 再将过去/现在/未来轨迹透明度上限从 0.26/0.055/0.30 调低至 0.06/0.012/0.07，并改用普通混合；新增纯函数回归约束峰值与进度边界。PR #351 经 Feng083 独立审批后合入 `version/V0.0.1`（merge `09dea67`）；PR 检查与合并后 Site Quality run `38791228566` 均通过（216 passed、4 skipped）。未部署生产或验证真机。

随后案例页截图发现桌面卡片等高拉伸，导致较短的 Altium 卡片在摘要与证据之间出现大块空白。本轮改为卡片自然高度，并让证据区紧跟摘要；中英文桌面/移动专项回归和截图复核通过。`pnpm run check`、`pnpm run build`（8 页面，Astro 诊断为零）、`python3 tools/validate_site.py`（8 页面）、`pnpm run assets:check`、Python 单测（6 项）、完整 Playwright（218 passed、4 skipped）及 `git diff --check` 均通过。前后截图位于 `.github/pr-evidence/cases-{before,after}-*`。构建时 Release API 返回 403，使用已检查的 `v3.1.13` 回退。PR #352 经 Feng083 独立审批、必需检查通过后合入 `version/V0.0.1`（merge `6949e4b`）；合并后 Site Quality run `38795306114` 通过（218 passed、4 skipped）。生产未部署，真机未验证。

继续核对 Formats 内容时发现计数语义容易混淆：11 个表格目标实际由 2 个稳定版主要目标与 9 个其他登记目标组成，原来的 “9 registered targets” 徽标与“已注册目标”表题容易使人误以为少了两行。PR #353 将徽标改为“其他目标”，表题明确总计 11 个，并新增中英文回归验证分类数和表格行数一致；经 Feng083 独立审批及必需检查通过后，合入 `version/V0.0.1`（merge `b2f1160`），合并后 Site Quality run `38798839827` 通过（220 passed、4 skipped）。构建时 Release API 返回 403，使用已检查的 `v3.1.13` 回退。未部署生产。

随后键盘可访问性复核发现 Lab 独立布局的跳转链接只滚动到正文，焦点落回 `body`。中英文 `<main id="lab-main">` 增加 `tabindex="-1"` 并补回归；聚焦 Chromium/Chromium Mobile 两项及完整本地 Playwright（222 passed、4 skipped）、构建、Astro 检查、8 路由校验、模型资源校验、6 项 Python 单测和 `git diff --check` 均通过。未部署生产或验证真机。

首页与真实工作台复用的截图曾暴露本机输出路径。PR #350 已生成单独的去路径截图资产，只清空路径输入框；中英文 Hero/工作台统一引用，替代文本和图注均向访客说明路径已隐藏。其余 UI 保持来源截图原样；PR 检查及合并后 Site Quality 均通过（214 passed、4 skipped）。未部署生产。

| ID / 优先级 | 目标、范围与交付 | 依赖、步骤与验收 | 状态 |
| --- | --- | --- | --- |
| WEB-01 / P1 | 修正首页双语品牌大小写、格式支持说明和下载引导。 | 双语文案/样式回归；构建、站点校验、完整 Playwright；PR #285/#286。 | 已完成、晋级 `master` 并随 2026-10-25 部署上线 |
| WEB-02 / P1 | 将唯一标题的当前版本构建发布到正式站，并验证 8 路由及首页标题。 | 已按正式流程 dry-run、备份、部署，并逐路由验证 HTTP、标题数、语言互链、资源和浏览器表现。 | 已于 2026-10-25 部署；备份 `/var/www/backups/easykiconverter-website-20261025-061311`。脚本确认 8 路由均 HTTP 200、单一 `<title>`、canonical/hreflang 正确；线上 32 组路由/视口检查无溢出、页面/控制台错误或本站资源失败。已完成；保留部署回滚备份 |
| WEB-03 / P2 | 测量真实手机和不同网络环境下的加载、缓存与交互性能，形成可复现记录。 | 收集设备/网络型号、浏览器、缓存状态和测试步骤；测首屏/模型加载、下载与交互，记录原始数据。 | 等待真实设备及可控网络；未验证 |
| WEB-04 / P1 | 持续审查 Home → Formats → Cases → Lab → Download 的双语信息、证据范围、CTA 和视觉一致性；仅对证据支持的问题实施成组修复。 | 新变更需双语回归、构建、路由/资产检查、完整 Playwright 和独立审评。 | PR #398 提升 Lab 手机视图切换器可发现性；#399 调整叙事姿态；#400、#403 同步验证与状态记录；#402 建立首页 3D 转换故事并修复阶段卡片/模型遮挡；#404 将移动端 3D 模型带入首屏；#406 将 Lab 首要 CTA 改为进入交互模型并明确区分 Release 外链；#407 稳定 CTA 视口回归。上述 PR 均已独立审评并合入 `version/V0.0.1`。#404 的 390×844 中英文前后截图见 `.github/pr-evidence/home-first-fold-{before,after}-{zh,en}-390.png`，双语首屏回归覆盖 320–428px；#406 的 Lab 前后截图见 `.github/pr-evidence/lab-viewer-entry-{before,after}-*`，并覆盖 390/768/1440px、双语与 reduced-motion；PR Site Quality 通过（258 passed、4 skipped）。#407 将相关回归拆为小型独立用例，桌面 1440px 仅由桌面项目执行；PR Site Quality 通过（268 passed、6 skipped）。平板“整理”阶段 768×760 中英文截图见 `.github/pr-evidence/homepage-3d-story-{zh,en}-768-prepare-after-overlap.png`；当前场景几何与遮挡回归覆盖各阶段，聚焦浏览器测试通过。PR #420 改进桌面首屏布局，PR #421 修复 320×760 首屏裁切并补充中英文前后截图；PR #421 的 PR/合并后 Site Quality 均为 277 passed、6 skipped。视口截图不替代真机验证；PR #416 合并提交 `d2e5d43` 对应的网站代码已于 2026-10-25 部署，PR #421 尚未晋级或部署，真机仍未验证。 |
| WEB-05 / P1 | 让格式矩阵每个目标链接到准确的专属验证依据，并准确描述自动测试和人工规程的覆盖边界。 | 11 行双语链接回归；构建、站点校验、资产检查、完整 Playwright；PR #287/#288 CI 和独立审查。 | 已完成并晋级 `master` |

## 关键风险与控制

1. **生产与源码需持续同步。** 2026-10-25 已将 `master` 的验证版本部署到正式站，8 路由及首页唯一标题线上检查通过；后续源码发布仍须通过分支保护并使用正式部署工具。
2. **实机证据缺失。** Chromium Mobile 和视口截图不能代替真实手机、受限网络、缓存和设备性能测试；WEB-03 保持未验证。
3. **Release API 受限。** 本地构建可能退回 `v3.1.13` 快照；CI 设置 `RELEASE_SYNC_REQUIRED=1` 并负责验证实时 Release 同步。不得把本地快照当成 Release 已更新。

## 后续执行顺序

1. 继续 WEB-04，审查 Home → Formats → Cases → Lab 的证据范围、内容层级和双语视觉一致性，基于新证据按同类问题成组处理。
2. 后续版本继续执行受保护的版本晋级和部署流程；本次 WEB-02 已完成，无需重复部署。
3. 获得设备与网络条件后完成 WEB-03，保留测量数据和环境信息。

## 状态更新规则

代码变更后同步更新双语文档和回归测试。每项完成状态附可复现命令、PR/CI 或线上证据。计划、源码修复、CI 通过、生产部署和实机验证分别记录，不能相互替代。任何外部状态在执行前重新核对。
