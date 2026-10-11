# 优化记录

[English](OPTIMIZATION_LOG_en.md)

## 2026-09-22 — Dependency Review 工作流故障核验

- **问题：** Actions run `35737032681` 的 `Dependency Review` 因仓库未启用 GitHub Dependency Graph 而失败；日志原文为 “Dependency review is not supported on this repository”。
- **处理：** 当前版本分支已在 `c45e03f` 将工作流改为仅在 PR 修改依赖清单时运行 Dependency Review。当前修复分支继承了该改动；本轮未重复修改工作流，也未推送远程。
- **验证：** 当前分支相对 `upstream/version/V0.0.1` 未修改依赖清单，检测逻辑输出 `dependency manifests unchanged: review is skipped`。`pnpm run check`、`pnpm run build`、`python3 tools/validate_site.py` 均通过，Astro 0 error / 0 warning / 0 hint。
- **风险与回滚：** 本轮仅新增记录文件；若需撤销，可回滚本轮文档提交，不影响站点运行。
- **限制：** 未重跑 GitHub Actions；本地结果验证工作流分支条件与网站构建，不代表远程 run 状态。

## 2026-09-22 — 校正仓库结构文档

- **选择原因：** 中英文 README 均把不存在的根目录 `assets/` 列为资源位置，并遗漏 `src/components/` 与 `tools/`；这可能导致贡献者把新文件放错位置。修复成本低、证据明确，不改变运行行为。
- **修改：** 同步更新中英文项目树和资源归属说明，修正中文 README 的官方图标路径与模型文档语言入口；在优化待办中调整后续机会优先级。
- **验证：** `pnpm run check` 与 `pnpm run build` 通过（Astro 0 errors / 0 warnings / 0 hints）；`python3 tools/validate_site.py` 通过；`git diff --check` 通过。没有独立 test、lint 或 benchmark 脚本；本轮仅改文档，未做浏览器测试。
- **风险与回滚：** 仅文档变化；如目录描述有误，可单独回滚 README 与本条记录，不影响站点运行。
- **下一步：** 优先评估浏览器回归测试，其次量测 STEP → GLB 管线收益。

## 2026-10-11 — 建立 GLB 交付资产质量门禁

- **问题：** STEP→GLB 生成器已经存在，但构建流程没有验证 GLB 容器、法线、源模型元数据或三角面增长；桌面资产曾缺少生成器应写入的源模型元数据。
- **处理：** 使用 `tools/prepare_model_asset.py` 重建桌面 GLB；新增跨平台 Python 校验器 `tools/check_model_assets.py`，检查 STEP 源文件、GLB 结构、303 组法线、源尺寸元数据，以及桌面 300,000 / 移动 250,000 三角面预算；将 `pnpm run assets:check` 接入 README 和 Site Quality。
- **验证：** 桌面资产为 9,989,676 bytes / 278,784 triangles，移动资产为 8,431,996 bytes / 228,004 triangles；`pnpm run build`、`python3 tools/validate_site.py`、`pnpm run assets:check` 和 `pnpm run test:browser` 均通过（26 项浏览器测试）。
- **边界：** 预算是意外膨胀的质量门，不是几何简化算法；真正的视觉简化仍需比较轮廓、连接器和焊盘细节后单独决定。

## 2026-10-11 — 统一内容页与 3D Lab 的品牌表现

- **问题：** 首页使用图标、GitHub 入口和产品式品牌头部，但 Formats、Cases 和 3D Lab 使用不同的纯文字头部；Lab 的双语资产体积提示也落后于实际 GLB 资产。
- **处理：** 内容页共享品牌图标和 GitHub 入口；Lab 头部改用同一图标与层级，并将桌面/移动 GLB 提示更新为约 10.0 / 8.4 MB；移动断点保留紧凑布局，隐藏非核心 GitHub 文字入口以避免拥挤。
- **验证：** `pnpm run build`、`python3 tools/validate_site.py`、`pnpm run assets:check` 和 `pnpm run test:browser` 均通过；浏览器回归测试为 28 项，覆盖桌面与移动头部表现。

## 2026-10-11 — 统一公开页面的纸张颗粒层

- **问题：** 中文首页有 `.grain` 质感层，但英文首页、Formats、Cases 和中英文 Lab 页面没有，切换语言或进入子页面时背景质感会变化。
- **处理：** 在英文首页、共享内容页布局和双语 Lab 页面加入同一层 `grain`，不改变页面结构或运行时加载路径。
- **验证：** `pnpm run build`、`python3 tools/validate_site.py`、`pnpm run assets:check` 和 `pnpm run test:browser` 均通过；浏览器测试共 30 项，并逐页确认 8 个公开路由各有一个颗粒层。

## 2026-10-11 — 对齐中英文首页的交互节奏

- **问题：** 英文首页的下载按钮缺少磁吸类名，故事卡片、工作流和平台列表缺少与中文首页对应的进入延迟；GitHub 箭头也没有使用统一的悬停动画结构。
- **处理：** 对齐英文首页的 `magnetic`、`reveal-delay` 类名和 GitHub 箭头结构，并为英文滚动提示补充可访问名称；新增浏览器测试锁定双语首页的交互节奏。
- **验证：** 修改后运行构建、静态站点检查和浏览器测试；中文与英文首页继续共享同一套视觉与交互状态。

## 2026-10-11 — 完整对齐首页下载与功能卡动效

- **问题：** 英文首页底部下载按钮缺少磁吸和箭头动效，首屏下载箭头没有统一的动画结构，三个彩色功能卡也没有沿用中文首页的错落进入节奏。
- **处理：** 同步英文首页的下载按钮类名、箭头结构和功能卡进入延迟；扩展双语浏览器测试，覆盖首屏、功能区和底部下载区的动效状态。
- **验证：** 运行构建、静态站点检查、GLB 资产门禁和双浏览器回归测试，确保修改只影响展示层。
