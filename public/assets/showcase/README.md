# Qt Quick 截图资产

[English](README_en.md)

`src/assets/source/showcase/easykiconverter-main.png` 与 `easykiconverter-export.png` 是从 EasyKiConverter 主项目取得的原始 Qt Quick 截图，保留用于溯源和重新生成；它们不进入 `public/` 发布目录。

页面实际加载对应的 WebP 派生文件：

- `easykiconverter-main.webp`：约 158 KB，用于首页展示
- `easykiconverter-export.webp`：约 193 KB，供后续展示扩展使用

派生方式：

```bash
convert src/assets/source/showcase/easykiconverter-main.png -strip -quality 84 public/assets/showcase/easykiconverter-main.webp
convert src/assets/source/showcase/easykiconverter-export.png -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

WebP 只用于减小传输体积，不能替代真实截图源文件。
