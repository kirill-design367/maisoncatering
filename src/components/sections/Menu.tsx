import { cta, formats, formatPricePerGuest, menuSection, sectionIds } from '@/data/site'
import { Flip } from '@/components/ui/Flip'
import { Lines } from '@/components/ui/Lines'
import { typo } from '@/lib/typo'
import { MenuTabs } from './MenuTabs'
import styles from './menu.module.css'

/** «Подача: состав» → название подачи и состав; строка без двоеточия — одно блюдо. */
function splitDish(line: string): { course: string | null; text: string } {
  const at = line.indexOf(':')
  if (at === -1) return { course: null, text: line }
  const rest = line.slice(at + 1).trim()
  return { course: line.slice(0, at).trim(), text: rest.charAt(0).toUpperCase() + rest.slice(1) }
}

/**
 * 4. Меню — печатная карта ресторана: двойная тонкая рамка, вкладки по пяти форматам,
 * в каждой — блюда и цена «от … за гостя». Внизу — индивидуальное меню и кнопка.
 *
 * Все пять вкладок есть в HTML: без JavaScript они идут одна за другой, с JavaScript
 * видна одна (MenuTabs). Вкладку открывает и ссылка с data-menu-format из блока «Форматы».
 */
export function Menu() {
  return (
    <section id={sectionIds.menu} className={`section ${styles.section}`} aria-labelledby="menu-title">
      <div className="wrap">
        <div className={styles.card} data-menu data-scroll-anchor>
          <div className={styles.cardInner}>
            <div className={styles.head}>
              <Lines lines={[menuSection.title]} as="h2" id="menu-title" className={`t-display t-h2 ${styles.title}`} />

              <div className={styles.tabsRow}>
                <div className={styles.tabs} role="tablist" aria-label={menuSection.tabsLabel} data-menu-tabs>
                  {formats.map((f, i) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      id={`menu-tab-${f.id}`}
                      aria-controls={`menu-panel-${f.id}`}
                      aria-selected={i === 0}
                      tabIndex={i === 0 ? 0 : -1}
                      data-format={f.id}
                      className={`t-label ${styles.tab}`}
                    >
                      <Flip text={f.title} />
                    </button>
                  ))}
                  <span className={styles.indicator} data-menu-indicator aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.bodyInner}>
                <div className={styles.panels}>
                  {formats.map((f, i) => (
                    <div
                      key={f.id}
                      role="tabpanel"
                      id={`menu-panel-${f.id}`}
                      aria-labelledby={`menu-tab-${f.id}`}
                      // панель в порядке фокуса: после выбора вкладки Tab попадает в её содержимое
                      tabIndex={0}
                      className={styles.panel}
                      data-format={f.id}
                      data-inactive={i === 0 ? undefined : ''}
                    >
                      <div className={styles.panelHead}>
                        <h3 className={`t-display ${styles.name}`}>
                          <span className={styles.nameMask}>
                            <span className={styles.nameInner} data-menu-name>
                              {f.title}
                            </span>
                          </span>
                        </h3>
                        <p className={`t-lead t-num ${styles.price}`} data-menu-fade>
                          {formatPricePerGuest(f.priceFrom)}
                        </p>
                      </div>

                      <ul className={styles.dishes}>
                        {f.menu.map((line) => {
                          const dish = splitDish(line)
                          return (
                            <li key={line} className={styles.dish} data-menu-fade>
                              {dish.course && <span className={`t-label ${styles.course}`}>{dish.course}</span>}
                              <span className={styles.dishText}>{typo(dish.text)}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className={styles.foot}>
                  <p className={`t-lead ${styles.custom}`}>{typo(menuSection.customLine)}</p>
                  {/* data-request-format всегда равен открытой вкладке: форма подставит этот формат. */}
                  <a href={`#${sectionIds.request}`} className={`btn ${styles.cta}`} data-request-format={formats[0].id} data-menu-cta>
                    {cta.discussMenu}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MenuTabs />
    </section>
  )
}
