# 站点部署配置

[English](SITE_CONFIGURATION_en.md)

Astro 的正式站点 URL 与部署子路径由构建环境变量统一控制，避免页面 SEO、robots 和 sitemap 各自维护域名：

- `SITE_URL`：站点 origin。正式域名为 `https://easykiconverter.org.cn`，不要包含仓库子路径。
- `SITE_BASE`：部署路径。自有域名根目录使用 `/`；GitHub Pages 项目站使用 `/<repository>/`，例如 `/EasyKiConverter_Website/`。

正式构建命令：`SITE_URL=https://easykiconverter.org.cn SITE_BASE=/ pnpm build`。Astro 默认值也已设为该正式域名和根路径；Astro 的 `site` / `base` 配置用于正式 URL 和资源/路由根路径，页面通过 `import.meta.env.BASE_URL` 构造 canonical、Open Graph、hreflang 与结构化数据；`robots.txt` 和 `sitemap.xml` 也从相同配置生成。

GitHub Pages 当前未启用。正式部署使用 `easykiconverter.org.cn` 根路径；如未来改用 GitHub Pages 项目子路径，必须显式设置对应的 `SITE_BASE`。本地开发默认使用 `/`，便于通过 `http://localhost:4173/` 预览。
