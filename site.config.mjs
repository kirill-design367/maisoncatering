// Единственное место, где задаётся путь публикации сайта.
//
// Сейчас сайт живёт на GitHub Pages: https://kirill-design367.github.io/maisoncatering/
// После подключения домена maisoncatering.ru поменять ДВЕ строки ниже:
//   basePath   → ''
//   siteOrigin → 'https://maisoncatering.ru'
// Больше нигде путь не прописан: next.config.mjs, ссылки на картинки, иконки
// и адреса для превью в мессенджерах берут значения отсюда.

/** Путь, под которым опубликован сайт. Без завершающего слэша; для корня домена — пустая строка. */
export const basePath = '/maisoncatering'

/** Адрес сервера без пути — нужен для абсолютных ссылок (картинка для мессенджеров, canonical). */
export const siteOrigin = 'https://kirill-design367.github.io'
