import { existsSync } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { CheckInputs, CssSource, DistImage, SourceFile } from './types.ts'

const DIST_TEXT_EXTENSIONS = new Set([
  '.html',
  '.xml',
  '.txt',
  '.json',
  '.svg',
  '.webmanifest'
])

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
])

/** A PNG's format and size, read from its signature and IHDR header. */
export function pngHeader(bytes: Buffer): Omit<DistImage, 'file'> {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE))
    return { format: 'unknown', width: 0, height: 0 }
  return {
    format: 'png',
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  }
}

/** Raster and vector image files. */
export const IMAGE_EXTENSION =
  /\.(?:png|jpe?g|webp|avif|gif|tiff?|bmp|heic|heif|ico|svg)$/i

async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
    .sort()
}

async function readSources(
  root: string,
  files: string[]
): Promise<SourceFile[]> {
  return Promise.all(
    files.map(async (abs) => ({
      file: path.relative(root, abs).split(path.sep).join('/'),
      content: await readFile(abs, 'utf8')
    }))
  )
}

/** Extracts every <style> block from an .astro file, keeping line offsets. */
export function astroStyleBlocks(source: SourceFile): CssSource[] {
  const blocks: CssSource[] = []
  for (const m of source.content.matchAll(
    /<style\b[^>]*>([\s\S]*?)<\/style>/g
  )) {
    const start = (m.index ?? 0) + m[0].indexOf('>') + 1
    const lineOffset = source.content.slice(0, start).split('\n').length - 1
    blocks.push({ file: source.file, css: m[1], lineOffset })
  }
  return blocks
}

function sitemapPageUrls(distText: SourceFile[]): string[] {
  return distText
    .filter((f) => /^dist\/sitemap-\d+\.xml$/.test(f.file))
    .flatMap((f) => [...f.content.matchAll(/<loc>([^<]+)<\/loc>/g)])
    .map((m) => m[1])
}

export interface LoadOptions {
  root: string
  indexable: boolean
  productionOrigin: string
  tokensFile?: string
}

/** Reads dist/ and src/ into the shape the rules expect. */
export async function loadInputs(options: LoadOptions): Promise<CheckInputs> {
  const { root } = options
  const distFiles = await listFiles(path.join(root, 'dist'))
  const srcFiles = await listFiles(path.join(root, 'src'))
  const publicFiles = await listFiles(path.join(root, 'public'))

  const distText = await readSources(
    root,
    distFiles.filter(
      (f) =>
        DIST_TEXT_EXTENSIONS.has(path.extname(f)) ||
        path.basename(f) === '_headers'
    )
  )
  const html = distText.filter((f) => f.file.endsWith('.html'))

  const cssFiles = await readSources(
    root,
    srcFiles.filter((f) => f.endsWith('.css'))
  )
  const astro = await readSources(
    root,
    srcFiles.filter((f) => f.endsWith('.astro'))
  )
  const css: CssSource[] = [
    ...cssFiles.map((f) => ({ file: f.file, css: f.content, lineOffset: 0 })),
    ...astro.flatMap(astroStyleBlocks)
  ]

  const headersFile = distText.find((f) => f.file === 'dist/_headers')

  const brandSvg = [
    ...(await readSources(
      root,
      srcFiles.filter(
        (f) =>
          f.endsWith('.svg') &&
          path
            .relative(root, f)
            .split(path.sep)
            .join('/')
            .startsWith('src/assets/brand/')
      )
    )),
    ...distText.filter((f) => f.file === 'dist/icon.svg')
  ]

  return {
    html,
    distText,
    css,
    astro,
    brandSvg,
    fontFiles: await Promise.all(
      srcFiles
        .filter((f) =>
          path
            .relative(root, f)
            .split(path.sep)
            .join('/')
            .startsWith('src/assets/fonts/')
        )
        .map(async (f) => ({
          file: path.relative(root, f).split(path.sep).join('/'),
          bytes: (await stat(f)).size
        }))
    ),
    distCss: await readSources(
      root,
      distFiles.filter((f) => f.endsWith('.css'))
    ),
    distImages: await Promise.all(
      distFiles
        .filter((f) => f.endsWith('.png'))
        .map(async (f) => ({
          file: path.relative(root, f).split(path.sep).join('/'),
          ...pngHeader((await readFile(f)).subarray(0, 24))
        }))
    ),
    imageFiles: [...srcFiles, ...publicFiles]
      .filter((f) => IMAGE_EXTENSION.test(f))
      .map((f) => path.relative(root, f).split(path.sep).join('/')),
    tokensFile: options.tokensFile ?? 'src/styles/tokens.css',
    headers: headersFile ? headersFile.content : null,
    sitemapUrls: sitemapPageUrls(distText),
    indexable: options.indexable,
    productionOrigin: options.productionOrigin
  }
}
