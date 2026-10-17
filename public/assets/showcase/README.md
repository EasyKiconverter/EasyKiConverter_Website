# Qt Quick 截图资产

[English](README_en.md)

`src/assets/source/showcase/easykiconverter-main.png` 与 `easykiconverter-export.png` 是从 EasyKiConverter 主项目取得的原始 Qt Quick 截图，保留用于溯源和重新生成；它们不进入 `public/` 发布目录。主界面源截图含本机路径，禁止直接复制到发布目录。

页面实际加载对应的 WebP 派生文件：

- `easykiconverter-main-public.webp`：约 307 KB，用于首页、3D Lab 和社交预览；只清空本机输出路径输入框，保留其他原始截图内容
- `easykiconverter-export.webp`：约 210 KB，首页工作台展示使用；只保留导出设置、进度和结果区域，本机输出路径已清空，下方带水印的统计区域已裁去
- `easyki-real-model-hero.webp`：约 18 KB，首页首屏使用；它是 `public/assets/model/Easykiconverter_展示模型.glb` 的静态 WebGL 渲染，不是 Qt Quick 软件截图，也不加载 GLB 到首屏。重新生成前先确认模型与材质，再仅捕获模型画布（不要包含页面轨迹、标签或叠层），以 2× DPR 导出并目视确认没有幽灵线框；不得用合成图替代真实产品软件截图。
- `easyki-conversion-story.glb`：约 2.1 MB，由 `pnpm run assets:story-model` 从完整 STEP 派生 GLB 生成，保留 303 个独立零件网格并启用 Meshopt 几何压缩；首页仅在滚动接近转换叙事时懒加载，WebGL 或资源加载失败时仍显示静态 WebP 预览。

派生方式：

```bash
magick src/assets/source/showcase/easykiconverter-main.png -fill '#f8fbfc' -stroke none -draw 'rectangle 112,1640 3565,1687' -strip -quality 88 public/assets/showcase/easykiconverter-main-public.webp
magick src/assets/source/showcase/easykiconverter-export.png -fill '#ffffff' -stroke none -draw 'roundrectangle 120,410 3558,466 18,18' -crop 5120x2300+0+0 +repage -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

主界面遮罩坐标适用于当前 5120×2816 源图；导出图同时清空输出路径输入框，并裁去下方带水印的统计区域。更换任一源截图后须重新定位并目视检查遮罩与裁切，确认没有残留个人路径或覆盖其他控件。WebP 只用于减小传输体积，不能替代真实截图源文件。
