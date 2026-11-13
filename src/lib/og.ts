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
  /**
   * The hero drawing (src/assets/brand/storefront.svg), shown beside the
   * title. Optional, so a page can go without it.
   */
  art?: string
}

/**
 * The hero drawing as a standalone image: its faces, its one yellow surface
 * and its dashed lines styled from the light-scheme tokens, with the labels'
 * leaders and the hover details left out.
 */
/** The share of the hero drawing's width on each side kept for labels. */
const ART_GUTTER = 0.24

export function standaloneArt(art: string, tokens: Tokens): string {
  const color = (name: string) => token(tokens, name).light
  const style = [
    `.face{fill:${color('--color-bg')}}`,
    `.side{fill:${color('--color-surface')}}`,
    `.hl{fill:${color('--color-highlight')}}`,
    `.course{stroke:${color('--color-border')}}`,
    '.dash{stroke-dasharray:4 4}',
    '.callouts,.detail{display:none}'
  ].join('')
  // Crop the side gutters the hero keeps for its HTML labels.
  const cropped = art.replace(
    /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/,
    (_, x, y, w, h) =>
      `viewBox="${+x + +w * ART_GUTTER} ${y} ${+w * (1 - 2 * ART_GUTTER)} ${h}"`
  )
  return cropped
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/currentColor/g, color('--color-text'))
    .replace(/(<svg\b[^>]*>)/, `$1<style>${style}</style>`)
}

const dataUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

/** Renders one social image as a 1200x630 PNG: a catalog plate. */
export async function renderOgImage(input: OgImageInput): Promise<Buffer> {
  const color = (name: string) => token(input.tokens, name).light
  const ink = color('--color-text')
  const symbolSvg = input.symbol
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/currentColor/g, ink)
  const titleSize = input.title.length > 40 ? 54 : 64

  // Printer's crop marks just outside the frame's corners.
  const frame = 28
  const mark = (x: number, y: number, w: number, h: number) =>
    el('div', {
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: ink
    })
  const marks = [
    [frame, frame],
    [OG_WIDTH - frame, frame],
    [frame, OG_HEIGHT - frame],
    [OG_WIDTH - frame, OG_HEIGHT - frame]
  ].flatMap(([x, y]) => {
    const sx = x < OG_WIDTH / 2 ? -1 : 1
    const sy = y < OG_HEIGHT / 2 ? -1 : 1
    return [
      mark(sx < 0 ? x - 20 : x + 6, y, 14, 1),
      mark(x, sy < 0 ? y - 20 : y + 6, 1, 14)
    ]
  })

  const text = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      width: input.art ? 560 : 960
    },
    [
      el('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
        el('img', { width: 52, height: 52 }, undefined, {
          src: dataUri(symbolSvg),
          width: 52,
          height: 52
        }),
        el('div', { fontSize: 30, fontWeight: 700 }, input.brandName)
      ]),
      el(
        'div',
        {
          display: 'flex',
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.05
        },
        input.title
      ),
      el(
        'div',
        { display: 'flex', fontSize: 26, color: color('--color-text-muted') },
        input.domain
      )
    ]
  )

  const children: Node[] = [text]
  if (input.art) {
    children.push(
      el('img', { width: 400, height: 444 }, undefined, {
        src: dataUri(standaloneArt(input.art, input.tokens)),
        width: 400,
        height: 444
      })
    )
  }

  const tree = el(
    'div',
    {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      background: color('--color-bg'),
      color: ink,
      fontFamily: input.fonts[0].name,
      padding: frame,
      position: 'relative'
    },
    [
      ...marks,
      el(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: `1px solid ${color('--color-border')}`,
          padding: '44px 40px 40px 52px'
        },
        children
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
