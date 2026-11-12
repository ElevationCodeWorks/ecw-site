/**
 * Lists every question the owner still needs to answer before launch:
 * `pending` entries in src/site.config.ts and in content frontmatter.
 *
 *   npm run release-check            # check this project
 *   node scripts/release-check.ts DIR  # check another project root
 *
 * Exits 1 while any remain, 0 when there are none. Preview builds are not
 * affected; this gate is for launch.
 */
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse } from 'yaml'

export interface PendingItem {
  file: string
  question: string
}

interface HasPending {
  pending?: { question?: unknown }[]
}

function questionsOf(data: unknown): string[] {
  const list = (data as HasPending | null)?.pending
  return Array.isArray(list)
    ? list
        .map((p) => p?.question)
        .filter((q): q is string => typeof q === 'string')
    : []
}

/** The YAML frontmatter of a Markdown file, or null when there is none. */
function frontmatter(markdown: string): unknown {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match ? parse(match[1]) : null
}

export async function collectPending(root: string): Promise<PendingItem[]> {
  const items: PendingItem[] = []

  const configFile = path.join(root, 'src', 'site.config.ts')
  if (existsSync(configFile)) {
    const config: unknown = await import(pathToFileURL(configFile).href)
    for (const question of questionsOf(config)) {
      items.push({ file: 'src/site.config.ts', question })
    }
  }

  const contentDir = path.join(root, 'src', 'content')
  if (existsSync(contentDir)) {
    const entries = await readdir(contentDir, {
      recursive: true,
      withFileTypes: true
    })
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => path.join(e.parentPath, e.name))
      .sort()
    for (const file of files) {
      const data = frontmatter(await readFile(file, 'utf8'))
      for (const question of questionsOf(data)) {
        items.push({
          file: path.relative(root, file).split(path.sep).join('/'),
          question
        })
      }
    }
  }

  return items
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  const root = path.resolve(process.argv[2] ?? process.cwd())
  const items = await collectPending(root)
  if (items.length === 0) {
    console.log('No pending owner input. Ready for launch.')
  } else {
    console.error(
      `${items.length} question(s) still need the owner's answer:\n`
    )
    for (const item of items) console.error(`- ${item.file}: ${item.question}`)
    process.exitCode = 1
  }
}
