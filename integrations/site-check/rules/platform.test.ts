import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { astroStyleBlocks } from '../load.ts'
import { astroInputs, cssInputs, htmlInputs, inputs } from '../test-helpers.ts'
import type { CssSource, SourceFile } from '../types.ts'
import { noClientScripts, rawValues } from './platform.ts'

test('raw values: flags a hex color and a named color outside the tokens file', () => {
  assert.equal(rawValues(cssInputs('a { color: #ff0000; }'), config).length, 1)
  assert.equal(
    rawValues(cssInputs('p { border: 1px solid gray; }'), config).length,
    1
  )
})

test('raw values: flags a font name outside the tokens file', () => {
  assert.equal(
    rawValues(cssInputs('h1 { font-family: Georgia, serif; }'), config).length,
    1
  )
})

test('raw values: allows tokens and keywords', () => {
  const css =
    'a { color: var(--color-link); background: transparent; border-color: currentColor; font: inherit; font-family: var(--font-body); transition: color 0.2s; }'
  assert.deepEqual(rawValues(cssInputs(css), config), [])
})

test('raw values: the tokens file itself may hold literals', () => {
  assert.deepEqual(
    rawValues(
      cssInputs(':root { --color-bg: #ffffff; }', 'src/styles/tokens.css'),
      config
    ),
    []
  )
})

test('raw values: flags inline colors in .astro markup', () => {
  const result = rawValues(
    astroInputs('---\nconst a = 1\n---\n<svg><path fill="#123456" /></svg>\n'),
    config
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].line, 4)
})

test('the placeholder look and every real component pass the raw-value rule', () => {
  const files = readdirSync('src', { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
  const css: CssSource[] = files
    .filter((f) => f.endsWith('.css'))
    .map((f) => ({ file: f, css: readFileSync(f, 'utf8'), lineOffset: 0 }))
  const astro: SourceFile[] = files
    .filter((f) => f.endsWith('.astro'))
    .map((f) => ({ file: f, content: readFileSync(f, 'utf8') }))
  const result = rawValues(
    inputs({ css: [...css, ...astro.flatMap(astroStyleBlocks)], astro }),
    config
  )
  assert.deepEqual(result, [])
})

test('client scripts: flags a script tag and an inline handler, allows JSON-LD', () => {
  assert.equal(
    noClientScripts(htmlInputs('<script src="/app.js"></script>'), config)
      .length,
    1
  )
  assert.equal(
    noClientScripts(htmlInputs('<button onclick="go()">Go</button>'), config)
      .length,
    1
  )
  assert.deepEqual(
    noClientScripts(
      htmlInputs(
        '<script type="application/ld+json">{"@type":"WebSite"}</script>'
      ),
      config
    ),
    []
  )
})
