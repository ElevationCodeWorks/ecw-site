import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
  portfolioFonts,
  eyebrowLabels,
  decorativeBackgrounds,
  animation
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

test('banned fonts: Inter Tight, Roboto Slab and DM Sans fail and name what they extend', () => {
  const tight = bannedFonts(
    cssInputs(':root { --font-heading: "Inter Tight", sans-serif; }'),
    config
  )
  assert.equal(tight.length, 1)
  assert.equal(
    tight[0].message,
    '"inter tight" extends the banned typeface Inter.'
  )
  const slab = bannedFonts(
    cssInputs('h2 { font-family: "Roboto Slab", serif; }'),
    config
  )
  assert.equal(
    slab[0].message,
    '"roboto slab" extends the banned typeface Roboto.'
  )
  const dm = bannedFonts(cssInputs(':root { --font-body: "DM Sans"; }'), config)
  assert.equal(dm[0].message, 'DM Sans is on the banned typeface list.')
})

test('banned fonts: every listed family is caught', () => {
  for (const family of config.bannedFonts) {
    assert.equal(
      count(bannedFonts, `:root { --font-body: '${family}', sans-serif; }`),
      1,
      family
    )
  }
})

test('banned fonts: Overpass, Archivo and Interstate pass', () => {
  for (const family of [
    'Overpass',
    'Archivo',
    'Archivo Narrow',
    'Interstate'
  ]) {
    assert.equal(
      count(bannedFonts, `:root { --font-body: '${family}', sans-serif; }`),
      0,
      family
    )
  }
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

const TOKENS = 'src/styles/tokens.css'
const withTokens = (tokens: string, css: string) =>
  inputs({
    css: [
      { file: TOKENS, css: tokens, lineOffset: 0 },
      { file: 'src/styles/base.css', css, lineOffset: 0 }
    ]
  })

test('eyebrow: uppercase fails and names the file, line and selector; capitalize passes', () => {
  const result = eyebrowLabels(
    cssInputs('.kicker {\n  text-transform: uppercase;\n}'),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'brand/eyebrow')
  assert.equal(result[0].file, 'src/styles/base.css')
  assert.equal(result[0].line, 2)
  assert.match(result[0].message ?? '', /selector: \.kicker/)
  assert.equal(count(eyebrowLabels, 'h2 { text-transform: capitalize; }'), 0)
})

test('eyebrow: all-small-caps and all-petite-caps fail; small-caps passes', () => {
  assert.equal(
    count(eyebrowLabels, '.l { font-variant-caps: all-small-caps; }'),
    1
  )
  assert.equal(count(eyebrowLabels, '.l { font-variant: all-petite-caps; }'), 1)
  assert.equal(
    count(eyebrowLabels, 'abbr { font-variant-caps: small-caps; }'),
    0
  )
})

test('eyebrow: letter spacing above 0.05em fails; 0.02em and normal pass', () => {
  assert.equal(count(eyebrowLabels, '.l { letter-spacing: 0.1em; }'), 1)
  assert.equal(count(eyebrowLabels, '.l { letter-spacing: 2px; }'), 1)
  assert.equal(count(eyebrowLabels, '.l { letter-spacing: 0.02em; }'), 0)
  assert.equal(count(eyebrowLabels, '.l { letter-spacing: 0.5px; }'), 0)
  assert.equal(count(eyebrowLabels, '.l { letter-spacing: normal; }'), 0)
  assert.equal(count(eyebrowLabels, 'h1 { letter-spacing: -0.02em; }'), 0)
})

test('eyebrow: letter spacing through a token is resolved', () => {
  const input = withTokens(
    ':root { --tracking-wide: 0.12em; }',
    '.l { letter-spacing: var(--tracking-wide); }'
  )
  assert.equal(eyebrowLabels(input, config).length, 1)
})

test('backgrounds: a radial-gradient blob fails', () => {
  assert.equal(
    count(
      decorativeBackgrounds,
      '.blob { background: radial-gradient(circle, #ffffff 0%, transparent 70%); }'
    ),
    1
  )
  assert.equal(
    count(
      decorativeBackgrounds,
      '.hero { background-image: linear-gradient(#fff, #eee); }'
    ),
    1
  )
})

test('backgrounds: a 0 0 40px violet glow fails', () => {
  const result = decorativeBackgrounds(
    cssInputs('.card { box-shadow: 0 0 40px #8b5cf6; }'),
    config
  )
  assert.equal(result.length, 1)
  assert.match(result[0].message ?? '', /blur 40px is above 24px/)
  assert.match(result[0].message ?? '', /#8b5cf6 is not a neutral gray/)
})

test('backgrounds: a small blue glow fails on color alone', () => {
  assert.equal(
    count(
      decorativeBackgrounds,
      '.b { box-shadow: 0 0 8px rgb(11 87 208 / 0.5); }'
    ),
    1
  )
})

test('backgrounds: 0 1px 2px in a neutral gray passes', () => {
  assert.equal(
    count(
      decorativeBackgrounds,
      '.card { box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); }'
    ),
    0
  )
  assert.equal(
    count(
      decorativeBackgrounds,
      '.card { box-shadow: inset 0 0 0 1px #6b6b6b, 0 2px 4px #0000001f; }'
    ),
    0
  )
})

test('backgrounds: shadows through tokens are resolved in both schemes', () => {
  const input = withTokens(
    ':root { --shadow: 0 1px 2px #0000001f; }\n@media (prefers-color-scheme: dark) { :root { --shadow: 0 0 30px #0b57d0; } }',
    '.card { box-shadow: var(--shadow); }'
  )
  const result = decorativeBackgrounds(input, config)
  assert.ok(result.some((v) => v.file === 'src/styles/base.css'))
})

test('backgrounds: blur filters and text shadows fail; text-shadow: none passes', () => {
  assert.equal(count(decorativeBackgrounds, '.g { filter: blur(60px); }'), 1)
  assert.equal(
    count(decorativeBackgrounds, 'h1 { text-shadow: 0 0 1px #000; }'),
    1
  )
  assert.equal(count(decorativeBackgrounds, 'h1 { text-shadow: none; }'), 0)
})

test('animation: a fade-up keyframe fails', () => {
  const css =
    '@keyframes fade-up {\n  from { opacity: 0; transform: translateY(1rem); }\n  to { opacity: 1; }\n}\n.hero { animation: fade-up 600ms ease-out; }'
  const result = animation(cssInputs(css), config)
  assert.equal(result.length, 2)
  assert.ok(result.every((v) => v.rule === 'brand/animation'))
  assert.equal(result[0].text, '@keyframes fade-up')
})

test('animation: animation-timeline: view() fails', () => {
  assert.equal(count(animation, '.reveal { animation-timeline: view(); }'), 1)
  assert.equal(count(animation, '.reveal { view-timeline-name: --reveal; }'), 1)
})

test('animation: a 150ms color transition passes; 400ms fails', () => {
  assert.equal(count(animation, 'a { transition: color 150ms ease; }'), 0)
  assert.equal(count(animation, 'a { transition: color 150ms ease 500ms; }'), 0)
  assert.equal(count(animation, 'a { transition: color 0.4s ease; }'), 1)
  assert.equal(count(animation, 'a { transition-duration: 100ms, 300ms; }'), 1)
})

test('animation: the reduced-motion reset in base.css passes', () => {
  const css = readFileSync('src/styles/base.css', 'utf8')
  assert.deepEqual(animation(cssInputs(css), config), [])
})
