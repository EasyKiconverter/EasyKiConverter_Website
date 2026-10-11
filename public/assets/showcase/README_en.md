# Qt Quick screenshot assets

[中文](README.md)

`src/assets/source/showcase/easykiconverter-main.png` and `easykiconverter-export.png` are the original Qt Quick screenshots obtained from the EasyKiConverter main project. They remain preserved for provenance and regeneration, but are not published under `public/`.

The pages load the derived WebP files:

- `easykiconverter-main.webp`: about 158 KB, used by the homepage
- `easykiconverter-export.webp`: about 193 KB, available for future showcase sections

Regenerate them with:

```bash
convert src/assets/source/showcase/easykiconverter-main.png -strip -quality 84 public/assets/showcase/easykiconverter-main.webp
convert src/assets/source/showcase/easykiconverter-export.png -strip -quality 84 public/assets/showcase/easykiconverter-export.webp
```

WebP reduces transfer size but does not replace the real screenshot source files.
