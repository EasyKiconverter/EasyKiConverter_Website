# Qt Quick 截图资产

[English](README_en.md)

`src/assets/source/showcase/easykiconverter-main.png` 与 `easykiconverter-export.png` 是从 EasyKiConverter 主项目取得的原始 Qt Quick 截图，保留用于溯源和重新生成；它们不进入 `public/` 发布目录。主界面源截图含本机路径，禁止直接复制到发布目录。

页面实际加载对应的 WebP 派生文件：

- `easykiconverter-main-public.webp`：约 307 KB，用于首页、3D Lab 和社交预览；只清空本机输出路径输入框，保留其他原始截图内容
- `easykiconverter-export.webp`：约 210 KB，首页工作台展示使用；只保留导出设置、进度和结果区域，本机输出路径已清空，下方带水印的统计区域已裁去。截图中的这次记录为 21/21 项成功、0 项失败，C2040 一行的符号、封装和 3D 模型状态均成功；该信息仅说明截图记录的那次运行，不代表在线服务承诺。
- `easyki-real-model-hero.webp`：约 18 KB，首页首屏使用；它是 `public/assets/model/Easykiconverter_展示模型.glb` 的静态 WebGL 渲染，不是 Qt Quick 软件截图，也不加载 GLB 到首屏。重新生成前先确认模型与材质，再仅捕获模型画布（不要包含页面轨迹、标签或叠层），以 2× DPR 导出并目视确认没有幽灵线框；不得用合成图替代真实产品软件截图。
- `easyki-lab-model-poster.webp` 与 `easyki-lab-model-poster-mobile.webp`：约 45 KB / 17 KB，分别用于 3D Lab 桌面和窄屏的模型加载及交互故障回退；源 PNG 保存在 `src/assets/source/showcase/`，尺寸为 1400×1298 和 720×712。两张图均从实际 GLB 模型画布以 2× DPR 捕获，不是合成图或 Qt Quick 截图。重新生成时隐藏控件，仅捕获模型与 Lab 背景，并检查模型完整、边缘无裁切；此预览改善等待期间的画面，不缩短 GLB 下载或首帧时间。
- `easyki-conversion-story.glb`：约 2.1 MB，由 `pnpm run assets:story-model` 从完整 STEP 整板装配模型派生 GLB 生成，保留 303 个独立零件网格并启用 Meshopt 几何压缩。它是整板演示场景，不是 RP2040/C2040 单个元件的 CAD 模型；首页仅在滚动接近转换叙事时懒加载，WebGL 或资源加载失败时仍显示静态 WebP 预览。

首页转换叙事的前三阶段使用 `src/js/rp2040-prototype.ts` 程序化绘制的 RP2040 QFN-56 示意封装，56 个触点与底部焊盘可在整理/转换阶段展开；随后镜头连续拉远并淡入整板背景，最后进入完整的使用阶段。封装与整板使用同一实测模型跨度缩放，7 mm 封装不会被放大成整板大小；减少动态效果时保持静态构图并在阶段切换点直接切换。厚度、触点外形/间距和底部焊盘均为视觉近似，不是 Raspberry Pi 厂商 CAD，也不代表官方焊盘图。静态故障回退仍使用整板 WebP，页面文字须明确说明这是回退预览。

首页以 Raspberry Pi RP2040（[LCSC 编号 C2040](https://lcsc.com/product-detail/Raspberry-Pi_Raspberry-Pi-RP2040_C2040.html)）作为具名示例。LCSC 将其封装列为 LQFN-56（7 × 7 mm）；Raspberry Pi 的 [RP2040 数据手册](https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf)记载 7 × 7 mm 的 QFN-56 封装。首页关于 C2040 的导出结论仅限于上方保存的截图；页面不会把整板 GLB 冒称为该元件的 CAD 模型。

派生方式：

```bash
magick src/assets/source/showcase/easykiconverter-main.png -fill '#f8fbfc' -stroke none -draw 'rectangle 112,1640 3565,1687' -strip -quality 88 public/assets/showcase/easykiconverter-main-public.webp
magick src/assets/source/showcase/easykiconverter-export.png -fill '#ffffff' -stroke none -draw 'roundrectangle 120,410 3558,466 18,18' -crop 5120x2300+0+0 +repage -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

主界面遮罩坐标适用于当前 5120×2816 源图；导出图同时清空输出路径输入框，并裁去下方带水印的统计区域。更换任一源截图后须重新定位并目视检查遮罩与裁切，确认没有残留个人路径或覆盖其他控件。WebP 只用于减小传输体积，不能替代真实截图源文件。
