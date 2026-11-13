import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isIndexable } from './env.ts'

const ORIGIN = 'https://elevationcode.works'

test('production context on the production host is indexable', () => {
  assert.equal(
    isIndexable(
      { CONTEXT: 'production', URL: 'https://elevationcode.works' },
      ORIGIN
    ),
    true
  )
})

test('production context on *.netlify.app is not indexable', () => {
  assert.equal(
    isIndexable(
      { CONTEXT: 'production', URL: 'https://ecw-site.netlify.app' },
      ORIGIN
    ),
    false
  )
})

test('branch deploy is not indexable', () => {
  assert.equal(
    isIndexable(
      { CONTEXT: 'branch-deploy', URL: 'https://elevationcode.works' },
      ORIGIN
    ),
    false
  )
})

test('deploy preview is not indexable', () => {
  assert.equal(
    isIndexable(
      { CONTEXT: 'deploy-preview', URL: 'https://elevationcode.works' },
      ORIGIN
    ),
    false
  )
})

test('no Netlify variables (local build) is not indexable', () => {
  assert.equal(isIndexable({}, ORIGIN), false)
})

test('a malformed URL is not indexable', () => {
  assert.equal(
    isIndexable({ CONTEXT: 'production', URL: 'not a url' }, ORIGIN),
    false
  )
})
