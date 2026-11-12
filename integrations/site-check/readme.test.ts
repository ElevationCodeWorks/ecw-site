import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkInputs } from './runner.ts'
import { inputs } from './test-helpers.ts'
import type { ExceptionEntry, Rule } from './types.ts'

/** The JSON block that follows "Example exception:" in the README. */
function documentedExample(): ExceptionEntry[] {
  const readme = readFileSync('README.md', 'utf8')
  const match = readme.match(/Example exception:\s*```json\n([\s\S]*?)```/)
  assert.ok(match, 'README must contain an "Example exception:" JSON block')
  return JSON.parse(match[1]) as ExceptionEntry[]
}

/** A rule producing exactly the violation the documented example waives. */
function ruleMatching(entry: ExceptionEntry): Rule {
  return () => [
    { rule: entry.rule, file: entry.file, line: entry.line, text: 'x' }
  ]
}

test('the documented example exception waives its violation', () => {
  const [entry] = documentedExample()
  assert.deepEqual(
    checkInputs(inputs(), {
      rules: [ruleMatching(entry)],
      exceptions: [entry]
    }),
    []
  )
})

test('removing the reason from the documented example makes the check fail', () => {
  const [entry] = documentedExample()
  const result = checkInputs(inputs(), {
    rules: [ruleMatching(entry)],
    exceptions: [{ ...entry, reason: '' }]
  })
  assert.ok(result.some((v) => v.rule === 'exceptions/missing-reason'))
  assert.ok(result.some((v) => v.rule === entry.rule))
})
