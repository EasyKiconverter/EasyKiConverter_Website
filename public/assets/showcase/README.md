# Qt Quick 截图资产

[English](README_en.md)

`src/assets/source/showcase/easykiconverter-main.png` 与 `easykiconverter-export.png` 是从 EasyKiConverter 主项目取得的原始 Qt Quick 截图，保留用于溯源和重新生成；它们不进入 `public/` 发布目录。主界面源截图含本机路径，禁止直接复制到发布目录。

页面实际加载对应的 WebP 派生文件：

- `easykiconverter-main-public.webp`：约 307 KB，用于首页、3D Lab 和社交预览；只清空本机输出路径输入框，保留其他原始截图内容
- `easykiconverter-export.webp`：约 193 KB，供后续展示扩展使用

派生方式：

```bash
magick src/assets/source/showcase/easykiconverter-main.png -fill '#f8fbfc' -stroke none -draw 'rectangle 112,1640 3565,1687' -strip -quality 88 public/assets/showcase/easykiconverter-main-public.webp
magick src/assets/source/showcase/easykiconverter-export.png -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

主界面去路径坐标适用于当前 5120×2816 源图；更换源截图后须重新定位并目视检查遮罩，确认没有残留个人路径或覆盖其他控件。WebP 只用于减小传输体积，不能替代真实截图源文件。
