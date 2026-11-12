/** Reads design token values from the tokens file, per color scheme. */
import { declarations } from './css.ts'
import type { Decl, Scheme } from './css.ts'
import type { CheckInputs } from './types.ts'

export const SCHEMES: Scheme[] = ['light', 'dark']

/** Custom-property declarations in the tokens file. */
export function tokenDecls(inputs: CheckInputs): Decl[] {
  return declarations(
    inputs.css.filter((s) => s.file === inputs.tokensFile)
  ).filter((d) => d.prop.startsWith('--'))
}

const VAR_REF = /var\(\s*(--[\w-]+)\s*(?:,([^()]*(?:\([^()]*\))?[^()]*))?\)/g

/**
 * Looks up tokens as the browser would apply them in a scheme: the dark
 * value when one exists, else the light value (the dark block only overrides
 * :root). The last declaration wins, as in CSS.
 */
export function tokenResolver(inputs: CheckInputs) {
  const decls = tokenDecls(inputs)
  const declFor = (name: string, scheme: Scheme): Decl | undefined => {
    const own = decls.filter((d) => d.prop === name)
    const inScheme = own.filter((d) => d.scheme === scheme)
    const light = own.filter((d) => d.scheme === 'light')
    return (inScheme.length ? inScheme : light).at(-1)
  }

  /** Replaces every var() in a value with the token's resolved value. */
  const resolve = (
    value: string,
    scheme: Scheme,
    seen: Set<string> = new Set()
  ): string =>
    value.replace(VAR_REF, (whole, name: string, fallback?: string) => {
      const decl = declFor(name, scheme)
      if (!decl || seen.has(name)) return fallback?.trim() ?? whole
      return resolve(decl.value.trim(), scheme, new Set([...seen, name]))
    })

  /** A token's value with var() references to other tokens resolved. */
  const valueOf = (name: string, scheme: Scheme): string | undefined => {
    const decl = declFor(name, scheme)
    return decl
      ? resolve(decl.value.trim(), scheme, new Set([name]))
      : undefined
  }

  return { declFor, valueOf, resolve }
}
