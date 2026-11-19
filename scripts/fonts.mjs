/**
 * Copies a typeface from its Fontsource packages into the repository
 * (visual-identity design D6):
 *
 *   npm install -D -E @fontsource/<slug>@<version> [@fontsource-variable/<slug>@<version>]
 *   node scripts/fonts.mjs <slug> [--weights 400,700] [--static]
 *
 * Writes to src/assets/fonts/<slug>/:
 * - the Latin-subset WOFF2 files the site serves: the variable file when the
 *   @fontsource-variable package is installed (unless --static), else one
 *   static file per weight in --weights
 * - static Latin WOFF files at 400 and 700, for the social images (satori
 *   reads neither WOFF2 nor variable fonts)
 * - the package's LICENSE, and SOURCE.txt recording the packages and date
 *
 * Refuses a family whose license isn't the SIL Open Font License. Prints the
 * @font-face rule to paste into src/styles/tokens.css and the import to add
 * to src/lib/fonts.ts. The committed files are what builds use; remove the
 * Fontsource devDependencies once a comp settles on its fonts.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--'))
const flag = (name) => args.includes(`--${name}`)
const option = (name) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error(
    'Usage: node scripts/fonts.mjs <fontsource-slug> [--weights 400,700] [--static]'
  )
  process.exit(2)
}

const OUT = path.join('src/assets/fonts', slug)
const staticDir = path.join('node_modules/@fontsource', slug)
const variableDir = path.join('node_modules/@fontsource-variable', slug)
const useVariable = !flag('static') && existsSync(variableDir)
const weights = (option('weights') ?? '400,700').split(',').map(Number)

if (!existsSync(staticDir)) {
  console.error(
    `@fontsource/${slug} is not installed. Install the pinned packages first:\n` +
      `  npm install -D -E @fontsource/${slug}@<version> @fontsource-variable/${slug}@<version>`
  )
  process.exit(1)
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const staticPkg = readJson(path.join(staticDir, 'package.json'))
const meta = readJson(path.join(staticDir, 'metadata.json'))
if (staticPkg.license !== 'OFL-1.1') {
  console.error(
    `${meta.family} is licensed ${staticPkg.license}, not OFL-1.1. Only open-licensed fonts are allowed.`
  )
  process.exit(1)
}

/** The Latin @font-face block for a file in a package's CSS. */
function latinBlock(cssFile, fileName) {
  const css = readFileSync(cssFile, 'utf8')
  const start = css.indexOf(`/* ${fileName.replace(/\.woff2$/, '')} */`)
  if (start === -1)
    throw new Error(`No @font-face for ${fileName} in ${cssFile}`)
  const block = css.slice(start, css.indexOf('}', start) + 1)
  const get = (prop) =>
    block.match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1].trim()
  return { weight: get('font-weight'), unicodeRange: get('unicode-range') }
}

mkdirSync(OUT, { recursive: true })
const copied = []
const copy = (dir, file) => {
  const from = path.join(dir, 'files', file)
  if (!existsSync(from)) throw new Error(`Missing ${from}`)
  copyFileSync(from, path.join(OUT, file))
  copied.push(file)
}

// Files the site serves.
const faces = []
if (useVariable) {
  const file = `${slug}-latin-wght-normal.woff2`
  copy(variableDir, file)
  faces.push({ file, ...latinBlock(path.join(variableDir, 'wght.css'), file) })
} else {
  for (const w of weights) {
    const file = `${slug}-latin-${w}-normal.woff2`
    copy(staticDir, file)
    faces.push({ file, ...latinBlock(path.join(staticDir, 'index.css'), file) })
  }
}

// Static WOFF files for the social images.
for (const w of [400, 700].filter((w) => meta.weights.includes(w))) {
  copy(staticDir, `${slug}-latin-${w}-normal.woff`)
}

copyFileSync(path.join(staticDir, 'LICENSE'), path.join(OUT, 'LICENSE'))
const packages = [`@fontsource/${slug}@${staticPkg.version}`]
if (useVariable)
  packages.push(
    `@fontsource-variable/${slug}@${readJson(path.join(variableDir, 'package.json')).version}`
  )
writeFileSync(
  path.join(OUT, 'SOURCE.txt'),
  `${meta.family}\n` +
    `Copied from ${packages.join(' and ')} by scripts/fonts.mjs on ${new Date().toISOString().slice(0, 10)}.\n` +
    `License: SIL Open Font License 1.1 (see LICENSE).\n`
)

console.log(`Copied into ${OUT}/: ${copied.join(', ')}, LICENSE, SOURCE.txt\n`)
console.log('Paste into src/styles/tokens.css (outside :root):\n')
for (const face of faces) {
  console.log(`@font-face {
  font-family: '${meta.family}';
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url('../assets/fonts/${slug}/${face.file}') format('woff2');
  unicode-range: ${face.unicodeRange};
}
`)
}
const ident = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
console.log(`To preload it (at most two files site-wide), add to src/lib/fonts.ts:

import ${ident} from '../assets/fonts/${slug}/${faces[0].file}?url'
  …and list ${ident} in preloadFonts.

Then generate the metric-matched fallback face:

  node scripts/font-fallback.mjs ${slug}
`)
