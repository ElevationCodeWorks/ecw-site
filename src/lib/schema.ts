/**
 * Structured data builders (design D10). Entities use stable @ids on the
 * production origin so pages can reference each other.
 */
import type {
  BreadcrumbList,
  Person,
  ProfessionalService,
  Service,
  WebSite,
  WithContext
} from 'schema-dts'
import { founder, PRODUCTION_ORIGIN, site } from '../site.config.ts'

export const ids = {
  business: `${PRODUCTION_ORIGIN}/#business`,
  founder: `${PRODUCTION_ORIGIN}/#founder`,
  website: `${PRODUCTION_ORIGIN}/#website`
} as const

const absolute = (path: string) => new URL(path, PRODUCTION_ORIGIN).href

const areaServed = {
  '@type': 'City',
  name: site.location.city,
  containedInPlace: { '@type': 'State', name: site.location.regionName }
} as const

export function businessEntity(description: string): ProfessionalService {
  return {
    '@type': 'ProfessionalService',
    '@id': ids.business,
    name: site.brandName,
    url: absolute('/'),
    description,
    slogan: site.brandLine,
    email: site.publicEmail,
    areaServed,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location.city,
      addressRegion: site.location.region,
      addressCountry: 'US'
    },
    founder: { '@id': ids.founder }
  }
}

export function founderEntity(image?: string): Person {
  return {
    '@type': 'Person',
    '@id': ids.founder,
    name: founder.name,
    jobTitle: founder.title,
    worksFor: { '@id': ids.business },
    url: absolute('/about/'),
    sameAs: [...founder.sameAs],
    ...(image ? { image: absolute(image) } : {}),
    homeLocation: {
      '@type': 'City',
      name: site.location.city
    }
  }
}

/** The founder as a standalone JSON-LD document (About page). */
export function founderJsonLd(image?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    // schema-dts types Person as a union that includes plain strings.
    ...(founderEntity(image) as unknown as Record<string, unknown>)
  }
}

export function websiteEntity(): WebSite {
  return {
    '@type': 'WebSite',
    '@id': ids.website,
    url: absolute('/'),
    name: site.brandName,
    publisher: { '@id': ids.business }
  }
}

/** Home page: business, founder and website in one graph. */
export function homeGraph(
  description: string,
  founderImage?: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      businessEntity(description),
      founderEntity(founderImage),
      websiteEntity()
    ]
  }
}

export function serviceEntity(options: {
  name: string
  description: string
  path: string
}): WithContext<Service> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: options.name,
    description: options.description,
    url: absolute(options.path),
    areaServed,
    provider: { '@id': ids.business }
  }
}

/** Breadcrumbs from Home to the current page, e.g. Home > Services > Integrations. */
export function breadcrumbs(
  trail: { name: string; path: string }[]
): WithContext<BreadcrumbList> {
  const items = [{ name: 'Home', path: '/' }, ...trail]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path)
    }))
  }
}

/** Typed helper so pages can pass schema-dts objects to BaseLayout. */
export function asJsonLd(
  data:
    WithContext<Service> | WithContext<BreadcrumbList> | Record<string, unknown>
): Record<string, unknown> {
  return data as Record<string, unknown>
}
