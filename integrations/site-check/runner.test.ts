import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkInputs } from './runner.ts'
import { formatViolations } from './report.ts'
import { lineIndex } from './lines.ts'
import { inputs } from './test-helpers.ts'
import type { Rule } from './types.ts'

const alwaysFails: Rule = () => [
  { rule: 'test/always', file: 'dist/index.html', line: 3, text: 'bad' }
]
const neverFails: Rule = () => []

test('a violation is reported', () => {
  const result = checkInputs(inputs(), { rules: [alwaysFails] })
  assert.equal(result.length, 1)
  assert.deepEqual(formatViolations(result), [
    'dist/index.html:3  test/always  "bad"'
  ])
})

test('clean input passes', () => {
  assert.deepEqual(checkInputs(inputs(), { rules: [neverFails] }), [])
})

test('an exception with a reason waives the matching violation', () => {
  const result = checkInputs(inputs(), {
    rules: [alwaysFails],
    exceptions: [
      {
        rule: 'test/always',
        file: 'dist/index.html',
        line: 3,
        reason: 'Fixture.'
      }
    ]
  })
  assert.deepEqual(result, [])
})

test('an exception without a reason fails and waives nothing', () => {
  const result = checkInputs(inputs(), {
    rules: [alwaysFails],
    exceptions: [
      { rule: 'test/always', file: 'dist/index.html', line: 3, reason: ' ' }
    ]
  })
  assert.deepEqual(result.map((v) => v.rule).sort(), [
    'exceptions/missing-reason',
    'test/always'
  ])
})

test('a stale exception fails', () => {
  const result = checkInputs(inputs(), {
    rules: [neverFails],
    exceptions: [
      {
        rule: 'test/always',
        file: 'dist/index.html',
        line: 99,
        reason: 'Old.'
      }
    ]
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'exceptions/stale')
})

test('lineIndex maps offsets to 1-based lines', () => {
  const toLine = lineIndex('a\nbb\nccc')
  assert.equal(toLine(0), 1)
  assert.equal(toLine(2), 2)
  assert.equal(toLine(5), 3)
})
