import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {
  ogFonts,
  ogImagePath,
  ogSubject,
  renderOgImage,
  standaloneArt
} from './og.ts'
import { readTokens } from './tokens.ts'

const tokens = readTokens(readFileSync('src/styles/tokens.css', 'utf8'))

test('image paths follow the page path', () => {
  assert.equal(ogImagePath('/'), '/og/home.png')
  assert.equal(ogImagePath('/services/'), '/og/services.png')
  assert.equal(ogImagePath('/services/websites/'), '/og/services/websites.png')
  assert.equal(ogImagePath('/work/condies/'), '/og/work/condies.png')
})

test('pages that are not indexed use the default image', () => {
  assert.equal(ogImagePath('/contact/thanks/', true), '/og/default.png')
  assert.equal(ogImagePath('/404/', true), '/og/default.png')
})

test("Home's full title loses its brand suffix", () => {
  assert.equal(
    ogSubject(
      'Custom software & websites in Denver | Elevation Code Works',
      'Elevation Code Works'
    ),
    'Custom software & websites in Denver'
  )
  assert.equal(ogSubject('About me', 'Elevation Code Works'), 'About me')
})

test('tokens that use system fonts only render with Noto Sans', () => {
  const systemOnly = readTokens(
    ':root { --font-body: system-ui, sans-serif; --font-heading: var(--font-body); }'
  )
  const fonts = ogFonts(systemOnly)
  assert.deepEqual(
    fonts.map((f) => [f.name, f.weight]),
    [
      ['Noto Sans', 400],
      ['Noto Sans', 700]
    ]
  )
})

test('a committed heading typeface is used once the tokens name it', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'og-fonts-'))
  const dir = path.join(root, 'src/assets/fonts/test-sans')
  mkdirSync(dir, { recursive: true })
  for (const w of [400, 700])
    cpSync(
      `node_modules/@fontsource/noto-sans/files/noto-sans-latin-${w}-normal.woff`,
      path.join(dir, `test-sans-latin-${w}-normal.woff`)
    )
  writeFileSync(path.join(dir, 'SOURCE.txt'), 'Test Sans\nCopied for a test.\n')
  const named = readTokens(
    ":root { --font-heading: 'Test Sans', 'Test Sans Fallback', Arial, sans-serif; }"
  )
  assert.deepEqual(
    ogFonts(named, root).map((f) => f.name),
    ['Test Sans', 'Test Sans']
  )
})

test('an image renders as a 1200x630 PNG', async () => {
  const png = await renderOgImage({
    title: 'Websites for Denver small businesses',
    brandName: 'Elevation Code Works',
    domain: 'elevationcode.works',
    symbol: readFileSync('src/assets/brand/symbol.svg', 'utf8'),
    tokens,
    fonts: ogFonts(tokens)
  })
  const meta = await sharp(png).metadata()
  assert.deepEqual([meta.format, meta.width, meta.height], ['png', 1200, 630])
})

test('the hero drawing stands alone: gutters cropped, faces styled from tokens', () => {
  const art =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 0 200 50"><g class="callouts"></g><polygon class="face hl" fill="currentColor" stroke="currentColor" points="0,0 1,1" /></svg>'
  const out = standaloneArt(art, tokens)
  assert.match(out, /viewBox="-52 0 104 50"/)
  assert.match(out, /\.hl\{fill:#ffdd00\}/)
  assert.match(out, /\.callouts,\.detail\{display:none\}/)
  assert.doesNotMatch(out, /currentColor/)
})

test('a social image with the hero drawing still renders at 1200x630', async () => {
  const png = await renderOgImage({
    title: 'Websites for Denver small businesses',
    brandName: 'Elevation Code Works',
    domain: 'elevationcode.works',
    symbol: readFileSync('src/assets/brand/symbol.svg', 'utf8'),
    art: readFileSync('src/assets/brand/storefront.svg', 'utf8'),
    tokens,
    fonts: ogFonts(tokens)
  })
  const meta = await sharp(png).metadata()
  assert.deepEqual([meta.width, meta.height], [1200, 630])
})
