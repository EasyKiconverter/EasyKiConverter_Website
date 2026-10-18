# Qt Quick screenshot assets

[中文](README.md)

`src/assets/source/showcase/easykiconverter-main.png` and `easykiconverter-export.png` are the original Qt Quick screenshots obtained from the EasyKiConverter main project. They remain preserved for provenance and regeneration, but are not published under `public/`. The main-window source contains a local filesystem path and must never be copied directly into the published directory.

The pages load the derived WebP files:

- `easykiconverter-main-public.webp`: about 307 KB, used by the homepage, 3D Lab, and social previews; only the local output-path field is cleared, while the rest of the original screenshot is preserved
- `easykiconverter-export.webp`: about 210 KB, used by the homepage workbench showcase; it keeps only export settings, progress, and results, clears the local output path, and crops away the watermarked statistics area below. The captured run shows 21/21 successful items, zero failures, and C2040 with successful symbol, footprint, and 3D-model indicators. This is evidence from that recorded run, not a live-service guarantee.
- `easyki-real-model-hero.webp`: about 18 KB, used in the homepage hero. It is a static WebGL render of `public/assets/model/Easykiconverter_展示模型.glb`, not a Qt Quick screenshot, and does not load the GLB above the fold. To regenerate, confirm the model and materials, capture only the model canvas (exclude page routes, labels, and overlays) at 2× DPR, then visually check for ghost wireframes. Never use a synthetic render in place of a real product-software screenshot.
- `easyki-conversion-story.glb`: about 2.1 MB, generated from the full STEP-derived board assembly with `pnpm run assets:story-model`; it preserves 303 independent part meshes with Meshopt geometry compression. It is an illustrative board scene, not the individual RP2040/C2040 package model. The homepage lazy-loads it near the conversion story, and keeps the static WebP preview if WebGL or the asset fails.

The homepage uses Raspberry Pi's RP2040 ([LCSC C2040](https://lcsc.com/product-detail/Raspberry-Pi_Raspberry-Pi-RP2040_C2040.html)) as its named example. LCSC identifies the part and package as LQFN-56 (7 × 7 mm); Raspberry Pi's [RP2040 datasheet](https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf) documents the 7 × 7 mm QFN-56 package. The homepage's C2040 export claims are limited to the preserved screenshot above; the board GLB is not presented as that component's CAD model.

Regenerate them with:

```bash
magick src/assets/source/showcase/easykiconverter-main.png -fill '#f8fbfc' -stroke none -draw 'rectangle 112,1640 3565,1687' -strip -quality 88 public/assets/showcase/easykiconverter-main-public.webp
magick src/assets/source/showcase/easykiconverter-export.png -fill '#ffffff' -stroke none -draw 'roundrectangle 120,410 3558,466 18,18' -crop 5120x2300+0+0 +repage -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

The main-window mask coordinates target the current 5120×2816 source; the export image also clears its output-path field and crops away the watermarked statistics area below. If either source screenshot changes, relocate and visually inspect the mask and crop to ensure no local path remains and no other control is obscured. WebP reduces transfer size but does not replace the real screenshot source files.
