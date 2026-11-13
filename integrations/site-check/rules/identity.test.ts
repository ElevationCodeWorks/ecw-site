import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { checkInputs } from '../runner.ts'
import { cssInputs, htmlInputs, inputs, page } from '../test-helpers.ts'
import {
  contrastPairs,
  fontBudget,
  fontHosts,
  fontLicense,
  imageSources,
  schemeParity,
  symbolPlainVector
} from './identity.ts'

const TOKENS = 'src/styles/tokens.css'
const DARK = (body: string) =>
  `@media (prefers-color-scheme: dark) { :root { ${body} } }`
const tokens = (css: string) => cssInputs(css, TOKENS)

test('scheme parity: a token with no dark value fails and names it', () => {
  const result = schemeParity(
    tokens(
      `:root { --color-bg: #ffffff; --color-text: #111111; }\n${DARK('--color-bg: #121212;')}`
    ),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'identity/scheme-parity')
  assert.match(result[0].message ?? '', /--color-text has no dark-scheme value/)
})

test('scheme parity: a dark-only token fails and names it', () => {
  const result = schemeParity(
    tokens(
      `:root { --color-bg: #ffffff; }\n${DARK('--color-bg: #121212; --color-glow: #333333;')}`
    ),
    config
  )
  assert.equal(result.length, 1)
  assert.match(
    result[0].message ?? '',
    /--color-glow has no light-scheme value/
  )
})

test('scheme parity: tokens with both values pass, and non-color tokens are ignored', () => {
  const result = schemeParity(
    tokens(
      `:root { --color-bg: #ffffff; --color-focus: #0b57d0; --space-1: 0.25rem; }\n${DARK('--color-bg: #121212; --color-focus: var(--color-link);')}`
    ),
    config
  )
  assert.deepEqual(result, [])
})

test('scheme parity: the real tokens file passes', () => {
  const input = tokens(readFileSync(TOKENS, 'utf8'))
  assert.deepEqual(schemeParity(input, config), [])
})

const pairConfig = (pairs: { fg: string; bg: string; min: number }[]) => ({
  ...config,
  contrastPairs: pairs
})

test('contrast: a failing pair names both tokens, the scheme, the ratio and the minimum', () => {
  const input = tokens(
    `:root { --color-bg: #ffffff; --color-text: #111111; }\n${DARK('--color-bg: #121212; --color-text: #333333;')}`
  )
  const result = contrastPairs(
    input,
    pairConfig([{ fg: '--color-text', bg: '--color-bg', min: 4.5 }])
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'identity/contrast')
  assert.match(
    result[0].message ?? '',
    /^dark scheme: --color-text on --color-bg is 1\.\d\d:1; it needs at least 4\.5:1\.$/
  )
  assert.equal(result[0].line, 2)
})

test('contrast: the dark scheme inherits light values it does not override', () => {
  const input = tokens(
    `:root { --color-bg: #ffffff; --color-muted: #858585; }\n${DARK('--color-bg: #121212;')}`
  )
  const result = contrastPairs(
    input,
    pairConfig([{ fg: '--color-muted', bg: '--color-bg', min: 4.5 }])
  )
  // #858585 is 5.08:1 on #121212 but only 3.69:1 on white.
  assert.deepEqual(
    result.map((v) => v.message?.split(':')[0]),
    ['light scheme']
  )
})

test('contrast: var() references are resolved in each scheme', () => {
  const input = tokens(
    `:root { --color-bg: #ffffff; --color-link: #0b57d0; --color-focus: var(--color-link); }\n${DARK('--color-bg: #121212; --color-link: #0b57d0;')}`
  )
  const result = contrastPairs(
    input,
    pairConfig([{ fg: '--color-focus', bg: '--color-bg', min: 3 }])
  )
  assert.equal(result.length, 1)
  assert.match(result[0].message ?? '', /^dark scheme: --color-focus/)
})

test('contrast: a pair naming a missing token fails', () => {
  const result = contrastPairs(
    tokens(':root { --color-bg: #ffffff; }'),
    pairConfig([{ fg: '--color-nope', bg: '--color-bg', min: 3 }])
  )
  assert.equal(result.length, 2)
  assert.match(result[0].message ?? '', /--color-nope has no color value/)
})

test('contrast: the placeholder tokens pass every configured pair in both schemes', () => {
  const input = tokens(readFileSync(TOKENS, 'utf8'))
  assert.deepEqual(contrastPairs(input, config), [])
})

test('image sources: a stray PNG fails and names the file', () => {
  const result = imageSources(
    inputs({ imageFiles: ['src/assets/hero-blob.png'] }),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'identity/image-source')
  assert.equal(result[0].file, 'src/assets/hero-blob.png')
})

test('image sources: images in public/ and stray vectors fail', () => {
  const result = imageSources(
    inputs({
      imageFiles: [
        'public/favicon.png',
        'public/logo.svg',
        'src/assets/illustration.svg'
      ]
    }),
    config
  )
  assert.equal(result.length, 3)
})

test('image sources: work screenshots, founder photos and brand vectors pass', () => {
  assert.deepEqual(
    imageSources(
      inputs({
        imageFiles: [
          'src/assets/work/condies-desktop.png',
          'src/assets/founder.jpg',
          'src/assets/founder/portrait.webp',
          'src/assets/brand/symbol.svg',
          'src/assets/brand/options/b.svg'
        ]
      }),
      config
    ),
    []
  )
})

test('image sources: an exception with a source waives the image; one without fails', () => {
  const found = inputs({ imageFiles: ['src/assets/map.png'] })
  const entry = {
    rule: 'identity/image-source',
    file: 'src/assets/map.png',
    line: 1,
    reason: 'Route map drawn by the owner for a case study.'
  }
  const withSource = checkInputs(found, {
    rules: [imageSources],
    exceptions: [{ ...entry, source: 'Drawn by Tejen Shrestha, 2026.' }]
  })
  assert.deepEqual(withSource, [])
  const without = checkInputs(found, {
    rules: [imageSources],
    exceptions: [entry]
  })
  assert.deepEqual(without.map((v) => v.rule).sort(), [
    'exceptions/missing-source',
    'identity/image-source'
  ])
})

const face = (family: string, file: string, weight = '400') =>
  `@font-face { font-family: '${family}'; font-weight: ${weight}; font-display: swap; src: url('../assets/fonts/${file}') format('woff2'); }`
const fallbackFace = (family: string) =>
  `@font-face { font-family: '${family} Fallback'; src: local('Arial'); size-adjust: 101%; }`
const fontInputs = (css: string, files: [string, number][]) =>
  inputs({
    css: [{ file: TOKENS, css, lineOffset: 0 }],
    fontFiles: files.map(([file, bytes]) => ({ file, bytes }))
  })

test('font budget: two families in four files within 150 KB pass; fallback faces do not count', () => {
  const css = [
    face('Overpass', 'overpass/overpass-latin-wght-normal.woff2', '100 900'),
    fallbackFace('Overpass'),
    face('Bitter', 'bitter/bitter-latin-400-normal.woff2'),
    face('Bitter', 'bitter/bitter-latin-700-normal.woff2', '700'),
    fallbackFace('Bitter')
  ].join('\n')
  const result = fontBudget(
    fontInputs(css, [
      ['src/assets/fonts/overpass/overpass-latin-wght-normal.woff2', 40_000],
      ['src/assets/fonts/bitter/bitter-latin-400-normal.woff2', 30_000],
      ['src/assets/fonts/bitter/bitter-latin-700-normal.woff2', 30_000],
      ['src/assets/fonts/bitter/bitter-latin-400-normal.woff', 40_000]
    ]),
    config
  )
  assert.deepEqual(result, [])
})

test('font budget: a third family fails and states the count against the limit', () => {
  const css = ['a', 'b', 'c'].map((n) => face(n, `${n}/${n}.woff2`)).join('\n')
  const result = fontBudget(
    fontInputs(
      css,
      ['a', 'b', 'c'].map((n) => [`src/assets/fonts/${n}/${n}.woff2`, 1000])
    ),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'identity/font-budget')
  assert.equal(result[0].message, '3 web font families; the limit is 2.')
})

test('font budget: a fifth file fails', () => {
  const files = [1, 2, 3, 4, 5].map((n) => `a/a-${n}00.woff2`)
  const css = files
    .map((f, i) => face('A', f, String((i + 1) * 100)))
    .join('\n')
  const result = fontBudget(
    fontInputs(
      css,
      files.map((f) => [`src/assets/fonts/${f}`, 1000])
    ),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].message, '5 font files; the limit is 4.')
})

test('font budget: files over 150 KB in total fail and state the size', () => {
  const css = face('A', 'a/a-wght.woff2') + face('A', 'a/a-italic.woff2')
  const result = fontBudget(
    fontInputs(css, [
      ['src/assets/fonts/a/a-wght.woff2', 90 * 1024],
      ['src/assets/fonts/a/a-italic.woff2', 70 * 1024]
    ]),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(
    result[0].message,
    'Font files total 160.0 KB; the budget is 150 KB.'
  )
})

test('font budget: a missing file and a third preload fail', () => {
  const missing = fontBudget(fontInputs(face('A', 'a/a.woff2'), []), config)
  assert.match(missing[0].message ?? '', /does not exist/)
  const preload = (n: number) =>
    `<link rel="preload" href="/_astro/f${n}.woff2" as="font" type="font/woff2" crossorigin>`
  const result = fontBudget(
    htmlInputs([1, 2, 3].map(preload).join('\n')),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].message, '3 font preloads; the limit is 2.')
})

test('font license: font files without a license fail and name the family', () => {
  const result = fontLicense(
    inputs({
      fontFiles: [
        {
          file: 'src/assets/fonts/bitter/bitter-latin-400-normal.woff2',
          bytes: 1
        },
        { file: 'src/assets/fonts/bitter/SOURCE.txt', bytes: 1 }
      ]
    }),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'identity/font-license')
  assert.equal(result[0].text, 'bitter')
})

test('font license: a LICENSE or OFL.txt beside the files passes', () => {
  for (const license of ['LICENSE', 'OFL.txt']) {
    const result = fontLicense(
      inputs({
        fontFiles: [
          {
            file: 'src/assets/fonts/bitter/bitter-latin-400-normal.woff2',
            bytes: 1
          },
          { file: `src/assets/fonts/bitter/${license}`, bytes: 1 }
        ]
      }),
      config
    )
    assert.deepEqual(result, [], license)
  }
})

test('font hosts: a Google Fonts link and a third-party font URL fail', () => {
  const html = page(
    '<link rel="preconnect" href="https://fonts.gstatic.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter">'
  )
  const css = {
    file: 'dist/_astro/index.css',
    content:
      "@font-face{font-family:X;src:url(https://cdn.example.com/x.woff2) format('woff2')}"
  }
  const result = fontHosts(inputs({ html: [html], distCss: [css] }), config)
  assert.equal(result.length, 3)
  assert.ok(result.every((v) => v.rule === 'identity/font-host'))
})

test('font hosts: self-hosted fonts and ordinary external links pass', () => {
  const html = page(
    '<link rel="preload" href="/_astro/overpass.B1x2.woff2" as="font" crossorigin>\n<a href="https://condies.fyi/">Condies</a>\n<link rel="preload" href="https://elevationcode.works/_astro/a.woff2" as="font">'
  )
  const css = {
    file: 'dist/_astro/index.css',
    content:
      "@font-face{font-family:Overpass;src:url(/_astro/overpass.B1x2.woff2) format('woff2')}"
  }
  assert.deepEqual(
    fontHosts(inputs({ html: [html], distCss: [css] }), config),
    []
  )
})

const symbol = (body: string, file = 'src/assets/brand/symbol.svg') =>
  inputs({
    brandSvg: [
      {
        file,
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">\n${body}\n</svg>\n`
      }
    ]
  })

test('symbol: gradients, filters, patterns, images and text fail and name the file', () => {
  const cases = [
    '<defs><linearGradient id="g"><stop offset="0" /></linearGradient></defs>',
    '<defs><radialGradient id="g" /></defs>',
    '<filter id="f"><feGaussianBlur stdDeviation="2" /></filter>',
    '<pattern id="p" width="2" height="2" />',
    '<image href="data:image/png;base64,AAAA" width="16" height="16" />',
    '<text x="0" y="12">E</text>'
  ]
  for (const body of cases) {
    const result = symbolPlainVector(symbol(body), config)
    assert.ok(result.length >= 1, body)
    assert.equal(result[0].rule, 'identity/symbol-plain')
    assert.equal(result[0].file, 'src/assets/brand/symbol.svg')
    assert.equal(result[0].line, 2)
  }
})

test('symbol: a second fill color fails', () => {
  const result = symbolPlainVector(
    symbol(
      '<path fill="currentColor" d="M0 0h8v8H0z" />\n<path fill="#0b57d0" d="M8 8h8v8H8z" />'
    ),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].line, 3)
  assert.match(result[0].text, /#0b57d0/)
})

test('symbol: a colored stroke in a style attribute fails', () => {
  assert.equal(
    symbolPlainVector(
      symbol('<path style="stroke: #111111" d="M0 0h16v16H0z" />'),
      config
    ).length,
    1
  )
})

test('symbol: currentColor paths pass, including symbol options', () => {
  assert.deepEqual(
    symbolPlainVector(
      symbol(
        '<path fill="currentColor" d="M0 0h16v16H0z" />\n<path fill="none" stroke="currentColor" d="M2 2h4" />',
        'src/assets/brand/options/b.svg'
      ),
      config
    ),
    []
  )
})

test('symbol: the real symbol source passes', () => {
  const file = 'src/assets/brand/symbol.svg'
  assert.deepEqual(
    symbolPlainVector(
      inputs({ brandSvg: [{ file, content: readFileSync(file, 'utf8') }] }),
      config
    ),
    []
  )
})
