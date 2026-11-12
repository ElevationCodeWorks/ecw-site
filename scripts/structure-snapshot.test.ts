import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diffSnapshots, snapshotPage } from './structure-snapshot.ts'

const ORIGIN = 'https://elevationcode.works'
const page = (body: string, jsonLd = { '@type': 'WebSite', url: ORIGIN }) => ({
  'index.html': snapshotPage({
    file: 'index.html',
    content: `<!doctype html><html><head><title>T</title><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body>${body}</body></html>`
  })
})

const base = page(
  '<header><a href="/">Elevation Code Works</a></header><main><h1>Services</h1><p>I build <a href="/work/">software</a>.</p><h2>Websites</h2></main>'
)

test('an unchanged page produces no diff', () => {
  assert.deepEqual(diffSnapshots(base, base), [])
})

test('wrappers, classes and whitespace are not changes', () => {
  const restyled = page(
    '<header class="x"><div class="inner"><a class="brand" href="/">Elevation   Code Works</a></div></header><main><div class="hero"><h1 class="big">Services</h1>\n<p>I build <a class="u" href="/work/">software</a>.</p></div><h2>Websites</h2></main>'
  )
  assert.deepEqual(diffSnapshots(base, restyled), [])
})

test('a changed heading produces a diff', () => {
  const changed = page(
    '<header><a href="/">Elevation Code Works</a></header><main><h1>Services</h1><p>I build <a href="/work/">software</a>.</p><h2>Web sites</h2></main>'
  )
  const diff = diffSnapshots(base, changed)
  assert.ok(diff.includes('  heading removed: h2 Websites'))
  assert.ok(diff.includes('  heading added:   h2 Web sites'))
})

test('a changed heading level produces a diff', () => {
  const changed = page(
    '<header><a href="/">Elevation Code Works</a></header><main><h1>Services</h1><p>I build <a href="/work/">software</a>.</p><h3>Websites</h3></main>'
  )
  assert.ok(diffSnapshots(base, changed).some((l) => l.includes('h3 Websites')))
})

test('a changed link target produces a diff', () => {
  const changed = page(
    '<header><a href="/">Elevation Code Works</a></header><main><h1>Services</h1><p>I build <a href="/services/">software</a>.</p><h2>Websites</h2></main>'
  )
  assert.ok(
    diffSnapshots(base, changed).includes(
      '  link added:   software -> /services/'
    )
  )
})

test('changed JSON-LD produces a diff', () => {
  const changed = page(
    '<header><a href="/">Elevation Code Works</a></header><main><h1>Services</h1><p>I build <a href="/work/">software</a>.</p><h2>Websites</h2></main>',
    { '@type': 'WebSite', url: `${ORIGIN}/home/` }
  )
  assert.ok(diffSnapshots(base, changed).some((l) => l.startsWith('  JSON-LD')))
})

test('reordered sections produce a diff', () => {
  const changed = page(
    '<header><a href="/">Elevation Code Works</a></header><main><h2>Websites</h2><h1>Services</h1><p>I build <a href="/work/">software</a>.</p></main>'
  )
  assert.ok(diffSnapshots(base, changed).includes('  heading reordered'))
})

test('added and removed pages are reported', () => {
  assert.deepEqual(diffSnapshots(base, {}), ['index.html: page removed'])
  assert.deepEqual(diffSnapshots({}, base), ['index.html: page added'])
})
