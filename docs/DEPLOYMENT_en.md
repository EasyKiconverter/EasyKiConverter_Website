# Deployment and preview parity

[中文](DEPLOYMENT.md)

This is an Astro-generated static website. Run `pnpm run build` before publishing and sync only the generated `dist/` directory; do not upload only source pages or only the image directory.

## Local preview

Do not open the 3D Lab HTML through `file://`. Browsers block local pages from reading STEP and WASM; the homepage may still look visible, but that does not validate Lab behavior.

```bash
pnpm install
pnpm dev
```

Astro's development server defaults to port `4321`; open <http://localhost:4321/>. If the port is occupied, run `pnpm dev -- --port 4322` and use that port.

To verify the production build:

```bash
pnpm run build
pnpm run preview
```

`astro preview` also defaults to port `4321`. For a root-path build, open <http://localhost:4321/>. To verify the GitHub Pages project subpath, rebuild with the matching `SITE_BASE` before starting preview:

```bash
SITE_BASE=/EasyKiConverter_Website/ pnpm run build
pnpm run preview
```

Then open <http://localhost:4321/EasyKiConverter_Website/>. Do not confuse this Astro preview port with `4174`, which the README uses for a separate parent-directory HTTP server.

## Self-hosted server

Sync only the generated `dist/` contents to the web root or target subdirectory; do not serve the source repository directly. Keep these files available:

- `dist/index.html`, `dist/en/index.html`, `dist/formats/index.html`, `dist/en/formats/index.html`, `dist/cases/index.html`, `dist/en/cases/index.html`
- `dist/_astro/`, `dist/assets/`
- `dist/assets/model/Easykiconverter_展示模型.glb` (the default 3D Lab delivery model)
- `dist/assets/model/Easykiconverter_展示模型-mobile.glb` (the narrow-viewport 3D Lab delivery model)
- `dist/assets/model/Easykiconverter_展示模型.step` (when deploying the 3D Lab)
- `robots.txt`, `sitemap.xml`

The server should return at least these MIME types:

- `.wasm`: `application/wasm`
- `.glb`: `model/gltf-binary`
- `.js`: `text/javascript` or `application/javascript`
- `.step`: `application/step`; `application/octet-stream` is also acceptable

STEP and WASM must allow same-origin GET requests. Do not add a cross-origin policy that prevents the page from reading static assets. If assets are hosted on another origin, configure CORS and verify the browser console as well.
GLB, WASM, and content-hashed `_astro` resources should return an explicit long-lived cache policy (for example `public, immutable` with `max-age=2592000`); GLB/WASM must also return `Content-Encoding: gzip` and `Vary: Accept-Encoding` when the client advertises support; HTML should remain short-lived or uncached.

## Domain configuration

The production domain is `https://easykiconverter.org.cn/`. `astro.config.ts` uses it as the default `site` with `/` as the default `base`; canonical, `og:url`, hreflang, `sitemap.xml`, and `robots.txt` are generated from that shared configuration. If the domain or deployment path changes, set `SITE_URL` and `SITE_BASE` in the build environment rather than editing page URLs individually.

## Production deployment script

Use [`tools/deploy-production.sh`](../tools/deploy-production.sh) with an explicit server address. The script builds `dist/`, creates a timestamped backup, replaces the site directory exactly, validates Nginx, and reloads the service. If the Nginx check fails, it restores the previous site directory.

```bash
DEPLOY_HOST=8.137.164.32 \
DEPLOY_USER=dennis \
DEPLOY_PORT=2267 \
DEPLOY_KEY="$HOME/.ssh/ChatGPT_KEY" \
./tools/deploy-production.sh
```

The script does not touch `/var/www/downloads/`; legacy release files remain available through Nginx at `/downloads/` and the compatibility root paths.

## Release acceptance

```bash
python3 tools/validate_site.py
python3 tools/check_production_assets.py
git diff --check
```

On the actual domain, check all eight built routes: the Chinese homepage, `/en/`, `/lab/`, `/en/lab/`, `/formats/`, `/en/formats/`, `/cases/`, and `/en/cases/`. Also check navigation anchors, download links, narrow mobile layout, reduced-motion behavior, and a clean browser console. Verify homepage and Lab resource boundaries separately. Production browser access must use `http://` or `https://`, never `file://`.
