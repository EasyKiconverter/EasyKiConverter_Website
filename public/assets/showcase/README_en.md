# Qt Quick screenshot assets

`easykiconverter-main.png` and `easykiconverter-export.png` are the original Qt Quick screenshots obtained from the EasyKiConverter main project. They remain preserved for provenance and regeneration.

The pages load the derived WebP files:

- `easykiconverter-main.webp`: about 158 KB, used by the homepage
- `easykiconverter-export.webp`: about 193 KB, available for future showcase sections

Regenerate them with:

```bash
convert easykiconverter-main.png -strip -quality 84 easykiconverter-main.webp
convert easykiconverter-export.png -strip -quality 84 easykiconverter-export.webp
```

WebP reduces transfer size but does not replace the real screenshot source files.
