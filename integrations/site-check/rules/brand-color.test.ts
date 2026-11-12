import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { cssInputs } from '../test-helpers.ts'
import { bannedColors, orangeAccent, warmOffWhite } from './brand-color.ts'

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
  for (const rule of [bannedColors, warmOffWhite, orangeAccent]) {
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
  for (const rule of [bannedColors, warmOffWhite, orangeAccent]) {
    assert.deepEqual(rule(input, config), [])
  }
})
