/**
 * Site-wide settings (design D5). Copy that belongs to a single page lives in
 * src/content/; this file holds values shared across pages and metadata.
 */

/** A question the owner still needs to answer before launch. Never rendered. */
export interface Pending {
  question: string
}

/** The canonical origin. Every canonical URL and sitemap entry uses it. */
export const PRODUCTION_ORIGIN = 'https://elevationcode.works'

export const site = {
  brandName: 'Elevation Code Works',
  brandLine: 'AI-powered, human-driven',
  location: { city: 'Denver', region: 'CO', regionName: 'Colorado' },
  /** Appended to every page title except Home. */
  titleSuffix: ' | Elevation Code Works',
  /** Where contact-form notifications go; also shown on the Contact page. */
  publicEmail: 'tejen@elevationcode.works',
  /** Promised on the contact confirmation page. */
  replyTime: 'within 48 hours'
} as const

export const founder = {
  name: 'Tejen Shrestha',
  title: 'Founder & CEO',
  /** Public profiles, used as `sameAs` links in structured data. */
  sameAs: ['https://github.com/tshrestha']
} as const

export const nav = [
  { label: 'Services', href: '/services/' },
  { label: 'Work', href: '/work/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' }
] as const

/** Open owner questions about site-wide settings (see `npm run release-check`). */
export const pending: Pending[] = [
  {
    question:
      'What is the LinkedIn profile URL to list in structured data? Also confirm github.com/tshrestha should be listed publicly.'
  }
]
