import { declarations, fontFamilies, subjectTag } from '../css.ts'
import type { Decl } from '../css.ts'
import { matchesWithLines } from '../lines.ts'
import type { Rule, Violation } from '../types.ts'

function violation(d: Decl, rule: string, message: string): Violation {
  return {
    rule,
    file: d.file,
    line: d.line,
    text: `${d.prop}: ${d.value}`,
    message
  }
}

const isFontDecl = (d: Decl) =>
  d.prop === 'font-family' || d.prop === 'font' || d.prop.startsWith('--font')

export const bannedFonts: Rule = (inputs, config) => {
  const banned = config.bannedFonts.map((f) => f.toLowerCase())
  const isBanned = (family: string) =>
    banned.some((b) => family === b || family.startsWith(`${b} `))

  const inCss = declarations(inputs.css)
    .filter(isFontDecl)
    .filter((d) => fontFamilies(d.value).some(isBanned))
    .map((d) =>
      violation(d, 'brand/banned-font', 'This typeface is on the banned list.')
    )

  // Web-font links in built pages, e.g. fonts.googleapis.com/css2?family=Inter
  const inLinks = inputs.html.flatMap((page) =>
    matchesWithLines(
      page.content,
      /fonts\.googleapis\.com\/css2?\?[^"'\s>]*/g
    ).flatMap((m) =>
      [...m.text.matchAll(/family=([^:&;"']+)/g)]
        .map((f) => decodeURIComponent(f[1].replace(/\+/g, ' ')).toLowerCase())
        .filter(isBanned)
        .map((family) => ({
          rule: 'brand/banned-font',
          file: page.file,
          line: m.line,
          text: family,
          message: 'This typeface is on the banned list.'
        }))
    )
  )
  return [...inCss, ...inLinks]
}

/** Styles may not use a portfolio site's typeface, or a variant of it. */
export const portfolioFonts: Rule = (inputs, config) =>
  declarations(inputs.css)
    .filter(isFontDecl)
    .flatMap((d) =>
      fontFamilies(d.value).flatMap((family) =>
        config.portfolioReferences
          .filter((p) =>
            p.fonts.some((f) => {
              const ref = f.toLowerCase()
              return family === ref || family.startsWith(`${ref} `)
            })
          )
          .map((p) =>
            violation(
              d,
              'brand/portfolio-echo',
              `"${family}" is a typeface of ${p.site}. The portfolio sites are not a style source.`
            )
          )
      )
    )

export const monospaceOnlyForCode: Rule = (inputs, config) =>
  declarations(inputs.css)
    .filter((d) => d.prop === 'font-family' || d.prop === 'font')
    .filter((d) =>
      config.monospaceMarkers.some((m) => d.value.toLowerCase().includes(m))
    )
    .filter((d) =>
      d.selectors.some(
        (s) => !config.monospaceAllowedTags.includes(subjectTag(s))
      )
    )
    .map((d) =>
      violation(
        d,
        'brand/monospace',
        `Monospace is only for ${config.monospaceAllowedTags.join(', ')} (selector: ${d.selectors.join(', ')}).`
      )
    )

export const gradientText: Rule = (inputs) =>
  declarations(inputs.css)
    .filter(
      (d) =>
        (d.prop === 'background-clip' ||
          d.prop === '-webkit-background-clip') &&
        /\btext\b/.test(d.value)
    )
    .map((d) => violation(d, 'brand/gradient-text', 'No gradient-filled text.'))

export const backdropBlur: Rule = (inputs) =>
  declarations(inputs.css)
    .filter(
      (d) =>
        (d.prop === 'backdrop-filter' ||
          d.prop === '-webkit-backdrop-filter') &&
        d.value.trim() !== 'none'
    )
    .map((d) => violation(d, 'brand/backdrop-blur', 'No backdrop blur.'))

export const noise: Rule = (inputs) => {
  const inCss = declarations(inputs.css)
    .filter(
      (d) =>
        /feTurbulence/i.test(d.value) ||
        /url\([^)]*(noise|grain)[^)]*\)/i.test(d.value)
    )
    .map((d) => violation(d, 'brand/noise', 'No grain or noise textures.'))
  const inMarkup = inputs.distText
    .filter((f) => f.file.endsWith('.html') || f.file.endsWith('.svg'))
    .flatMap((f) =>
      matchesWithLines(f.content, /<feTurbulence\b/gi).map((m) => ({
        rule: 'brand/noise',
        file: f.file,
        line: m.line,
        text: m.text,
        message: 'No grain or noise textures.'
      }))
    )
  return [...inCss, ...inMarkup]
}

export const customCursor: Rule = (inputs) =>
  declarations(inputs.css)
    .filter((d) => d.prop === 'cursor' && /url\(/i.test(d.value))
    .map((d) => violation(d, 'brand/custom-cursor', 'No custom cursors.'))

/** True when any length in a radius value is pill- or circle-sized. */
export function isPillRadius(
  value: string,
  limits: { minPx: number; minEm: number }
): boolean {
  if (/%|vmax|vmin|infinity/i.test(value)) return true
  for (const m of value.matchAll(/(-?\d*\.?\d+)(px|rem|em)\b/gi)) {
    const n = Number(m[1])
    const unit = m[2].toLowerCase()
    if (unit === 'px' && n >= limits.minPx) return true
    if ((unit === 'rem' || unit === 'em') && n >= limits.minEm) return true
  }
  return false
}

export const pillRadius: Rule = (inputs, config) =>
  declarations(inputs.css)
    .filter((d) => /radius/.test(d.prop))
    .filter((d) => isPillRadius(d.value, config.pillRadius))
    .map((d) =>
      violation(
        d,
        'brand/pill-radius',
        'No pill or circle radii. Waive with a reason if a circle is intended.'
      )
    )

export const emojiMarkers: Rule = (inputs, config) =>
  declarations(inputs.css)
    .filter(
      (d) =>
        (d.prop === 'list-style-type' ||
          d.prop === 'list-style' ||
          d.prop === 'content') &&
        config.emoji.test(d.value)
    )
    .map((d) => violation(d, 'brand/emoji', 'No emoji list markers or icons.'))

export const brandStyleRules: Rule[] = [
  bannedFonts,
  portfolioFonts,
  monospaceOnlyForCode,
  gradientText,
  backdropBlur,
  noise,
  customCursor,
  pillRadius,
  emojiMarkers
]
