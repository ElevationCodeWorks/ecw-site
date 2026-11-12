/**
 * Minimal static server for audits, close to how Netlify serves dist/:
 * directories serve their index.html, unknown paths get 404.html with status
 * 404, and text responses are gzip-compressed when the client accepts it.
 */
import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp'
}
const COMPRESSIBLE = /^(text\/|application\/(json|xml)|image\/svg)/

function resolveFile(root, pathname) {
  const target = path.join(root, decodeURIComponent(pathname))
  if (!target.startsWith(root)) return null
  if (pathname.endsWith('/')) {
    const index = path.join(target, 'index.html')
    return existsSync(index) ? { file: index } : null
  }
  if (existsSync(target) && statSync(target).isFile()) return { file: target }
  if (existsSync(path.join(target, 'index.html'))) {
    return { redirect: `${pathname}/` }
  }
  return null
}

export function serveDist(dir, port) {
  const root = path.resolve(dir)
  const server = http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost')
    const found = resolveFile(root, pathname)
    if (found?.redirect) {
      res.writeHead(301, { Location: found.redirect }).end()
      return
    }
    const file = found?.file ?? path.join(root, '404.html')
    const status = found ? 200 : 404
    const type = TYPES[path.extname(file)] ?? 'application/octet-stream'
    let body = await readFile(file)
    const headers = { 'Content-Type': type }
    if (
      COMPRESSIBLE.test(type) &&
      /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')
    ) {
      body = gzipSync(body)
      headers['Content-Encoding'] = 'gzip'
    }
    res.writeHead(status, headers).end(body)
  })
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () =>
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done))
      })
    )
  })
}
