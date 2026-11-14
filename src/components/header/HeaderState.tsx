'use client'

import { useEffect } from 'react'
import { sectionIds } from '@/data/site'
import { ScrollTrigger } from '@/lib/gsap'
import { defer } from '@/lib/schedule'

/**
 * Состояния шапки, зависящие от прокрутки:
 *  data-scrolled — страница прокручена: появляется линия под шапкой;
 *  data-theme="bordo" — под шапкой бордовый экран заявки: шапка становится бордовой с молочным текстом;
 *  aria-current у пункта меню — раздел, который сейчас на экране.
 */
export function HeaderState() {
  useEffect(
    () =>
      defer(() => {
        const header = document.querySelector<HTMLElement>('[data-header]')
        if (!header) return

        const triggers: ScrollTrigger[] = []

        triggers.push(
          ScrollTrigger.create({
            start: 8,
            end: 'max',
            onToggle: (self) => header.toggleAttribute('data-scrolled', self.isActive),
          }),
        )

        const request = document.getElementById(sectionIds.request)
        if (request) {
          triggers.push(
            ScrollTrigger.create({
              trigger: request,
              start: () => `top ${header.offsetHeight}px`,
              end: 'bottom top',
              onToggle: (self) => {
                if (self.isActive) header.setAttribute('data-theme', 'bordo')
                else header.removeAttribute('data-theme')
              },
            }),
          )
        }

        const links = Array.from(header.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'))
        links.forEach((link) => {
          const section = document.getElementById(link.getAttribute('href')!.slice(1))
          if (!section) return
          triggers.push(
            ScrollTrigger.create({
              trigger: section,
              start: 'top 55%',
              end: 'bottom 55%',
              onToggle: (self) => {
                if (self.isActive) link.setAttribute('aria-current', 'true')
                else link.removeAttribute('aria-current')
              },
            }),
          )
        })

        return () => triggers.forEach((t) => t.kill())
      }),
    [],
  )

  return null
}
