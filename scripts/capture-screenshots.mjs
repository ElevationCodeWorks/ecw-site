/**
 * Captures portfolio screenshots for the case studies (design D8):
 *
 *   node scripts/capture-screenshots.mjs
 *
 * Uses the locally installed Google Chrome through playwright-core. Writes
 * src/assets/work/<slug>-desktop.png (1440x900) and <slug>-mobile.png
 * (390x844), dismissing cookie banners first. A site with `clipHeight` keeps
 * only that many pixels from the top of each viewport. Record the capture
 * date in each case study's `screenshotsCapturedAt`.
 */
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const OUT = 'src/assets/work'

const SITES = [
  {
    slug: 'what-can-i-do',
    url: 'https://whatcanido.earth/',
    // Owner decision 2026-11-12: show the search area only, not that day's
    // featured causes.
    clipHeight: { desktop: 520, mobile: 360 }
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

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })

try {
  for (const site of SITES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
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
        ...(height ? { clip: { x: 0, y: 0, width: vp.width, height } } : {})
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
