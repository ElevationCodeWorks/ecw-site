import type { APIRoute } from 'astro'
import symbol from '../assets/brand/symbol.svg?raw'
import tokensCss from '../styles/tokens.css?raw'
import { touchIconPng } from '../lib/icons.ts'
import { readTokens } from '../lib/tokens.ts'

/** The 180-pixel touch icon (visual-identity design D8). */
export const GET: APIRoute = async () =>
  new Response(
    new Uint8Array(await touchIconPng(symbol, readTokens(tokensCss))),
    {
      headers: { 'Content-Type': 'image/png' }
    }
  )
