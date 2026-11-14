'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { brand, contacts, mobileMenu, nav, requestSection } from '@/data/site'
import { ease, gsap, mq } from '@/lib/gsap'
import { lockScroll } from '@/lib/scroll'
import styles from './mobileMenu.module.css'

/**
 * Мобильное меню: бургер справа в шапке и полноэкранный молочный слой.
 * Пункты набраны антиквой, внизу — телефон и кнопки мессенджеров.
 * Пока меню открыто, страница под ним не прокручивается и недоступна для фокуса.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)

  // Анимация открытия собирается один раз; закрытие — та же анимация в обратную сторону.
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const mm = gsap.matchMedia()
    mm.add(mq.motion, () => {
      const items = layer.querySelectorAll('[data-menu-item]')
      const foot = layer.querySelectorAll('[data-menu-foot]')
      const tl = gsap
        .timeline({ paused: true, defaults: { ease: ease.out } })
        .fromTo(layer, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: ease.inOut }, 0)
        .fromTo(items, { yPercent: 112 }, { yPercent: 0, duration: 1, stagger: 0.06 }, 0.3)
        .fromTo(foot, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 0.6)
      timeline.current = tl
      return () => {
        tl.kill()
        timeline.current = null
        gsap.set([layer, ...items, ...foot], { clearProps: 'all' })
      }
    })
    return () => mm.revert()
  }, [])

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const tl = timeline.current
    const main = document.getElementById('main')
    const bar = document.querySelector<HTMLElement>('[data-mobile-bar]')

    if (open) {
      lockScroll(true)
      layer.removeAttribute('inert')
      main?.setAttribute('inert', '')
      bar?.setAttribute('inert', '')
      layer.dataset.open = 'true'
      if (tl) tl.timeScale(1).play()
      // Фокус — на первый пункт, чтобы клавиатура и скринридер оказались внутри меню.
      layer.querySelector<HTMLElement>('a')?.focus({ preventScroll: true })
    } else {
      lockScroll(false)
      layer.setAttribute('inert', '')
      main?.removeAttribute('inert')
      bar?.removeAttribute('inert')
      if (tl && tl.progress() > 0) {
        tl.timeScale(1.8).reverse()
        tl.eventCallback('onReverseComplete', () => {
          delete layer.dataset.open
        })
      } else {
        delete layer.dataset.open
      }
    }
  }, [open])

  // Esc закрывает меню; при переходе на десктопную ширину меню закрывается само.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const desktop = window.matchMedia(mq.desktop)
    const onDesktop = () => desktop.matches && close(false)
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onDesktop)
    return () => {
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onDesktop)
    }
  }, [open, close])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.burger}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? mobileMenu.close : mobileMenu.open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.burgerLines} aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      <div
        ref={layerRef}
        id="mobile-menu"
        className={styles.layer}
        role="dialog"
        aria-modal="true"
        aria-label={mobileMenu.title}
        inert
      >
        <div className={styles.inner}>
          <nav aria-label={mobileMenu.title}>
            <ul className={styles.list}>
              {nav.map((item) => (
                <li key={item.href} className={styles.item}>
                  <a href={item.href} className={`t-display ${styles.link}`} onClick={() => close(false)}>
                    <span className={styles.linkInner} data-menu-item>
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.foot}>
            <a href={contacts.phoneHref} className={`t-display t-num ${styles.phone}`} data-menu-foot>
              {contacts.phoneDisplay}
            </a>
            <div className={styles.messengers} data-menu-foot>
              <a href={contacts.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--block">
                {requestSection.messengerWhatsapp}
              </a>
              <a href={contacts.maxProfileUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--block">
                {requestSection.messengerMax}
              </a>
            </div>
            <p className={`t-label ${styles.city}`} data-menu-foot>
              {brand.name}, {contacts.city}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
