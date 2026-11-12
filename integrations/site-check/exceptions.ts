import type { ExceptionEntry, Violation } from './types.ts'

export const EXCEPTIONS_FILE = 'site-check.exceptions.json'

/** Rules whose exception entries must also record where the file came from. */
const NEEDS_SOURCE = new Set(['identity/image-source'])

const hasText = (s: unknown) => typeof s === 'string' && s.trim() !== ''

/** An entry that may waive a violation: it has a reason, and a source when required. */
const isComplete = (e: ExceptionEntry) =>
  hasText(e.reason) && (!NEEDS_SOURCE.has(e.rule) || hasText(e.source))

/**
 * Removes violations waived by an exception entry, and reports entries that are
 * invalid (no written reason) or stale (match no violation).
 */
export function applyExceptions(
  violations: Violation[],
  entries: ExceptionEntry[]
): Violation[] {
  const problems: Violation[] = []
  const used = new Set<number>()

  entries.forEach((entry, index) => {
    if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
      problems.push({
        rule: 'exceptions/missing-reason',
        file: EXCEPTIONS_FILE,
        line: index + 1,
        text: `${entry.rule} @ ${entry.file}:${entry.line}`,
        message: 'Every exception needs a written reason.'
      })
    } else if (NEEDS_SOURCE.has(entry.rule) && !hasText(entry.source)) {
      problems.push({
        rule: 'exceptions/missing-source',
        file: EXCEPTIONS_FILE,
        line: index + 1,
        text: `${entry.rule} @ ${entry.file}:${entry.line}`,
        message:
          'An image exception must record where the image came from in "source".'
      })
    }
  })

  const remaining = violations.filter((v) => {
    const index = entries.findIndex(
      (e) =>
        e.rule === v.rule &&
        e.file === v.file &&
        e.line === v.line &&
        isComplete(e)
    )
    if (index === -1) return true
    used.add(index)
    return false
  })

  entries.forEach((entry, index) => {
    if (isComplete(entry) && !used.has(index)) {
      problems.push({
        rule: 'exceptions/stale',
        file: EXCEPTIONS_FILE,
        line: index + 1,
        text: `${entry.rule} @ ${entry.file}:${entry.line}`,
        message: 'This exception matches nothing. Remove it.'
      })
    }
  })

  return [...remaining, ...problems]
}
