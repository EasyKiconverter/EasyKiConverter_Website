# 部署与预览一致性

本项目是由 Astro 生成的静态网站。发布前运行 `pnpm run build`，服务器只需发布生成的 `dist/` 目录，不能只上传源码页面或图片目录。

## 本地预览

不要直接打开 3D Lab 的 HTML 使用 `file://`。浏览器会阻止页面读取 STEP 和 WASM；首页的静态内容虽然可见，但这不能验证 Lab 的线上行为。

```bash
pnpm install
pnpm dev
```

打开：<http://localhost:4173/>。

验证发布构建：

```bash
pnpm run build
pnpm run preview
```

然后打开 `http://localhost:4174/EasyKiConverter_Website/`。相对资源路径会按线上子路径解析。

## 自有服务器

只将构建生成的 `dist/` 内容同步到 Web 根目录或目标子目录，不要把源码仓库直接作为静态根目录。必须保留以下文件：

- `dist/index.html`、`dist/en/index.html`、`dist/formats/index.html`、`dist/en/formats/index.html`、`dist/cases/index.html`、`dist/en/cases/index.html`
- `dist/_astro/`、`dist/assets/`
- `dist/assets/model/Easykiconverter_展示模型.glb`（3D Lab 默认交付模型）
- `dist/assets/model/Easykiconverter_展示模型-mobile.glb`（窄屏 3D Lab 交付模型）
- `dist/assets/model/Easykiconverter_展示模型.step`（若部署 3D Lab）
- `robots.txt`、`sitemap.xml`

服务器至少需要正确返回这些 MIME 类型：

- `.wasm`：`application/wasm`
- `.glb`：`model/gltf-binary`
- `.js`：`text/javascript` 或 `application/javascript`
- `.step`：`application/step`；若服务器没有该类型，也可以使用 `application/octet-stream`

STEP 和 WASM 必须允许同源 GET 请求。不要给静态资源增加会阻止页面读取它们的跨域策略；如果资源与页面不在同一域名，需额外配置 CORS，并同时验证浏览器控制台无错误。
GLB、WASM 和带内容哈希的 `_astro` 资源应返回明确的长期缓存头（例如 `public, immutable` 与 `max-age=2592000`）；HTML 应保持短缓存或不缓存。

## 域名配置

正式域名为 `https://easykiconverter.org.cn/`。`astro.config.ts` 将其作为默认 `site`，并以 `/` 为默认 `base`；页面的 canonical、`og:url`、hreflang、`sitemap.xml` 和 `robots.txt` 都从此配置生成。若部署路径或域名改变，只需在构建环境设置 `SITE_URL` 与 `SITE_BASE`，不要在页面中分别手改 URL。

## 生产部署脚本

使用 [`tools/deploy_production.py`](../tools/deploy_production.py) 发布时，必须显式提供服务器地址；Python 脚本会构建 `dist/`、创建带时间戳的备份、精确替换站点目录、检查 Nginx 配置并重新加载服务。Nginx 检查失败会恢复上一份站点目录。Shell 入口 [`tools/deploy-production.sh`](../tools/deploy-production.sh) 仅作为兼容包装。

```bash
DEPLOY_HOST=8.137.164.32 \
DEPLOY_USER=dennis \
DEPLOY_PORT=2267 \
DEPLOY_KEY="$HOME/.ssh/ChatGPT_KEY" \
python3 tools/deploy_production.py
```

PowerShell：

```powershell
$env:DEPLOY_HOST = "8.137.164.32"
$env:DEPLOY_USER = "dennis"
$env:DEPLOY_PORT = "2267"
$env:DEPLOY_KEY = "$HOME/.ssh/ChatGPT_KEY"
python tools/deploy_production.py
```

先检查配置而不构建或连接服务器：

```bash
DEPLOY_HOST=example.org python3 tools/deploy_production.py --dry-run
```

本地需要 Python 3、pnpm 和 OpenSSH；远程服务器继续使用 Nginx、sudo 和 tar 完成原子替换。

脚本不会触碰 `/var/www/downloads/`；该目录中的旧版下载文件由 Nginx 的 `/downloads/` 和兼容路径继续提供。

## 发布前验收

```bash
python3 tools/validate_site.py
python3 tools/check_production_assets.py
git diff --check
```

在实际域名上检查八个构建路由：中文首页、`/en/`、`/lab/`、`/en/lab/`、`/formats/`、`/en/formats/`、`/cases/`、`/en/cases/`，并检查导航锚点、下载链接、移动宽度、减少动态效果设置，以及浏览器控制台没有错误。首页和 Lab 的资源边界应分别核对；发布服务器上的浏览器访问应使用 `http://` 或 `https://`，不能用 `file://`。
