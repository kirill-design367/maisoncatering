import { a11y, brand, contacts, cta, nav, sectionIds } from '@/data/site'
import { HeaderState } from './HeaderState'
import styles from './header.module.css'

/**
 * Шапка. Десктоп: вордмарк слева, пункты по центру, телефон и кнопка справа.
 * Мобильная: вордмарк слева, бургер справа (полноэкранное меню — MobileMenu).
 * Шапка закреплена: с любого экрана до заявки — одно действие.
 */
export function Header({ mobileMenu }: { mobileMenu?: React.ReactNode }) {
  return (
    <header className={styles.header} data-header>
      <div className={`wrap ${styles.row}`}>
        <a href={`#${sectionIds.top}`} className={styles.brand} aria-label={`${brand.name} — ${a11y.toTop}`}>
          <span className={styles.brandMain}>{brand.wordmark}</span>
          <span className={`t-label ${styles.brandSuffix}`}>{brand.suffix}</span>
        </a>

        <nav className={styles.nav} aria-label={a11y.navLabel}>
          <ul className={styles.navList}>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="t-label link link--quiet" data-nav-link>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <a href={contacts.phoneHref} className={`t-label t-num link link--quiet ${styles.phone}`}>
            {contacts.phoneDisplay}
          </a>
          <a href={`#${sectionIds.request}`} className="btn btn--small">
            {cta.discussEvent}
          </a>
        </div>

        {mobileMenu}
      </div>
      <span className={styles.hairline} aria-hidden="true" />
      <HeaderState />
    </header>
  )
}
