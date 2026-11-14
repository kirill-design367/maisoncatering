'use client'

import { useEffect } from 'react'
import { onDelegatedClick } from '@/lib/bus'
import { ease, gsap, prefersReducedMotion, ScrollTrigger, type Timeline } from '@/lib/gsap'
import { defer } from '@/lib/schedule'

/**
 * Вкладки меню: выбор мышью, касанием и с клавиатуры (стрелки, Home, End),
 * скользящая линия под активной вкладкой, смена содержимого карты.
 * Вкладку также открывает любая ссылка страницы с data-menu-format="<формат>".
 */
export function MenuTabs() {
  useEffect(
    () =>
      defer(() => {
        const root = document.querySelector<HTMLElement>('[data-menu]')
        const list = root?.querySelector<HTMLElement>('[data-menu-tabs]')
        const indicator = root?.querySelector<HTMLElement>('[data-menu-indicator]')
        if (!root || !list || !indicator) return

        const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
        const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'))
        const ctaLink = root.querySelector<HTMLElement>('[data-menu-cta]')
        let current = tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.format ?? tabs[0]?.dataset.format
        let intro: Timeline | null = null

        // Линия под активной вкладкой двигается трансформацией: сдвиг и масштаб считаются по вкладке.
        const placeIndicator = () => {
          const tab = tabs.find((t) => t.dataset.format === current)
          if (!tab) return
          indicator.style.setProperty('--x', `${tab.offsetLeft}px`)
          indicator.style.setProperty('--w', `${tab.offsetWidth}`)
        }

        const select = (id: string | undefined, opts: { focus?: boolean; animate?: boolean } = {}) => {
          const tab = tabs.find((t) => t.dataset.format === id)
          if (!tab || !id) return
          const changed = id !== current
          current = id

          tabs.forEach((t) => {
            const on = t === tab
            t.setAttribute('aria-selected', String(on))
            t.tabIndex = on ? 0 : -1
          })
          panels.forEach((p) => p.toggleAttribute('data-inactive', p.dataset.format !== id))
          ctaLink?.setAttribute('data-request-format', id)
          placeIndicator()
          // На телефоне высота карты зависит от вкладки — точки привязки к скроллу ниже по странице сдвигаются.
          if (changed) ScrollTrigger.refresh()
          if (opts.focus) tab.focus({ preventScroll: true })

          // На мобильном лента прокручивается так, чтобы активная вкладка была по центру.
          if (list.scrollWidth > list.clientWidth) {
            const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2
            list.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
          }

          // Появление содержимого: название выезжает из-под маски, цена и блюда проявляются по очереди.
          if (changed && opts.animate !== false && !prefersReducedMotion()) {
            const panel = panels.find((p) => p.dataset.format === id)
            if (!panel) return
            intro?.kill()
            panels.forEach((p) => gsap.set(p.querySelectorAll('[data-menu-name], [data-menu-fade]'), { clearProps: 'all' }))
            intro = gsap
              .timeline({ defaults: { ease: ease.out } })
              .fromTo(panel.querySelectorAll('[data-menu-name]'), { yPercent: 112 }, { yPercent: 0, duration: 0.9 }, 0.1)
              .fromTo(
                panel.querySelectorAll('[data-menu-fade]'),
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.7, stagger: 0.05 },
                0.2,
              )
          }
        }

        const onClick = (e: MouseEvent) => {
          const tab = (e.target as Element).closest<HTMLButtonElement>('[role="tab"]')
          if (tab) select(tab.dataset.format)
        }

        const onKey = (e: KeyboardEvent) => {
          const i = tabs.findIndex((t) => t.dataset.format === current)
          const next =
            e.key === 'ArrowRight'
              ? (i + 1) % tabs.length
              : e.key === 'ArrowLeft'
                ? (i - 1 + tabs.length) % tabs.length
                : e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? tabs.length - 1
                    : -1
          if (next === -1) return
          e.preventDefault()
          select(tabs[next].dataset.format, { focus: true })
        }

        // Лента вкладок на телефоне: у правого края она растворяется, пока не докручена до конца.
        const markEnd = () => list.toggleAttribute('data-end', list.scrollLeft >= list.scrollWidth - list.clientWidth - 2)
        list.addEventListener('scroll', markEnd, { passive: true })
        markEnd()

        list.addEventListener('click', onClick)
        list.addEventListener('keydown', onKey)
        // Ссылки «Свадьба → меню» из других блоков. Переход к блоку делает MotionRoot.
        const off = onDelegatedClick('[data-menu-format]', (el) => select(el.dataset.menuFormat, { animate: true }))

        const observer = new ResizeObserver(() => {
          placeIndicator()
          markEnd()
        })
        observer.observe(list)
        document.fonts?.ready.then(placeIndicator)
        placeIndicator()
        root.setAttribute('data-ready', '')

        return () => {
          list.removeEventListener('scroll', markEnd)
          list.removeEventListener('click', onClick)
          list.removeEventListener('keydown', onKey)
          off()
          observer.disconnect()
          intro?.kill()
        }
      }),
    [],
  )

  return null
}
