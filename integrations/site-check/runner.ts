import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { siteCheckConfig } from '../../site-check.config.ts'
import type { SiteCheckConfig } from '../../site-check.config.ts'
import { applyExceptions, EXCEPTIONS_FILE } from './exceptions.ts'
import { loadInputs } from './load.ts'
import { rules as defaultRules } from './rules/index.ts'
import type { CheckInputs, ExceptionEntry, Rule, Violation } from './types.ts'

/** Runs rules over prepared inputs and applies exception entries. */
export function checkInputs(
  inputs: CheckInputs,
  options: {
    rules?: Rule[]
    config?: SiteCheckConfig
    exceptions?: ExceptionEntry[]
  } = {}
): Violation[] {
  const config = options.config ?? siteCheckConfig
  const violations = (options.rules ?? defaultRules).flatMap((rule) =>
    rule(inputs, config)
  )
  return applyExceptions(violations, options.exceptions ?? [])
}

export async function readExceptions(root: string): Promise<ExceptionEntry[]> {
  const file = path.join(root, EXCEPTIONS_FILE)
  if (!existsSync(file)) return []
  const parsed: unknown = JSON.parse(await readFile(file, 'utf8'))
  if (!Array.isArray(parsed)) {
    throw new Error(`${EXCEPTIONS_FILE} must contain a JSON array`)
  }
  return parsed as ExceptionEntry[]
}

/** Loads dist/ and src/ from disk and runs the full check. */
export async function runSiteCheck(options: {
  root: string
  indexable: boolean
  productionOrigin: string
}): Promise<Violation[]> {
  const inputs = await loadInputs(options)
  const exceptions = await readExceptions(options.root)
  return checkInputs(inputs, { exceptions })
}
