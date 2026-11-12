import { converter, parse } from 'culori'
import {
  cssAtRules,
  declarations,
  fontFamilies,
  splitTopLevel,
  subjectTag
} from '../css.ts'
import type { Decl } from '../css.ts'
import { matchesWithLines } from '../lines.ts'
import { SCHEMES, tokenResolver } from '../tokens.ts'
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

/**
 * The banned family a font family is, or extends: "inter tight" extends
 * "Inter". Matching is by whole words, so "Interstate" is not "Inter".
 */
export function bannedFamilyOf(
  family: string,
  banned: string[]
): string | undefined {
  const name = family.toLowerCase()
  return banned
    .filter(
      (b) => name === b.toLowerCase() || name.startsWith(`${b.toLowerCase()} `)
    )
    .sort((a, b) => b.length - a.length)[0]
}

function bannedMessage(family: string, banned: string): string {
  return family === banned.toLowerCase()
    ? `${banned} is on the banned typeface list.`
    : `"${family}" extends the banned typeface ${banned}.`
}

export const bannedFonts: Rule = (inputs, config) => {
  const inCss = declarations(inputs.css)
    .filter(isFontDecl)
    .flatMap((d) =>
      fontFamilies(d.value).flatMap((family) => {
        const banned = bannedFamilyOf(family, config.bannedFonts)
        return banned
          ? [violation(d, 'brand/banned-font', bannedMessage(family, banned))]
          : []
      })
    )

  // Web-font links in built pages, e.g. fonts.googleapis.com/css2?family=Inter
  const inLinks = inputs.html.flatMap((page) =>
    matchesWithLines(
      page.content,
      /fonts\.googleapis\.com\/css2?\?[^"'\s>]*/g
    ).flatMap((m) =>
      [...m.text.matchAll(/family=([^:&;"']+)/g)]
        .map((f) => decodeURIComponent(f[1].replace(/\+/g, ' ')).toLowerCase())
        .flatMap((family) => {
          const banned = bannedFamilyOf(family, config.bannedFonts)
          return banned
            ? [
                {
                  rule: 'brand/banned-font',
                  file: page.file,
                  line: m.line,
                  text: family,
                  message: bannedMessage(family, banned)
                }
              ]
            : []
        })
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

/** Length in px for px, em and rem values (1em = 16px); NaN otherwise. */
function toPx(token: string): number {
  if (/^-?0+(\.0+)?$/.test(token)) return 0
  const m = token.match(/^(-?\d*\.?\d+)(px|em|rem)$/i)
  if (!m) return NaN
  const n = Number(m[1])
  return m[2].toLowerCase() === 'px' ? n : n * 16
}

/**
 * Eyebrow labels: uppercase or all-small-caps text, or letter spacing above
 * the configured em limit. Token references are resolved first.
 */
export const eyebrowLabels: Rule = (inputs, config) => {
  const { resolve } = tokenResolver(inputs)
  return declarations(inputs.css)
    .filter((d) => !d.prop.startsWith('--'))
    .flatMap((d): Violation[] => {
      const value = resolve(d.value, 'light').toLowerCase()
      let reason = ''
      if (d.prop === 'text-transform' && /\buppercase\b/.test(value))
        reason = 'Uppercase text'
      else if (
        (d.prop === 'font-variant-caps' || d.prop === 'font-variant') &&
        /\ball-(?:small|petite)-caps\b/.test(value)
      )
        reason = 'All-small-caps text'
      else if (d.prop === 'letter-spacing') {
        const px = toPx(value.trim())
        if (px / 16 > config.maxLetterSpacingEm)
          reason = `Letter spacing above ${config.maxLetterSpacingEm}em`
      }
      return reason
        ? [
            violation(
              d,
              'brand/eyebrow',
              `${reason} is the mark of an eyebrow label (selector: ${d.selectors.join(', ') || '@' + d.atRule}). A wordmark needs an exception entry with a reason.`
            )
          ]
        : []
    })
}

const toOklch = converter('oklch')

/** Problems with one box-shadow value, or [] when it is small and neutral. */
export function shadowProblems(
  value: string,
  limits: { maxBlurPx: number; maxChroma: number }
): string[] {
  const problems: string[] = []
  for (const shadow of splitTopLevel(value, ',')) {
    if (shadow.trim().toLowerCase() === 'none') continue
    const parts = splitTopLevel(shadow, ' ').filter(
      (p) => p.toLowerCase() !== 'inset'
    )
    const lengths = parts.filter((p) => !Number.isNaN(toPx(p)))
    const colorText = parts.filter((p) => Number.isNaN(toPx(p))).join(' ')
    const blur = lengths.length >= 3 ? toPx(lengths[2]) : 0
    if (blur > limits.maxBlurPx)
      problems.push(`blur ${blur}px is above ${limits.maxBlurPx}px`)
    const color = colorText ? parse(colorText) : undefined
    if (color && toOklch(color).c >= limits.maxChroma)
      problems.push(`${colorText} is not a neutral gray`)
  }
  return problems
}

/**
 * Decorative backgrounds and glows: gradients, blur filters, text shadows,
 * and box shadows that are large or colored. Token references are resolved
 * in both color schemes.
 */
export const decorativeBackgrounds: Rule = (inputs, config) => {
  const { resolve } = tokenResolver(inputs)
  return declarations(inputs.css).flatMap((d): Violation[] => {
    const out: Violation[] = []
    const flag = (message: string) =>
      out.push(violation(d, 'brand/decorative-background', message))
    if (/-gradient\(/i.test(d.value)) flag('No gradients.')
    if (
      (d.prop === 'filter' || d.prop === '-webkit-filter') &&
      /\bblur\(/i.test(d.value)
    )
      flag('No blur filters.')
    if (d.prop === 'text-shadow' && d.value.trim().toLowerCase() !== 'none')
      flag('No text shadows.')
    if (d.prop === 'box-shadow' || d.prop.startsWith('--shadow')) {
      const problems = new Set(
        SCHEMES.flatMap((scheme) =>
          shadowProblems(resolve(d.value, scheme), config.shadow)
        )
      )
      if (problems.size) flag(`No glows: ${[...problems].join('; ')}.`)
    }
    return out
  })
}

/** Durations in ms of each transition in a transition or transition-duration value. */
function transitionDurations(prop: string, value: string): number[] {
  const ms = (t: string) => {
    const m = t.match(/^(-?\d*\.?\d+)(ms|s)$/i)
    return m ? Number(m[1]) * (m[2].toLowerCase() === 's' ? 1000 : 1) : NaN
  }
  return splitTopLevel(value, ',')
    .map((item) =>
      prop === 'transition-duration'
        ? ms(item)
        : (splitTopLevel(item, ' ')
            .map(ms)
            .find((n) => !Number.isNaN(n)) ?? NaN)
    )
    .filter((n) => !Number.isNaN(n))
}

/**
 * No keyframe or scroll-driven animation, and no transition longer than the
 * configured limit.
 */
export const animation: Rule = (inputs, config) => {
  const { resolve } = tokenResolver(inputs)
  const keyframes: Violation[] = cssAtRules(inputs.css)
    .filter((a) => /(^|-)keyframes$/.test(a.name))
    .map((a) => ({
      rule: 'brand/animation',
      file: a.file,
      line: a.line,
      text: `@${a.name} ${a.params}`,
      message: 'No keyframe animations.'
    }))
  const decls = declarations(inputs.css).flatMap((d): Violation[] => {
    const value = resolve(d.value, 'light').trim().toLowerCase()
    if (/^(?:-webkit-)?animation(?:-name)?$/.test(d.prop) && value !== 'none')
      return [violation(d, 'brand/animation', 'No keyframe animations.')]
    if (
      /^(?:animation-timeline|scroll-timeline(?:-name|-axis)?|view-timeline(?:-name|-axis|-inset)?|timeline-scope)$/.test(
        d.prop
      ) &&
      value !== 'none' &&
      value !== 'auto'
    )
      return [violation(d, 'brand/animation', 'No scroll-driven animations.')]
    if (d.prop === 'transition' || d.prop === 'transition-duration') {
      const longest = Math.max(0, ...transitionDurations(d.prop, value))
      if (longest > config.maxTransitionMs)
        return [
          violation(
            d,
            'brand/animation',
            `Transitions may last at most ${config.maxTransitionMs}ms; this one lasts ${longest}ms.`
          )
        ]
    }
    return []
  })
  return [...keyframes, ...decls]
}

export const brandStyleRules: Rule[] = [
  bannedFonts,
  portfolioFonts,
  monospaceOnlyForCode,
  gradientText,
  backdropBlur,
  noise,
  customCursor,
  pillRadius,
  emojiMarkers,
  eyebrowLabels,
  decorativeBackgrounds,
  animation
]
