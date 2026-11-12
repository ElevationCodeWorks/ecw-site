/**
 * Screenshot sheet for a round of comps (visual-identity design D2):
 *
 *   node scripts/capture-comps.mjs <round> <name>=<preview-url> [<name>=<preview-url> …]
 *   node scripts/capture-comps.mjs 1 trailhead=https://deploy-preview-3--elevationcodeworks.netlify.app
 *
 * For each comp it captures Home, Services, one service page, one case study,
 * About and Contact, full-page at 1440 and 390 pixels wide, in the light and
 * the dark color scheme: 24 screenshots per comp. It writes them to
 * comps/round-<n>/<name>/ with an index.html sheet that shows the comps side
 * by side. When src/assets/brand/options/ exists, the sheet also shows every
 * symbol option at 16, 32, 64 and 256 pixels in both schemes, drawn with the
 * local tokens. comps/ is git-ignored.
 *
 * Uses the locally installed Google Chrome through playwright-core.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { readTokens, token } from '../src/lib/tokens.ts'

const PAGES = [
  { slug: 'home', path: '/', label: 'Home' },
  { slug: 'services', path: '/services/', label: 'Services' },
  { slug: 'service', path: '/services/websites/', label: 'Service page' },
  { slug: 'case-study', path: '/work/condies/', label: 'Case study' },
  { slug: 'about', path: '/about/', label: 'About' },
  { slug: 'contact', path: '/contact/', label: 'Contact' }
]
const VIEWPORTS = [
  { slug: 'desktop', width: 1440, height: 900, isMobile: false },
  { slug: 'phone', width: 390, height: 844, isMobile: true }
]
const SCHEMES = ['light', 'dark']
const SYMBOL_SIZES = [16, 32, 64, 256]
const OPTIONS_DIR = 'src/assets/brand/options'

/** Netlify's deploy-preview review overlay; kept out of the screenshots. */
const NETLIFY_OVERLAY =
  /netlify-cdp-loader|\/\.netlify\/(?:functions|scripts)\/|app\.netlify\.com\/.*(?:drawer|collab)/i

const [round, ...compArgs] = process.argv.slice(2)
if (!/^\d+$/.test(round ?? '') || compArgs.length === 0) {
  console.error(
    'Usage: node scripts/capture-comps.mjs <round> <name>=<preview-url> [...]'
  )
  process.exit(2)
}
const comps = compArgs.map((arg) => {
  const [name, url] = arg.split(/=(.*)/s)
  if (!/^[a-z0-9-]+$/.test(name ?? '') || !/^https?:\/\//.test(url ?? '')) {
    console.error(`Bad comp "${arg}". Use <name>=<preview-url>.`)
    process.exit(2)
  }
  return { name, url: url.replace(/\/+$/, '') }
})

const outDir = path.join('comps', `round-${round}`)
const shots = []
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const comp of comps) {
    mkdirSync(path.join(outDir, comp.name), { recursive: true })
    for (const scheme of SCHEMES) {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          isMobile: vp.isMobile,
          hasTouch: vp.isMobile,
          colorScheme: scheme,
          reducedMotion: 'reduce'
        })
        await context.route(NETLIFY_OVERLAY, (route) => route.abort())
        const page = await context.newPage()
        for (const p of PAGES) {
          await page.goto(comp.url + p.path, { waitUntil: 'networkidle' })
          await page.evaluate(() => document.fonts.ready)
          const file = path.join(
            comp.name,
            `${p.slug}-${vp.slug}-${scheme}.png`
          )
          await page.screenshot({
            path: path.join(outDir, file),
            fullPage: true
          })
          shots.push({
            comp: comp.name,
            page: p.slug,
            viewport: vp.slug,
            scheme,
            file
          })
          console.log(path.join(outDir, file))
        }
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  )

/** Symbol options at every size, in both schemes, using the local tokens. */
function symbolStrip() {
  if (!existsSync(OPTIONS_DIR)) return ''
  const options = readdirSync(OPTIONS_DIR)
    .filter((f) => f.endsWith('.svg'))
    .sort()
  if (!options.length) return ''
  const tokens = readTokens(readFileSync('src/styles/tokens.css', 'utf8'))
  const bg = token(tokens, '--color-bg')
  const text = token(tokens, '--color-text')
  const rows = options
    .map((file) => {
      const svg = readFileSync(path.join(OPTIONS_DIR, file), 'utf8').replace(
        /<!--[\s\S]*?-->/g,
        ''
      )
      const cells = SCHEMES.map((scheme) => {
        const marks = SYMBOL_SIZES.map(
          (size) =>
            `<span class="mark" style="width:${size}px;height:${size}px">${svg}</span>`
        ).join('')
        return `<td><div class="strip" style="background:${bg[scheme]};color:${text[scheme]}">${marks}</div></td>`
      }).join('')
      return `<tr><th scope="row">${esc(file)}</th>${cells}</tr>`
    })
    .join('\n')
  return `<h2>Symbol options</h2>
<table class="symbols"><thead><tr><th></th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead>
<tbody>${rows}</tbody></table>`
}

const header = comps
  .map(
    (c) =>
      `<th scope="col">${esc(c.name)}<br><a href="${esc(c.url)}">${esc(c.url)}</a></th>`
  )
  .join('')
const body = PAGES.flatMap((p) =>
  VIEWPORTS.flatMap((vp) =>
    SCHEMES.map((scheme) => {
      const cells = comps
        .map((c) => {
          const s = shots.find(
            (x) =>
              x.comp === c.name &&
              x.page === p.slug &&
              x.viewport === vp.slug &&
              x.scheme === scheme
          )
          return `<td class="${vp.slug}"><a href="${esc(s.file)}"><img loading="lazy" src="${esc(s.file)}" alt="${esc(`${c.name}: ${p.label}, ${vp.slug}, ${scheme}`)}"></a></td>`
        })
        .join('')
      return `<tr><th scope="row">${esc(p.label)}<br>${vp.slug} ${vp.width}px<br>${scheme}</th>${cells}</tr>`
    })
  )
).join('\n')

writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Round ${esc(round)} comps</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 16px; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; text-align: left; }
  thead th { position: sticky; top: 0; background: #fff; }
  td.desktop img { width: 480px; }
  td.phone img { width: 195px; }
  .strip { display: flex; align-items: center; gap: 16px; padding: 16px; }
  .mark { display: inline-block; flex: none; }
  .mark svg { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
<h1>Round ${esc(round)} comps</h1>
<p>Captured ${new Date().toISOString().slice(0, 10)}. Click an image for full size.</p>
${symbolStrip()}
<h2>Pages</h2>
<table><thead><tr><th></th>${header}</tr></thead>
<tbody>
${body}
</tbody></table>
</body>
</html>
`
)
console.log(
  `\nWrote ${path.join(outDir, 'index.html')} (${shots.length} screenshots).`
)
