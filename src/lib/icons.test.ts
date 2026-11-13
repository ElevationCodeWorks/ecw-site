import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { faviconIco, iconSvg, icoFromPng, touchIconPng } from './icons.ts'
import { readTokens } from './tokens.ts'

const symbol = readFileSync('src/assets/brand/symbol.svg', 'utf8')
const tokens = readTokens(
  readFileSync('integrations/site-check/fixtures/tokens.css', 'utf8')
)

/** Reads a single-image ICO header and directory entry. */
function icoHeader(ico: Buffer) {
  return {
    reserved: ico.readUInt16LE(0),
    type: ico.readUInt16LE(2),
    count: ico.readUInt16LE(4),
    width: ico.readUInt8(6) || 256,
    height: ico.readUInt8(7) || 256,
    size: ico.readUInt32LE(14),
    offset: ico.readUInt32LE(18)
  }
}

test('the favicon ICO declares one 32x32 image holding a 32x32 PNG', async () => {
  const ico = await faviconIco(symbol, tokens)
  const h = icoHeader(ico)
  assert.deepEqual(
    {
      reserved: h.reserved,
      type: h.type,
      count: h.count,
      width: h.width,
      height: h.height
    },
    { reserved: 0, type: 1, count: 1, width: 32, height: 32 }
  )
  assert.equal(h.offset, 22)
  assert.equal(h.offset + h.size, ico.length)
  const png = ico.subarray(h.offset)
  const meta = await sharp(png).metadata()
  assert.deepEqual([meta.format, meta.width, meta.height], ['png', 32, 32])
})

test('icoFromPng writes 0 for a 256-pixel image', () => {
  assert.equal(icoFromPng(Buffer.from([1, 2, 3]), 256).readUInt8(6), 0)
})

test('the touch icon is a 180x180 PNG', async () => {
  const meta = await sharp(await touchIconPng(symbol, tokens)).metadata()
  assert.deepEqual([meta.format, meta.width, meta.height], ['png', 180, 180])
})

test('the touch icon sets the symbol on the brand yellow', async () => {
  const { data } = await sharp(await touchIconPng(symbol, tokens))
    .raw()
    .toBuffer({ resolveWithObject: true })
  // The top-left pixel is padding, so it shows --color-highlight (#ffdd00).
  assert.deepEqual([...data.subarray(0, 3)], [255, 221, 0])
})

test('icon.svg uses the light text token, and the dark one under a dark preference', () => {
  const svg = iconSvg(symbol, tokens)
  assert.match(svg, /svg\{color:#111111\}/)
  assert.match(
    svg,
    /@media \(prefers-color-scheme: dark\)\{svg\{color:#ededed\}\}/
  )
  assert.match(svg, /fill="currentColor"/)
})

test('the built icons exist when dist/ has been built', async (t) => {
  if (!existsSync('dist/favicon.ico')) return t.skip('dist/ not built')
  assert.equal(icoHeader(readFileSync('dist/favicon.ico')).width, 32)
  const touch = await sharp('dist/apple-touch-icon.png').metadata()
  assert.equal(touch.width, 180)
  assert.match(
    readFileSync('dist/icon.svg', 'utf8'),
    /prefers-color-scheme: dark/
  )
})
