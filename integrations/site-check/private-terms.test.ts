import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  loadPrivateTerms,
  mask,
  PRIVATE_TERMS_ENV,
  PRIVATE_TERMS_FILE,
  termPattern
} from './private-terms.ts'

// Fixture terms only: the real list is private and never committed.

test('loads comma-separated terms from the environment variable', () => {
  const terms = loadPrivateTerms('/nonexistent', {
    [PRIVATE_TERMS_ENV]: 'Acme Bank, widget ,'
  })
  assert.equal(terms.length, 2)
  assert.deepEqual(
    terms.map((t) => t.label),
    ['private term #1', 'private term #2']
  )
})

test('loads terms from the git-ignored file when the variable is unset', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ecw-terms-'))
  try {
    writeFileSync(
      path.join(root, PRIVATE_TERMS_FILE),
      JSON.stringify({ employerTerms: ['Acme Bank'] })
    )
    assert.equal(loadPrivateTerms(root, {}).length, 1)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('fails loudly when no private terms are configured', () => {
  assert.throws(
    () => loadPrivateTerms('/nonexistent', {}),
    /needs its private employer terms/
  )
})

test('term patterns are whole-word, case-insensitive and allow plurals', () => {
  const p = termPattern('Acme Bank')
  assert.equal('An ACME   bank account'.match(p)?.length, 1)
  assert.equal('acme banks'.match(termPattern('Acme Bank'))?.length, 1)
  assert.equal('widgetry'.match(termPattern('widget')), null)
})

test('mask reveals nothing about the term', () => {
  assert.equal(mask('Acme Bank'), '[redacted]')
})
