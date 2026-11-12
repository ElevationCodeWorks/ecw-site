import type { APIRoute } from 'astro'
import { currentDeployEnv, isIndexable } from '../lib/env.ts'
import { PRODUCTION_ORIGIN } from '../site.config.ts'

/** Prerendered robots.txt: open on the production host, closed everywhere else. */
export const GET: APIRoute = () => {
  const body = isIndexable(currentDeployEnv(), PRODUCTION_ORIGIN)
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${new URL('/sitemap-index.xml', PRODUCTION_ORIGIN).href}`,
        ''
      ].join('\n')
    : ['User-agent: *', 'Disallow: /', ''].join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
