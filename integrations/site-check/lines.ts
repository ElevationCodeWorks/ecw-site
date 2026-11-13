/** Maps character offsets in a string to 1-based line numbers. */
export function lineIndex(content: string): (offset: number) => number {
  const starts = [0]
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') starts.push(i + 1)
  }
  return (offset: number) => {
    let lo = 0
    let hi = starts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (starts[mid] <= offset) lo = mid
      else hi = mid - 1
    }
    return lo + 1
  }
}

/** Every match of a global regex, with its 1-based line. */
export function matchesWithLines(
  content: string,
  pattern: RegExp
): { text: string; line: number }[] {
  const toLine = lineIndex(content)
  const flags = pattern.flags.includes('g')
    ? pattern.flags
    : pattern.flags + 'g'
  const re = new RegExp(pattern.source, flags)
  return [...content.matchAll(re)].map((m) => ({
    text: m[0],
    line: toLine(m.index ?? 0)
  }))
}
