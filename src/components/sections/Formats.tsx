import { formatPricePerGuest, formats, formatsSection, sectionIds } from '@/data/site'
import { Lines } from '@/components/ui/Lines'
import { Picture } from '@/components/ui/Picture'
import { FormatsInteractive } from './FormatsInteractive'
import styles from './formats.module.css'

// Кадр у курсора — около 22rem в ширину; на мобильном этот набор кадров не показывается и не грузится.
const PREVIEW_SIZES = '(min-width: 64rem) 22vw, 1px'
// Кадр в раскрытом пункте: вся ширина между полями, на планшете — половина.
const PANEL_SIZES = '(min-width: 64rem) 1px, (min-width: 40rem) 50vw, calc(100vw - 2.5rem)'

/**
 * 3. Форматы мероприятий. Блок — типографический список: пять форматов и цена «от» за гостя.
 *
 * Десктоп: пять строк-ссылок на меню формата. При наведении строка сдвигается, остальные
 * приглушаются, а рядом с курсором появляется кадр этого формата (FormatsInteractive).
 * Мобильный — отдельная композиция: аккордеон, кадр и ссылка на меню раскрываются по нажатию.
 *
 * Обе разметки лежат рядом; неактивная скрыта через display: none — скринридер и клавиатура
 * видят только одну, поэтому заголовок h3 у каждого формата всегда один.
 */
export function Formats() {
  const menuHref = `#${sectionIds.menu}`

  return (
    <section id={sectionIds.formats} className={`section ${styles.section}`} aria-labelledby="formats-title" data-formats>
      <div className="wrap">
        <div className={`grid-12 ${styles.head}`}>
          <Lines lines={formatsSection.titleLines} as="h2" id="formats-title" className={`t-display t-h2 ${styles.title}`} />
          <p className={`t-body t-muted ${styles.note}`} data-reveal="fade">
            {formatsSection.note}
          </p>
        </div>

        {/* ── Десктоп: строки-ссылки. Линии и строки появляются одним спокойным каскадом. ── */}
        <div className={styles.rows} data-reveal-group="0.07" data-formats-rows>
          <ul>
            {formats.map((format) => (
              <li key={format.id}>
                <span className="rule" data-reveal="rule" aria-hidden="true" />
                <a href={menuHref} data-menu-format={format.id} className={styles.row} data-formats-row>
                  {/* Название и цена выезжают из-под масок вместе, как строки заголовка. */}
                  <div className={styles.rowText} data-reveal="lines" data-formats-text>
                    <h3 className={`t-display t-list ${styles.name}`} data-formats-name>
                      <span className="line">
                        <span className="line__inner">{format.title}</span>
                      </span>
                    </h3>
                    <span className={`t-num ${styles.price}`} data-formats-price>
                      <span className="line">
                        <span className="line__inner">{formatPricePerGuest(format.priceFrom)}</span>
                      </span>
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <span className="rule" data-reveal="rule" aria-hidden="true" />
        </div>

        {/* ── Мобильный: аккордеон. Без JS все пункты раскрыты (см. formats.module.css). ── */}
        <div className={styles.accordion} data-reveal-group="0.07">
          <ul>
            {formats.map((format) => (
              <li key={format.id} data-formats-item>
                <span className="rule" data-reveal="rule" aria-hidden="true" />
                <h3>
                  <button
                    type="button"
                    className={styles.toggle}
                    id={`formats-toggle-${format.id}`}
                    aria-expanded="false"
                    aria-controls={`formats-panel-${format.id}`}
                    data-formats-toggle
                  >
                    <span className={styles.toggleInner} data-reveal="lines">
                      <span className={styles.toggleText}>
                        <span className={`t-display ${styles.itemName}`}>
                          <span className="line">
                            <span className="line__inner">{format.title}</span>
                          </span>
                        </span>
                        <span className={`t-body t-num ${styles.itemPrice}`}>
                          <span className="line">
                            <span className="line__inner">{formatPricePerGuest(format.priceFrom)}</span>
                          </span>
                        </span>
                      </span>
                      {/* Плюс из двух линий; в раскрытом пункте вертикальная линия уходит — остаётся минус. */}
                      <span className={`line ${styles.markLine}`} aria-hidden="true">
                        <span className={`line__inner ${styles.mark}`}>
                          <span className={styles.markH} />
                          <span className={styles.markV} />
                        </span>
                      </span>
                    </span>
                  </button>
                </h3>
                <div className={styles.panel} id={`formats-panel-${format.id}`} data-formats-panel>
                  <div className={styles.panelInner} data-formats-panel-inner>
                    <div className={styles.panelPhoto}>
                      <Picture
                        name={format.image}
                        alt={format.imageAlt}
                        sizes={PANEL_SIZES}
                        className={styles.picture}
                        imgClassName={styles.img}
                      />
                    </div>
                    <div className={styles.panelLink} data-formats-panel-link>
                      <a href={menuHref} data-menu-format={format.id} className={`t-label link ${styles.menuLink}`}>
                        {formatsSection.menuLinkLabel}
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <span className="rule" data-reveal="rule" aria-hidden="true" />
        </div>
      </div>

      {/* Кадр у курсора: один на весь список, пять фотографий лежат стопкой. Это иллюстрация
          к строке под курсором, поэтому для скринридеров он скрыт. */}
      <div className={styles.preview} aria-hidden="true" data-formats-preview>
        <div className={styles.frame} data-formats-frame>
          {formats.map((format) => (
            <div className={styles.photo} key={format.id} data-formats-photo>
              <Picture
                name={format.image}
                alt={format.imageAlt}
                sizes={PREVIEW_SIZES}
                className={styles.picture}
                imgClassName={styles.img}
                decorative
              />
            </div>
          ))}
        </div>
      </div>

      <FormatsInteractive />
    </section>
  )
}
