# Deployment and preview parity

This is an Astro-generated static website. Run `pnpm run build` before publishing and sync only the generated `dist/` directory; do not upload only source pages or only the image directory.

## Local preview

Do not open the generated HTML through `file://`. Browsers block local pages from reading the STEP and WASM files, so the local model would not match production.

```bash
pnpm install
pnpm dev
```

Open <http://localhost:4173/>.

To verify the production build:

```bash
pnpm run build
pnpm run preview
```

Then open `http://localhost:4174/EasyKiConverter_Website/`. Relative asset paths resolve the same way as they do under a production subpath.

## Self-hosted server

Sync the repository contents to the web root or target subdirectory and configure the server to serve that directory as static files. Keep these files available:

- `dist/index.html`, `dist/en/index.html`
- `dist/_astro/`, `dist/assets/`
- `dist/assets/model/Easykiconverter_展示模型.step`
- `robots.txt`, `sitemap.xml`

The server should return at least these MIME types:

- `.wasm`: `application/wasm`
- `.js`: `text/javascript` or `application/javascript`
- `.step`: `application/step`; `application/octet-stream` is also acceptable

STEP and WASM must allow same-origin GET requests. Do not add a cross-origin policy that prevents the page from reading static assets. If assets are hosted on another origin, configure CORS and verify the browser console as well.

## Domain configuration

The HTML currently uses the public example canonical URL `https://easykiconverter.github.io/EasyKiConverter_Website/`. After deploying to your own domain, update these together:

- `canonical` in `src/pages/index.astro` and `src/pages/en/index.astro`
- `og:url` in both pages, if present
- URLs in `sitemap.xml`
- the sitemap URL in `robots.txt`

This does not change the visual result, but prevents search engines from treating the self-hosted site as a GitHub Pages mirror.

## Release acceptance

```bash
python3 tools/validate_site.py
git diff --check
```

On the actual domain, check the Chinese home page, `/en/`, navigation anchors, download links, STEP model loading, narrow mobile layout, reduced-motion behavior, and a clean browser console. Production browser access must use `http://` or `https://`, never `file://`.
