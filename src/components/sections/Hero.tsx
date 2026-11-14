import { preload } from 'react-dom'
import { brand, cta, hero, sectionIds } from '@/data/site'
import { Picture, preloadProps } from '@/components/ui/Picture'
import { HeroMotion } from './HeroMotion'
import styles from './hero.module.css'
import { typo } from '@/lib/typo'

// Тарелка занимает до 40% ширины на десктопе и ~90% на мобильном.
// Для мобильного sizes занижен намеренно: на экранах ×3 хватает варианта 757px — это вес первого экрана.
const PLATE_SIZES = '(min-width: 64rem) 40vw, 62vw'

/**
 * 1. Первый экран. MAISON во всю ширину, тарелка перекрывает буквы,
 * под ней — надстрочник, строка и кнопка. При прокрутке тарелка вращается
 * и уходит вниз, скрываясь за следующим блоком (HeroMotion).
 */
export function Hero() {
  const { href, ...plate } = preloadProps('hero-dish-cut', PLATE_SIZES)
  preload(href, { as: 'image', fetchPriority: 'high', ...plate })

  return (
    <section id={sectionIds.top} className={styles.hero} aria-labelledby="hero-title" data-hero data-scroll-flush>
      {/* Вордмарк — графика: название бренда для скринридеров есть в шапке. */}
      <div className={styles.wordmark} aria-hidden="true" data-hero-wordmark>
        {brand.wordmark.split('').map((letter, i) => (
          <span className={styles.letterMask} key={i}>
            <span className={styles.letter} data-hero-letter>
              {letter}
            </span>
          </span>
        ))}
      </div>
      <span className={`t-label ${styles.suffix}`} aria-hidden="true" data-hero-fade>
        {brand.suffix}
      </span>

      <div className={styles.plate} data-hero-plate>
        <div className={styles.plateSpin} data-hero-spin>
          <div className={styles.plateIntro} data-hero-plate-intro>
            <Picture name="hero-dish-cut" alt={hero.plateAlt} sizes={PLATE_SIZES} priority imgClassName={styles.plateImg} />
          </div>
        </div>
      </div>

      <div className={styles.text} data-hero-text>
        {/* Заголовок страницы: надстрочник называет, что и где, строка — зачем. */}
        <h1 id="hero-title" className={styles.heading}>
          <span className={`t-label ${styles.eyebrow}`} data-hero-fade>
            {hero.eyebrow}
          </span>
          <span className="sr-only">. </span>
          <span className={styles.line} data-hero-fade>
            {typo(hero.line)}
          </span>
        </h1>
        <a href={`#${sectionIds.request}`} className={`btn ${styles.cta}`} data-hero-fade>
          {cta.discussEvent}
        </a>
      </div>

      <HeroMotion />
    </section>
  )
}
