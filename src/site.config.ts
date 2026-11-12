/** The canonical origin. Every canonical URL and sitemap entry uses it. */
export const PRODUCTION_ORIGIN = 'https://elevationcode.works'

export const site = {
  brandName: 'Elevation Code Works',
  brandLine: 'AI-powered, human-driven',
  location: { city: 'Denver', region: 'CO', regionName: 'Colorado' },
  /** Appended to every page title except Home. */
  titleSuffix: ' | Elevation Code Works'
} as const

export const nav = [
  { label: 'Services', href: '/services/' },
  { label: 'Work', href: '/work/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' }
] as const
