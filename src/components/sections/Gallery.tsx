import { gallery, gallerySection, sectionIds } from '@/data/site'
import { Lines } from '@/components/ui/Lines'
import { Picture } from '@/components/ui/Picture'
import { GalleryMotion } from './GalleryMotion'
import styles from './gallery.module.css'

/**
 * Раскладка шести кадров: форма маски, место в композиции и скорость движения при прокрутке.
 * shift — на сколько rem кадр смещается за время прохода через экран (знак — направление):
 * у соседних кадров значения разные, поэтому они движутся с разной скоростью.
 * Порядок кадров в данных (site.ts) можно менять — раскладка привязана к позиции, а не к файлу.
 */
const layout = [
  { slot: 'a', shape: 'arch', shift: 4, sizes: '(min-width: 64rem) 31vw, 45vw' },
  { slot: 'b', shape: 'circle', shift: -3, sizes: '(min-width: 64rem) 23vw, 45vw' },
  { slot: 'c', shape: 'rect', shift: 7, sizes: '(min-width: 64rem) 23vw, 45vw' },
  { slot: 'd', shape: 'arch', shift: -4.5, sizes: '(min-width: 64rem) 23vw, 45vw' },
  { slot: 'e', shape: 'pill', shift: 6, sizes: '(min-width: 64rem) 15vw, 45vw' },
  { slot: 'f', shape: 'rect', shift: -2, sizes: '(min-width: 64rem) 39vw, 45vw' },
] as const

/**
 * 7. Галерея. Шесть кадров в масках разной формы — арки, круг, овал, прямоугольники —
 * расставлены асимметрично. При прокрутке кадры движутся с разной скоростью (GalleryMotion).
 * На мобильном — две колонки со сдвигом по высоте, движение мягче.
 */
export function Gallery() {
  const frames = gallery.map((item, i) => ({ ...item, ...layout[i % layout.length] }))
  // Мобильные колонки: слева кадры 1, 5, 6; справа — 2, 3, 4. На десктопе колонки «растворяются»,
  // и каждый кадр встаёт на своё место в общей сетке.
  const columns = [
    [frames[0], frames[4], frames[5]],
    [frames[1], frames[2], frames[3]],
  ]

  return (
    <section id={sectionIds.gallery} className={`section ${styles.section}`} aria-labelledby="gallery-title">
      <div className={`wrap ${styles.grid}`} data-gallery>
        <Lines lines={[gallerySection.title]} as="h2" id="gallery-title" className={`t-display t-h2 ${styles.title}`} />

        {columns.map((column, c) => (
          <div className={styles.column} key={c} data-gallery-column>
            {column.map((frame) => (
              <figure
                key={frame.image}
                className={`${styles.frame} ${styles[`slot-${frame.slot}`]}`}
                data-gallery-frame
                data-shift={frame.shift}
              >
                <div className={`${styles.mask} ${styles[frame.shape]}`} data-reveal="mask">
                  <Picture name={frame.image} alt={frame.alt} sizes={frame.sizes} className={styles.picture} imgClassName={styles.img} />
                </div>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <GalleryMotion />
    </section>
  )
}
