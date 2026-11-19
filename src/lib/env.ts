/**
 * Decides at build time whether search engines may index this build (design D3).
 *
 * Netlify sets CONTEXT (production | deploy-preview | branch-deploy | dev) and
 * URL (the site's main address) during builds. A build is indexable only when it
 * is a production build whose main address is the canonical production host.
 * Everything else, including local builds with no Netlify variables, is not.
 */
export interface DeployEnv {
  CONTEXT?: string
  URL?: string
}

export function isIndexable(env: DeployEnv, productionOrigin: string): boolean {
  if (env.CONTEXT !== 'production' || !env.URL) return false
  try {
    return new URL(env.URL).host === new URL(productionOrigin).host
  } catch {
    return false
  }
}

/** Reads the current process environment. */
export function currentDeployEnv(): DeployEnv {
  return { CONTEXT: process.env.CONTEXT, URL: process.env.URL }
}
