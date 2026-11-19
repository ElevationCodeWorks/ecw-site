/**
 * Integration audit (design D13): `npm run audit`
 *
 * 1. Builds the site in production mode (the artifact that ships; preview
 *    builds are noindex by design, which would fail Lighthouse's SEO audit).
 * 2. Serves dist/ locally, Netlify-style.
 * 3. Lighthouse CI on every page with the thresholds in lighthouserc.cjs.
 * 4. axe-core with WCAG 2.0/2.1/2.2 A and AA rules, at desktop and phone sizes,
 *    in the light and the dark color scheme (visual-identity design D12).
 * 5. Interaction checks per page: keyboard and skip link and visible focus (in
 *    both color schemes), 320px reflow, reduced motion, and rendering with
 *    JavaScript disabled. Lighthouse stays light-only: the scheme doesn't
 *    change load performance.
 * 6. Rebuilds dist/ in normal (preview) mode so an indexable build is not
 *    left behind.
 *
 * Writes .lighthouseci/audit-summary.json and exits 1 on any failure.
 */
import { spawn, spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'
import { serveDist } from './lib/static-server.mjs'

const ORIGIN = 'https://elevationcode.works'
const PORT = 4400
const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22a',
  'wcag22aa'
]
const SCHEMES = ['light', 'dark']
const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

/**
 * Runs a command without blocking the event loop. Required while the local
 * server is up: a blocking spawn would stop it from answering Lighthouse.
 */
function runAsync(cmd, args, env = {}) {
  return new Promise((resolve) => {
    spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } }).on(
      'close',
      (code) => resolve(code ?? 1)
    )
  })
}

/** Blocking run, only for steps while the local server is not running. */
function run(cmd, args, env = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env }
  })
  return result.status ?? 1
}

// 1. Production-mode build.
if (run('npm', ['run', 'build'], { CONTEXT: 'production', URL: ORIGIN })) {
  console.error('Production-mode build failed.')
  process.exit(1)
}

// 2. Serve it.
const server = await serveDist('dist', PORT)
const local = (url) => url.replace(ORIGIN, server.url)
const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8')
const pages = [
  ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => local(m[1])),
  `${server.url}/contact/thanks/`,
  `${server.url}/404.html`
]
let failed = false
const summary = { lighthouse: [], axe: [], interaction: [] }

try {
  // 3. Lighthouse.
  rmSync('.lighthouseci', { recursive: true, force: true })
  const urlArgs = pages.map((u) => `--url=${u}`)
  if (
    await runAsync('npx', [
      'lhci',
      'collect',
      '--config=lighthouserc.cjs',
      ...urlArgs
    ])
  )
    failed = true
  if (await runAsync('npx', ['lhci', 'assert', '--config=lighthouserc.cjs']))
    failed = true
  await runAsync('npx', ['lhci', 'upload', '--config=lighthouserc.cjs'])
  for (const file of readdirSync('.lighthouseci').filter((f) =>
    /^lhr-.*\.json$/.test(f)
  )) {
    const lhr = JSON.parse(readFileSync(`.lighthouseci/${file}`, 'utf8'))
    const cat = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100)
    const num = (k) => lhr.audits[k]?.numericValue ?? NaN
    summary.lighthouse.push({
      path: new URL(lhr.requestedUrl).pathname,
      performance: cat('performance'),
      accessibility: cat('accessibility'),
      bestPractices: cat('best-practices'),
      seo: cat('seo'),
      lcpMs: Math.round(num('largest-contentful-paint')),
      cls: Number(num('cumulative-layout-shift').toFixed(3)),
      tbtMs: Math.round(num('total-blocking-time'))
    })
  }

  const browser = await chromium.launch({ channel: 'chrome' })
  try {
    // 4. axe at two sizes, in both color schemes.
    for (const colorScheme of SCHEMES)
      for (const viewport of [
        { width: 1280, height: 800 },
        { width: 390, height: 844 }
      ]) {
        const ctx = await browser.newContext({ viewport, colorScheme })
        const page = await ctx.newPage()
        for (const url of pages) {
          await page.goto(url)
          await page.addScriptTag({ content: axeSource })
          const violations = await page.evaluate(async (tags) => {
            const r = await window.axe.run(document, {
              runOnly: { type: 'tag', values: tags }
            })
            return r.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length
            }))
          }, WCAG_TAGS)
          summary.axe.push({
            path: new URL(url).pathname,
            viewport: `${viewport.width}x${viewport.height}`,
            scheme: colorScheme,
            violations
          })
          if (violations.length) failed = true
        }
        await ctx.close()
      }

    // 5. Interaction checks.
    for (const url of pages) {
      const path = new URL(url).pathname
      const result = { path }

      // Keyboard and visible focus, once per color scheme.
      for (const colorScheme of SCHEMES) {
        const kb = await browser.newContext({
          viewport: { width: 1280, height: 800 },
          colorScheme
        })
        const page = await kb.newPage()
        await page.goto(url)
        // Tag every focusable element so identical-looking ones (e.g. two
        // matching call-to-action links) are still counted separately.
        const tabbable = await page.evaluate(() => {
          const els = [
            ...document.querySelectorAll(
              'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ].filter((el) => !el.closest('[hidden]'))
          els.forEach((el, i) => el.setAttribute('data-audit-index', String(i)))
          return els.length
        })
        const seen = new Set()
        let allVisible = true
        let firstIsSkip = false
        for (let i = 0; i < tabbable; i++) {
          await page.keyboard.press('Tab')
          const info = await page.evaluate(() => {
            const el = document.activeElement
            const cs = getComputedStyle(el)
            return {
              key:
                el.getAttribute('data-audit-index') ??
                el.outerHTML.slice(0, 120),
              skip: el.classList.contains('skip-link'),
              visible:
                cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
            }
          })
          if (i === 0) firstIsSkip = info.skip
          seen.add(info.key)
          if (!info.visible) allVisible = false
        }
        await page.goto(url)
        await page.keyboard.press('Tab')
        await page.keyboard.press('Enter')
        const skipWorks = await page.evaluate(
          () => document.activeElement?.id === 'main'
        )
        result[`keyboard_${colorScheme}`] =
          firstIsSkip && skipWorks && seen.size === tabbable && allVisible
        result[`keyboardDetail_${colorScheme}`] = {
          tabbable,
          reached: seen.size,
          firstIsSkip,
          skipWorks,
          allVisible
        }
        await kb.close()
      }
      result.keyboard = SCHEMES.every((sc) => result[`keyboard_${sc}`])

      const narrow = await browser.newContext({
        viewport: { width: 320, height: 640 }
      })
      const np = await narrow.newPage()
      await np.goto(url)
      result.reflow320 = await np.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
      await narrow.close()

      const calm = await browser.newContext({ reducedMotion: 'reduce' })
      const cp = await calm.newPage()
      await cp.goto(url)
      result.reducedMotion = await cp.evaluate(
        () => document.getAnimations().length === 0
      )
      await calm.close()

      const nojs = await browser.newContext({ javaScriptEnabled: false })
      const jp = await nojs.newPage()
      await jp.goto(url)
      result.noJs =
        (await jp.locator('h1').count()) === 1 &&
        (await jp.locator('nav[aria-label="Primary"] a').count()) === 4 &&
        (await jp.locator('main').innerText()).trim().length > 0
      await nojs.close()

      if (
        !result.keyboard ||
        !result.reflow320 ||
        !result.reducedMotion ||
        !result.noJs
      )
        failed = true
      summary.interaction.push(result)
    }
  } finally {
    await browser.close()
  }
} finally {
  await server.close()
}

writeFileSync(
  '.lighthouseci/audit-summary.json',
  JSON.stringify(summary, null, 2)
)

console.log('\nLighthouse (mobile):')
console.table(summary.lighthouse.sort((a, b) => a.path.localeCompare(b.path)))
const axeFailures = summary.axe.filter((a) => a.violations.length)
console.log(
  axeFailures.length
    ? `axe: ${axeFailures.length} page/viewport/scheme combination(s) with violations`
    : `axe (WCAG 2.2 AA): no violations on ${summary.axe.length} page/viewport/scheme combinations`
)
for (const a of axeFailures)
  console.log(' ', a.path, a.viewport, a.scheme, JSON.stringify(a.violations))
console.log('\nInteraction checks:')
console.table(
  summary.interaction.map(
    ({
      path,
      keyboard_light,
      keyboard_dark,
      reflow320,
      reducedMotion,
      noJs
    }) => ({
      path,
      keyboardLight: keyboard_light,
      keyboardDark: keyboard_dark,
      reflow320,
      reducedMotion,
      noJs
    })
  )
)

// 6. Restore a normal (non-indexable) build.
run('npm', ['run', 'build'], { CONTEXT: '', URL: '' })

console.log(failed ? '\nAUDIT FAILED' : '\nAUDIT PASSED')
process.exit(failed ? 1 : 0)
