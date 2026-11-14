'use client'

import { useEffect, useRef } from 'react'
import { cta, sectionIds } from '@/data/site'
import { ScrollTrigger } from '@/lib/gsap'
import styles from './mobileBar.module.css'
import { defer } from '@/lib/schedule'

/**
 * Мобильная панель с кнопкой заявки. На телефоне в шапке только бургер, поэтому кнопка
 * «Обсудить событие» закреплена внизу экрана: до заявки — одно действие с любого блока.
 * Панель появляется после первого экрана (там своя кнопка) и уходит, когда на экране форма.
 */
export function MobileBar() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      defer(() => {
        const bar = ref.current
        const start = document.getElementById(sectionIds.directions)
        const end = document.getElementById(sectionIds.request)
        if (!bar || !start || !end) return

        // Пока панель спрятана, она недоступна для фокуса (без JavaScript она просто всегда видна).

        bar.setAttribute('inert', '')

        const trigger = ScrollTrigger.create({
          trigger: start,
          start: 'top 75%',
          endTrigger: end,
          end: 'top 80%',
          onToggle: (self) => {
            bar.toggleAttribute('data-visible', self.isActive)
            // Скрытая панель недоступна для фокуса.
            bar.toggleAttribute('inert', !self.isActive)
          },
        })
        return () => trigger.kill()
      }),
    [],
  )

  return (
    <div ref={ref} className={styles.bar} data-mobile-bar>
      <a href={`#${sectionIds.request}`} className="btn btn--block">
        {cta.discussEvent}
      </a>
    </div>
  )
}
