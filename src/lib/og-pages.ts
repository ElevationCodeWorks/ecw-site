/**
 * The pages that get their own social image: the same indexable pages the
 * sitemap lists, plus the default image used by the not-found and contact
 * confirmation pages (visual-identity design D7).
 */
import { getCollection } from 'astro:content'
import { site } from '../site.config.ts'
import { getPage } from './pages.ts'
import { ogSubject } from './og.ts'

export interface OgPage {
  /** Image path under /og/, without the extension, e.g. "services/websites". */
  slug: string
  title: string
}

/** Shown on, and describing, the image of pages that aren't indexed. */
export const DEFAULT_OG = {
  title: 'Custom software and websites for Denver small businesses',
  alt: `${site.brandName}: custom software and websites for Denver small businesses.`
}

export async function ogPages(): Promise<OgPage[]> {
  const title = async (id: string) => (await getPage(id)).data.seo.title
  const [services, work] = await Promise.all([
    getCollection('services'),
    getCollection('work')
  ])
  return [
    { slug: 'home', title: ogSubject(await title('home'), site.brandName) },
    { slug: 'services', title: await title('services') },
    ...services.map((s) => ({
      slug: `services/${s.id}`,
      title: s.data.seo.title
    })),
    { slug: 'work', title: await title('work') },
    ...work.map((w) => ({ slug: `work/${w.id}`, title: w.data.seo.title })),
    { slug: 'about', title: await title('about') },
    { slug: 'contact', title: await title('contact') },
    { slug: 'default', title: DEFAULT_OG.title }
  ]
}
