import { parsePage, tagOf } from '../html.ts'
import type { ParsedPage } from '../html.ts'
import type { SiteCheckConfig } from '../../../site-check.config.ts'
import type { CheckInputs, Rule, SourceFile, Violation } from '../types.ts'

/** dist file for a page URL, e.g. https://x/about/ -> dist/about/index.html */
export function distFileFor(url: string): string {
  const pathname = new URL(url).pathname
  return `dist${pathname.endsWith('/') ? pathname : `${pathname}/`}index.html`
}

/** Built pages that the sitemap lists as indexable. */
function sitemapPages(inputs: CheckInputs): SourceFile[] {
  const wanted = new Set(inputs.sitemapUrls.map(distFileFor))
  return inputs.html.filter((p) => wanted.has(p.file))
}

const isHome = (file: string) => file === 'dist/index.html'

function v(
  page: ParsedPage,
  rule: string,
  line: number,
  text: string,
  message: string
): Violation {
  return { rule, file: page.file, line, text, message }
}

/** Exactly one value per page, within limits, and unique across pages. */
function uniqueMetadata(
  inputs: CheckInputs,
  rule: string,
  select: (page: ParsedPage) => { text: string; line: number }[],
  check: (text: string, page: ParsedPage) => string | null
): Violation[] {
  const out: Violation[] = []
  const seen = new Map<string, ParsedPage>()
  for (const source of sitemapPages(inputs)) {
    const page = parsePage(source)
    const found = select(page)
    if (found.length !== 1) {
      out.push(
        v(
          page,
          rule,
          1,
          `${found.length} found`,
          'Each page needs exactly one.'
        )
      )
      continue
    }
    const { text, line } = found[0]
    const problem = check(text, page)
    if (problem) out.push(v(page, rule, line, text, problem))
    const twin = seen.get(text)
    if (twin) {
      out.push(
        v(page, rule, line, text, `Duplicate of ${twin.file}.`),
        v(twin, rule, 1, text, `Duplicate of ${page.file}.`)
      )
    } else {
      seen.set(text, page)
    }
  }
  return out
}

export const titles: Rule = (inputs, config) =>
  uniqueMetadata(
    inputs,
    'seo/title',
    (page) =>
      page.root.querySelectorAll('title').map((el) => ({
        text: el.text.trim(),
        line: page.lineOf(el.range[0])
      })),
    (text, page) => {
      if (text.length > config.seo.titleMax)
        return `Longer than ${config.seo.titleMax} characters (${text.length}).`
      if (!isHome(page.file) && !text.endsWith(config.seo.titleSuffix))
        return `Must end with "${config.seo.titleSuffix}".`
      return null
    }
  )

export const descriptions: Rule = (inputs, config) =>
  uniqueMetadata(
    inputs,
    'seo/description',
    (page) =>
      page.root.querySelectorAll('meta[name="description"]').map((el) => ({
        text: (el.getAttribute('content') ?? '').trim(),
        line: page.lineOf(el.range[0])
      })),
    (text) => {
      const { descriptionMin: min, descriptionMax: max } = config.seo
      return text.length < min || text.length > max
        ? `Must be ${min}-${max} characters (${text.length}).`
        : null
    }
  )

export const headings: Rule = (inputs) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    const hs = page.root
      .querySelectorAll('h1, h2, h3, h4, h5, h6')
      .map((el) => ({
        level: Number(tagOf(el).slice(1)),
        text: el.text.trim(),
        line: page.lineOf(el.range[0])
      }))
    const out: Violation[] = []
    const h1s = hs.filter((h) => h.level === 1)
    if (h1s.length !== 1) {
      out.push(
        v(
          page,
          'seo/headings',
          h1s[1]?.line ?? 1,
          `${h1s.length} h1 elements`,
          'Each page needs exactly one H1.'
        )
      )
    }
    hs.forEach((h, i) => {
      const prev = i === 0 ? 0 : hs[i - 1].level
      if (h.level > prev + 1) {
        out.push(
          v(
            page,
            'seo/headings',
            h.line,
            h.text,
            `h${h.level} follows h${prev || '(none)'}; heading levels may not skip.`
          )
        )
      }
    })
    return out
  })

export const canonicals: Rule = (inputs) =>
  sitemapPages(inputs).flatMap((source) => {
    const page = parsePage(source)
    const links = page.root.querySelectorAll('link[rel="canonical"]')
    if (links.length !== 1) {
      return [
        v(
          page,
          'seo/canonical',
          1,
          `${links.length} found`,
          'Each indexable page needs exactly one canonical link.'
        )
      ]
    }
    const href = links[0].getAttribute('href') ?? ''
    const line = page.lineOf(links[0].range[0])
    let url: URL
    try {
      url = new URL(href)
    } catch {
      return [v(page, 'seo/canonical', line, href, 'Must be an absolute URL.')]
    }
    const expected = new URL(inputs.productionOrigin)
    if (url.origin !== expected.origin) {
      return [
        v(page, 'seo/canonical', line, href, `Must use ${expected.origin}.`)
      ]
    }
    if (distFileFor(url.href) !== page.file) {
      return [
        v(page, 'seo/canonical', line, href, 'Must point to this page itself.')
      ]
    }
    return []
  })

/** True when an internal path follows the trailing-slash convention. */
export function isCanonicalPath(pathname: string): boolean {
  const last = pathname.split('/').pop() ?? ''
  return pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(last)
}

export const internalLinks: Rule = (inputs) =>
  inputs.html.flatMap((source) => {
    const page = parsePage(source)
    const origin = new URL(inputs.productionOrigin).origin
    return page.root
      .querySelectorAll('a[href]')
      .map((el) => ({
        href: el.getAttribute('href') ?? '',
        line: page.lineOf(el.range[0])
      }))
      .filter(
        ({ href }) =>
          (href.startsWith('/') && !href.startsWith('//')) ||
          href.startsWith(origin)
      )
      .filter(({ href }) => !isCanonicalPath(new URL(href, origin).pathname))
      .map(({ href, line }) =>
        v(
          page,
          'seo/internal-link',
          line,
          href,
          'Internal links end with "/" (the canonical form).'
        )
      )
  })

export const noindexHeaders: Rule = (inputs) => {
  if (inputs.indexable) return []
  if (inputs.headers && /X-Robots-Tag:\s*noindex/i.test(inputs.headers))
    return []
  return [
    {
      rule: 'seo/noindex-headers',
      file: 'dist/_headers',
      line: 1,
      text: inputs.headers === null ? '(missing)' : inputs.headers,
      message:
        'Non-production builds must send X-Robots-Tag: noindex (design D3).'
    }
  ]
}

/** Open Graph and Twitter tags every indexable page needs (seo spec). */
const REQUIRED_SOCIAL: {
  key: string
  equals?: (c: SiteCheckConfig) => string
}[] = [
  { key: 'og:title' },
  { key: 'og:description' },
  { key: 'og:url' },
  { key: 'og:type' },
  { key: 'og:image' },
  { key: 'og:image:alt' },
  { key: 'og:site_name', equals: (c) => c.brandName },
  { key: 'twitter:card', equals: () => 'summary_large_image' }
]

export const socialMeta: Rule = (inputs, config) =>
  sitemapPages(inputs).flatMap((source) => {
    const page = parsePage(source)
    const content = (key: string) =>
      page.root
        .querySelectorAll(`meta[property="${key}"], meta[name="${key}"]`)
        .map((el) => (el.getAttribute('content') ?? '').trim())
        .filter(Boolean)[0]
    return REQUIRED_SOCIAL.flatMap(({ key, equals }) => {
      const value = content(key)
      if (!value) {
        return [v(page, 'seo/social', 1, key, 'Missing social preview tag.')]
      }
      const expected = equals?.(config)
      if (expected && value !== expected) {
        return [
          v(page, 'seo/social', 1, `${key}=${value}`, `Must be "${expected}".`)
        ]
      }
      if (
        (key === 'og:image' || key === 'og:url') &&
        !/^https?:\/\//.test(value)
      ) {
        return [
          v(
            page,
            'seo/social',
            1,
            `${key}=${value}`,
            'Must be an absolute URL.'
          )
        ]
      }
      return []
    })
  })

export const seoRules: Rule[] = [
  titles,
  descriptions,
  headings,
  canonicals,
  internalLinks,
  noindexHeaders,
  socialMeta
]
