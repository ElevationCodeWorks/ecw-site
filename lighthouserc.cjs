/**
 * Lighthouse CI thresholds (site-platform spec: mobile performance baseline).
 * Lighthouse's default settings emulate a mid-range phone on a slow 4G
 * connection. URLs are passed in by scripts/audit.mjs.
 *
 * The SEO category is asserted only on indexable pages: the 404 and contact
 * confirmation pages are noindex by design, which Lighthouse scores down.
 */
const everyPage = {
  'categories:performance': ['error', { minScore: 0.95 }],
  'categories:accessibility': ['error', { minScore: 0.95 }],
  'categories:best-practices': ['error', { minScore: 0.95 }],
  'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
  'total-blocking-time': ['error', { maxNumericValue: 200 }]
}

module.exports = {
  ci: {
    collect: { numberOfRuns: 1 },
    assert: {
      assertMatrix: [
        { matchingUrlPattern: '.*', assertions: everyPage },
        {
          matchingUrlPattern: '^(?!.*(/contact/thanks/|/404\\.html)).*$',
          assertions: { 'categories:seo': ['error', { minScore: 0.95 }] }
        }
      ]
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' }
  }
}
