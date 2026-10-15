# Qt Quick screenshot assets

[中文](README.md)

`src/assets/source/showcase/easykiconverter-main.png` and `easykiconverter-export.png` are the original Qt Quick screenshots obtained from the EasyKiConverter main project. They remain preserved for provenance and regeneration, but are not published under `public/`. The main-window source contains a local filesystem path and must never be copied directly into the published directory.

The pages load the derived WebP files:

- `easykiconverter-main-public.webp`: about 307 KB, used by the homepage, 3D Lab, and social previews; only the local output-path field is cleared, while the rest of the original screenshot is preserved
- `easykiconverter-export.webp`: about 193 KB, available for future showcase sections

Regenerate them with:

```bash
magick src/assets/source/showcase/easykiconverter-main.png -fill '#f8fbfc' -stroke none -draw 'rectangle 112,1640 3565,1687' -strip -quality 88 public/assets/showcase/easykiconverter-main-public.webp
magick src/assets/source/showcase/easykiconverter-export.png -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

The path mask coordinates target the current 5120×2816 source. If the source screenshot changes, relocate and visually inspect the mask to ensure no personal path remains and no other control is obscured. WebP reduces transfer size but does not replace the real screenshot source files.
