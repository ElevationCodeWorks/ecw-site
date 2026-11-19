import type { Violation } from './types.ts'

/** One line per violation: `file:line  rule  "text"  (message)`. */
export function formatViolations(violations: Violation[]): string[] {
  return [...violations]
    .sort(
      (a, b) =>
        a.file.localeCompare(b.file) ||
        a.line - b.line ||
        a.rule.localeCompare(b.rule)
    )
    .map((v) => {
      const text = v.text.replace(/\s+/g, ' ').trim().slice(0, 120)
      const message = v.message ? `  (${v.message})` : ''
      return `${v.file}:${v.line}  ${v.rule}  "${text}"${message}`
    })
}
