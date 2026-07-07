# Bundled fonts

`NotoSans-Regular.ttf` and `NotoSans-Bold.ttf` are **subsets** of Google's
[Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans), reduced to Latin
plus common currency symbols (including the rupee sign). They are embedded into
generated invoice PDFs so non-ASCII names and currency signs render correctly
(`lib/invoice-pdf.ts`).

- Source: [googlefonts/noto-fonts](https://github.com/googlefonts/noto-fonts)
- Subset command: `pyftsubset NotoSans-<weight>.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+20A0-20BF,U+2122,U+00A9,U+00AE" --no-hinting --desubroutinize --drop-tables+=GSUB,GPOS`
- License: SIL Open Font License 1.1 — see [OFL.txt](./OFL.txt).

Noto Sans is © The Noto Project Authors. The OFL permits bundling and
redistribution (including subsets); the license text must travel with the font
files, which is why `OFL.txt` lives here.
