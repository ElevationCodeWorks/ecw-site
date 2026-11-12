/**
 * Generates a metric-matched fallback @font-face for a web font (visual
 * identity design D6), so text renders at once in a local system face and the
 * swap to the web font barely moves anything:
 *
 *   node scripts/font-fallback.mjs <slug> [--fallback arial|georgia|courierNew|…]
 *
 * Reads the family's metrics from @capsizecss/metrics, or, when the family
 * isn't in that collection, from its committed WOFF file in
 * src/assets/fonts/<slug>/ with @capsizecss/unpack. The fallback system face
 * defaults to Arial for sans-serif families, Georgia for serifs and Courier
 * New for monospace. @capsizecss/core computes size-adjust and the ascent,
 * descent and line-gap overrides.
 *
 * Prints the @font-face rule and the font stack to paste into
 * src/styles/tokens.css, so every font name stays in the one tokens file.
 */
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { createFontStack } from '@capsizecss/core'
import { fontFamilyToCamelCase } from '@capsizecss/metrics'
import { fromFile } from '@capsizecss/unpack'

const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--'))
const i = args.indexOf('--fallback')
const fallbackName = i === -1 ? undefined : args[i + 1]

if (!slug) {
  console.error(
    'Usage: node scripts/font-fallback.mjs <slug> [--fallback arial]'
  )
  process.exit(2)
}

const loadMetrics = async (name) =>
  (await import(`@capsizecss/metrics/${name}`)).default

/** Metrics for the web font: from the collection, else from its WOFF file. */
async function webFontMetrics() {
  const camel = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
  try {
    return await loadMetrics(camel)
  } catch {
    const dir = path.join('src/assets/fonts', slug)
    const woff = readdirSync(dir).find((f) => /-400-normal\.woff$/.test(f))
    if (!woff)
      throw new Error(`No metrics for ${slug}, and no 400 WOFF in ${dir}`)
    return fromFile(path.join(dir, woff))
  }
}

const web = await webFontMetrics()
const defaultFallback =
  { serif: 'georgia', monospace: 'courierNew' }[web.category] ?? 'arial'
const fallback = await loadMetrics(
  fallbackName ? fontFamilyToCamelCase(fallbackName) : defaultFallback
)
const { fontFamily, fontFaces } = createFontStack([web, fallback])

console.log('Paste into src/styles/tokens.css (outside :root):\n')
console.log(fontFaces)
console.log(`\nThen use the stack in a font token, with a generic family last:

  ${fontFamily}, ${web.category === 'serif' ? 'serif' : web.category === 'monospace' ? 'monospace' : 'sans-serif'}
`)
