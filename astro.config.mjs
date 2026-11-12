import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { PRODUCTION_ORIGIN } from './src/site.config.ts'
import { indexingHeaders } from './integrations/indexing-headers.ts'

/** Pages that must never appear in the sitemap. */
const EXCLUDED_FROM_SITEMAP = ['/404/', '/contact/thanks/']

export default defineConfig({
  site: PRODUCTION_ORIGIN,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    indexingHeaders(PRODUCTION_ORIGIN),
    sitemap({
      filter: (page) =>
        !EXCLUDED_FROM_SITEMAP.some((path) => new URL(page).pathname === path)
    })
  ]
})
