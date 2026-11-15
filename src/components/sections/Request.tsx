import { contacts, footer, requestSection, sectionIds } from '@/data/site'
import { Arrow } from '@/components/ui/Arrow'
import { Flip } from '@/components/ui/Flip'
import { Lines } from '@/components/ui/Lines'
import { RequestForm } from './RequestForm'
import styles from './request.module.css'
import { typo } from '@/lib/typo'

const TITLE_ID = 'request-title'

/** Мессенджеры в блоке контактов: прямые ссылки на чат и профиль, без текста заявки. */
const messengers = [
  { label: requestSection.messengerWhatsapp, href: contacts.whatsappUrl },
  { label: requestSection.messengerMax, href: contacts.maxProfileUrl },
]

/**
 * 8. Заявка и контакты — единственный цветной экран сайта: бордовый фон, молочный текст.
 * Десктоп: слева заголовок и, у нижнего края, контакты; справа форма. Внизу — строка подвала.
 * Мобильная композиция своя: заголовок → форма → контакты с двумя кнопками мессенджеров → подвал.
 * Порядок в разметке один на оба случая (заголовок, форма, контакты), колонки расставляет сетка.
 */
export function Request() {
  // Страница собирается заранее, поэтому год в подвале — год сборки.
  const year = new Date().getFullYear()

  return (
    <section
      id={sectionIds.request}
      className={styles.request}
      data-theme="bordo"
      data-scroll-flush
      aria-labelledby={TITLE_ID}
    >
      <div className={`wrap ${styles.inner}`}>
        {/* Группа появления привязана к верху блока: контакты прижаты к низу экрана
            и собственной точки срабатывания могли бы не достичь. */}
        <div className={`grid-12 ${styles.grid}`} data-reveal-group>
          <div className={styles.head}>
            <Lines lines={requestSection.titleLines} as="h2" className="t-display t-h2" id={TITLE_ID} />
            <p className={`t-body t-muted ${styles.intro}`} data-reveal="fade">
              {typo(requestSection.intro)}
            </p>
          </div>

          <RequestForm />

          <div className={styles.contacts} data-reveal="fade">
            <h3 className="sr-only">{requestSection.contactsTitle}</h3>
            <address className={styles.address}>
            <a href={contacts.phoneHref} className={`t-display t-num link ${styles.phone}`}>
              <Flip text={contacts.phoneDisplay} font="display" />
            </a>

            <div className={styles.meta}>
              {/* Десктоп: мессенджеры — текстовые ссылки в одной строке с городом. */}
              <ul className={styles.messengerLinks}>
                {messengers.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="t-label link" target="_blank" rel="noopener noreferrer">
                      <Flip text={item.label} />
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
              <span className={`t-label ${styles.city}`}>{contacts.city}</span>
            </div>

            {/* Мобильный: те же ссылки — двумя кнопками во всю ширину, под палец.
                Из двух списков всегда виден один, второй скрыт и от скринридеров (display: none). */}
            <ul className={styles.messengerButtons}>
              {messengers.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="btn btn--ghost btn--block" target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            </address>
          </div>
        </div>

        <footer className={styles.footer}>
          <span className="rule" aria-hidden="true" />
          <div className={`t-small t-muted ${styles.footerRow}`}>
            <p>
              © {year} {footer.copyright}
            </p>
            <a href={contacts.phoneHref} className={`t-num link ${styles.footerPhone}`}>
              <Flip text={contacts.phoneDisplay} caps={false} />
            </a>
          </div>
        </footer>
      </div>
    </section>
  )
}
