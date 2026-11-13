import { parse } from 'node-html-parser'
import type { HTMLElement, Node, TextNode } from 'node-html-parser'
import { lineIndex } from './lines.ts'
import type { SourceFile } from './types.ts'

const ELEMENT = 1
const TEXT = 3

/** Elements whose content is never visible copy. */
const NON_COPY = new Set([
  'head',
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'code',
  'pre',
  'kbd',
  'samp'
])

export interface ParsedPage {
  file: string
  root: HTMLElement
  lineOf: (offset: number) => number
}

export interface CopyText {
  text: string
  line: number
  /** Ancestor tag names, outermost first. */
  ancestors: string[]
}

export function parsePage(source: SourceFile): ParsedPage {
  return {
    file: source.file,
    root: parse(source.content, {
      comment: false,
      blockTextElements: {
        script: true,
        style: true,
        noscript: true,
        pre: true
      }
    }),
    lineOf: lineIndex(source.content)
  }
}

export function tagOf(node: Node): string {
  return node.nodeType === ELEMENT
    ? ((node as HTMLElement).rawTagName ?? '').toLowerCase()
    : ''
}

function isHidden(el: HTMLElement): boolean {
  return el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true'
}

/** Visible text nodes in document order, skipping non-copy and hidden elements. */
export function copyTextNodes(page: ParsedPage): CopyText[] {
  const out: CopyText[] = []
  const walk = (node: Node, ancestors: string[]) => {
    for (const child of node.childNodes) {
      if (child.nodeType === TEXT) {
        const text = (child as TextNode).text
        if (text.trim()) {
          out.push({ text, line: page.lineOf(child.range[0]), ancestors })
        }
      } else if (child.nodeType === ELEMENT) {
        const el = child as HTMLElement
        const tag = tagOf(el)
        if (NON_COPY.has(tag) || isHidden(el)) continue
        walk(el, [...ancestors, tag])
      }
    }
  }
  walk(page.root, [])
  return out
}

/** Elements matching a selector, with their trimmed text and line. */
export function elementsWithText(
  page: ParsedPage,
  selector: string
): { el: HTMLElement; text: string; line: number }[] {
  return page.root
    .querySelectorAll(selector)
    .filter((el) => !isHidden(el))
    .map((el) => ({
      el,
      text: el.text.replace(/\s+/g, ' ').trim(),
      line: page.lineOf(el.range[0])
    }))
}

/** Does this element sit inside one of the given tags? */
export function hasAncestor(el: HTMLElement, tags: string[]): boolean {
  let node = el.parentNode as HTMLElement | null
  while (node) {
    if (tags.includes(tagOf(node))) return true
    node = node.parentNode as HTMLElement | null
  }
  return false
}

/**
 * Copy that lives in attributes and metadata: the title, descriptions,
 * social preview text and image alt text.
 */
export function metadataCopy(page: ParsedPage): CopyText[] {
  const out: CopyText[] = []
  const push = (el: HTMLElement, text: string | undefined) => {
    if (text && text.trim()) {
      out.push({ text, line: page.lineOf(el.range[0]), ancestors: ['head'] })
    }
  }
  for (const el of page.root.querySelectorAll('title')) push(el, el.text)
  for (const el of page.root.querySelectorAll('meta')) {
    const key = el.getAttribute('name') ?? el.getAttribute('property') ?? ''
    if (
      /^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)$/.test(
        key
      )
    ) {
      push(el, el.getAttribute('content'))
    }
  }
  for (const el of page.root.querySelectorAll('img[alt]')) {
    push(el, el.getAttribute('alt'))
  }
  return out
}
