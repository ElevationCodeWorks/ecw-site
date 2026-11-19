import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'
import { currentDeployEnv, isIndexable } from '../src/lib/env.ts'

export const NOINDEX_HEADERS = '/*\n  X-Robots-Tag: noindex, nofollow\n'

/**
 * Writes Netlify's `_headers` file so non-production builds send
 * `X-Robots-Tag: noindex, nofollow` on every response (design D3). Netlify
 * does not add this header to the latest branch deploy on its own.
 */
export function indexingHeaders(productionOrigin: string): AstroIntegration {
  return {
    name: 'ecw:indexing-headers',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (isIndexable(currentDeployEnv(), productionOrigin)) {
          logger.info('Indexable production build: no noindex header written')
          return
        }
        await writeFile(
          fileURLToPath(new URL('_headers', dir)),
          NOINDEX_HEADERS,
          'utf8'
        )
        logger.info('Non-production build: wrote noindex _headers')
      }
    }
  }
}
