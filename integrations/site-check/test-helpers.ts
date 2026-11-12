import { astroStyleBlocks } from './load.ts'
import type { CheckInputs, CssSource, SourceFile } from './types.ts'

/** Builds in-memory inputs for rule tests; everything empty unless overridden. */
export function inputs(overrides: Partial<CheckInputs> = {}): CheckInputs {
  return {
    html: [],
    distText: [],
    css: [],
    astro: [],
    brandSvg: [],
    imageFiles: [],
    fontFiles: [],
    distCss: [],
    distImages: [],
    tokensFile: 'src/styles/tokens.css',
    headers: null,
    sitemapUrls: [],
    indexable: false,
    productionOrigin: 'https://elevationcode.works',
    ...overrides
  }
}

/** A built page wrapped in a minimal document. */
export function page(body: string, file = 'dist/index.html'): SourceFile {
  return {
    file,
    content: `<!doctype html>\n<html lang="en">\n<head>\n<title>T</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`
  }
}

/** Inputs containing one built page (also counted as dist text). */
export function htmlInputs(body: string, file?: string): CheckInputs {
  const p = page(body, file)
  return inputs({ html: [p], distText: [p] })
}

/** Inputs containing one stylesheet. */
export function cssInputs(
  css: string,
  file = 'src/styles/base.css'
): CheckInputs {
  const source: CssSource = { file, css, lineOffset: 0 }
  return inputs({ css: [source] })
}

/** Inputs containing one .astro component (template + style blocks). */
export function astroInputs(
  content: string,
  file = 'src/components/X.astro'
): CheckInputs {
  const source: SourceFile = { file, content }
  return inputs({ astro: [source], css: astroStyleBlocks(source) })
}
