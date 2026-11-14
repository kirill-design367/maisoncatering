import localFont from 'next/font/local'

// Шрифты сайта. Файлы — в src/fonts (woff2, только латиница и русская кириллица), собраны scripts/fonts.py.
// Кириллица проверена по таблице cmap в самих бинарниках. Сравнение пар — на странице /fonts.
//
// При смене пары меняются: два вызова localFont ниже и блок «Метрики антиквы» в globals.css.

/** Заголовки: Noto Serif Display Light — тонкая контрастная антиква, набор прописными. */
export const displayFont = localFont({
  src: '../fonts/noto-serif-display-300.woff2',
  weight: '300',
  style: 'normal',
  display: 'swap',
  variable: '--font-display-face',
  fallback: ['Times New Roman', 'Times', 'serif'],
  adjustFontFallback: 'Times New Roman',
  preload: true,
})

/** Текст: Jost — лёгкий геометрический гротеск. Вариативный, начертания 300–500. */
export const textFont = localFont({
  src: '../fonts/jost-300-500.woff2',
  weight: '300 500',
  style: 'normal',
  display: 'swap',
  variable: '--font-text-face',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
  preload: true,
})

export const fontVariables = `${displayFont.variable} ${textFont.variable}`
