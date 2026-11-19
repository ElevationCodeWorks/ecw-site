/** Brand-guardrails rules on the structure of built pages. */
import type { HTMLElement } from 'node-html-parser'
import { parsePage, tagOf } from '../html.ts'
import type { Rule, Violation } from '../types.ts'

/** Elements a heading may contain. Anything else sets words apart. */
const HEADING_ALLOWED = new Set(['a', 'abbr', 'code', 'br'])

/** An inline SVG hidden from assistive technology, e.g. a decorative mark. */
const isHiddenSvg = (el: HTMLElement) =>
  tagOf(el) === 'svg' && el.getAttribute('aria-hidden') === 'true'

/** Elements inside a heading that aren't allowed there. */
function accentElements(heading: HTMLElement): HTMLElement[] {
  const found: HTMLElement[] = []
  const walk = (el: HTMLElement) => {
    for (const child of el.childNodes) {
      if (child.nodeType !== 1) continue
      const node = child as HTMLElement
      if (isHiddenSvg(node)) continue
      if (!HEADING_ALLOWED.has(tagOf(node))) found.push(node)
      walk(node)
    }
  }
  walk(heading)
  return found
}

/**
 * Headings may not set part of their text apart: no em, span, mark, strong
 * and the like. Links, abbreviations, code, line breaks and hidden SVGs are
 * allowed.
 */
export const headingAccents: Rule = (inputs) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    return page.root
      .querySelectorAll('h1, h2, h3, h4, h5, h6')
      .flatMap((heading): Violation[] => {
        const accents = accentElements(heading)
        if (!accents.length) return []
        const tags = [...new Set(accents.map((el) => `<${tagOf(el)}>`))]
        return [
          {
            rule: 'brand/heading-accent',
            file: page.file,
            line: page.lineOf(heading.range[0]),
            text: heading.outerHTML.replace(/\s+/g, ' ').slice(0, 120),
            message: `Headings may not set words apart; remove ${tags.join(', ')}. Only links, abbreviations, code, line breaks and hidden SVGs are allowed.`
          }
        ]
      })
  })

export const brandMarkupRules: Rule[] = [headingAccents]
