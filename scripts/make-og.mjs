/**
 * Renders the default social preview image (design D9):
 *
 *   node scripts/make-og.mjs
 *
 * Writes public/og/default.png at 1200x630 from a plain HTML template using
 * the locally installed Google Chrome. Colors come from src/styles/tokens.css,
 * so the image follows the current design tokens. The visual identity change
 * replaces this placeholder.
 */
import { mkdir, readFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const OUT = 'public/og/default.png'

const tokens = await readFile('src/styles/tokens.css', 'utf8')
const token = (name) => {
  const match = tokens.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`Token --${name} not found in tokens.css`)
  return match[1].trim()
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: ${token('color-bg')};
    color: ${token('color-text')};
    font-family: ${token('font-body')};
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px 80px;
  }
  .name { font-size: 40px; font-weight: 700; }
  .line { font-size: 64px; font-weight: 700; line-height: 1.1; max-width: 900px; }
  .meta { font-size: 28px; color: ${token('color-text-muted')}; }
  .rule { border-top: 4px solid ${token('color-link')}; width: 120px; margin-bottom: 24px; }
</style>
</head>
<body>
  <div class="name">Elevation Code Works</div>
  <div>
    <div class="rule"></div>
    <div class="line">Custom software and websites for Denver small businesses</div>
  </div>
  <div class="meta">elevationcode.works</div>
</body>
</html>`

await mkdir('public/og', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1
  })
  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({ path: OUT })
  console.log(`Wrote ${OUT}`)
} finally {
  await browser.close()
}
