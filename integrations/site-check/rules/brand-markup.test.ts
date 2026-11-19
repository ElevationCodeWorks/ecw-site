import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { htmlInputs } from '../test-helpers.ts'
import { headingAccents } from './brand-markup.ts'

const check = (body: string) => headingAccents(htmlInputs(body), config)

test('heading accents: an italic accent word fails and names the page and heading', () => {
  const result = check('<h1>Websites that <em>get found</em></h1>')
  assert.equal(result.length, 1)
  assert.equal(result[0].rule, 'brand/heading-accent')
  assert.equal(result[0].file, 'dist/index.html')
  assert.equal(result[0].line, 7)
  assert.match(result[0].text, /<h1>Websites that <em>get found<\/em><\/h1>/)
  assert.match(result[0].message ?? '', /<em>/)
})

test('heading accents: span, mark, strong, b and i fail', () => {
  for (const tag of ['span', 'mark', 'strong', 'b', 'i']) {
    assert.equal(
      check(`<h2>Custom <${tag}>web apps</${tag}></h2>`).length,
      1,
      tag
    )
  }
})

test('heading accents: a span nested inside a heading link still fails', () => {
  assert.equal(
    check('<h2><a href="/work/">Recent <span>work</span></a></h2>').length,
    1
  )
})

test('heading accents: a fully linked heading passes', () => {
  assert.deepEqual(check('<h3><a href="/work/condies/">Condies</a></h3>'), [])
})

test('heading accents: abbr, code, br and a hidden SVG pass', () => {
  assert.deepEqual(
    check(
      '<h2><svg aria-hidden="true" focusable="false"><path d="M0 0h1v1z"></path></svg><abbr title="Search engine optimization">SEO</abbr> with <code>robots.txt</code><br>done right</h2>'
    ),
    []
  )
})

test('heading accents: an SVG that is not hidden fails', () => {
  assert.equal(
    check('<h2><svg><path d="M0 0h1v1z"></path></svg> Services</h2>').length,
    1
  )
})
