import type { ExceptionEntry, Violation } from './types.ts'

export const EXCEPTIONS_FILE = 'site-check.exceptions.json'

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
    }
  })

  const remaining = violations.filter((v) => {
    const index = entries.findIndex(
      (e) =>
        e.rule === v.rule &&
        e.file === v.file &&
        e.line === v.line &&
        typeof e.reason === 'string' &&
        e.reason.trim() !== ''
    )
    if (index === -1) return true
    used.add(index)
    return false
  })

  entries.forEach((entry, index) => {
    const hasReason =
      typeof entry.reason === 'string' && entry.reason.trim() !== ''
    if (hasReason && !used.has(index)) {
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
