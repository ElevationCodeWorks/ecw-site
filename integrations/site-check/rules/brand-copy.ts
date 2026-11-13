import {
  copyTextNodes,
  elementsWithText,
  metadataCopy,
  parsePage
} from '../html.ts'
import type { CopyText, ParsedPage } from '../html.ts'
import { matchesWithLines } from '../lines.ts'
import { mask } from '../private-terms.ts'
import type { Rule, Violation } from '../types.ts'

const BLOCKS =
  'p, li, h1, h2, h3, h4, h5, h6, a, button, label, legend, summary, figcaption, td, th, dt, dd, blockquote, q'

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Replaces allowed phrases with spaces (case-insensitive), keeping offsets. */
function blank(text: string, phrases: readonly string[]): string {
  return phrases.reduce(
    (out, phrase) =>
      out.replace(new RegExp(escapeRegExp(phrase), 'gi'), (m) =>
        ' '.repeat(m.length)
      ),
    text
  )
}

/** Removes duplicate reports of the same match on the same line. */
function dedupe(violations: Violation[]): Violation[] {
  const seen = new Set<string>()
  return violations.filter((v) => {
    const key = `${v.rule}|${v.file}|${v.line}|${v.text.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function scan(
  page: ParsedPage,
  units: CopyText[],
  rule: string,
  pattern: RegExp,
  label: string
): Violation[] {
  return units.flatMap((u) =>
    [...u.text.matchAll(new RegExp(pattern.source, pattern.flags))].map(
      (m) => ({
        rule,
        file: page.file,
        line: u.line,
        text: m[0],
        message: `Banned: ${label}`
      })
    )
  )
}

export const bannedWords: Rule = (inputs, config) =>
  dedupe(
    inputs.html.flatMap((source) => {
      const page = parsePage(source)
      // A quotation is shown exactly as the client gave it, so its words are
      // exempt; its attribution (a figcaption outside the blockquote) is not.
      const ownCopy = copyTextNodes(page).filter(
        (u) => !u.ancestors.includes('blockquote')
      )
      const units = [...ownCopy, ...metadataCopy(page)].map((u) => ({
        ...u,
        text: blank(u.text, config.brandAllowList)
      }))
      return config.bannedWords.flatMap((w) =>
        scan(page, units, 'brand/banned-word', w.pattern, w.label)
      )
    })
  )

export const bannedPhrases: Rule = (inputs, config) =>
  dedupe(
    inputs.html.flatMap((source) => {
      const page = parsePage(source)
      const units = [
        ...elementsWithText(page, BLOCKS).map((b) => ({
          text: b.text,
          line: b.line,
          ancestors: []
        })),
        ...metadataCopy(page)
      ]
      return config.bannedPhrases.flatMap((p) =>
        scan(page, units, 'brand/banned-phrase', p.pattern, p.label)
      )
    })
  )

export const genericCtas: Rule = (inputs, config) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    const buttons = elementsWithText(page, 'a, button')
    const inputsWithValue = page.root
      .querySelectorAll('input[type="submit"], input[type="button"]')
      .map((el) => ({
        el,
        text: (el.getAttribute('value') ?? '').trim(),
        line: page.lineOf(el.range[0])
      }))
    return [...buttons, ...inputsWithValue]
      .filter((b) => config.genericCtas.includes(b.text.toLowerCase()))
      .map((b) => ({
        rule: 'brand/generic-cta',
        file: page.file,
        line: b.line,
        text: b.text,
        message: 'Name the action instead.'
      }))
  })

export const emDashes: Rule = (inputs, config) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    return elementsWithText(
      page,
      `h1, h2, h3, h4, h5, h6, a, button, [${config.brandLineAttribute}]`
    )
      .filter((e) => e.text.includes('—'))
      .map((e) => ({
        rule: 'brand/em-dash',
        file: page.file,
        line: e.line,
        text: e.text,
        message: 'No em dashes in headings, buttons, links or the brand line.'
      }))
  })

export const emoji: Rule = (inputs, config) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    const labels = elementsWithText(page, 'h1, h2, h3, h4, h5, h6, nav, button')
      .filter((e) => config.emoji.test(e.text))
      .map((e) => ({ line: e.line, text: e.text }))
    const markers = elementsWithText(page, 'li')
      .filter((e) => config.emoji.test(Array.from(e.text)[0] ?? ''))
      .map((e) => ({ line: e.line, text: e.text }))
    return [...labels, ...markers].map((e) => ({
      rule: 'brand/emoji',
      file: page.file,
      line: e.line,
      text: e.text,
      message: 'No emoji in headings, navigation, buttons or list markers.'
    }))
  })

export const trailingArrows: Rule = (inputs, config) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    return elementsWithText(page, 'a')
      .filter((e) => config.trailingArrow.test(e.text))
      .map((e) => ({
        rule: 'brand/trailing-arrow',
        file: page.file,
        line: e.line,
        text: e.text,
        message: 'Link text may not end with an arrow.'
      }))
  })

export const numberedLabels: Rule = (inputs, config) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    return copyTextNodes(page)
      .filter(
        (t) =>
          config.numberedLabel.test(t.text.trim()) &&
          !t.ancestors.includes('ol')
      )
      .map((t) => ({
        rule: 'brand/numbered-label',
        file: page.file,
        line: t.line,
        text: t.text.trim(),
        message: 'Number only real sequences, marked up as an <ol>.'
      }))
  })

export const firstPersonPlural: Rule = (inputs, config) =>
  dedupe(
    inputs.html.flatMap((source) => {
      const page = parsePage(source)
      const units = [...copyTextNodes(page), ...metadataCopy(page)].filter(
        (u) => !u.ancestors.includes('blockquote') && !u.ancestors.includes('q')
      )
      return units.flatMap((u) =>
        [
          ...u.text.matchAll(
            new RegExp(
              config.firstPersonPlural.source,
              config.firstPersonPlural.flags
            )
          )
        ]
          .filter((m) => m[0] !== 'US')
          .map((m) => ({
            rule: 'brand/first-person-plural',
            file: page.file,
            line: u.line,
            text: m[0],
            message: 'Write as "I". The business is one person.'
          }))
      )
    })
  )

export const employerTerms: Rule = (inputs, config) =>
  inputs.distText.flatMap((source) =>
    config.employerTerms.flatMap((term) =>
      matchesWithLines(source.content, term.pattern).map((m) => ({
        rule: 'brand/employer-term',
        file: source.file,
        line: m.line,
        // Masked: build logs can be public, so never echo the term itself.
        text: mask(m.text),
        message: `Never name or identify an employer (${term.label}).`
      }))
    )
  )

export const brandCopyRules: Rule[] = [
  bannedWords,
  bannedPhrases,
  genericCtas,
  emDashes,
  emoji,
  trailingArrows,
  numberedLabels,
  firstPersonPlural,
  employerTerms
]
