/**
 * Rules for the visual-identity spec: color schemes, contrast, fonts, the
 * logo symbol and imagery.
 */
import { parse, wcagContrast } from 'culori'
import type { Color } from 'culori'
import { declarations } from '../css.ts'
import type { Decl, Scheme } from '../css.ts'
import type { CheckInputs, Rule, Violation } from '../types.ts'
import { colorTokens } from './brand-color.ts'

const SCHEMES: Scheme[] = ['light', 'dark']

/** Custom-property declarations in the tokens file, by name and scheme. */
function tokenDecls(inputs: CheckInputs): Decl[] {
  return declarations(
    inputs.css.filter((s) => s.file === inputs.tokensFile)
  ).filter((d) => d.prop.startsWith('--'))
}

/**
 * Looks up a token's declaration as the browser would apply it in a scheme:
 * the dark value when one exists, else the light value (the dark block only
 * overrides :root). The last declaration wins, as in CSS.
 */
export function tokenResolver(inputs: CheckInputs) {
  const decls = tokenDecls(inputs)
  const declFor = (name: string, scheme: Scheme): Decl | undefined => {
    const own = decls.filter((d) => d.prop === name)
    const inScheme = own.filter((d) => d.scheme === scheme)
    const light = own.filter((d) => d.scheme === 'light')
    return (inScheme.length ? inScheme : light).at(-1)
  }
  /** The token's value with var() references to other tokens resolved. */
  const valueOf = (
    name: string,
    scheme: Scheme,
    seen: Set<string> = new Set()
  ): string | undefined => {
    const decl = declFor(name, scheme)
    if (!decl || seen.has(name)) return undefined
    seen.add(name)
    const ref = decl.value.trim().match(/^var\(\s*(--[\w-]+)\s*(?:,(.*))?\)$/)
    if (!ref) return decl.value.trim()
    return valueOf(ref[1], scheme, seen) ?? ref[2]?.trim()
  }
  return { declFor, valueOf }
}

/**
 * Every color token has a value in both schemes. A token counts as a color
 * token when any of its values is a color; the other scheme's value may be a
 * color or a reference to another token.
 */
export const schemeParity: Rule = (inputs) => {
  const decls = tokenDecls(inputs)
  const colorNames = new Set(colorTokens(inputs).map((t) => t.name))
  const out: Violation[] = []
  for (const name of colorNames) {
    const own = decls.filter((d) => d.prop === name)
    for (const scheme of SCHEMES) {
      if (own.some((d) => d.scheme === scheme)) continue
      const other = own[0]
      out.push({
        rule: 'identity/scheme-parity',
        file: other.file,
        line: other.line,
        text: `${name}: ${other.value}`,
        message: `${name} has no ${scheme}-scheme value. Declare it ${
          scheme === 'dark'
            ? 'inside @media (prefers-color-scheme: dark) { :root { … } }'
            : 'in :root'
        }.`
      })
    }
  }
  return out
}

/** Each configured token pair meets its contrast ratio in both schemes. */
export const contrastPairs: Rule = (inputs, config) => {
  const { declFor, valueOf } = tokenResolver(inputs)
  const out: Violation[] = []
  for (const pair of config.contrastPairs) {
    for (const scheme of SCHEMES) {
      const at = declFor(pair.fg, scheme) ?? declFor(pair.bg, scheme)
      const location = at
        ? { file: at.file, line: at.line }
        : { file: inputs.tokensFile, line: 1 }
      const fg = parse(valueOf(pair.fg, scheme) ?? '')
      const bg = parse(valueOf(pair.bg, scheme) ?? '')
      if (!fg || !bg) {
        const missing = !fg ? pair.fg : pair.bg
        out.push({
          rule: 'identity/contrast',
          ...location,
          text: `${pair.fg} on ${pair.bg}`,
          message: `${missing} has no color value in the ${scheme} scheme, so this contrast pair can't be measured.`
        })
        continue
      }
      const ratio = wcagContrast(fg as Color, bg as Color)
      if (ratio >= pair.min) continue
      out.push({
        rule: 'identity/contrast',
        ...location,
        text: `${pair.fg} on ${pair.bg}`,
        message: `${scheme} scheme: ${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1; it needs at least ${pair.min}:1.`
      })
    }
  }
  return out
}

export const identityRules: Rule[] = [schemeParity, contrastPairs]
