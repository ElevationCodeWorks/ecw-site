import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readTokens, token } from './tokens.ts'

const fixture = readTokens(
  readFileSync('integrations/site-check/fixtures/tokens.css', 'utf8')
)

test('reads light and dark values', () => {
  assert.deepEqual(token(fixture, '--color-bg'), {
    light: '#ffffff',
    dark: '#121212'
  })
})

test('a token without a dark override keeps its light value in both schemes', () => {
  assert.deepEqual(token(fixture, '--space-4'), { light: '1rem', dark: '1rem' })
})

test('var() references resolve per scheme, even to tokens declared later', () => {
  assert.deepEqual(token(fixture, '--color-focus'), {
    light: '#0b57d0',
    dark: '#8ab4f8'
  })
  assert.equal(
    token(fixture, '--font-heading').light,
    "'Overpass', 'Overpass Fallback', Arial, sans-serif"
  )
})

test('an unknown token throws and names it', () => {
  assert.throws(() => token(fixture, '--color-nope'), /--color-nope/)
})

test('the real tokens file has both values for every color token', () => {
  const real = readTokens(readFileSync('src/styles/tokens.css', 'utf8'))
  for (const [name, value] of real) {
    if (!name.startsWith('--color-')) continue
    assert.ok(value.light && value.dark, name)
  }
})
