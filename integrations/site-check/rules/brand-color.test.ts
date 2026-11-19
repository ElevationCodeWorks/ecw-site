import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { cssInputs, inputs } from '../test-helpers.ts'
import {
  bannedColors,
  orangeAccent,
  portfolioColors,
  violetAccent,
  warmOffWhite
} from './brand-color.ts'

const TOKENS = 'src/styles/tokens.css'
const tokens = (body: string) => cssInputs(`:root { ${body} }`, TOKENS)

test('every reference color is flagged', () => {
  for (const ref of config.referenceColors) {
    const result = bannedColors(tokens(`--color-x: ${ref.hex};`), config)
    assert.equal(result.length, 1, `${ref.hex} should be flagged`)
  }
})

test('a near match to a reference color is flagged', () => {
  const result = bannedColors(tokens('--color-accent: #da7858;'), config)
  assert.equal(result.length, 1)
  assert.match(result[0].message ?? '', /Anthropic clay/)
})

test('pure white, near-black and the placeholder blue pass every color rule', () => {
  const input = tokens(
    '--color-bg: #ffffff; --color-text: #111111; --color-link: #0b57d0;'
  )
  for (const rule of [bannedColors, warmOffWhite, orangeAccent, violetAccent]) {
    assert.deepEqual(rule(input, config), [])
  }
})

test('warm off-white backgrounds are flagged; a cool white is not', () => {
  assert.equal(warmOffWhite(tokens('--color-bg: #fdfbf7;'), config).length, 1)
  assert.equal(warmOffWhite(tokens('--color-bg: #f7f9fc;'), config).length, 0)
})

test('orange and amber accents are flagged; red is not', () => {
  assert.equal(
    orangeAccent(tokens('--color-accent: #ff8800;'), config).length,
    1
  )
  assert.equal(
    orangeAccent(tokens('--color-accent: #f5a623;'), config).length,
    1
  )
  assert.equal(
    orangeAccent(tokens('--color-error: #b3261e;'), config).length,
    0
  )
})

test('the real tokens file passes every color rule', () => {
  const input = cssInputs(readFileSync(TOKENS, 'utf8'), TOKENS)
  for (const rule of [bannedColors, warmOffWhite, orangeAccent, violetAccent]) {
    assert.deepEqual(rule(input, config), [])
  }
})

const DARK = (body: string) =>
  `:root { --color-bg: #ffffff; }\n@media (prefers-color-scheme: dark) { :root { ${body} } }`

test('violet: the placeholder blue and blue-700 are not flagged', () => {
  for (const hex of ['#0b57d0', '#1d4ed8', '#8ab4f8']) {
    assert.deepEqual(
      violetAccent(tokens(`--color-link: ${hex};`), config),
      [],
      `${hex} should pass`
    )
  }
})

test('violet: indigo-500, violet-500 and fuchsia-500 are flagged', () => {
  for (const hex of ['#6366f1', '#8b5cf6', '#d946ef']) {
    const result = violetAccent(tokens(`--color-accent: ${hex};`), config)
    assert.equal(result.length, 1, `${hex} should be flagged`)
    assert.equal(result[0].rule, 'brand/violet')
  }
})

test('violet: a muted lavender gray below the chroma floor passes', () => {
  assert.deepEqual(violetAccent(tokens('--color-border: #d8d6de;'), config), [])
})

test('navy: a dark-scheme background at slate-900 fails and names the scheme', () => {
  const input = cssInputs(DARK('--color-bg: #0f172a;'), TOKENS)
  const result = bannedColors(input, config)
  assert.equal(result.length, 1)
  assert.match(result[0].message ?? '', /AI dark navy \(slate-900\)/)
  assert.match(result[0].message ?? '', /\(dark scheme\)$/)
  assert.equal(result[0].line, 2)
})

test('navy: every dark navy reference is flagged in the dark scheme', () => {
  for (const hex of ['#0F172A', '#020617', '#111827', '#1E293B']) {
    const input = cssInputs(DARK(`--color-bg: ${hex};`), TOKENS)
    assert.equal(bannedColors(input, config).length, 1, `${hex}`)
  }
})

test('icon files: a banned color in an SVG fails and names the file', () => {
  const svg = {
    file: 'src/assets/brand/symbol.svg',
    content:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">\n  <path fill="#8b5cf6" d="M0 0h16v16H0z"/>\n</svg>\n'
  }
  const result = [bannedColors, violetAccent].flatMap((rule) =>
    rule(inputs({ brandSvg: [svg] }), config)
  )
  assert.equal(result.length, 2)
  for (const v of result) {
    assert.equal(v.file, 'src/assets/brand/symbol.svg')
    assert.equal(v.line, 2)
  }
})

test('icon files: colors inside a generated icon style block are checked', () => {
  const icon = {
    file: 'dist/icon.svg',
    content:
      '<svg xmlns="http://www.w3.org/2000/svg"><style>path{fill:#111111}@media (prefers-color-scheme: dark){path{fill:#d97757}}</style><path d="M0 0h1v1z"/></svg>'
  }
  const result = bannedColors(inputs({ brandSvg: [icon] }), config)
  assert.equal(result.length, 1)
  assert.equal(result[0].file, 'dist/icon.svg')
  assert.match(result[0].message ?? '', /Anthropic clay/)
})

test('icon files: currentColor and neutral fills pass', () => {
  const svg = {
    file: 'src/assets/brand/symbol.svg',
    content:
      '<svg xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M0 0h1v1z"/><path fill="#111111" d="M0 0h1v1z"/></svg>'
  }
  const input = inputs({ brandSvg: [svg] })
  for (const rule of [bannedColors, orangeAccent, violetAccent]) {
    assert.deepEqual(rule(input, config), [])
  }
})

test('portfolio: a token matching a sampled portfolio color fails and names the site', () => {
  const result = portfolioColors(tokens('--color-accent: #1a3ade;'), config)
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'brand/portfolio-echo')
  assert.match(result[0].message ?? '', /uphillskico\.com's #1838E0/)
})

test('portfolio: every sampled color is caught in the dark scheme too', () => {
  for (const ref of config.portfolioReferences) {
    for (const hex of ref.colors) {
      const result = portfolioColors(
        cssInputs(DARK(`--color-accent: ${hex};`), TOKENS),
        config
      )
      assert.equal(result.length, 1, `${ref.site} ${hex}`)
      assert.match(
        result[0].message ?? '',
        new RegExp(ref.site.replace('.', '\\.'))
      )
    }
  }
})

test('portfolio: the real tokens file echoes no portfolio color', () => {
  const input = cssInputs(readFileSync(TOKENS, 'utf8'), TOKENS)
  assert.deepEqual(portfolioColors(input, config), [])
})
