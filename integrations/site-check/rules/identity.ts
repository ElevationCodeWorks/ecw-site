/**
 * Rules for the visual-identity spec: color schemes, contrast, fonts, the
 * logo symbol and imagery.
 */
import { parse, wcagContrast } from 'culori'
import type { Color } from 'culori'
import { SCHEMES, tokenDecls, tokenResolver } from '../tokens.ts'
import type { Rule, Violation } from '../types.ts'
import { colorTokens } from './brand-color.ts'

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

const RASTER = /\.(?:png|jpe?g|webp|avif|gif|tiff?|bmp|heic|heif|ico)$/i

/** Why an image file is in the wrong place, or null when it's allowed. */
export function imagePlacementProblem(file: string): string | null {
  if (file.startsWith('public/'))
    return 'public/ holds no images. Generated images come from build endpoints; others belong under src/assets/.'
  if (RASTER.test(file)) {
    return file.startsWith('src/assets/work/') ||
      file.startsWith('src/assets/founder')
      ? null
      : 'Raster images are only work screenshots (src/assets/work/) or founder photos (src/assets/founder*).'
  }
  return file.startsWith('src/assets/brand/')
    ? null
    : 'Vector images are only hand-authored brand graphics under src/assets/brand/.'
}

/**
 * Imagery is real: work screenshots, founder photos, generated images and
 * hand-authored brand vectors. Anything else needs an exception entry that
 * records the image's source and the reason.
 */
export const imageSources: Rule = (inputs) =>
  inputs.imageFiles.flatMap((file): Violation[] => {
    const problem = imagePlacementProblem(file)
    return problem
      ? [
          {
            rule: 'identity/image-source',
            file,
            line: 1,
            text: file,
            message: `${problem} To keep it, add an exception entry with its "source" and "reason".`
          }
        ]
      : []
  })

export const identityRules: Rule[] = [schemeParity, contrastPairs, imageSources]
