/**
 * Captures portfolio screenshots for the case studies (design D8):
 *
 *   node scripts/capture-screenshots.mjs            # every site
 *   node scripts/capture-screenshots.mjs condies    # only the sites named
 *
 * Uses the locally installed Google Chrome through playwright-core. Writes
 * src/assets/work/<slug>-desktop.png (1440x900) and <slug>-mobile.png
 * (390x844), dismissing cookie banners first. A site can set:
 *
 * - `clipHeight`: keep only that many pixels from the top of each viewport.
 * - `desktopWidth`: a narrower desktop viewport, for a page whose opening
 *   would otherwise be a thin strip. A work listing never cuts the sides of
 *   a screenshot, so the nearer a capture is to 16:10, the fuller its plate.
 * - `scale`: the device pixel ratio, so a narrow capture stays sharp where
 *   the case study shows it large.
 *
 * Record the capture date in each case study's `screenshotsCapturedAt`.
 */
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const OUT = 'src/assets/work'

const SITES = [
  {
    slug: 'what-can-i-do',
    url: 'https://whatcanido.earth/',
    // Owner decision 2026-11-12: show the search area only, not that day's
    // featured causes. 1024 is the narrowest width with the page's desktop
    // layout; the clip ends above the "Starter Actions" heading.
    desktopWidth: 1024,
    scale: 2,
    clipHeight: { desktop: 496, mobile: 360 }
  },
  { slug: 'condies', url: 'https://condies.fyi/' },
  { slug: 'uphill-ski-co', url: 'https://uphillskico.com/' }
]

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true }
]

/** Buttons that dismiss consent banners, tried in order. */
const DISMISS_LABELS = ['Reject All', 'Reject all', 'Decline', 'Accept All']

async function dismissBanners(page) {
  for (const label of DISMISS_LABELS) {
    const button = page.getByRole('button', { name: label, exact: true })
    if (
      await button
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await button.first().click()
      await page.waitForTimeout(500)
      return label
    }
  }
  return null
}

const only = process.argv.slice(2)
const unknown = only.filter((slug) => !SITES.some((s) => s.slug === slug))
if (unknown.length) {
  console.error(`No such site: ${unknown.join(', ')}`)
  process.exit(2)
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })

try {
  for (const site of SITES.filter(
    (s) => !only.length || only.includes(s.slug)
  )) {
    for (const vp of VIEWPORTS) {
      const width =
        vp.name === 'desktop' ? (site.desktopWidth ?? vp.width) : vp.width
      const context = await browser.newContext({
        viewport: { width, height: vp.height },
        deviceScaleFactor: site.scale ?? 1,
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
        reducedMotion: 'reduce',
        colorScheme: 'light'
      })
      const page = await context.newPage()
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 })
      const dismissed = await dismissBanners(page)
      // Let entrance animations and late images settle.
      await page.waitForTimeout(3000)
      const file = `${OUT}/${site.slug}-${vp.name}.png`
      const height = site.clipHeight?.[vp.name]
      await page.screenshot({
        path: file,
        ...(height ? { clip: { x: 0, y: 0, width, height } } : {})
      })
      console.log(
        `${file}${dismissed ? ` (dismissed banner: ${dismissed})` : ''}`
      )
      await context.close()
    }
  }
} finally {
  await browser.close()
}
