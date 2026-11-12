import postcss from 'postcss'
import type { AtRule, Container, Declaration } from 'postcss'
import type { CssSource } from './types.ts'

/** The color scheme a declaration applies to. */
export type Scheme = 'light' | 'dark'

export interface AtRuleInfo {
  /** Lowercased at-rule name, e.g. "media" or "font-face". */
  name: string
  /** The at-rule's prelude, e.g. "(prefers-color-scheme: dark)". */
  params: string
}

export interface Decl {
  file: string
  line: number
  prop: string
  value: string
  /** Selectors of the enclosing rule, or [] for at-rules and the root. */
  selectors: string[]
  /** Name of the enclosing at-rule, if any (e.g. "font-face"). */
  atRule: string | null
  /** Every enclosing at-rule, outermost first. */
  atRules: AtRuleInfo[]
  /** "dark" inside a prefers-color-scheme: dark media query, else "light". */
  scheme: Scheme
}

const DARK_QUERY = /prefers-color-scheme\s*:\s*dark/i

/** The color scheme selected by a chain of enclosing at-rules. */
export function schemeOf(atRules: AtRuleInfo[]): Scheme {
  return atRules.some((a) => a.name === 'media' && DARK_QUERY.test(a.params))
    ? 'dark'
    : 'light'
}

function ancestry(decl: Declaration): AtRuleInfo[] {
  const chain: AtRuleInfo[] = []
  let node: Container | undefined = decl.parent as Container | undefined
  while (node && node.type !== 'root') {
    if (node.type === 'atrule') {
      const at = node as AtRule
      chain.unshift({ name: at.name.toLowerCase(), params: at.params })
    }
    node = node.parent as Container | undefined
  }
  return chain
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
      const atRules = ancestry(decl)
      out.push({
        file: source.file,
        line: (decl.source?.start?.line ?? 1) + source.lineOffset,
        prop: decl.prop.toLowerCase(),
        value: decl.value,
        selectors,
        atRule,
        atRules,
        scheme: schemeOf(atRules)
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
