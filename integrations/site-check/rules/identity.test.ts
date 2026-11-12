import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { cssInputs } from '../test-helpers.ts'
import { contrastPairs, schemeParity } from './identity.ts'

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
