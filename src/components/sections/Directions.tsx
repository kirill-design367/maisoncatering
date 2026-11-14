import { a11y, directions, sectionIds } from '@/data/site'
import { Lines } from '@/components/ui/Lines'
import { Picture } from '@/components/ui/Picture'
import { typo } from '@/lib/typo'
import { DirectionsSplit } from './DirectionsSplit'
import styles from './directions.module.css'

/**
 * 2. Два направления. Экран поделён пополам: выездной кейтеринг и доставка.
 * На десктопе половина под курсором плавно расширяется, вторая сжимается (DirectionsSplit).
 * На мобильном — две карточки друг под другом.
 *
 * Расширение сделано без анимации ширины: окна кадров и подписи двигаются только трансформациями
 * от одной переменной --p (−1 — раскрыта левая половина, 0 — поровну, 1 — раскрыта правая).
 */
export function Directions() {
  return (
    <section id={sectionIds.directions} className={styles.section} aria-label={a11y.directionsLabel}>
      <div className={`wrap ${styles.wrap}`}>
        <div className={styles.stage} data-directions>
          {directions.map((d) => (
            // Кадр, заголовок и строка появляются одной группой, как только блок входит в экран.
            <article className={styles.half} data-dir={d.id} data-reveal-group="0.12" key={d.id}>
              {/* Кадр с описанием — для всех; поверх него ссылка, по которой кадр кликабелен целиком.
                  Для клавиатуры и скринридеров она скрыта: там есть текстовая ссылка в подписи. */}
              <div className={styles.window} data-dir-hit={d.id} data-reveal="mask">
                <span className={styles.layer}>
                  <Picture
                    name={d.image}
                    alt={d.imageAlt}
                    // На телефоне sizes занижен намеренно: увеличенный вариант 1392px там не нужен.
                    sizes="(min-width: 64rem) 58vw, 72vw"
                    className={styles.picture}
                    imgClassName={styles.img}
                  />
                </span>
                <a className={styles.windowLink} href={d.href} tabIndex={-1} aria-hidden="true" />
              </div>
              <div className={styles.caption} data-dir-hit={d.id}>
                <Lines lines={d.titleLines} as="h2" className={`t-display ${styles.title}`} />
                <div className={styles.row} data-reveal="fade">
                  <p className={`t-body ${styles.text}`}>{typo(d.text)}</p>
                  <a href={d.href} className={`t-label link ${styles.link}`}>
                    {d.linkLabel}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <DirectionsSplit />
    </section>
  )
}
