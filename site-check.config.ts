/**
 * Site check configuration: the banned patterns and thresholds behind the
 * brand-guardrails, seo and site-platform rules. Extend these lists rather than
 * adding exceptions when a new pattern should be banned everywhere.
 */
export const siteCheckConfig = {
  /** The brand name, exactly as it appears in titles and metadata. */
  brandName: 'Elevation Code Works',

  /**
   * The only allowed uses of "elevat…": the exact brand name and its domain
   * (which also appears in the contact email address). Compared
   * case-insensitively.
   */
  brandAllowList: ['Elevation Code Works', 'elevationcode.works'],

  /** Marketing words banned from page copy, in any form. */
  bannedWords: [
    { label: 'elevate', pattern: /\belevat\w*/gi },
    { label: 'unlock', pattern: /\bunlock\w*/gi },
    { label: 'seamless', pattern: /\bseamless\w*/gi },
    { label: 'supercharge', pattern: /\bsupercharg\w*/gi },
    { label: 'effortless', pattern: /\beffortless\w*/gi },
    { label: 'game-changer', pattern: /\bgame[- ]chang\w*/gi },
    { label: 'cutting-edge', pattern: /\bcutting[- ]edge\b/gi },
    { label: 'empower', pattern: /\bempower\w*/gi },
    {
      label: 'leverage (verb)',
      pattern:
        /\bleverag(?:ed|es|ing)\b|\bleverage\s+(?:the|your|our|my|a|an|it|its|this|these|those|ai|existing|modern)\b/gi
    },
    { label: 'synergy', pattern: /\bsynerg\w*/gi }
  ],

  /** Cliche constructions banned from page copy. */
  bannedPhrases: [
    {
      label: 'not just',
      pattern: /\b(?:not|isn['’]t|aren['’]t|wasn['’]t)\s+just\b/gi
    },
    {
      label: "in today's fast-paced",
      pattern: /\bin today['’]s fast[- ]paced\b/gi
    },
    { label: "whether you're", pattern: /\bwhether you['’]re\b/gi }
  ],

  /** Button or link text that may not stand alone. Compared case-insensitively. */
  genericCtas: ['get started', 'learn more'],

  /** Attribute that marks the brand line element (no em dashes allowed). */
  brandLineAttribute: 'data-brand-line',

  /** Link text may not end with an arrow. */
  trailingArrow: /(?:→|↗|➜|➔|⟶|»|›|->)\s*$/u,

  /** "01 / Services" style labels outside an ordered list. */
  numberedLabel: /^0\d(?:\s*(?:\/|—|–|-|\.|:|\|).*)?$/u,

  emoji: /\p{Extended_Pictographic}/u,

  /** First-person plural; the uppercase country name "US" is allowed. */
  firstPersonPlural: /\b(?:we|we['’](?:re|ve|ll|d)|our|ours|ourselves|us)\b/gi,

  /** Font families that may not appear in any stylesheet or token. */
  bannedFonts: [
    'Inter',
    'Geist',
    'Geist Mono',
    'Space Grotesk',
    'Instrument Serif',
    'Fraunces',
    'Playfair Display',
    'Newsreader',
    'JetBrains Mono',
    'IBM Plex Mono',
    'Roboto',
    'Poppins',
    'Open Sans',
    'Lato'
  ],

  /** Monospace may only style these elements. */
  monospaceAllowedTags: ['code', 'kbd', 'samp', 'pre'],

  /** Values that make a font declaration monospace. */
  monospaceMarkers: [
    'monospace',
    '--font-mono',
    'ui-monospace',
    'sf mono',
    'menlo',
    'consolas',
    'courier'
  ],

  /** Radii at or above these sizes read as pills or circles. */
  pillRadius: { minPx: 100, minEm: 6 },

  /**
   * Colors a token may not match: Anthropic's palette, Claude's default cream
   * and rust, and the default AI indigo/violet.
   */
  referenceColors: [
    { hex: '#D97757', label: 'Anthropic clay' },
    { hex: '#C6613F', label: 'Anthropic clay (interactive)' },
    { hex: '#FAF9F5', label: 'Anthropic ivory' },
    { hex: '#F0EEE6', label: 'Anthropic ivory (medium)' },
    { hex: '#E8E6DC', label: 'Anthropic ivory (dark)' },
    { hex: '#E3DACC', label: 'Anthropic oat' },
    { hex: '#F4F1EA', label: 'Claude default cream' },
    { hex: '#F7F1E4', label: 'Claude cream variant' },
    { hex: '#D9622B', label: 'Claude default rust' },
    { hex: '#6366F1', label: 'AI indigo-500' },
    { hex: '#4F46E5', label: 'AI indigo-600' },
    { hex: '#8B5CF6', label: 'AI violet-500' }
  ],

  /**
   * deltaE: CIEDE2000 distance below which a token counts as the reference.
   * neutralChroma: OKLCH chroma below which a color is a true neutral (white,
   * black, gray). Neutrals are exempt from the reference comparison because
   * the banned creams differ from white only by their warm tint, which the
   * warm off-white category catches instead.
   */
  colorMatch: { deltaE: 8, neutralChroma: 0.004 },

  /** Token names treated as backgrounds for the warm off-white rule. */
  backgroundTokenPattern: /(bg|background|surface|ground|paper|canvas|page)/i,

  /** OKLCH ranges (L 0-1, C, hue degrees) for the banned color categories. */
  warmOffWhite: { minL: 0.93, minC: 0.004, maxC: 0.06, minH: 50, maxH: 110 },
  orangeAccent: { minL: 0.45, maxL: 0.8, minC: 0.09, minH: 35, maxH: 75 },

  /** Search metadata limits (seo spec). */
  seo: {
    titleMax: 60,
    descriptionMin: 70,
    descriptionMax: 160,
    /** Every title except Home ends with this. */
    titleSuffix: 'Elevation Code Works'
  },

  /**
   * Terms that may never appear anywhere in the build, including metadata and
   * JSON-LD: employer names and details that would identify them.
   *
   * Deliberately empty here: this repository is public, so the real list is
   * loaded at run time from the SITE_CHECK_PRIVATE_TERMS environment variable
   * or the git-ignored site-check.private.json (see
   * integrations/site-check/private-terms.ts). Never commit the terms.
   */
  employerTerms: [] as { label: string; pattern: RegExp }[]
}

export type SiteCheckConfig = typeof siteCheckConfig
