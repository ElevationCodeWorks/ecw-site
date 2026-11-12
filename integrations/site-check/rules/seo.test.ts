import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteCheckConfig as config } from '../../../site-check.config.ts'
import { htmlInputs, inputs } from '../test-helpers.ts'
import type { SourceFile } from '../types.ts'
import {
  canonicals,
  descriptions,
  headings,
  internalLinks,
  isCanonicalPath,
  noindexHeaders,
  titles
} from './seo.ts'

const ORIGIN = 'https://elevationcode.works'
const GOOD_DESCRIPTION =
  'Custom software and websites for Denver small businesses, built by a senior engineer.'

function doc(
  file: string,
  {
    title = 'About | Elevation Code Works',
    description = GOOD_DESCRIPTION,
    canonical = '',
    body = '<h1>About</h1>'
  } = {}
): SourceFile {
  const canonicalTag = canonical
    ? `<link rel="canonical" href="${canonical}">`
    : ''
  return {
    file,
    content: `<!doctype html>\n<html>\n<head>\n<title>${title}</title>\n<meta name="description" content="${description}">\n${canonicalTag}\n</head>\n<body>\n${body}\n</body>\n</html>\n`
  }
}

const site = (pages: { url: string; source: SourceFile }[]) =>
  inputs({
    html: pages.map((p) => p.source),
    sitemapUrls: pages.map((p) => p.url)
  })

test('titles: a good title passes', () => {
  const s = site([
    { url: `${ORIGIN}/about/`, source: doc('dist/about/index.html') }
  ])
  assert.deepEqual(titles(s, config), [])
})

test('titles: flags a missing suffix, an over-long title and duplicates', () => {
  const noSuffix = site([
    {
      url: `${ORIGIN}/about/`,
      source: doc('dist/about/index.html', { title: 'About me' })
    }
  ])
  assert.equal(titles(noSuffix, config).length, 1)

  const long = site([
    {
      url: `${ORIGIN}/about/`,
      source: doc('dist/about/index.html', {
        title: `${'A very long page title that keeps going'} | Elevation Code Works`
      })
    }
  ])
  assert.match(titles(long, config)[0].message ?? '', /Longer than 60/)

  const dupes = site([
    { url: `${ORIGIN}/a/`, source: doc('dist/a/index.html') },
    { url: `${ORIGIN}/b/`, source: doc('dist/b/index.html') }
  ])
  const result = titles(dupes, config)
  assert.equal(result.length, 2)
  assert.deepEqual(result.map((v) => v.file).sort(), [
    'dist/a/index.html',
    'dist/b/index.html'
  ])
})

test('descriptions: flags a short description, passes a good one', () => {
  const short = site([
    {
      url: `${ORIGIN}/about/`,
      source: doc('dist/about/index.html', { description: 'Too short.' })
    }
  ])
  assert.equal(descriptions(short, config).length, 1)
  const good = site([
    { url: `${ORIGIN}/about/`, source: doc('dist/about/index.html') }
  ])
  assert.deepEqual(descriptions(good, config), [])
})

test('headings: flags two H1s and a skipped level, passes a clean outline', () => {
  assert.equal(headings(htmlInputs('<h1>A</h1><h1>B</h1>'), config).length, 1)
  assert.equal(headings(htmlInputs('<h1>A</h1><h3>C</h3>'), config).length, 1)
  assert.deepEqual(
    headings(htmlInputs('<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2>'), config),
    []
  )
})

test('canonical: passes a self-referencing production URL', () => {
  const s = site([
    {
      url: `${ORIGIN}/about/`,
      source: doc('dist/about/index.html', { canonical: `${ORIGIN}/about/` })
    }
  ])
  assert.deepEqual(canonicals(s, config), [])
})

test('canonical: flags missing, wrong origin and wrong page', () => {
  const missing = site([
    { url: `${ORIGIN}/about/`, source: doc('dist/about/index.html') }
  ])
  assert.equal(canonicals(missing, config).length, 1)
  const wrongOrigin = site([
    {
      url: `${ORIGIN}/about/`,
      source: doc('dist/about/index.html', {
        canonical: 'https://ecw-site.netlify.app/about/'
      })
    }
  ])
  assert.match(canonicals(wrongOrigin, config)[0].message ?? '', /Must use/)
  const wrongPage = site([
    {
      url: `${ORIGIN}/about/`,
      source: doc('dist/about/index.html', { canonical: `${ORIGIN}/` })
    }
  ])
  assert.match(canonicals(wrongPage, config)[0].message ?? '', /this page/)
})

test('internal links: flags a missing trailing slash, allows files, anchors and external links', () => {
  assert.equal(
    internalLinks(htmlInputs('<a href="/services">Services</a>'), config)
      .length,
    1
  )
  assert.deepEqual(
    internalLinks(
      htmlInputs(
        '<a href="/services/">S</a><a href="/og/default.png">I</a><a href="#main">M</a><a href="https://condies.fyi">C</a><a href="mailto:a@b.c">E</a>'
      ),
      config
    ),
    []
  )
  assert.equal(isCanonicalPath('/sitemap-index.xml'), true)
})

test('noindex headers: required on non-indexable builds only', () => {
  assert.equal(noindexHeaders(inputs({ indexable: false }), config).length, 1)
  assert.deepEqual(
    noindexHeaders(
      inputs({
        indexable: false,
        headers: '/*\n  X-Robots-Tag: noindex, nofollow\n'
      }),
      config
    ),
    []
  )
  assert.deepEqual(noindexHeaders(inputs({ indexable: true }), config), [])
})

test('social meta: flags missing tags and a wrong card type, passes a full set', async () => {
  const { socialMeta } = await import('./seo.ts')
  const tags = (card: string) =>
    [
      '<meta property="og:title" content="About | Elevation Code Works">',
      '<meta property="og:description" content="D">',
      '<meta property="og:url" content="https://elevationcode.works/about/">',
      '<meta property="og:type" content="website">',
      '<meta property="og:image" content="https://elevationcode.works/og/default.png">',
      '<meta property="og:image:alt" content="Alt">',
      '<meta property="og:site_name" content="Elevation Code Works">',
      `<meta name="twitter:card" content="${card}">`
    ].join('\n')
  const pageWith = (head: string) =>
    inputs({
      html: [
        {
          file: 'dist/about/index.html',
          content: `<html><head>${head}</head><body><h1>A</h1></body></html>`
        }
      ],
      sitemapUrls: ['https://elevationcode.works/about/']
    })
  assert.deepEqual(
    socialMeta(pageWith(tags('summary_large_image')), config),
    []
  )
  assert.equal(socialMeta(pageWith(tags('summary')), config).length, 1)
  assert.equal(socialMeta(pageWith(''), config).length, 8)
})
