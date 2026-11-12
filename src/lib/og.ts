/**
 * Per-page social images, rendered at build time (visual-identity design
 * D7): satori lays out the symbol, the wordmark, the page title and the
 * domain; sharp turns the SVG into a 1200x630 PNG. Colors and the typeface
 * come from the design tokens. This is the placeholder template; the final
 * identity restyles it.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import sharp from 'sharp'
import { fontFamilies } from '../../integrations/site-check/css.ts'
import { token } from './tokens.ts'
import type { TokenValue } from './tokens.ts'

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

type Tokens = Map<string, TokenValue>

/** The site-root path of a page's social image, derived from its URL path. */
export function ogImagePath(pathname: string, noindex = false): string {
  if (noindex) return '/og/default.png'
  const trimmed = pathname.replace(/^\/+|\/+$/g, '')
  return `/og/${trimmed || 'home'}.png`
}

/** A page's subject: a full title (Home's) without its brand suffix. */
export function ogSubject(title: string, brandName: string): string {
  return title.replace(new RegExp(`\\s*[|:–-]\\s*${brandName}\\s*$`), '')
}

export interface OgFont {
  name: string
  data: Buffer
  weight: 400 | 700
  style: 'normal'
}

/** Neutral OFL face for the placeholder look, which has no web font. */
const PLACEHOLDER_FONT = {
  name: 'Noto Sans',
  dir: 'node_modules/@fontsource/noto-sans/files',
  slug: 'noto-sans'
}

/**
 * Static WOFF files for the heading typeface: the family named first in
 * --font-heading, found in src/assets/fonts/<slug>/ by its SOURCE.txt (see
 * scripts/fonts.mjs). Falls back to Noto Sans while the tokens use system
 * fonts only.
 */
export function ogFonts(tokens: Tokens, root = process.cwd()): OgFont[] {
  const wanted = fontFamilies(token(tokens, '--font-heading').light)
  const fontsDir = path.join(root, 'src/assets/fonts')
  const slugs = existsSync(fontsDir) ? readdirSync(fontsDir) : []
  const match = slugs.find((slug) => {
    const source = path.join(fontsDir, slug, 'SOURCE.txt')
    if (!existsSync(source)) return false
    const family = readFileSync(source, 'utf8').split('\n')[0].trim()
    return wanted.includes(family.toLowerCase())
  })
  const font = match
    ? {
        name: readFileSync(path.join(fontsDir, match, 'SOURCE.txt'), 'utf8')
          .split('\n')[0]
          .trim(),
        dir: path.join(fontsDir, match),
        slug: match
      }
    : { ...PLACEHOLDER_FONT, dir: path.join(root, PLACEHOLDER_FONT.dir) }
  return ([400, 700] as const).map((weight) => ({
    name: font.name,
    data: readFileSync(
      path.join(font.dir, `${font.slug}-latin-${weight}-normal.woff`)
    ),
    weight,
    style: 'normal'
  }))
}

/** A satori element: the plain-object form of a JSX element. */
interface Node {
  type: string
  props: Record<string, unknown> & { children?: unknown }
}
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra: Record<string, unknown> = {}
): Node => ({ type, props: { style, children, ...extra } })

export interface OgImageInput {
  title: string
  brandName: string
  domain: string
  symbol: string
  tokens: Tokens
  fonts: OgFont[]
}

/** Renders one social image as a 1200x630 PNG. */
export async function renderOgImage(input: OgImageInput): Promise<Buffer> {
  const color = (name: string) => token(input.tokens, name).light
  const symbolSvg = input.symbol
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/currentColor/g, color('--color-text'))
  const symbolSrc = `data:image/svg+xml;base64,${Buffer.from(symbolSvg).toString('base64')}`
  const titleSize = input.title.length > 44 ? 60 : 72

  const tree = el(
    'div',
    {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 72,
      background: color('--color-bg'),
      color: color('--color-text'),
      fontFamily: input.fonts[0].name
    },
    [
      el('div', { display: 'flex', alignItems: 'center', gap: 20 }, [
        el('img', { width: 48, height: 48 }, undefined, {
          src: symbolSrc,
          width: 48,
          height: 48
        }),
        el('div', { fontSize: 32, fontWeight: 700 }, input.brandName)
      ]),
      el(
        'div',
        {
          display: 'flex',
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: 1000
        },
        input.title
      ),
      el(
        'div',
        { display: 'flex', fontSize: 28, color: color('--color-text-muted') },
        input.domain
      )
    ]
  )

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: input.fonts
  })
  return sharp(Buffer.from(svg)).png().toBuffer()
}
