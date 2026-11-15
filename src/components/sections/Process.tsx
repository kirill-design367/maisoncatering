import type { CSSProperties } from 'react'
import { processSection, sectionIds, steps } from '@/data/site'
import { Lines } from '@/components/ui/Lines'
import { typo } from '@/lib/typo'
import { glassSize, type GlassKind, ProcessGlass } from './ProcessGlass'
import { ProcessMotion } from './ProcessMotion'
import styles from './process.module.css'

/** Бокал под каждым шагом: флюте, для белого, для красного, купе. */
const GLASSES: GlassKind[] = ['flute', 'white', 'red', 'coupe']

/**
 * 6. Как проходит. Четыре шага в одну линию с крупными номерами антиквой.
 * Единственное место на сайте с нумерацией: это настоящая последовательность.
 * Линия под номерами — держатель барной стойки: под каждым шагом ножкой вверх висит свой бокал.
 * Номера стоят над стойкой, название шага и текст — под бокалом.
 * На мобильном шаги идут вертикально, у каждого свой короткий отрезок стойки с одним бокалом.
 * Появление и покачивание бокалов — ProcessMotion; без JS и при prefers-reduced-motion бокалы висят статично.
 */
export function Process() {
  return (
    <section id={sectionIds.process} className={`section ${styles.section}`} aria-labelledby="process-title">
      <div className="wrap">
        <Lines lines={processSection.titleLines} as="h2" id="process-title" className="t-display t-h2" />

        <div className={styles.row} data-process>
          {/* Стойка через все шаги — на десктопе. */}
          <span className={styles.line} data-process-line aria-hidden="true" />
          <ol className={styles.steps}>
            {steps.map((step, i) => {
              const kind = GLASSES[i % GLASSES.length]
              const size = glassSize(kind)
              return (
                <li key={step.title} className={styles.step} data-process-step>
                  {/* Номер — графика: порядок шагов скринридеру сообщает сам список. */}
                  <span className={`t-display t-num ${styles.num}`} data-process-num aria-hidden="true">
                    <span className="line">
                      <span className="line__inner">{i + 1}</span>
                    </span>
                  </span>
                  {/* Свой отрезок стойки — на мобильном. */}
                  <span className={styles.rail} data-process-rail aria-hidden="true" />
                  <span
                    className={styles.hang}
                    style={{ '--gw': size.width, '--gh': size.height } as CSSProperties}
                    aria-hidden="true"
                  >
                    {/* Обёртка едет по стойке, сам рисунок качается вокруг точки подвеса. */}
                    <span className={styles.glass} data-process-glass>
                      <ProcessGlass kind={kind} />
                    </span>
                  </span>
                  <div className={styles.body} data-process-body>
                    <h3 className={styles.title}>{step.title}</h3>
                    <p className={`t-body ${styles.text}`}>{typo(step.text)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
      <ProcessMotion />
    </section>
  )
}
