import type { Metadata } from 'next'
import Link from 'next/link'
import { brand, contacts } from '@/data/site'
import { Flip } from '@/components/ui/Flip'
import { fontsPage, pairs } from './pairs'
import styles from './fonts.module.css'

export const metadata: Metadata = {
  title: 'Шрифтовые пары — Maison catering',
  description: 'Сравнение шрифтовых пар для сайта Maison catering.',
  robots: { index: false, follow: false },
}

/**
 * Служебная страница для арт-директора: три шрифтовые пары в финальных кеглях.
 * В выдачу поисковиков не попадает, в меню сайта не показывается.
 */
export default function FontsPage() {
  return (
    <main className={styles.page}>
      <header className={`wrap ${styles.top}`}>
        <Link href="/" className="t-label link">
          <Flip text={fontsPage.back} />
        </Link>
        <span className="t-label t-muted">
          {brand.name}, {contacts.city}
        </span>
      </header>

      <section className={`wrap ${styles.intro}`}>
        <h1 className="t-display t-h2">{fontsPage.title}</h1>
        <p className={`t-lead ${styles.introText}`}>{fontsPage.intro}</p>
      </section>

      {pairs.map((pair) => (
        <section key={pair.id} className={`${styles.pair} ${pair.fontClass}`} style={pair.vars} aria-labelledby={`pair-${pair.id}`}>
          <div className="wrap">
            <span className="rule" />
            <div className={styles.pairHead}>
              <h2 id={`pair-${pair.id}`} className={styles.pairName}>
                <span className={`t-display ${styles.pairLetter}`}>{pair.id}</span>
                <span className={styles.pairFaces}>
                  <span className="t-lead">{pair.heading}</span>
                  <span className="t-lead t-muted">{pair.text}</span>
                </span>
              </h2>
              <span className={`t-label ${styles.status}`}>{pair.status}</span>
            </div>

            {/* Название — как на первом экране: во всю ширину, catering мелко рядом. */}
            <div className={styles.wordmark} aria-label={brand.name} role="img">
              {brand.wordmark.split('').map((letter, i) => (
                <span className={styles.letterMask} key={i} aria-hidden="true">
                  <span className={styles.letter}>{letter}</span>
                </span>
              ))}
            </div>
            <p className={`t-label ${styles.suffix}`} aria-hidden="true">
              {brand.suffix}
            </p>

            <div className={`grid-12 ${styles.sample}`}>
              <p className={`t-display t-h2 ${styles.sampleHeading}`}>
                {fontsPage.sampleHeadingLines.map((line) => (
                  <span key={line} className={styles.sampleLine}>
                    {line}
                  </span>
                ))}
              </p>
              <div className={styles.sampleBody}>
                <p className={`t-label ${styles.sampleNav}`}>
                  {fontsPage.sampleNav.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </p>
                <p className="t-body">{fontsPage.sampleText}</p>
                <p className={`t-lead ${styles.sampleDish}`}>{fontsPage.sampleDish}</p>
                <p className="t-body t-num t-muted">{fontsPage.samplePrice}</p>
              </div>
            </div>

            <div className={`grid-12 ${styles.notes}`}>
              <p className={`t-body ${styles.rationale}`}>{pair.rationale}</p>
              <dl className={styles.facts}>
                {pair.facts.map((fact) => (
                  <div key={fact.label} className={styles.fact}>
                    <dt className="t-label">{fact.label}</dt>
                    <dd className="t-small">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      ))}

      {fontsPage.paid.length > 0 && (
        <section className={`wrap ${styles.paid}`} aria-labelledby="paid-title">
          <span className="rule" />
          <h2 id="paid-title" className={`t-display t-h3 ${styles.paidTitle}`}>
            {fontsPage.paidTitle}
          </h2>
          <p className={`t-body ${styles.paidIntro}`}>{fontsPage.paidIntro}</p>
          <ul className={styles.paidList}>
            {fontsPage.paid.map((item) => (
              <li key={item.name} className={styles.paidItem}>
                <h3 className="t-lead">{item.name}</h3>
                <p className="t-body t-muted">{item.text}</p>
              </li>
            ))}
          </ul>
          <p className={`t-small t-muted ${styles.paidNote}`}>{fontsPage.paidNote}</p>
        </section>
      )}
    </main>
  )
}
