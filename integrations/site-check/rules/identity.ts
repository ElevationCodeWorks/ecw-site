/**
 * Rules for the visual-identity spec: color schemes, contrast, fonts, the
 * logo symbol and imagery.
 */
import path from 'node:path'
import { parse, wcagContrast } from 'culori'
import type { Color } from 'culori'
import { fontFaceRules } from '../css.ts'
import type { FontFaceRule } from '../css.ts'
import { parsePage } from '../html.ts'
import { matchesWithLines } from '../lines.ts'
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

const FONT_FILE = /\.(?:woff2?|ttf|otf|eot)$/i
const URL_IN_SRC = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi

/** The url() targets of a @font-face src, resolved to project paths. */
function faceFiles(face: FontFaceRule): string[] {
  return [...face.src.matchAll(URL_IN_SRC)].map((m) => {
    const url = m[1].trim()
    return /^(?:[a-z]+:)?\/\//i.test(url)
      ? url
      : path.posix.normalize(
          path.posix.join(path.posix.dirname(face.file), url)
        )
  })
}

/**
 * Web fonts stay within budget: at most N families and M files declared with
 * url() sources, at most K KB in total, and at most P font preloads per page.
 */
export const fontBudget: Rule = (inputs, config) => {
  const b = config.fontBudget
  const out: Violation[] = []
  const webFaces = fontFaceRules(inputs.css).filter(
    (f) => faceFiles(f).length > 0
  )
  const at = (face: FontFaceRule | undefined, text: string, message: string) =>
    out.push({
      rule: 'identity/font-budget',
      file: face?.file ?? inputs.tokensFile,
      line: face?.line ?? 1,
      text,
      message
    })

  const families = [...new Set(webFaces.map((f) => f.family.toLowerCase()))]
  if (families.length > b.maxFamilies)
    at(
      webFaces.find((f) => f.family.toLowerCase() === families[b.maxFamilies]),
      families.join(', '),
      `${families.length} web font families; the limit is ${b.maxFamilies}.`
    )

  const files = [...new Set(webFaces.flatMap(faceFiles))].filter(
    (f) => !/^(?:[a-z]+:)?\/\//i.test(f)
  )
  if (files.length > b.maxFiles)
    at(
      webFaces[0],
      files.join(', '),
      `${files.length} font files; the limit is ${b.maxFiles}.`
    )

  const sizes = new Map(inputs.fontFiles.map((f) => [f.file, f.bytes]))
  for (const file of files.filter((f) => !sizes.has(f)))
    at(
      webFaces.find((f) => faceFiles(f).includes(file)),
      file,
      'This font file does not exist under src/assets/fonts/.'
    )
  const totalKB = files.reduce((sum, f) => sum + (sizes.get(f) ?? 0), 0) / 1024
  if (totalKB > b.maxKB)
    at(
      webFaces[0],
      files.join(', '),
      `Font files total ${totalKB.toFixed(1)} KB; the budget is ${b.maxKB} KB.`
    )

  for (const source of inputs.html) {
    const page = parsePage(source)
    const preloads = page.root
      .querySelectorAll('link[rel="preload"]')
      .filter((el) => el.getAttribute('as') === 'font')
    if (preloads.length > b.maxPreloads)
      out.push({
        rule: 'identity/font-budget',
        file: page.file,
        line: page.lineOf(preloads[b.maxPreloads].range[0]),
        text: `${preloads.length} font preloads`,
        message: `${preloads.length} font preloads; the limit is ${b.maxPreloads}.`
      })
  }
  return out
}

const LICENSE_FILE = /^(?:LICEN[CS]E|OFL)(?:[.-][\w.-]*)?$/i

/** Every font family directory under src/assets/fonts/ keeps its license. */
export const fontLicense: Rule = (inputs) => {
  const dirs = new Map<string, string[]>()
  for (const { file } of inputs.fontFiles) {
    const dir = path.posix.dirname(file)
    dirs.set(dir, [...(dirs.get(dir) ?? []), path.posix.basename(file)])
  }
  return [...dirs.entries()]
    .filter(
      ([, names]) =>
        names.some((n) => FONT_FILE.test(n)) &&
        !names.some((n) => LICENSE_FILE.test(n))
    )
    .map(([dir, names]) => ({
      rule: 'identity/font-license',
      file: `${dir}/${names.find((n) => FONT_FILE.test(n))}`,
      line: 1,
      text: path.posix.basename(dir),
      message: `The ${path.posix.basename(dir)} font files have no license file beside them. Copy the family's OFL text in as LICENSE.`
    }))
}

/** No font is loaded from another origin. */
export const fontHosts: Rule = (inputs, config) => {
  const ownHost = new URL(inputs.productionOrigin).host
  const hosts = config.fontHosts.map((h) => h.replace(/\./g, '\\.')).join('|')
  const pattern = new RegExp(
    `(?:https?:)?//(?:(?:${hosts})[^"'\\s)>]*|[^"'\\s)>/]+/[^"'\\s)>]*\\.(?:woff2?|ttf|otf|eot)\\b)`,
    'gi'
  )
  return [...inputs.html, ...inputs.distCss].flatMap((file) =>
    matchesWithLines(file.content, pattern)
      .filter((m) => {
        const host = m.text.replace(/^(?:https?:)?\/\//i, '').split('/')[0]
        return host !== ownHost
      })
      .map((m) => ({
        rule: 'identity/font-host',
        file: file.file,
        line: m.line,
        text: m.text,
        message:
          'Fonts are self-hosted. Copy the files in with scripts/fonts.mjs instead of loading them from another origin.'
      }))
  )
}

export const identityRules: Rule[] = [
  schemeParity,
  contrastPairs,
  imageSources,
  fontBudget,
  fontLicense,
  fontHosts
]
