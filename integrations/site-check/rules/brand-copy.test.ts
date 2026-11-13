import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { parseTerms } from '../private-terms.ts'
import { htmlInputs, inputs } from '../test-helpers.ts'
import type { Rule } from '../types.ts'
import {
  bannedPhrases,
  bannedWords,
  emDashes,
  emoji,
  employerTerms,
  firstPersonPlural,
  genericCtas,
  numberedLabels,
  trailingArrows
} from './brand-copy.ts'

function hits(rule: Rule, body: string): string[] {
  return rule(htmlInputs(body), config).map((v) => v.text)
}

test('banned words: flags "elevate", allows the brand name', () => {
  assert.deepEqual(hits(bannedWords, '<p>We elevate your business.</p>'), [
    'elevate'
  ])
  assert.deepEqual(
    hits(bannedWords, '<p>Elevation Code Works builds software.</p>'),
    []
  )
})

test('banned words: checks metadata and alt text, reports the line', () => {
  const result = bannedWords(
    htmlInputs('<img src="x.png" alt="A seamless checkout">'),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].text, 'seamless')
  assert.equal(result[0].line, 7)
})

const quoteFigure = (caption: string) =>
  `<figure>\n<blockquote><p>Tejen was able to seamlessly step in and get them done.</p></blockquote>\n<figcaption>${caption}</figcaption>\n</figure>`

test('banned words: a client quote in a blockquote is exempt', () => {
  assert.deepEqual(
    hits(bannedWords, quoteFigure('Conor Britain, Important, Not Important')),
    []
  )
})

test('banned words: the quote attribution is still checked', () => {
  assert.deepEqual(hits(bannedWords, quoteFigure('Seamless Co, a client')), [
    'Seamless'
  ])
})

test('banned words: the same word outside a quote fails', () => {
  assert.deepEqual(
    hits(
      bannedWords,
      `${quoteFigure('Conor Britain, Important, Not Important')}\n<p>I step in seamlessly.</p>`
    ),
    ['seamlessly']
  )
})

test('banned phrases: flags "not just" across inline markup', () => {
  assert.deepEqual(
    hits(
      bannedPhrases,
      "<p>It's not <em>just</em> a website, it's a growth engine.</p>"
    ),
    ['not just']
  )
  assert.deepEqual(hits(bannedPhrases, '<p>Just a plain sentence.</p>'), [])
})

test('generic CTAs: flags "Get Started", allows a named action', () => {
  assert.deepEqual(hits(genericCtas, '<a href="/contact/">Get Started</a>'), [
    'Get Started'
  ])
  assert.deepEqual(
    hits(genericCtas, '<a href="/contact/">Book a 20-minute call</a>'),
    []
  )
})

test('em dashes: flags a heading, allows body copy', () => {
  assert.deepEqual(hits(emDashes, '<h2>Services — what I do</h2>'), [
    'Services — what I do'
  ])
  assert.deepEqual(hits(emDashes, '<p>Body copy — allowed here.</p>'), [])
})

test('em dashes: flags the brand line', () => {
  assert.equal(
    hits(emDashes, '<p data-brand-line>AI-powered — human-driven</p>').length,
    1
  )
})

test('emoji: flags heading emoji and emoji list markers, allows plain lists', () => {
  assert.equal(hits(emoji, '<h2>🚀 Launch</h2>').length, 1)
  assert.equal(hits(emoji, '<ul><li>✅ Fast</li></ul>').length, 1)
  assert.deepEqual(hits(emoji, '<ul><li>Fast</li></ul><h2>Launch</h2>'), [])
})

test('trailing arrows: flags "→" at the end of link text', () => {
  assert.deepEqual(
    hits(trailingArrows, '<a href="/work/">See the work →</a>'),
    ['See the work →']
  )
  assert.deepEqual(
    hits(trailingArrows, '<a href="/work/">See the work</a>'),
    []
  )
})

test('numbered labels: flags "01 / Services", allows an ordered list', () => {
  assert.deepEqual(hits(numberedLabels, '<span>01 / Services</span>'), [
    '01 / Services'
  ])
  assert.deepEqual(
    hits(numberedLabels, '<ol><li>01. Discovery</li><li>02. Build</li></ol>'),
    []
  )
})

test('first-person plural: flags "we", allows quotes and "U.S."', () => {
  assert.deepEqual(hits(firstPersonPlural, '<p>We build websites.</p>'), ['We'])
  assert.deepEqual(
    hits(
      firstPersonPlural,
      '<p>I worked on U.S. Census Bureau and US federal projects.</p><blockquote>We loved it.</blockquote>'
    ),
    []
  )
})

test('employer terms: flags private terms anywhere in the build and masks them', () => {
  // Fixture terms only: the real list is private and never committed.
  const withTerms = {
    ...config,
    employerTerms: parseTerms(['Acme Bank', 'widget'])
  }
  const file = {
    file: 'dist/index.html',
    content:
      '<script type="application/ld+json">{"worksFor":"Acme Bank"}</script>\n<p>1,200 widgets</p>'
  }
  const result = employerTerms(inputs({ distText: [file] }), withTerms)
  assert.deepEqual(
    result.map((v) => `${v.line}:${v.text}`),
    ['1:[redacted]', '2:[redacted]']
  )
  assert.ok(result.every((v) => !/Acme|widget/.test(v.message ?? '')))
  const clean = {
    file: 'dist/index.html',
    content: '<p>Enterprise software and federal projects.</p>'
  }
  assert.deepEqual(employerTerms(inputs({ distText: [clean] }), withTerms), [])
})

test('banned words: allows the brand domain and email, still flags puns', () => {
  assert.deepEqual(
    hits(
      bannedWords,
      '<p>Email tejen@elevationcode.works or visit ElevationCode.works.</p>'
    ),
    []
  )
  assert.deepEqual(hits(bannedWords, '<p>Elevating your brand.</p>'), [
    'Elevating'
  ])
})
