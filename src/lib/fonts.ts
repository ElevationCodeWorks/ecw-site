/**
 * Web font files to preload on every page (visual-identity design D6). At
 * most two critical files: import each with `?url` so the preload and the
 * @font-face rule in src/styles/tokens.css resolve to the same hashed URL.
 *
 *   import overpass from '../assets/fonts/overpass/overpass-latin-wght-normal.woff2?url'
 *   export const preloadFonts: string[] = [overpass]
 *
 * The placeholder look uses system fonts only, so there is nothing to
 * preload.
 */
import archivo from '../assets/fonts/archivo/archivo-latin-wght-normal.woff2?url'
import archivoNarrow from '../assets/fonts/archivo-narrow/archivo-narrow-latin-wght-normal.woff2?url'
export const preloadFonts: string[] = [archivo, archivoNarrow]
