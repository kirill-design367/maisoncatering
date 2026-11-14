'use client'

import { useEffect } from 'react'
import { ease, gsap, mq } from '@/lib/gsap'
import { defer } from '@/lib/schedule'

/**
 * Параллакс галереи: каждый кадр при прокрутке смещается на свою величину (data-shift, в rem),
 * поэтому кадры движутся с разной скоростью. На мобильном движение мягче: смещаются две колонки целиком.
 * Двигается обёртка кадра (transform), открытие маски живёт на вложенном элементе — они не мешают друг другу.
 * При prefers-reduced-motion параллакса нет.
 */
export function GalleryMotion() {
  useEffect(
    () =>
      defer(() => {
        const root = document.querySelector<HTMLElement>('[data-gallery]')
        if (!root) return
        const mm = gsap.matchMedia()

        mm.add({ motion: mq.motion, desktop: mq.desktop }, (context) => {
          const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean }
          if (!motion) return
          const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

          const drift = (el: HTMLElement, shift: number) =>
            gsap.fromTo(
              el,
              { y: () => shift * rem() },
              {
                y: () => -shift * rem(),
                ease: ease.scrub,
                scrollTrigger: {
                  trigger: el,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              },
            )

          if (desktop) {
            // Десктоп: у каждого кадра своя скорость.
            gsap.utils.toArray<HTMLElement>('[data-gallery-frame]', root).forEach((frame) => {
              drift(frame, parseFloat(frame.dataset.shift || '0'))
            })
          } else {
            // Мобильный: мягче — с разной скоростью движутся две колонки, кадры внутри колонки не расходятся.
            gsap.utils.toArray<HTMLElement>('[data-gallery-column]', root).forEach((column, i) => {
              drift(column, i === 0 ? 1.5 : -1)
            })
          }
        })

        return () => mm.revert()
      }),
    [],
  )

  return null
}
