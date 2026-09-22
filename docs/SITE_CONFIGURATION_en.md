# Site Deployment Configuration

[中文](SITE_CONFIGURATION.md)

Astro's production URL and deployment path are controlled by build environment variables so page SEO, `robots.txt`, and the sitemap share one source:

- `SITE_URL`: the site origin. The production domain is `https://easykiconverter.org.cn`, without a repository subpath.
- `SITE_BASE`: the deployment path. Use `/` for a custom domain root or `/<repository>/` for a GitHub Pages project site, such as `/EasyKiConverter_Website/`.

Build for production with `SITE_URL=https://easykiconverter.org.cn SITE_BASE=/ pnpm build`. Astro defaults are also set to this domain and root path. Astro's `site` and `base` options define the production URL and the route/asset root. Pages use `import.meta.env.BASE_URL` for canonical, Open Graph, hreflang, and structured-data URLs; `robots.txt` and `sitemap.xml` use the same configuration.

GitHub Pages is not currently enabled. Production is intended to use the root of `easykiconverter.org.cn`; if the site later moves to a GitHub Pages project subpath, explicitly set the matching `SITE_BASE`. Local development defaults to `/` for preview at `http://localhost:4173/`.
