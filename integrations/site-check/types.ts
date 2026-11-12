import type { SiteCheckConfig } from '../../site-check.config.ts'

/** One rule violation, reported as `file:line  rule  "text"`. */
export interface Violation {
  rule: string
  /** Project-relative path. */
  file: string
  line: number
  /** The offending text or value. */
  text: string
  /** Optional explanation of what to fix. */
  message?: string
}

export interface SourceFile {
  /** Project-relative path. */
  file: string
  content: string
}

/** A block of CSS from a .css file or an .astro <style> block. */
export interface CssSource {
  file: string
  css: string
  /** Number of lines in `file` before the CSS starts. */
  lineOffset: number
}

/** Everything the rules look at, loaded once per run. */
export interface CheckInputs {
  /** Built pages in dist/. */
  html: SourceFile[]
  /** Every text file in dist/ (HTML, XML, TXT, JSON, SVG, _headers). */
  distText: SourceFile[]
  /** CSS from src/ (.css files and .astro <style> blocks), tokens included. */
  css: CssSource[]
  /** Raw .astro sources from src/. */
  astro: SourceFile[]
  /** Brand vector sources (src/assets/brand/) and the built dist/icon.svg. */
  brandSvg: SourceFile[]
  /** Project-relative paths of every image file in src/ and public/. */
  imageFiles: string[]
  /** Every file under src/assets/fonts/, with its size in bytes. */
  fontFiles: { file: string; bytes: number }[]
  /** Built stylesheets in dist/. */
  distCss: SourceFile[]
  /** Built PNG files in dist/, with the format and size their header declares. */
  distImages: DistImage[]
  /** Project-relative path of the design tokens file. */
  tokensFile: string
  /** Contents of dist/_headers, or null when absent. */
  headers: string | null
  /** Page URLs listed in the built sitemap. */
  sitemapUrls: string[]
  /** Whether this build may be indexed (design D3). */
  indexable: boolean
  productionOrigin: string
}

export interface DistImage {
  /** Project-relative path, e.g. dist/og/home.png. */
  file: string
  /** "png" when the file has a PNG signature, else "unknown". */
  format: 'png' | 'unknown'
  width: number
  height: number
}

export type Rule = (inputs: CheckInputs, config: SiteCheckConfig) => Violation[]

export interface ExceptionEntry {
  rule: string
  file: string
  line: number
  reason: string
  /** Where the file came from. Required for identity/image-source entries. */
  source?: string
}
