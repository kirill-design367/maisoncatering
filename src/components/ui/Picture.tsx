import { images, type ImageName } from '@/data/images.gen'
import { asset } from '@/lib/asset'

type Props = {
  name: ImageName
  alt: string
  /** Атрибут sizes: какую ширину кадр занимает на экране. Обязателен — от него зависит вес загрузки. */
  sizes: string
  /** true только для кадров первого экрана: грузится сразу и с высоким приоритетом. */
  priority?: boolean
  className?: string
  imgClassName?: string
  /** Декоративный кадр: скрыть от скринридеров (alt=""). */
  decorative?: boolean
  draggable?: boolean
}

function srcset(list: readonly (readonly [number, string])[]): string {
  return list.map(([w, src]) => `${asset(src)} ${w}w`).join(', ')
}

/**
 * Кадр из public/images: AVIF + WebP, несколько ширин, ленивые загрузка и декодирование.
 * Ширина и высота проставлены — страница не прыгает при загрузке.
 */
export function Picture({ name, alt, sizes, priority = false, className, imgClassName, decorative = false, draggable = false }: Props) {
  const img = images[name]
  const fallback = img.webp[img.webp.length - 1][1]
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcset(img.avif)} sizes={sizes} />
      <img
        src={asset(fallback)}
        srcSet={srcset(img.webp)}
        sizes={sizes}
        width={img.width}
        height={img.height}
        alt={decorative ? '' : alt}
        aria-hidden={decorative || undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        draggable={draggable}
        className={imgClassName}
      />
    </picture>
  )
}

/** Данные для <link rel="preload" as="image"> кадра первого экрана. */
export function preloadProps(name: ImageName, sizes: string) {
  const img = images[name]
  return {
    href: asset(img.avif[img.avif.length - 1][1]),
    imageSrcSet: srcset(img.avif),
    imageSizes: sizes,
    type: 'image/avif',
  }
}
