import type { Metadata, Viewport } from 'next'
import './globals.css'
import { fontVariables } from './fonts'
import { meta } from '@/data/site'
import { absoluteUrl, asset } from '@/lib/asset'
import { MotionRoot } from '@/components/motion/MotionRoot'

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: meta.title,
  description: meta.description,
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: absoluteUrl('/'),
    siteName: 'Maison catering',
    title: meta.ogTitle,
    description: meta.ogDescription,
    images: [{ url: absoluteUrl('/og.jpg'), width: 1200, height: 630, alt: meta.ogTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.ogTitle,
    description: meta.ogDescription,
    images: [absoluteUrl('/og.jpg')],
  },
  icons: {
    icon: [
      { url: asset('/favicon.svg'), type: 'image/svg+xml' },
      { url: asset('/favicon.ico'), sizes: '32x32' },
    ],
    apple: [{ url: asset('/apple-touch-icon.png'), sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#FAF7F2',
  width: 'device-width',
  initialScale: 1,
}

// Ставит класс .js до первой отрисовки: исходные состояния анимаций применяются только когда
// работает JavaScript. Если скрипты не поднялись за 4 секунды — класс снимается, и всё содержимое видно.
const bootScript = `(function(d){d.classList.add('js');setTimeout(function(){if(!window.__motionReady)d.classList.remove('js')},4000)})(document.documentElement)`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        {children}
        <MotionRoot />
      </body>
    </html>
  )
}
