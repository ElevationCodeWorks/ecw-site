import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'
import { currentDeployEnv, isIndexable } from '../../src/lib/env.ts'
import { formatViolations } from './report.ts'
import { runSiteCheck } from './runner.ts'

/**
 * Runs the site check after every build (design D7). Any violation fails the
 * build; a clean run is silent. Register it after integrations that write
 * build output it inspects (such as `_headers`).
 */
export function siteCheck(options: {
  productionOrigin: string
}): AstroIntegration {
  let root = process.cwd()
  return {
    name: 'ecw:site-check',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root)
      },
      'astro:build:done': async ({ logger }) => {
        const violations = await runSiteCheck({
          root,
          productionOrigin: options.productionOrigin,
          indexable: isIndexable(currentDeployEnv(), options.productionOrigin)
        })
        if (violations.length === 0) return
        for (const line of formatViolations(violations)) logger.error(line)
        throw new Error(
          `Site check failed with ${violations.length} violation(s). See above.`
        )
      }
    }
  }
}
