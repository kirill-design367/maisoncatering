import { basePath } from './site.config.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Статический экспорт в ./out — GitHub Pages отдаёт только файлы.
  output: 'export',
  // Путь публикации — одна переменная в site.config.mjs.
  basePath,
  assetPrefix: basePath || undefined,
  // Оптимизатора изображений на статике нет: размеры и форматы готовит `npm run images`.
  images: { unoptimized: true },
  // /fonts → out/fonts/index.html: работает на любом статическом хостинге.
  trailingSlash: true,
  reactStrictMode: true,
  experimental: {
    // Стили встраиваются в HTML: одностраничнику не нужны отдельные запросы за CSS,
    // первая отрисовка не ждёт их загрузки.
    inlineCss: true,
  },
}

export default nextConfig
