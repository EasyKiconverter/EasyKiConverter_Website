# Qt Quick 截图资产

`easykiconverter-main.png` 与 `easykiconverter-export.png` 是从 EasyKiConverter 主项目取得的原始 Qt Quick 截图，保留用于溯源和重新生成。

页面实际加载对应的 WebP 派生文件：

- `easykiconverter-main.webp`：约 158 KB，用于首页展示
- `easykiconverter-export.webp`：约 193 KB，供后续展示扩展使用

派生方式：

```bash
convert easykiconverter-main.png -strip -quality 84 easykiconverter-main.webp
convert easykiconverter-export.png -strip -quality 84 easykiconverter-export.webp
```

WebP 只用于减小传输体积，不能替代真实截图源文件。
