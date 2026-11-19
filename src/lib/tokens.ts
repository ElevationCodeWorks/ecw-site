/**
 * Reads design token values from src/styles/tokens.css for build-time code
 * that can't use CSS variables: the social images and the site icons
 * (visual-identity design D7, D8). It uses the site check's CSS parser, so
 * both agree on what each token's value is in each color scheme.
 */
import {
  tokenDecls,
  tokenResolver
} from '../../integrations/site-check/tokens.ts'

export interface TokenValue {
  light: string
  dark: string
}

const TOKENS_FILE = 'src/styles/tokens.css'

/**
 * Every token in a tokens stylesheet, with its light and dark value and any
 * var() references resolved. A token with no dark override has its light
 * value in both.
 */
export function readTokens(css: string): Map<string, TokenValue> {
  const source = {
    css: [{ file: TOKENS_FILE, css, lineOffset: 0 }],
    tokensFile: TOKENS_FILE
  }
  const { valueOf } = tokenResolver(source)
  const names = [...new Set(tokenDecls(source).map((d) => d.prop))]
  return new Map(
    names.map((name) => [
      name,
      { light: valueOf(name, 'light') ?? '', dark: valueOf(name, 'dark') ?? '' }
    ])
  )
}

/** One token's values; throws when the token doesn't exist. */
export function token(
  tokens: Map<string, TokenValue>,
  name: string
): TokenValue {
  const value = tokens.get(name)
  if (!value) throw new Error(`Unknown design token ${name} in ${TOKENS_FILE}`)
  return value
}
