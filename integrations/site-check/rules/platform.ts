import { declarations } from '../css.ts'
import { parsePage } from '../html.ts'
import { lineIndex } from '../lines.ts'
import type { Rule, Violation } from '../types.ts'

const HEX = /#[0-9a-f]{3,8}\b/i
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i
const COLOR_PROPS =
  /^(?:color|background(?:-color)?|border(?:-[a-z]+)*|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|text-decoration(?:-color)?|caret-color|accent-color|column-rule(?:-color)?)$/
const NAMED_COLORS = new Set(
  (
    'black white red green blue yellow orange purple pink brown gray grey silver gold navy teal ' +
    'maroon olive lime aqua fuchsia cyan magenta indigo violet beige ivory tan coral salmon ' +
    'crimson khaki lavender plum orchid turquoise wheat linen snow azure mintcream honeydew ' +
    'seashell oldlace floralwhite ghostwhite whitesmoke gainsboro cornsilk'
  ).split(' ')
)
const ALLOWED_FONT_WORDS = /\b(?:inherit|initial|unset|revert|revert-layer)\b/g

function hasColorLiteral(prop: string, value: string): boolean {
  if (HEX.test(value) || COLOR_FUNCTION.test(value)) return true
  if (!COLOR_PROPS.test(prop)) return false
  const words = value
    .replace(/var\([^)]*\)/g, ' ')
    .toLowerCase()
    .match(/[a-z]+/g)
  return (words ?? []).some((w) => NAMED_COLORS.has(w))
}

function hasFontLiteral(prop: string, value: string): boolean {
  if (!(prop === 'font-family' || prop === 'font' || prop.startsWith('--font')))
    return false
  const rest = value
    .replace(/var\([^)]*\)/g, ' ')
    .replace(ALLOWED_FONT_WORDS, ' ')
  return /[a-z]/i.test(rest)
}

/** Template markup of an .astro file: frontmatter and <style> blocks blanked out. */
function templateOnly(content: string): string {
  const blank = (s: string) => s.replace(/[^\n]/g, ' ')
  return content
    .replace(/^---\n[\s\S]*?\n---/, blank)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, blank)
}

const INLINE_COLOR =
  /\b(?:style=["'][^"']*(?:#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\()[^"']*["']|(?:fill|stroke|stop-color|color|bgcolor)=["']\s*(?:#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|oklch)\())/gi

export const rawValues: Rule = (inputs) => {
  const inCss: Violation[] = declarations(
    inputs.css.filter((s) => s.file !== inputs.tokensFile)
  )
    .filter(
      (d) => hasColorLiteral(d.prop, d.value) || hasFontLiteral(d.prop, d.value)
    )
    .map((d) => ({
      rule: 'platform/raw-value',
      file: d.file,
      line: d.line,
      text: `${d.prop}: ${d.value}`,
      message: `Use a token from ${inputs.tokensFile} instead of a literal value.`
    }))

  const inMarkup: Violation[] = inputs.astro.flatMap((source) => {
    const template = templateOnly(source.content)
    const toLine = lineIndex(template)
    return [...template.matchAll(INLINE_COLOR)].map((m) => ({
      rule: 'platform/raw-value',
      file: source.file,
      line: toLine(m.index ?? 0),
      text: m[0],
      message: `Use a token from ${inputs.tokensFile} instead of a literal value.`
    }))
  })

  return [...inCss, ...inMarkup]
}

export const noClientScripts: Rule = (inputs) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    const scripts = page.root
      .querySelectorAll('script')
      .filter(
        (el) =>
          (el.getAttribute('type') ?? '').toLowerCase() !==
          'application/ld+json'
      )
      .map((el) => ({
        line: page.lineOf(el.range[0]),
        text: el.outerHTML.slice(0, 80)
      }))
    const handlers = page.root
      .querySelectorAll('*')
      .filter((el) =>
        Object.keys(el.attributes).some((a) => /^on[a-z]+$/i.test(a))
      )
      .map((el) => ({
        line: page.lineOf(el.range[0]),
        text: el.outerHTML.slice(0, 80)
      }))
    return [...scripts, ...handlers].map((s) => ({
      rule: 'platform/client-script',
      file: page.file,
      line: s.line,
      text: s.text,
      message:
        'Pages ship no client JavaScript. Only JSON-LD scripts are allowed.'
    }))
  })

export const platformRules: Rule[] = [rawValues, noClientScripts]
