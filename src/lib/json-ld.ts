/**
 * Serializes structured data for an inline <script type="application/ld+json">.
 * Escapes "<" so content can never close the script element early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
