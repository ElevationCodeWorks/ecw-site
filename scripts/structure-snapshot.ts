/**
 * Structure baseline for the visual identity change (design D11): proves a
 * restyle changed no copy, headings, links or structured data.
 *
 *   node scripts/structure-snapshot.ts capture   # write the baseline from dist/
 *   node scripts/structure-snapshot.ts check     # diff dist/ against it
 *   npm run check:structure                      # build, then check
 *
 * For every built page it records the visible text in DOM order, the heading
 * outline, every link (text and href) and the JSON-LD. Whitespace is
 * normalized, so wrappers, classes and formatting don't count as changes.
 * Exits 1 on any difference.
 */
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyTextNodes, parsePage } from '../integrations/site-check/html.ts'
import type { SourceFile } from '../integrations/site-check/types.ts'

export const BASELINE_FILE =
  'openspec/changes/visual-identity/structure-baseline.json'

export interface PageSnapshot {
  text: string[]
  headings: string[]
  links: string[]
  jsonLd: unknown[]
}

export type Snapshot = Record<string, PageSnapshot>

const squash = (s: string) => s.replace(/\s+/g, ' ').trim()

/** The structure of one built page. */
export function snapshotPage(source: SourceFile): PageSnapshot {
  const page = parsePage(source)
  const body = page.root.querySelector('body') ?? page.root
  const text = copyTextNodes({ ...page, root: body })
    .map((t) => squash(t.text))
    .filter(Boolean)
  const headings = body
    .querySelectorAll('h1, h2, h3, h4, h5, h6')
    .map((h) => `${h.rawTagName.toLowerCase()} ${squash(h.text)}`)
  const links = body
    .querySelectorAll('a[href]')
    .map((a) => `${squash(a.text)} -> ${a.getAttribute('href')}`)
  const jsonLd = page.root
    .querySelectorAll('script[type="application/ld+json"]')
    .map((s) => JSON.parse(s.text) as unknown)
  return { text, headings, links, jsonLd }
}

/** Snapshots every HTML file under a dist directory, keyed by path. */
export async function snapshotDist(dist = 'dist'): Promise<Snapshot> {
  const entries = await readdir(dist, { recursive: true, withFileTypes: true })
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => path.join(e.parentPath, e.name))
    .sort()
  const snapshot: Snapshot = {}
  for (const file of files) {
    const key = path.relative(dist, file).split(path.sep).join('/')
    snapshot[key] = snapshotPage({
      file: key,
      content: await readFile(file, 'utf8')
    })
  }
  return snapshot
}

/** One list's differences: removed and added items, or a reordering. */
function diffList(label: string, before: string[], after: string[]): string[] {
  const out: string[] = []
  const removed = before.filter((x) => !after.includes(x))
  const added = after.filter((x) => !before.includes(x))
  for (const x of removed) out.push(`  ${label} removed: ${x}`)
  for (const x of added) out.push(`  ${label} added:   ${x}`)
  if (!out.length && before.join('\n') !== after.join('\n'))
    out.push(`  ${label} reordered`)
  return out
}

/** Human-readable differences between two snapshots; [] when identical. */
export function diffSnapshots(base: Snapshot, current: Snapshot): string[] {
  const out: string[] = []
  const pages = [
    ...new Set([...Object.keys(base), ...Object.keys(current)])
  ].sort()
  for (const page of pages) {
    const a = base[page]
    const b = current[page]
    if (!a) {
      out.push(`${page}: page added`)
      continue
    }
    if (!b) {
      out.push(`${page}: page removed`)
      continue
    }
    const lines = [
      ...diffList('heading', a.headings, b.headings),
      ...diffList('link', a.links, b.links),
      ...diffList('text', a.text, b.text),
      ...diffList(
        'JSON-LD',
        a.jsonLd.map((j) => JSON.stringify(j)),
        b.jsonLd.map((j) => JSON.stringify(j))
      )
    ]
    if (lines.length) out.push(`${page}:`, ...lines)
  }
  return out
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  const mode = process.argv[2]
  if (mode === 'capture') {
    const snapshot = await snapshotDist()
    await writeFile(BASELINE_FILE, `${JSON.stringify(snapshot, null, 2)}\n`)
    console.log(
      `Wrote ${BASELINE_FILE} (${Object.keys(snapshot).length} pages).`
    )
  } else if (mode === 'check') {
    if (!existsSync(BASELINE_FILE)) {
      console.error(`No baseline at ${BASELINE_FILE}. Run "capture" first.`)
      process.exit(1)
    }
    const base = JSON.parse(await readFile(BASELINE_FILE, 'utf8')) as Snapshot
    const diff = diffSnapshots(base, await snapshotDist())
    if (diff.length) {
      console.error('Structure changed:\n' + diff.join('\n'))
      process.exit(1)
    }
    console.log(
      `Structure matches the baseline (${Object.keys(base).length} pages).`
    )
  } else {
    console.error('Usage: node scripts/structure-snapshot.ts capture|check')
    process.exit(2)
  }
}
