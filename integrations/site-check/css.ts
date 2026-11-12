import postcss from 'postcss'
import type { Declaration } from 'postcss'
import type { CssSource } from './types.ts'

export interface Decl {
  file: string
  line: number
  prop: string
  value: string
  /** Selectors of the enclosing rule, or [] for at-rules and the root. */
  selectors: string[]
  /** Name of the enclosing at-rule, if any (e.g. "font-face"). */
  atRule: string | null
}

/** Every declaration in every CSS source, with real file line numbers. */
export function declarations(sources: CssSource[]): Decl[] {
  return sources.flatMap((source) => {
    const out: Decl[] = []
    const root = postcss.parse(source.css)
    root.walkDecls((decl: Declaration) => {
      const parent = decl.parent
      const selectors =
        parent && parent.type === 'rule' && 'selectors' in parent
          ? (parent as unknown as { selectors: string[] }).selectors
          : []
      const atRule =
        parent && parent.type === 'atrule'
          ? (parent as unknown as { name: string }).name
          : null
      out.push({
        file: source.file,
        line: (decl.source?.start?.line ?? 1) + source.lineOffset,
        prop: decl.prop.toLowerCase(),
        value: decl.value,
        selectors,
        atRule
      })
    })
    return out
  })
}

/** Font family names in a font-family or font value, unquoted and lowercased. */
export function fontFamilies(value: string): string[] {
  return value
    .split(',')
    .map((part) =>
      part
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .trim()
        .toLowerCase()
    )
    .filter(Boolean)
}

/** The type selector of the last compound in a selector, e.g. "pre code" -> "code". */
export function subjectTag(selector: string): string {
  const compounds = selector
    .trim()
    .split(/\s*[>+~]\s*|\s+/)
    .filter(Boolean)
  const last = compounds[compounds.length - 1] ?? ''
  const match = last.match(/^[a-z][a-z0-9-]*/i)
  return match ? match[0].toLowerCase() : ''
}
