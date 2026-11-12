import { test } from 'node:test'
import assert from 'node:assert/strict'
import { declarations } from './css.ts'
import { colorTokens } from './rules/brand-color.ts'
import { cssInputs } from './test-helpers.ts'

const TOKENS = 'src/styles/tokens.css'

test('declarations record their full at-rule ancestry, outermost first', () => {
  const css = `
@supports (display: grid) {
  @media (min-width: 40rem) {
    .a { color: var(--color-text); }
  }
}`
  const [decl] = declarations([{ file: 'x.css', css, lineOffset: 0 }])
  assert.deepEqual(decl.atRules, [
    { name: 'supports', params: '(display: grid)' },
    { name: 'media', params: '(min-width: 40rem)' }
  ])
  assert.equal(decl.atRule, null)
})

test('a token in a prefers-color-scheme: dark block is labeled dark', () => {
  const input = cssInputs(
    `:root { --color-bg: #ffffff; }
@media (prefers-color-scheme: dark) {
  :root { --color-bg: #121212; }
}`,
    TOKENS
  )
  const tokens = colorTokens(input)
  assert.deepEqual(
    tokens.map((t) => [t.name, t.scheme]),
    [
      ['--color-bg', 'light'],
      ['--color-bg', 'dark']
    ]
  )
})

test('a dark query combined with other conditions is still dark', () => {
  const input = cssInputs(
    `@media screen and (prefers-color-scheme:dark) { :root { --color-text: #eeeeee; } }`,
    TOKENS
  )
  assert.equal(colorTokens(input)[0].scheme, 'dark')
})

test('font weights and other bare numbers are not color tokens', () => {
  const input = cssInputs(
    `:root { --weight-normal: 400; --weight-bold: 700; --color-bg: #ffffff; --color-x: white; }`,
    TOKENS
  )
  assert.deepEqual(
    colorTokens(input).map((t) => t.name),
    ['--color-bg', '--color-x']
  )
})

test('a prefers-color-scheme: light block is labeled light', () => {
  const input = cssInputs(
    `@media (prefers-color-scheme: light) { :root { --color-text: #111111; } }`,
    TOKENS
  )
  assert.equal(colorTokens(input)[0].scheme, 'light')
})
