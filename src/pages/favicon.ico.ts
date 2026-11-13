import type { APIRoute } from 'astro'
import symbol from '../assets/brand/symbol.svg?raw'
import tokensCss from '../styles/tokens.css?raw'
import { faviconIco } from '../lib/icons.ts'
import { readTokens } from '../lib/tokens.ts'

/** The legacy 32-pixel favicon (visual-identity design D8). */
export const GET: APIRoute = async () =>
  new Response(
    new Uint8Array(await faviconIco(symbol, readTokens(tokensCss))),
    {
      headers: { 'Content-Type': 'image/x-icon' }
    }
  )
