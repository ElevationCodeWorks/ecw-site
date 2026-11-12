import type { Rule } from '../types.ts'
import { brandColorRules } from './brand-color.ts'
import { brandCopyRules } from './brand-copy.ts'
import { brandStyleRules } from './brand-style.ts'
import { identityRules } from './identity.ts'
import { platformRules } from './platform.ts'
import { seoRules } from './seo.ts'

/** Every rule the site check runs, in reporting order. */
export const rules: Rule[] = [
  ...brandCopyRules,
  ...brandStyleRules,
  ...brandColorRules,
  ...identityRules,
  ...platformRules,
  ...seoRules
]
