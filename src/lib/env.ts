/**
 * Decides at build time whether search engines may index this build
 * (site-platform spec, "Non-production builds stay out of search").
 *
 * A build is indexable only when SITE_ENV is exactly "production". The
 * DigitalOcean app sets it as a build-time variable (.do/app.yaml). Every
 * other build, including local builds and tests, leaves it unset and is
 * marked noindex.
 */
export interface DeployEnv {
  SITE_ENV?: string
}

export function isIndexable(env: DeployEnv): boolean {
  return env.SITE_ENV === 'production'
}

/** Reads the current process environment. */
export function currentDeployEnv(): DeployEnv {
  return { SITE_ENV: process.env.SITE_ENV }
}
