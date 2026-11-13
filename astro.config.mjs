import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { PRODUCTION_ORIGIN } from './src/site.config.ts'
import { indexingHeaders } from './integrations/indexing-headers.ts'
import { siteCheck } from './integrations/site-check/index.ts'

/** Pages that must never appear in the sitemap. */
const EXCLUDED_FROM_SITEMAP = ['/404/', '/contact/thanks/']

export default defineConfig({
  site: PRODUCTION_ORIGIN,
  trailingSlash: 'always',
  // Keep built HTML multi-line so the site check can report useful line numbers.
  compressHTML: false,
  build: { format: 'directory' },
  integrations: [
    indexingHeaders(PRODUCTION_ORIGIN),
    sitemap({
      filter: (page) =>
        !EXCLUDED_FROM_SITEMAP.some((path) => new URL(page).pathname === path)
    }),
    // Runs last: it inspects output written by the integrations above.
    siteCheck({ productionOrigin: PRODUCTION_ORIGIN })
  ]
})
