'use client'

import { useEffect } from 'react'
import { ease, gsap, mq } from '@/lib/gsap'
import { defer } from '@/lib/schedule'

/**
 * Половина под курсором расширяется, вторая сжимается.
 * Анимируется одна переменная --p на сцене; все сдвиги считает CSS (directions.module.css).
 * Работает только с мышью или трекпадом и без prefers-reduced-motion; с клавиатуры половина
 * раскрывается, когда фокус попадает на её ссылку.
 */
export function DirectionsSplit() {
  useEffect(
    () =>
      defer(() => {
        const stage = document.querySelector<HTMLElement>('[data-directions]')
        if (!stage) return
        const mm = gsap.matchMedia()

        mm.add(`${mq.motion} and ${mq.hover} and ${mq.desktop}`, () => {
          const to = gsap.quickTo(stage, '--p', { duration: 1.1, ease: ease.soft })
          const target = (el: EventTarget | null): number | null => {
            const hit = (el as Element | null)?.closest<HTMLElement>('[data-dir-hit]')
            if (!hit) return null
            return hit.dataset.dirHit === 'events' ? -1 : 1
          }

          const onOver = (e: PointerEvent) => {
            const p = target(e.target)
            if (p !== null) to(p)
          }
          const onLeave = () => to(0)
          const onFocusIn = (e: FocusEvent) => {
            const p = target(e.target)
            if (p !== null) to(p)
          }
          const onFocusOut = (e: FocusEvent) => {
            if (!stage.contains(e.relatedTarget as Node | null)) to(0)
          }

          stage.addEventListener('pointerover', onOver)
          stage.addEventListener('pointerleave', onLeave)
          stage.addEventListener('focusin', onFocusIn)
          stage.addEventListener('focusout', onFocusOut)

          return () => {
            stage.removeEventListener('pointerover', onOver)
            stage.removeEventListener('pointerleave', onLeave)
            stage.removeEventListener('focusin', onFocusIn)
            stage.removeEventListener('focusout', onFocusOut)
            gsap.set(stage, { '--p': 0 })
          }
        })

        return () => mm.revert()
      }),
    [],
  )

  return null
}
