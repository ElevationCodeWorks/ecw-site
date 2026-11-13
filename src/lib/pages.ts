import { getEntry } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

/** A page's copy from the `pages` collection; fails the build if it's missing. */
export async function getPage(id: string): Promise<CollectionEntry<'pages'>> {
  const page = await getEntry('pages', id)
  if (!page) throw new Error(`Missing page copy: src/content/pages/${id}.md`)
  return page
}
