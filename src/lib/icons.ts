/**
 * Site icons drawn from the one symbol source (visual-identity design D8):
 * a scalable icon that follows the visitor's color scheme, and square PNGs
 * for the legacy favicon and the touch icon. Colors come from the tokens.
 */
import sharp from 'sharp'
import { token } from './tokens.ts'
import type { TokenValue } from './tokens.ts'

type Tokens = Map<string, TokenValue>

/** The symbol's viewBox and inner markup, without comments. */
function parseSymbol(symbol: string): { viewBox: string; body: string } {
  const clean = symbol.replace(/<!--[\s\S]*?-->/g, '')
  const viewBox = clean.match(/viewBox="([^"]+)"/)?.[1]
  const body = clean.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1]
  if (!viewBox || body === undefined)
    throw new Error('The symbol SVG needs a viewBox')
  return { viewBox, body: body.trim() }
}

/**
 * The scalable icon: the symbol in the text color, switching to the
 * dark-scheme text color under a dark system preference. The symbol draws
 * in currentColor, so setting `color` is enough.
 */
export function iconSvg(symbol: string, tokens: Tokens): string {
  const { viewBox, body } = parseSymbol(symbol)
  const text = token(tokens, '--color-text')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><style>svg{color:${text.light}}@media (prefers-color-scheme: dark){svg{color:${text.dark}}}</style>${body}</svg>\n`
}

/**
 * A square PNG of the symbol in the light-scheme text color on the
 * light-scheme background, with padding (a fraction of the size) around it.
 */
export async function squareIconPng(
  symbol: string,
  tokens: Tokens,
  size: number,
  padding = 0.125,
  background = '--color-bg'
): Promise<Buffer> {
  const { viewBox, body } = parseSymbol(symbol)
  const inset = Math.round(size * padding)
  const inner = size - inset * 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${token(tokens, background).light}"/><svg x="${inset}" y="${inset}" width="${inner}" height="${inner}" viewBox="${viewBox}" color="${token(tokens, '--color-text').light}">${body}</svg></svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/**
 * Wraps one PNG in a single-image ICO container: a 6-byte header, one
 * 16-byte directory entry, then the PNG itself (ICO has allowed PNG data
 * since Windows Vista).
 */
export function icoFromPng(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size >= 256 ? 0 : size, 0) // width (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1) // height
  entry.writeUInt8(0, 2) // palette colors
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png.length, 8) // image size
  entry.writeUInt32LE(header.length + entry.length, 12) // image offset
  return Buffer.concat([header, entry, png])
}

/** The 32-pixel favicon as an ICO file. */
export async function faviconIco(
  symbol: string,
  tokens: Tokens
): Promise<Buffer> {
  return icoFromPng(await squareIconPng(symbol, tokens, 32, 0.0625), 32)
}

/** The 180-pixel touch icon: the symbol on the brand yellow. */
export function touchIconPng(symbol: string, tokens: Tokens): Promise<Buffer> {
  return squareIconPng(symbol, tokens, 180, 0.15, '--color-highlight')
}
