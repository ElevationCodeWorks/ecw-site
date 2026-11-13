import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const SCRIPT = path.resolve('scripts/release-check.ts')

function project(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), 'ecw-release-'))
  for (const [file, content] of Object.entries(files)) {
    const abs = path.join(root, file)
    mkdirSync(path.dirname(abs), { recursive: true })
    writeFileSync(abs, content)
  }
  return root
}

function run(root: string) {
  return spawnSync(process.execPath, [SCRIPT, root], { encoding: 'utf8' })
}

test('exits 1 and lists file and question while markers remain', () => {
  const root = project({
    'src/site.config.ts':
      "export const pending = [{ question: 'Which LinkedIn URL?' }]\n",
    'src/content/work/condies.md':
      '---\nname: Condies\npending:\n  - question: Any usage numbers to share?\n---\nBody\n'
  })
  try {
    const result = run(root)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /src\/site\.config\.ts: Which LinkedIn URL\?/)
    assert.match(
      result.stderr,
      /src\/content\/work\/condies\.md: Any usage numbers to share\?/
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('exits 0 when no markers remain', () => {
  const root = project({
    'src/site.config.ts': 'export const pending = []\n',
    'src/content/work/condies.md': '---\nname: Condies\npending: []\n---\n'
  })
  try {
    const result = run(root)
    assert.equal(result.status, 0)
    assert.match(result.stdout, /No pending owner input/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
