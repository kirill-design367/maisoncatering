// Локальный просмотр собранного сайта: `npm run build && npm run serve`.
// Отдаёт ./out под тем же путём, что и на хостинге (basePath из site.config.mjs),
// с gzip — как GitHub Pages. Нужен для проверки путей и замеров скорости.

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { basePath } from '../site.config.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out')
const port = Number(process.env.PORT || 4173)
// LATENCY=40 — задержка ответа в миллисекундах: имитирует настоящий хостинг при замерах скорости.
const latency = Number(process.env.LATENCY || 0)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}
const compressible = new Set(['.html', '.js', '.css', '.json', '.txt', '.svg', '.webmanifest'])
const cache = new Map()

async function resolve(urlPath) {
  let rel = decodeURIComponent(urlPath)
  if (basePath) {
    if (rel === basePath) return { redirect: `${basePath}/` }
    if (!rel.startsWith(`${basePath}/`)) return null
    rel = rel.slice(basePath.length)
  }
  let file = path.join(root, rel)
  if (!file.startsWith(root)) return null
  try {
    const s = await stat(file)
    if (s.isDirectory()) {
      if (!rel.endsWith('/')) return { redirect: `${basePath}${rel}/` }
      file = path.join(file, 'index.html')
    }
    await stat(file)
    return { file }
  } catch {
    try {
      await stat(`${file}.html`)
      return { file: `${file}.html` }
    } catch {
      return null
    }
  }
}

createServer(async (req, res) => {
  if (latency) await new Promise((resolve) => setTimeout(resolve, latency))
  const url = new URL(req.url, 'http://localhost')
  const hit = await resolve(url.pathname)
  if (!hit) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('404')
    return
  }
  if (hit.redirect) {
    res.writeHead(301, { location: hit.redirect })
    res.end()
    return
  }
  const ext = path.extname(hit.file)
  const gzip = compressible.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')
  // Ключ кэша включает время изменения: после пересборки отдаются свежие файлы.
  const key = `${hit.file}:${gzip}:${(await stat(hit.file)).mtimeMs}`
  let body = cache.get(key)
  if (!body) {
    body = await readFile(hit.file)
    if (gzip) body = gzipSync(body)
    cache.set(key, body)
  }
  res.writeHead(200, {
    'content-type': types[ext] || 'application/octet-stream',
    'cache-control': 'max-age=600',
    ...(gzip ? { 'content-encoding': 'gzip', vary: 'Accept-Encoding' } : {}),
  })
  res.end(body)
}).listen(port, () => {
  console.log(`http://localhost:${port}${basePath}/`)
})
