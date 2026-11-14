import { basePath, siteOrigin } from '@root/site.config.mjs'

/** Путь к файлу из /public с учётом basePath: asset('/images/a.webp') → '/maisoncatering/images/a.webp'. */
export function asset(path: string): string {
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`
}

/** Абсолютный адрес страницы или файла — для превью в мессенджерах и canonical. */
export function absoluteUrl(path = '/'): string {
  return `${siteOrigin}${asset(path)}`
}

export { basePath, siteOrigin }
