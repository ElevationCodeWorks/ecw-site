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

export type Rule = (inputs: CheckInputs, config: SiteCheckConfig) => Violation[]

export interface ExceptionEntry {
  rule: string
  file: string
  line: number
  reason: string
}
