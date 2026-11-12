import type { APIRoute, GetStaticPaths } from 'astro'
import symbol from '../../assets/brand/symbol.svg?raw'
import tokensCss from '../../styles/tokens.css?raw'
import { ogFonts, renderOgImage } from '../../lib/og.ts'
import { ogPages } from '../../lib/og-pages.ts'
import { readTokens } from '../../lib/tokens.ts'
import { PRODUCTION_ORIGIN, site } from '../../site.config.ts'

/** One social image per indexable page, plus the default (design D7). */
export const getStaticPaths = (async () =>
  (await ogPages()).map((page) => ({
    params: { slug: page.slug },
    props: { title: page.title }
  }))) satisfies GetStaticPaths

const tokens = readTokens(tokensCss)
const fonts = ogFonts(tokens)

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage({
    title: props.title as string,
    brandName: site.brandName,
    domain: new URL(PRODUCTION_ORIGIN).host,
    symbol,
    tokens,
    fonts
  })
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' }
  })
}
