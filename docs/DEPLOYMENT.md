# 部署与预览一致性

本项目是由 Astro 生成的静态网站。发布前运行 `pnpm run build`，服务器只需发布生成的 `dist/` 目录，不能只上传源码页面或图片目录。

## 本地预览

不要直接打开生成的 HTML 使用 `file://`。浏览器会阻止页面从本地文件读取 STEP 和 WASM，导致本地看到的模型与线上不一致。

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

将仓库内容原样同步到 Web 根目录或目标子目录，并配置服务器将该目录作为静态文件根目录。必须保留以下文件：

- `dist/index.html`、`dist/en/index.html`
- `dist/_astro/`、`dist/assets/`
- `dist/assets/model/Easykiconverter_展示模型.step`
- `robots.txt`、`sitemap.xml`

服务器至少需要正确返回这些 MIME 类型：

- `.wasm`：`application/wasm`
- `.js`：`text/javascript` 或 `application/javascript`
- `.step`：`application/step`；若服务器没有该类型，也可以使用 `application/octet-stream`

STEP 和 WASM 必须允许同源 GET 请求。不要给静态资源增加会阻止页面读取它们的跨域策略；如果资源与页面不在同一域名，需额外配置 CORS，并同时验证浏览器控制台无错误。

## 域名配置

当前 HTML 中的 canonical 地址仍是公开示例地址 `https://easykiconverter.github.io/EasyKiConverter_Website/`。部署到自有域名后，应同步修改：

- `src/pages/index.astro` 与 `src/pages/en/index.astro` 的 `canonical`
- 两个页面的 `og:url`（如果存在）
- `sitemap.xml` 中的 URL
- `robots.txt` 中的 sitemap 地址

这不会改变页面视觉效果，但能避免搜索引擎把自有服务器识别为 GitHub Pages 的镜像。

## 发布前验收

```bash
python3 tools/validate_site.py
git diff --check
```

在实际域名上检查：中文首页、`/en/`、导航锚点、下载链接、STEP 模型加载、移动宽度、减少动态效果设置，以及浏览器控制台没有错误。发布服务器上的浏览器访问应使用 `http://` 或 `https://`，不能用 `file://`。
