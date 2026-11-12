/**
 * Loads the private list of terms that must never appear on the site
 * (employer names and identifying details). The repository is public, so the
 * terms are never committed. Sources, in order:
 *
 * 1. The SITE_CHECK_PRIVATE_TERMS environment variable: a comma-separated
 *    list, e.g. "First Term,Second Term". Set it in Netlify's environment
 *    variables for builds there.
 * 2. site-check.private.json in the project root (git-ignored), for local
 *    builds: { "employerTerms": ["First Term", "Second Term"] }
 *
 * When neither is present the site check fails, so the rule can never be
 * silently switched off.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const PRIVATE_TERMS_ENV = 'SITE_CHECK_PRIVATE_TERMS'
export const PRIVATE_TERMS_FILE = 'site-check.private.json'

export interface PrivateTerm {
  label: string
  pattern: RegExp
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A whole-word, case-insensitive pattern that also matches a plural "s". */
export function termPattern(term: string): RegExp {
  const words = term.trim().split(/\s+/).map(escapeRegExp).join('\\s+')
  return new RegExp(`\\b${words}s?\\b`, 'gi')
}

export function parseTerms(list: string[]): PrivateTerm[] {
  return list
    .map((t) => t.trim())
    .filter(Boolean)
    .map((term, index) => ({
      // Labels are numbered, never the term itself, so reports and build logs
      // (which can be public) don't reveal the list.
      label: `private term #${index + 1}`,
      pattern: termPattern(term)
    }))
}

export function loadPrivateTerms(
  root: string,
  env: Record<string, string | undefined> = process.env
): PrivateTerm[] {
  const fromEnv = env[PRIVATE_TERMS_ENV]
  if (fromEnv && fromEnv.trim()) return parseTerms(fromEnv.split(','))

  const file = path.join(root, PRIVATE_TERMS_FILE)
  if (existsSync(file)) {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
      employerTerms?: unknown
    }
    if (
      Array.isArray(parsed.employerTerms) &&
      parsed.employerTerms.every((t) => typeof t === 'string')
    ) {
      const terms = parseTerms(parsed.employerTerms as string[])
      if (terms.length > 0) return terms
    }
  }

  throw new Error(
    `The site check needs its private employer terms. Set ${PRIVATE_TERMS_ENV} ` +
      `(comma-separated) or create ${PRIVATE_TERMS_FILE} with ` +
      `{ "employerTerms": [...] }. See README, "Employers are never named".`
  )
}

/**
 * Replaces a matched term in reports. Build logs can be public, so not even
 * its first letter or length is shown; the line number locates it.
 */
export function mask(_text: string): string {
  return '[redacted]'
}
