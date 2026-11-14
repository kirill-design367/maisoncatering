import localFont from 'next/font/local'

// Гарнитуры пар B и C. Подключаются только на странице /fonts — на главной не грузятся.

export const playfair = localFont({
  src: '../../fonts/playfair-300-opsz.woff2',
  weight: '300',
  display: 'swap',
  variable: '--font-display-face',
  fallback: ['Times New Roman', 'serif'],
  preload: false,
})

export const manrope = localFont({
  src: '../../fonts/manrope-300-500.woff2',
  weight: '300 500',
  display: 'swap',
  variable: '--font-text-face',
  fallback: ['Arial', 'sans-serif'],
  preload: false,
})

export const literata = localFont({
  src: '../../fonts/literata-200-opsz72.woff2',
  weight: '200',
  display: 'swap',
  variable: '--font-display-face',
  fallback: ['Times New Roman', 'serif'],
  preload: false,
})
