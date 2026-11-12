import { converter, differenceCiede2000, parse } from 'culori'
import type { Color } from 'culori'
import { declarations } from '../css.ts'
import type { Decl } from '../css.ts'
import type { CheckInputs, Rule, Violation } from '../types.ts'

const toOklch = converter('oklch')
const deltaE = differenceCiede2000()

interface ColorToken {
  decl: Decl
  color: Color
  l: number
  c: number
  /** Hue in degrees, or null for achromatic colors. */
  h: number | null
}

/** Custom properties in the tokens file whose value is a color. */
export function colorTokens(inputs: CheckInputs): ColorToken[] {
  const tokens = inputs.css.filter((s) => s.file === inputs.tokensFile)
  return declarations(tokens)
    .filter((d) => d.prop.startsWith('--'))
    .flatMap((decl) => {
      const color = parse(decl.value.trim())
      if (!color) return []
      const o = toOklch(color)
      return [{ decl, color, l: o.l, c: o.c, h: o.h ?? null }]
    })
}

function violation(t: ColorToken, rule: string, message: string): Violation {
  return {
    rule,
    file: t.decl.file,
    line: t.decl.line,
    text: `${t.decl.prop}: ${t.decl.value}`,
    message
  }
}

const inRange = (n: number | null, min: number, max: number) =>
  n !== null && n >= min && n <= max

export const bannedColors: Rule = (inputs, config) => {
  const refs = config.referenceColors.map((r) => ({
    ...r,
    color: parse(r.hex) as Color
  }))
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
    .filter((t) => config.backgroundTokenPattern.test(t.decl.prop))
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
  return colorTokens(inputs)
    .filter(
      (t) =>
        inRange(t.l, o.minL, o.maxL) &&
        t.c >= o.minC &&
        inRange(t.h, o.minH, o.maxH)
    )
    .map((t) =>
      violation(
        t,
        'brand/orange-accent',
        'Orange, rust, terracotta and amber accents are banned.'
      )
    )
}

export const brandColorRules: Rule[] = [
  bannedColors,
  warmOffWhite,
  orangeAccent
]
