// Downloads the site's Google Fonts into app/_fonts/ and writes the files that
// load them, so `next build` never talks to Google. next/font/google fetched
// them at build time, and builds failed whenever Google answered with
// extensionless /l/font?kit= URLs (vercel/next.js#99114).
//
// Run by hand after changing FONTS below: `npm run fonts`. It is not part of
// the build. It writes:
//   app/_fonts/*.woff2   the font files, one per subset (and weight, for static fonts)
//   app/_fonts/fonts.ts  next/font/local for the Latin files, so they stay hashed and preloaded
//   app/_fonts/fonts.css the other subsets, metric-matched fallbacks, and the --font-* variables
//   app/_fonts/OFL-*.txt the license texts
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = 'app/_fonts';

// Same User-Agent next/font/google sends, so Google returns the same woff2 files.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';

// `fallback` holds the Arial overrides next/font computed for these fonts, so
// text doesn't shift when the web font swaps in.
const FONTS = [
  {
    family: 'JetBrains Mono',
    slug: 'jetbrains-mono',
    exportName: 'jetbrainsMono',
    variable: '--font-jetbrains',
    weights: [400, 500, 600, 700],
    license: 'ofl/jetbrainsmono/OFL.txt',
    fallback: { ascent: '75.79%', descent: '22.29%', lineGap: '0.0%', sizeAdjust: '134.59%' },
  },
  {
    family: 'IBM Plex Mono',
    slug: 'ibm-plex-mono',
    exportName: 'plexMono',
    variable: '--font-plex-mono',
    weights: [400, 500, 600, 700],
    license: 'ofl/ibmplexmono/OFL.txt',
    fallback: { ascent: '76.16%', descent: '20.43%', lineGap: '0.0%', sizeAdjust: '134.59%' },
  },
  {
    family: 'IBM Plex Sans',
    slug: 'ibm-plex-sans',
    exportName: 'plexSans',
    variable: '--font-plex-sans',
    weights: [300, 400, 500, 600, 700],
    license: 'ofl/ibmplexsans/OFL.txt',
    fallback: { ascent: '101.32%', descent: '27.18%', lineGap: '0.0%', sizeAdjust: '101.17%' },
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOk(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

// Google sometimes serves /l/font?kit= URLs. Those files work, but ask again
// so we always get the stable /s/<family>/<version>/<hash>.woff2 ones.
async function fetchFaces(font) {
  const url = `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}:wght@${font.weights.join(';')}&display=swap`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const css = await (await fetchOk(url, { headers: { 'User-Agent': USER_AGENT } })).text();
    const faces = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)].map(([, subset, body]) => {
      const get = (prop) => body.match(new RegExp(`${prop}: ([^;]+);`))?.[1].trim();
      return {
        subset,
        style: get('font-style'),
        weight: Number(get('font-weight')),
        stretch: get('font-stretch'),
        url: get('src').match(/url\(([^)]+)\)/)[1],
        unicodeRange: get('unicode-range'),
      };
    });
    if (faces.length && faces.every((f) => /\/s\/.+\.woff2$/.test(f.url))) return faces;
    console.warn(`${font.family}: unexpected font URLs from Google (attempt ${attempt}), retrying`);
    await sleep(2000);
  }
  throw new Error(`${font.family}: Google kept returning non-woff2 URLs`);
}

// Variable fonts use one file for every weight; static fonts have one per weight.
function fileName(font, face, faces) {
  const sharedAcrossWeights = faces.filter((f) => f.url === face.url).length > 1;
  return `${font.slug}-${face.subset}${sharedAcrossWeights ? '' : `-${face.weight}`}.woff2`;
}

const quote = (s) => JSON.stringify(s);

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.woff2')) rmSync(`${OUT}/${f}`);
}

const tsParts = [];
const cssFaces = [];
const cssFallbacks = [];
const cssVars = [];

for (const font of FONTS) {
  const faces = await fetchFaces(font);
  const files = new Map();
  for (const face of faces) {
    face.file = fileName(font, face, faces);
    files.set(face.file, face.url);
  }
  for (const [file, url] of files) {
    const bytes = Buffer.from(await (await fetchOk(url)).arrayBuffer());
    writeFileSync(`${OUT}/${file}`, bytes);
  }

  const latin = faces.filter((f) => f.subset === 'latin');
  const latinRange = latin[0].unicodeRange;
  const stretch = latin[0].stretch;
  const declarations = [{ prop: 'unicode-range', value: latinRange }];
  if (stretch) declarations.push({ prop: 'font-stretch', value: stretch });
  tsParts.push(`export const ${font.exportName} = localFont({
  src: [
${latin.map((f) => `    { path: ${quote(`./${f.file}`)}, weight: ${quote(String(f.weight))}, style: ${quote(f.style)} },`).join('\n')}
  ],
  display: "swap",
  variable: ${quote(`${font.variable}-latin`)},
  adjustFontFallback: false,
  declarations: [
${declarations.map((d) => `    { prop: ${quote(d.prop)}, value: ${quote(d.value)} },`).join('\n')}
  ],
});`);

  for (const face of faces.filter((f) => f.subset !== 'latin')) {
    cssFaces.push(`/* ${face.subset} */
@font-face {
  font-family: ${quote(font.family)};
  font-style: ${face.style};
  font-weight: ${face.weight};${face.stretch ? `\n  font-stretch: ${face.stretch};` : ''}
  font-display: swap;
  src: url(${quote(`./${face.file}`)}) format("woff2");
  unicode-range: ${face.unicodeRange};
}`);
  }

  const fb = font.fallback;
  cssFallbacks.push(`@font-face {
  font-family: ${quote(`${font.family} Fallback`)};
  src: local("Arial");
  ascent-override: ${fb.ascent};
  descent-override: ${fb.descent};
  line-gap-override: ${fb.lineGap};
  size-adjust: ${fb.sizeAdjust};
}`);
  cssVars.push(`  ${font.variable}: var(${font.variable}-latin), ${quote(font.family)}, ${quote(`${font.family} Fallback`)};`);

  const license = await (await fetchOk(`https://raw.githubusercontent.com/google/fonts/main/${font.license}`)).text();
  writeFileSync(`${OUT}/OFL-${font.slug}.txt`, license);
  console.log(`${font.family}: ${files.size} files`);
}

writeFileSync(
  `${OUT}/fonts.ts`,
  `// Generated by scripts/fetch-fonts.mjs. Do not edit.
// The Latin files load through next/font/local so they are hashed and
// preloaded. fonts.css adds the other subsets and builds the --font-* variables.
import localFont from "next/font/local";

${tsParts.join('\n\n')}
`,
);

writeFileSync(
  `${OUT}/fonts.css`,
  `/* Generated by scripts/fetch-fonts.mjs. Do not edit. */

/* Non-Latin subsets. Latin is in fonts.ts. Each variable below lists the Latin
   family first, then these, then the fallback, so a character missing from one
   subset falls through to the next one before reaching Arial. */
${cssFaces.join('\n')}

/* Arial adjusted to each font's metrics, used until the web font loads. */
${cssFallbacks.join('\n')}

:root {
${cssVars.join('\n')}
}
`,
);
