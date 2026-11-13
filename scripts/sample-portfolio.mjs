/**
 * Samples the primary colors and typefaces of the showcased portfolio sites,
 * so the site check can stop the ECW identity from echoing them (visual
 * identity design D10, brand-guardrails "Portfolio sites are not echoed"):
 *
 *   node scripts/sample-portfolio.mjs
 *
 * Uses the locally installed Google Chrome through playwright-core. For each
 * site's Home page (desktop, light scheme) it collects:
 * - fonts: the first family of every visible element's computed font stack
 *   that isn't a generic or system family, plus loaded @font-face families
 * - colors: computed text, background, border and SVG fill colors of visible
 *   elements, and :root custom properties whose names mark them as brand
 *   colors (--brand…, --primary…, --accent…, --secondary…). Each color is
 *   weighted by the area it covers (or the amount of text it colors); near
 *   duplicates (CIEDE2000 < 8) are merged, neutrals (OKLCH C < 0.03) are
 *   dropped, and the top colors that make up at least 2% of the weight are
 *   kept.
 *
 * Prints a `portfolioReferences` block to paste into site-check.config.ts.
 */
import { converter, differenceCiede2000, formatHex, parse } from 'culori'
import { chromium } from 'playwright-core'

const SITES = [
  { site: 'whatcanido.earth', url: 'https://whatcanido.earth/' },
  { site: 'condies.fyi', url: 'https://condies.fyi/' },
  { site: 'uphillskico.com', url: 'https://uphillskico.com/' }
]

const MAX_COLORS = 5
const MIN_SHARE = 0.02
const NEUTRAL_CHROMA = 0.03
const MERGE_DELTA_E = 8
/** :root custom properties that name a brand color. */
const BRAND_PROPERTY = /^--(?:brand|primary|accent|secondary)\b/i
/** Buttons that dismiss consent banners, tried in order. */
const DISMISS_LABELS = ['Reject All', 'Reject all', 'Decline', 'Accept All']

const GENERIC_FONTS = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
  'helvetica',
  'helvetica neue',
  'arial',
  'times new roman',
  'times',
  'georgia',
  'apple color emoji',
  'segoe ui emoji',
  'segoe ui symbol',
  'noto color emoji',
  'emoji',
  'math',
  'fangsong',
  'inherit',
  'initial'
])

const toOklch = converter('oklch')
const deltaE = differenceCiede2000()

/** Runs in the page: raw color and font observations. */
function observe(brandProperty) {
  const brandRe = new RegExp(brandProperty.source, brandProperty.flags)
  const samples = []
  const fonts = new Map()
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return (
      r.width > 0 &&
      r.height > 0 &&
      s.visibility !== 'hidden' &&
      s.display !== 'none' &&
      Number(s.opacity) > 0
    )
  }
  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join('').length
  for (const el of document.querySelectorAll('body, body *')) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const area = Math.min(r.width * r.height, innerWidth * innerHeight * 2)
    const text = ownText(el)
    if (s.backgroundColor)
      samples.push({ value: s.backgroundColor, weight: area })
    if (text > 0) {
      samples.push({ value: s.color, weight: text * 200 })
      const family = s.fontFamily
        .split(',')[0]
        .trim()
        .replace(/^['"]|['"]$/g, '')
      fonts.set(family, (fonts.get(family) ?? 0) + text)
    }
    if (parseFloat(s.borderTopWidth) > 0)
      samples.push({ value: s.borderTopColor, weight: r.width * 20 })
    if (el instanceof SVGGraphicsElement && s.fill && s.fill !== 'none') {
      samples.push({ value: s.fill, weight: area })
    }
  }
  const custom = []
  for (const sheet of document.styleSheets) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of rules) {
      if (
        !rule.style ||
        !/(^|,)\s*(:root|html)\b/.test(rule.selectorText ?? '')
      )
        continue
      for (const prop of rule.style) {
        if (brandRe.test(prop))
          custom.push(rule.style.getPropertyValue(prop).trim())
      }
    }
  }
  const loaded = [...document.fonts]
    .filter((f) => f.status === 'loaded')
    .map((f) => f.family.replace(/^['"]|['"]$/g, ''))
  return { samples, custom, fonts: [...fonts.entries()], loaded }
}

function summarize({ samples, custom, fonts, loaded }) {
  const merged = []
  const add = (value, weight) => {
    const color = parse(value)
    if (!color || (color.alpha ?? 1) < 0.5) return
    const o = toOklch(color)
    if (o.c < NEUTRAL_CHROMA) return
    const near = merged.find((m) => deltaE(m.color, color) < MERGE_DELTA_E)
    if (near) near.weight += weight
    else merged.push({ color, weight })
  }
  for (const s of samples) add(s.value, s.weight)
  const total = merged.reduce((sum, m) => sum + m.weight, 0) || 1
  const top = merged
    .sort((a, b) => b.weight - a.weight)
    .filter((m) => m.weight / total >= MIN_SHARE)
    .slice(0, MAX_COLORS)
    .map((m) => formatHex(m.color).toUpperCase())

  // Custom-property colors the page defines on :root count too, even when
  // the Home page doesn't happen to paint them.
  const customColors = custom
    .map((v) => parse(v))
    .filter((c) => c && (c.alpha ?? 1) >= 0.5 && toOklch(c).c >= NEUTRAL_CHROMA)
    .map((c) => formatHex(c).toUpperCase())
  const colors = [...top]
  for (const hex of customColors) {
    if (!colors.some((h) => deltaE(parse(h), parse(hex)) < MERGE_DELTA_E))
      colors.push(hex)
  }

  // Fontsource names variable builds "<Family> Variable"; record the family.
  const families = new Map()
  for (const raw of [
    ...fonts.sort((a, b) => b[1] - a[1]).map(([f]) => f),
    ...loaded
  ]) {
    const family = raw.replace(/\s+Variable$/i, '').trim()
    if (!family || GENERIC_FONTS.has(family.toLowerCase())) continue
    if (!families.has(family.toLowerCase()))
      families.set(family.toLowerCase(), family)
  }
  return { fonts: [...families.values()], colors }
}

const browser = await chromium.launch({ channel: 'chrome' })
const sampledAt = new Date().toISOString().slice(0, 10)
const results = []
try {
  for (const { site, url } of SITES) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    for (const label of DISMISS_LABELS) {
      const button = page.getByRole('button', { name: label, exact: true })
      if (
        await button
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await button.first().click()
        break
      }
    }
    await page.waitForTimeout(2000)
    const raw = await page.evaluate(observe, {
      source: BRAND_PROPERTY.source,
      flags: BRAND_PROPERTY.flags
    })
    results.push({ site, ...summarize(raw) })
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(`  /** Sampled ${sampledAt} with scripts/sample-portfolio.mjs. */`)
console.log(`  portfolioSampledAt: '${sampledAt}',`)
console.log('  portfolioReferences: [')
for (const r of results) {
  console.log('    {')
  console.log(`      site: '${r.site}',`)
  console.log(`      fonts: [${r.fonts.map((f) => `'${f}'`).join(', ')}],`)
  console.log(`      colors: [${r.colors.map((c) => `'${c}'`).join(', ')}]`)
  console.log('    },')
}
console.log('  ],')
