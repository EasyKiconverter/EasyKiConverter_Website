# Qt Quick 截图资产

[English](README_en.md)

`src/assets/source/showcase/easykiconverter-main.png` 与 `easykiconverter-export.png` 是从 EasyKiConverter 主项目取得的原始 Qt Quick 截图，保留用于溯源和重新生成；它们不进入 `public/` 发布目录。主界面源截图含本机路径，禁止直接复制到发布目录。

页面实际加载对应的 WebP 派生文件：

- `easykiconverter-main-public.webp`：约 307 KB，用于首页、3D Lab 和社交预览；只清空本机输出路径输入框，保留其他原始截图内容
- `easykiconverter-export.webp`：约 210 KB，首页工作台展示使用；只保留导出设置、进度和结果区域，本机输出路径已清空，下方带水印的统计区域已裁去
- `easyki-real-model-hero.webp`：约 27 KB，首页首屏使用；它是 `public/assets/model/Easykiconverter_展示模型.glb` 在本仓库 3D Lab/Three.js 中的静态 WebGL 渲染裁切，不是 Qt Quick 软件截图，也不加载 GLB 到首页。重新生成前先在 3D Lab 确认该 STEP 派生模型与材质状态，再用 2× DPR 捕获模型画布并裁切；不得用合成图替代真实产品软件截图。

派生方式：

```bash
magick src/assets/source/showcase/easykiconverter-main.png -fill '#f8fbfc' -stroke none -draw 'rectangle 112,1640 3565,1687' -strip -quality 88 public/assets/showcase/easykiconverter-main-public.webp
magick src/assets/source/showcase/easykiconverter-export.png -fill '#ffffff' -stroke none -draw 'roundrectangle 120,410 3558,466 18,18' -crop 5120x2300+0+0 +repage -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

主界面遮罩坐标适用于当前 5120×2816 源图；导出图同时清空输出路径输入框，并裁去下方带水印的统计区域。更换任一源截图后须重新定位并目视检查遮罩与裁切，确认没有残留个人路径或覆盖其他控件。WebP 只用于减小传输体积，不能替代真实截图源文件。
