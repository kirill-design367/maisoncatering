'use client'

import { useEffect } from 'react'
import { defer } from '@/lib/schedule'

/**
 * Лента сетов на мобильном: тонкая линия под лентой показывает, сколько уже пролистано.
 * Линия двигается трансформацией; прокрутка читается не чаще раза за кадр.
 */
export function SetsStrip() {
  useEffect(
    () =>
      defer(() => {
        const strip = document.querySelector<HTMLElement>('[data-sets-strip]')
        const bar = document.querySelector<HTMLElement>('[data-sets-progress]')
        if (!strip || !bar) return

        let frame = 0
        const update = () => {
          frame = 0
          const max = strip.scrollWidth - strip.clientWidth
          // Областью прокрутки (для клавиатуры и скринридера) лента становится, только когда она листается:
          // на десктопе это обычная таблица.
          if (max > 0) {
            strip.setAttribute('role', 'region')
            strip.setAttribute('aria-label', strip.dataset.label ?? '')
            strip.tabIndex = 0
          } else {
            strip.removeAttribute('role')
            strip.removeAttribute('aria-label')
            strip.removeAttribute('tabindex')
          }
          if (max <= 0) return
          const visible = strip.clientWidth / strip.scrollWidth
          const progress = strip.scrollLeft / max
          bar.style.transform = `translateX(${progress * (1 - visible) * 100}%) scaleX(${visible})`
        }
        const onScroll = () => {
          if (!frame) frame = requestAnimationFrame(update)
        }

        strip.addEventListener('scroll', onScroll, { passive: true })
        const observer = new ResizeObserver(onScroll)
        observer.observe(strip)
        update()

        return () => {
          strip.removeEventListener('scroll', onScroll)
          observer.disconnect()
          if (frame) cancelAnimationFrame(frame)
        }
      }),
    [],
  )

  return null
}
