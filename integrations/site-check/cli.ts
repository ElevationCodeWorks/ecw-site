/**
 * Runs the site check against an existing build: `npm run check:site`.
 * Exits 1 and prints one line per violation; prints nothing on success.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { currentDeployEnv, isIndexable } from '../../src/lib/env.ts'
import { PRODUCTION_ORIGIN } from '../../src/site.config.ts'
import { formatViolations } from './report.ts'
import { runSiteCheck } from './runner.ts'

const root = process.cwd()

if (!existsSync(path.join(root, 'dist'))) {
  console.error('No dist/ folder. Run `npm run build` first.')
  process.exit(1)
}

const violations = await runSiteCheck({
  root,
  productionOrigin: PRODUCTION_ORIGIN,
  indexable: isIndexable(currentDeployEnv(), PRODUCTION_ORIGIN)
})

if (violations.length > 0) {
  for (const line of formatViolations(violations)) console.error(line)
  console.error(`\nSite check failed with ${violations.length} violation(s).`)
  process.exit(1)
}
