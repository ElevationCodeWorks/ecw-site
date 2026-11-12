import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { astroInputs, cssInputs, htmlInputs, inputs } from '../test-helpers.ts'
import type { Rule } from '../types.ts'
import {
  backdropBlur,
  bannedFonts,
  customCursor,
  emojiMarkers,
  gradientText,
  monospaceOnlyForCode,
  noise,
  pillRadius,
  portfolioFonts
} from './brand-style.ts'

const count = (rule: Rule, css: string) => rule(cssInputs(css), config).length

test('banned fonts: flags Inter in a token stack, allows system-ui', () => {
  assert.equal(
    count(
      bannedFonts,
      ':root { --font-body: "Inter", system-ui, sans-serif; }'
    ),
    1
  )
  assert.equal(
    count(
      bannedFonts,
      ':root { --font-body: system-ui, -apple-system, sans-serif; }'
    ),
    0
  )
})

test('banned fonts: catches family variants and web-font links', () => {
  assert.equal(count(bannedFonts, 'h1 { font-family: "Inter Tight"; }'), 1)
  const page = htmlInputs(
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400">'
  )
  assert.equal(bannedFonts(page, config).length, 1)
})

test('monospace: flags an eyebrow label, allows code and pre', () => {
  assert.equal(
    count(monospaceOnlyForCode, '.eyebrow { font-family: var(--font-mono); }'),
    1
  )
  assert.equal(
    count(
      monospaceOnlyForCode,
      'code, pre code, kbd { font-family: var(--font-mono); } :root { --font-mono: ui-monospace, monospace; }'
    ),
    0
  )
})

test('gradient text: flags background-clip text', () => {
  assert.equal(
    count(
      gradientText,
      'h1 { -webkit-background-clip: text; background-clip: text; }'
    ),
    2
  )
  assert.equal(count(gradientText, 'div { background-clip: padding-box; }'), 0)
})

test('backdrop blur: flags frosted glass, allows none', () => {
  assert.equal(count(backdropBlur, 'nav { backdrop-filter: blur(12px); }'), 1)
  assert.equal(count(backdropBlur, 'nav { backdrop-filter: none; }'), 0)
})

test('noise: flags turbulence filters and noise images, in CSS and markup', () => {
  assert.equal(
    count(noise, 'body::before { background-image: url("/img/noise.png"); }'),
    1
  )
  const svg = inputs({
    distText: [
      {
        file: 'dist/index.html',
        content:
          '<svg><filter><feTurbulence baseFrequency="0.8"/></filter></svg>'
      }
    ]
  })
  assert.equal(noise(svg, config).length, 1)
  assert.equal(count(noise, 'body { background: var(--color-bg); }'), 0)
})

test('custom cursor: flags url() cursors, allows pointer', () => {
  assert.equal(count(customCursor, 'a { cursor: url(/c.svg), auto; }'), 1)
  assert.equal(count(customCursor, 'a { cursor: pointer; }'), 0)
})

test('pill radius: flags 9999px and 50%, allows the 2px token', () => {
  assert.equal(count(pillRadius, '.btn { border-radius: 9999px; }'), 1)
  assert.equal(count(pillRadius, '.avatar { border-radius: 50%; }'), 1)
  assert.equal(count(pillRadius, ':root { --radius: 2px; }'), 0)
})

test('emoji markers: flags emoji list-style, allows disc', () => {
  assert.equal(count(emojiMarkers, "ul > li { list-style-type: '✅ '; }"), 1)
  assert.equal(count(emojiMarkers, 'ul { list-style-type: disc; }'), 0)
})

test('style blocks in .astro files report the real file line', () => {
  const result = backdropBlur(
    astroInputs(
      '---\n---\n<nav />\n\n<style>\n  nav {\n    backdrop-filter: blur(4px);\n  }\n</style>\n'
    ),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].file, 'src/components/X.astro')
  assert.equal(result[0].line, 7)
})

test('portfolio: Condies is recorded with Chivo', () => {
  const condies = config.portfolioReferences.find(
    (p) => p.site === 'condies.fyi'
  )
  assert.ok(condies?.fonts.includes('Chivo'))
})

test('portfolio: a font stack with Chivo fails and names the site', () => {
  const result = portfolioFonts(
    cssInputs(":root { --font-body: 'Chivo', system-ui, sans-serif; }"),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'brand/portfolio-echo')
  assert.match(result[0].message ?? '', /condies\.fyi/)
})

test('portfolio: a variant such as Chivo Mono fails; an unrelated family passes', () => {
  assert.equal(
    portfolioFonts(
      cssInputs('code { font-family: "Chivo Mono", monospace; }'),
      config
    ).length,
    1
  )
  assert.deepEqual(
    portfolioFonts(
      cssInputs(":root { --font-body: 'Overpass', sans-serif; }"),
      config
    ),
    []
  )
})
