import { defineCollection, reference } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { site } from './site.config.ts'

/** Titles get the brand suffix appended, so the subject must leave room for it. */
const TITLE_MAX = 60
const SUFFIXED_TITLE_MAX = TITLE_MAX - site.titleSuffix.length

/** Owner questions; never rendered. Listed by `npm run release-check`. */
const pending = z.array(z.object({ question: z.string().min(1) })).default([])

const description = z.string().min(70).max(160)

/**
 * Trail-rating marks, one per service: the size of the commitment, the way
 * ski runs are rated (visual-identity design D9).
 */
export const RATINGS = ['green-circle', 'blue-square', 'black-diamond'] as const
const rating = z.enum(RATINGS)

/** The Services page legend: every rating exactly once, with what it means. */
const ratingLegend = z
  .array(
    z.object({
      rating,
      name: z.string().min(1),
      meaning: z.string().min(1)
    })
  )
  .refine(
    (legend) =>
      legend.length === RATINGS.length &&
      RATINGS.every((r) => legend.filter((l) => l.rating === r).length === 1),
    {
      message: `ratingLegend must list ${RATINGS.join(', ')} exactly once each`
    }
  )

const suffixedSeo = z.object({
  title: z.string().min(1).max(SUFFIXED_TITLE_MAX),
  description
})

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string().min(1),
    order: z.number().int(),
    summary: z.string().min(1),
    forWho: z.string().min(1),
    included: z.array(z.string().min(1)).min(1),
    notIncluded: z.array(z.string().min(1)).min(1),
    relatedWork: z.array(reference('work')).default([]),
    isEntryOffer: z.boolean().default(false),
    rating,
    seo: suffixedSeo,
    pending
  })
})

const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      order: z.number().int(),
      /** One sentence: what the project is. */
      description: z.string().min(1),
      audience: z.string().min(1),
      role: z.string().min(1),
      client: z.string().optional(),
      liveUrl: z.url(),
      screenshots: z
        .array(
          z.object({
            image: image(),
            alt: z.string().min(20),
            viewport: z.enum(['desktop', 'mobile'])
          })
        )
        .min(1),
      /** When the screenshots were captured (ISO date). */
      screenshotsCapturedAt: z.coerce.date(),
      /** Every outcome must say where it comes from and when it was measured. */
      outcomes: z
        .array(
          z.object({
            claim: z.string().min(1),
            source: z.string().min(1),
            /** A date, or text such as "November 2026". */
            measuredAt: z.union([z.date(), z.string().min(1)])
          })
        )
        .default([]),
      seo: suffixedSeo,
      pending
    })
})

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z
    .object({
      /** Home uses its title as-is; every other page gets the brand suffix. */
      fullTitle: z.boolean().default(false),
      seo: z.object({ title: z.string().min(1).max(TITLE_MAX), description }),
      h1: z.string().min(1),
      lede: z.string().optional(),
      cta: z.object({ label: z.string(), href: z.string() }).optional(),
      workHeading: z.string().optional(),
      servicesHeading: z.string().optional(),
      photoAlt: z.string().optional(),
      dataUse: z.string().optional(),
      ratingLegendHeading: z.string().optional(),
      ratingLegendIntro: z.string().optional(),
      ratingLegend: ratingLegend.optional(),
      pending
    })
    .refine((p) => p.fullTitle || p.seo.title.length <= SUFFIXED_TITLE_MAX, {
      message: `seo.title must be at most ${SUFFIXED_TITLE_MAX} characters (the brand suffix is appended)`,
      path: ['seo', 'title']
    })
})

export const collections = { services, work, pages }
