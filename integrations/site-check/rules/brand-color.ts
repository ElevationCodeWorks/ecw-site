import { converter, differenceCiede2000, parse } from 'culori'
import type { Color } from 'culori'
import { declarations } from '../css.ts'
import type { Decl, Scheme } from '../css.ts'
import { matchesWithLines } from '../lines.ts'
import type { CheckInputs, Rule, Violation } from '../types.ts'

const toOklch = converter('oklch')
const deltaE = differenceCiede2000()

/** A color found in the tokens or in a brand SVG, with where it came from. */
interface ColorSample {
  file: string
  line: number
  /** What to show in the report, e.g. "--color-bg: #fff" or "fill="#fff"". */
  text: string
  /** The scheme of a token value; null for colors in SVG files. */
  scheme: Scheme | null
  color: Color
  l: number
  c: number
  /** Hue in degrees, or null for achromatic colors. */
  h: number | null
}

export interface ColorToken extends ColorSample {
  decl: Decl
  /** Token name, e.g. "--color-bg". */
  name: string
  scheme: Scheme
}

/**
 * True when a value is written as a color: a hex code, a color function or a
 * named color. culori alone also reads bare digits such as a font weight of
 * "400" as hex.
 */
function looksLikeColor(value: string): boolean {
  return /^(?:#[0-9a-f]{3,8}|[a-z-]+\(.*\)|[a-z]+)$/i.test(value)
}

function measure(color: Color) {
  const o = toOklch(color)
  return { l: o.l, c: o.c, h: o.h ?? null }
}

/** Custom properties in the tokens file whose value is a color. */
export function colorTokens(inputs: CheckInputs): ColorToken[] {
  const tokens = inputs.css.filter((s) => s.file === inputs.tokensFile)
  return declarations(tokens)
    .filter((d) => d.prop.startsWith('--'))
    .flatMap((decl) => {
      const value = decl.value.trim()
      if (!looksLikeColor(value)) return []
      const color = parse(value)
      if (!color) return []
      return [
        {
          decl,
          name: decl.prop,
          scheme: decl.scheme,
          file: decl.file,
          line: decl.line,
          text: `${decl.prop}: ${decl.value}`,
          color,
          ...measure(color)
        }
      ]
    })
}

/** Literal colors in brand SVG files: hex codes and color functions. */
const SVG_COLOR =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/gi

/** Every literal color in the brand SVG files (the symbol and the icon). */
export function svgColors(inputs: CheckInputs): ColorSample[] {
  return inputs.brandSvg.flatMap((file) =>
    matchesWithLines(file.content, SVG_COLOR).flatMap((m) => {
      const color = parse(m.text)
      if (!color) return []
      return [
        {
          file: file.file,
          line: m.line,
          text: m.text,
          scheme: null,
          color,
          ...measure(color)
        }
      ]
    })
  )
}

const allColors = (inputs: CheckInputs): ColorSample[] => [
  ...colorTokens(inputs),
  ...svgColors(inputs)
]

function violation(s: ColorSample, rule: string, message: string): Violation {
  return {
    rule,
    file: s.file,
    line: s.line,
    text: s.text,
    message: s.scheme === 'dark' ? `${message} (dark scheme)` : message
  }
}

const inRange = (n: number | null, min: number, max: number) =>
  n !== null && n >= min && n <= max

export const bannedColors: Rule = (inputs, config) => {
  const refs = config.referenceColors.map((r) => ({
    ...r,
    color: parse(r.hex) as Color
  }))
  return allColors(inputs)
    .filter((s) => s.c >= config.colorMatch.neutralChroma)
    .flatMap((s) => {
      const nearest = refs
        .map((r) => ({ r, d: deltaE(s.color, r.color) }))
        .sort((a, b) => a.d - b.d)[0]
      return nearest && nearest.d < config.colorMatch.deltaE
        ? [
            violation(
              s,
              'brand/banned-color',
              `Too close to ${nearest.r.label} ${nearest.r.hex} (CIEDE2000 ${nearest.d.toFixed(1)}).`
            )
          ]
        : []
    })
}

export const warmOffWhite: Rule = (inputs, config) => {
  const w = config.warmOffWhite
  return colorTokens(inputs)
    .filter((t) => config.backgroundTokenPattern.test(t.name))
    .filter(
      (t) =>
        t.l > w.minL &&
        inRange(t.c, w.minC, w.maxC) &&
        inRange(t.h, w.minH, w.maxH)
    )
    .map((t) =>
      violation(
        t,
        'brand/warm-off-white',
        'Warm off-white backgrounds are banned. Use a pure or cool white.'
      )
    )
}

export const orangeAccent: Rule = (inputs, config) => {
  const o = config.orangeAccent
  return allColors(inputs)
    .filter(
      (s) =>
        inRange(s.l, o.minL, o.maxL) &&
        s.c >= o.minC &&
        inRange(s.h, o.minH, o.maxH)
    )
    .map((s) =>
      violation(
        s,
        'brand/orange-accent',
        'Orange, rust, terracotta and amber accents are banned.'
      )
    )
}

export const violetAccent: Rule = (inputs, config) => {
  const v = config.violetAccent
  return allColors(inputs)
    .filter((s) => s.c >= v.minC && inRange(s.h, v.minH, v.maxH))
    .map((s) =>
      violation(
        s,
        'brand/violet',
        'Violet, purple and magenta are banned as a category.'
      )
    )
}

/** Color tokens may not match a portfolio site's primary colors. */
export const portfolioColors: Rule = (inputs, config) => {
  const refs = config.portfolioReferences.flatMap((p) =>
    p.colors.map((hex) => ({ site: p.site, hex, color: parse(hex) as Color }))
  )
  return colorTokens(inputs)
    .filter((t) => t.c >= config.colorMatch.neutralChroma)
    .flatMap((t) => {
      const nearest = refs
        .map((r) => ({ r, d: deltaE(t.color, r.color) }))
        .sort((a, b) => a.d - b.d)[0]
      return nearest && nearest.d < config.colorMatch.deltaE
        ? [
            violation(
              t,
              'brand/portfolio-echo',
              `Echoes ${nearest.r.site}'s ${nearest.r.hex} (CIEDE2000 ${nearest.d.toFixed(1)}). The portfolio sites are not a style source.`
            )
          ]
        : []
    })
}

export const brandColorRules: Rule[] = [
  bannedColors,
  warmOffWhite,
  orangeAccent,
  violetAccent,
  portfolioColors
]
