import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

/** The service catalog has exactly this many entries (site-content spec). */
export const SERVICE_COUNT = 6

/**
 * All services in display order. Fails the build unless there are exactly six,
 * with exactly one entry offer.
 */
export async function getServices(): Promise<CollectionEntry<'services'>[]> {
  const services = (await getCollection('services')).sort(
    (a, b) => a.data.order - b.data.order
  )
  if (services.length !== SERVICE_COUNT) {
    throw new Error(
      `Expected exactly ${SERVICE_COUNT} services, found ${services.length}: ${services.map((s) => s.id).join(', ')}`
    )
  }
  const entryOffers = services.filter((s) => s.data.isEntryOffer)
  if (entryOffers.length !== 1) {
    throw new Error(
      `Expected exactly one entry-offer service, found ${entryOffers.length}`
    )
  }
  return services
}
