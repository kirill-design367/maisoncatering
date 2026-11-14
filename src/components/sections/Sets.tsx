import { cta, formatPrice, sectionIds, sets, setsSection, type DeliverySet } from '@/data/site'
import { Lines } from '@/components/ui/Lines'
import { Picture } from '@/components/ui/Picture'
import { SetsStrip } from './SetsStrip'
import styles from './sets.module.css'

/** Карточка сета. Типографическая; если в данных появилось фото (set.photo) — показывает его сверху. */
export function SetCard({ set }: { set: DeliverySet }) {
  return (
    <article className={styles.card}>
      {set.photo && (
        <div className={styles.photo}>
          <Picture
            name={set.photo}
            alt={set.photoAlt ?? `${set.kind} «${set.name}»`}
            sizes="(min-width: 64rem) 33vw, 78vw"
            className={styles.picture}
            imgClassName={styles.img}
          />
        </div>
      )}

      <div className={styles.top}>
        <span className={`t-label ${styles.kind}`}>{set.kind}</span>
        <span className={`t-small ${styles.facts}`}>
          {set.pieces && <span>{set.pieces}</span>}
          {set.guests && <span>{set.guests}</span>}
        </span>
      </div>

      <h3 className={`t-display ${styles.name}`}>«{set.name}»</h3>

      <ul className={`t-body ${styles.composition}`}>
        {set.composition.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className={styles.bottom}>
        <span className={`t-display t-num ${styles.price}`}>{formatPrice(set.price)}</span>
        {/* Ведёт к заявке с уже выбранным сетом. */}
        <a
          href={`#${sectionIds.request}`}
          className="btn btn--ghost btn--small"
          data-request-set={set.id}
          aria-label={`${cta.order}: ${set.kind} «${set.name}»`}
        >
          {cta.order}
        </a>
      </div>
    </article>
  )
}

/**
 * 5. Сеты и боксы — витрина доставки. Шесть типографических карточек: тип, название,
 * состав, число гостей, цена и кнопка «Заказать».
 * Десктоп: таблица 3×2 с общими тонкими линиями. Мобильный: лента с прокруткой пальцем,
 * следующая карточка видна краем (SetsStrip двигает линию прогресса).
 */
export function Sets() {
  return (
    <section id={sectionIds.sets} className={`section ${styles.section}`} aria-labelledby="sets-title">
      <div className="wrap">
        <div className={`grid-12 ${styles.head}`}>
          <Lines lines={setsSection.titleLines} as="h2" id="sets-title" className={`t-display t-h2 ${styles.title}`} />
          <p className={`t-body t-muted ${styles.note}`} data-reveal="fade">
            {setsSection.note}
          </p>
        </div>

        <div className={styles.strip} role="region" aria-label={setsSection.stripLabel} tabIndex={0} data-sets-strip data-reveal="fade">
          <div className={styles.grid}>
            {sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        </div>

        <div className={styles.progress} aria-hidden="true">
          <span className={styles.progressBar} data-sets-progress />
        </div>
      </div>
      <SetsStrip />
    </section>
  )
}
