import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isIndexable } from './env.ts'

test('SITE_ENV=production is indexable', () => {
  assert.equal(isIndexable({ SITE_ENV: 'production' }), true)
})

test('no SITE_ENV (local build) is not indexable', () => {
  assert.equal(isIndexable({}), false)
})

test('an empty SITE_ENV is not indexable', () => {
  assert.equal(isIndexable({ SITE_ENV: '' }), false)
})

test('any other SITE_ENV value is not indexable', () => {
  for (const value of ['preview', 'staging', 'Production', ' production']) {
    assert.equal(isIndexable({ SITE_ENV: value }), false, value)
  }
})
