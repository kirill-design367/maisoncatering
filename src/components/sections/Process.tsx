import { processSection, sectionIds, steps } from '@/data/site'
import { Lines } from '@/components/ui/Lines'
import { typo } from '@/lib/typo'
import styles from './process.module.css'

/**
 * 6. Как проходит. Четыре шага в одну линию с крупными номерами антиквой.
 * Единственное место на сайте с нумерацией: это настоящая последовательность.
 * Появление — один жест: номера выезжают из-под масок, линия прочерчивается через все шаги.
 * На мобильном шаги идут вертикально, номер крупно слева.
 */
export function Process() {
  return (
    <section id={sectionIds.process} className={`section ${styles.section}`} aria-labelledby="process-title">
      <div className="wrap">
        <Lines lines={processSection.titleLines} as="h2" id="process-title" className="t-display t-h2" />

        <div className={styles.row} data-reveal-group="0.1">
          <span className={`rule ${styles.line}`} data-reveal="rule" aria-hidden="true" />
          <ol className={styles.steps}>
            {steps.map((step, i) => (
              <li key={step.title} className={styles.step}>
                {/* Номер — графика: порядок шагов скринридеру сообщает сам список. */}
                <span className={`t-display t-num ${styles.num}`} data-reveal="lines" aria-hidden="true">
                  <span className="line">
                    <span className="line__inner">{i + 1}</span>
                  </span>
                </span>
                <div className={styles.body} data-reveal="fade">
                  <h3 className={styles.title}>{step.title}</h3>
                  <p className={`t-body ${styles.text}`}>{typo(step.text)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
