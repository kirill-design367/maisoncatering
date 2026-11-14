// Подготовка изображений для веба: `npm run images`.
//
// Исходники лежат в public/images/*.jpg (их кладёт арт-директор, скрипт их не меняет).
// Скрипт пишет в public/images/gen/ варианты AVIF и WebP нескольких ширин
// и манифест src/data/images.gen.ts, из которого компонент <Picture> собирает srcset.
// Результат закоммичен в репозиторий: на CI скрипт не запускается.
//
// Запускать после замены или добавления исходников. Уже готовые файлы не пересобираются;
// если исходник заменён под тем же именем — запускать с флагом: npm run images -- --force

import { access, mkdir, readdir, rm, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'public/images')
const OUT = path.join(SRC, 'gen')
const MANIFEST = path.join(root, 'src/data/images.gen.ts')

// Ширины вариантов. Исходники не шире 1200px, поэтому крупнее не делаем:
// вариант «native» — это исходная ширина кадра.
const WIDTHS = [480, 720]

// Тарелка на первом экране. Границы круга определены по самому кадру
// (radial edge fit по hero-dish.jpg 1024×1024): центр (511.5, 512.5), радиус 378.5px.
// При замене кадра эти три числа нужно определить заново.
const PLATE = { left: 133, top: 134, size: 757 }
// 1136 — увеличение ×1.5 с лёгкой резкостью: на 2560 и ретине браузер иначе растянет 757px сам.
const PLATE_WIDTHS = [380, 560, 757, 1136]

// Кадры, которые на больших экранах показываются шире исходника. Для них делается увеличенный
// вариант (Lanczos + лёгкая резкость): он чище, чем растягивание браузером. Это не замена
// исходникам большего размера — как только они появятся, строки отсюда нужно убрать.
const UPSCALE = { 'direction-events': 1392, 'direction-delivery': 1392 }

// Файлы, которые уже есть, не пересобираются (кодирование AVIF небыстрое). Полная пересборка: --force.
const FORCE = process.argv.includes('--force')

const exists = (file) => access(file).then(() => true, () => false)

const avifOpts = { quality: 56, effort: 5 }
const webpOpts = { quality: 78, effort: 6, smartSubsample: true }

async function emit(pipeline, base, width) {
  const files = {}
  for (const [ext, opts] of [['avif', avifOpts], ['webp', webpOpts]]) {
    const file = `${base}-${width}.${ext}`
    if (FORCE || !(await exists(path.join(OUT, file)))) {
      await pipeline.clone()[ext](opts).toFile(path.join(OUT, file))
    }
    files[ext] = `/images/gen/${file}`
  }
  return files
}

async function processPhoto(name) {
  const input = path.join(SRC, `${name}.jpg`)
  const meta = await sharp(input).metadata()
  const widths = [...WIDTHS.filter((w) => w < meta.width), meta.width]
  const entry = { width: meta.width, height: meta.height, avif: [], webp: [] }
  for (const w of widths) {
    const pipeline = sharp(input).rotate().resize({ width: w, withoutEnlargement: true })
    const files = await emit(pipeline, name, w)
    entry.avif.push([w, files.avif])
    entry.webp.push([w, files.webp])
  }
  if (UPSCALE[name]) {
    const w = UPSCALE[name]
    const pipeline = sharp(input).rotate().resize({ width: w, kernel: 'lanczos3' }).sharpen({ sigma: 0.6 })
    const files = await emit(pipeline, name, w)
    entry.avif.push([w, files.avif])
    entry.webp.push([w, files.webp])
  }
  return entry
}

async function processPlate() {
  const input = path.join(SRC, 'hero-dish.jpg')
  const { left, top, size } = PLATE
  const r = size / 2
  // Маска-круг: всё за ободом тарелки становится прозрачным.
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r - 0.25}" fill="#fff"/></svg>`,
  )
  const cut = await sharp(input)
    .extract({ left, top, width: size, height: size })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  const entry = { width: size, height: size, avif: [], webp: [] }
  for (const w of PLATE_WIDTHS) {
    let pipeline = sharp(cut).resize({ width: w, kernel: 'lanczos3' })
    if (w > size) pipeline = pipeline.sharpen({ sigma: 0.6 })
    const base = 'hero-dish-cut'
    const avifFile = `${base}-${w}.avif`
    const webpFile = `${base}-${w}.webp`
    if (FORCE || !(await exists(path.join(OUT, avifFile)))) {
      await pipeline.clone().avif({ quality: 60, effort: 5 }).toFile(path.join(OUT, avifFile))
    }
    if (FORCE || !(await exists(path.join(OUT, webpFile)))) {
      await pipeline.clone().webp({ quality: 82, alphaQuality: 92, effort: 6 }).toFile(path.join(OUT, webpFile))
    }
    entry.avif.push([w, `/images/gen/${avifFile}`])
    entry.webp.push([w, `/images/gen/${webpFile}`])
  }
  return entry
}

async function main() {
  if (FORCE) await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const names = (await readdir(SRC))
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => f.replace(/\.jpg$/, ''))
    .sort()

  const manifest = {}
  for (const name of names) {
    if (name === 'hero-dish') continue // на странице используется только вырезанная тарелка
    manifest[name] = await processPhoto(name)
  }
  manifest['hero-dish-cut'] = await processPlate()

  const body = `// Сгенерировано scripts/images.mjs — руками не править. Обновить: npm run images
export const images = ${JSON.stringify(manifest, null, 2)} as const

export type ImageName = keyof typeof images
`
  await writeFile(MANIFEST, body)

  let total = 0
  for (const f of await readdir(OUT)) total += (await stat(path.join(OUT, f))).size
  console.log(`${Object.keys(manifest).length} изображений → ${(await readdir(OUT)).length} файлов, ${(total / 1024).toFixed(0)} КБ`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
