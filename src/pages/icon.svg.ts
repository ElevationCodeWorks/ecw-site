import type { APIRoute } from 'astro'
import symbol from '../assets/brand/symbol.svg?raw'
import tokensCss from '../styles/tokens.css?raw'
import { iconSvg } from '../lib/icons.ts'
import { readTokens } from '../lib/tokens.ts'

/** The scalable icon, in dark-scheme colors under a dark preference (design D8). */
export const GET: APIRoute = () =>
  new Response(iconSvg(symbol, readTokens(tokensCss)), {
    headers: { 'Content-Type': 'image/svg+xml' }
  })
