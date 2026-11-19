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

  /**
   * Font families that may not appear in any stylesheet, token or web-font
   * link: the default AI-site and template favorites. A family that extends a
   * banned name by whole words ("Inter Tight", "Roboto Slab") is banned too.
   */
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
    'Lato',
    'DM Sans',
    'DM Serif Display',
    'Plus Jakarta Sans',
    'Manrope',
    'Outfit',
    'Sora',
    'Bricolage Grotesque',
    'Syne',
    'Satoshi',
    'General Sans',
    'Cabinet Grotesk',
    'Clash Display',
    'Cormorant Garamond',
    'Space Mono',
    'Montserrat'
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
   * Eyebrow labels and tracked kickers: letter spacing above this many em
   * (px divided by 16) is banned, as are uppercase and all-small-caps text.
   */
  maxLetterSpacingEm: 0.05,

  /**
   * Shadows: a blur radius above maxBlurPx, or a color with OKLCH chroma at
   * or above maxChroma, reads as a glow.
   */
  shadow: { maxBlurPx: 24, maxChroma: 0.02 },

  /** Transitions longer than this read as motion design. */
  maxTransitionMs: 250,

  /**
   * The only place keyframe and scroll-driven animation is allowed: the Home
   * hero's own components (visual-identity design D14). Each animation there
   * must sit inside a media query matching `guard`, so visitors who prefer
   * reduced motion never see it.
   */
  heroMotion: {
    files: /^src\/components\/hero\//,
    guard: /prefers-reduced-motion\s*:\s*no-preference/i
  },

  /**
   * Web font budget (visual-identity spec): families and files declared with
   * @font-face url() sources (fallback faces with only local() sources don't
   * count), their total size, and font preloads per page.
   */
  fontBudget: { maxFamilies: 2, maxFiles: 4, maxKB: 150, maxPreloads: 2 },

  /** Hosts that serve web fonts. Pages may not load fonts from any of them. */
  fontHosts: [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'use.typekit.net',
    'p.typekit.net',
    'fonts.bunny.net',
    'fonts.cdnfonts.com',
    'fast.fonts.net',
    'cloud.typography.com',
    'cdn.jsdelivr.net',
    'unpkg.com'
  ],

  /**
   * Colors a token (in either scheme) or a brand SVG may not match: Anthropic's
   * palette, Claude's default cream and rust, the default AI indigo/violet, and
   * the default AI dark navy.
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
    { hex: '#8B5CF6', label: 'AI violet-500' },
    { hex: '#0F172A', label: 'AI dark navy (slate-900)' },
    { hex: '#020617', label: 'AI dark navy (slate-950)' },
    { hex: '#111827', label: 'AI dark navy (gray-900)' },
    { hex: '#1E293B', label: 'AI dark navy (slate-800)' }
  ],

  /**
   * The showcased portfolio sites' typefaces and primary colors. They are
   * independent work, not a style source, so the ECW identity may not echo
   * them (brand-guardrails spec). Sampled from each site's Home page with
   * scripts/sample-portfolio.mjs; re-run it and paste the output to refresh.
   * Condies' colors follow the weather, so its sample is one day's palette.
   */
  portfolioSampledAt: '2026-11-12',
  portfolioReferences: [
    {
      site: 'whatcanido.earth',
      fonts: ['HCo Gotham', 'Fields'],
      colors: ['#FF4438', '#004660', '#6FB1C8']
    },
    {
      site: 'condies.fyi',
      fonts: ['Chivo'],
      colors: ['#F4EA68', '#93E5E4']
    },
    {
      site: 'uphillskico.com',
      fonts: ['Mona Sans'],
      colors: ['#0A1338', '#535F8A', '#DEE6FB', '#FAF0D7', '#FFC22E', '#1838E0']
    }
  ] as { site: string; fonts: string[]; colors: string[] }[],

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
  /**
   * Violet, purple and magenta: indigo-500 sits at 277°, fuchsia-500 at 322°.
   * Standard blues (the placeholder link at 260.6°, blue-700 at 264.4°) and
   * pinks (354°) fall outside.
   */
  violetAccent: { minC: 0.08, minH: 270, maxH: 335 },

  /**
   * Foreground/background token pairs and their minimum WCAG contrast,
   * measured in both color schemes (visual-identity spec, design D5). Text
   * needs 4.5; large text, strong borders, focus rings, fills and graphics
   * need 3. Add a pair whenever a component puts a new token on a background.
   */
  contrastPairs: [
    { fg: '--color-text', bg: '--color-bg', min: 4.5 },
    { fg: '--color-text', bg: '--color-surface', min: 4.5 },
    { fg: '--color-text-muted', bg: '--color-bg', min: 4.5 },
    { fg: '--color-text-muted', bg: '--color-surface', min: 4.5 },
    { fg: '--color-link', bg: '--color-bg', min: 4.5 },
    { fg: '--color-link', bg: '--color-surface', min: 4.5 },
    { fg: '--color-link-hover', bg: '--color-bg', min: 4.5 },
    { fg: '--color-link-hover', bg: '--color-surface', min: 4.5 },
    { fg: '--color-on-accent', bg: '--color-accent', min: 4.5 },
    { fg: '--color-accent', bg: '--color-bg', min: 3 },
    { fg: '--color-border-strong', bg: '--color-bg', min: 3 },
    { fg: '--color-border-strong', bg: '--color-surface', min: 3 },
    { fg: '--color-focus', bg: '--color-bg', min: 3 },
    { fg: '--color-focus', bg: '--color-surface', min: 3 },
    { fg: '--color-error', bg: '--color-bg', min: 4.5 }
  ] as { fg: string; bg: string; min: number }[],

  /** Size of every page's social preview image (seo spec). */
  socialImage: { width: 1200, height: 630 },

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
