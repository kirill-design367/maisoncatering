'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { dur, ease, gsap, mq, ScrollTrigger } from '@/lib/gsap'
import { goToSection, setLenis } from '@/lib/scroll'

declare global {
  interface Window {
    __motionReady?: boolean
  }
}

/**
 * Общий слой движения страницы. Подключается один раз в layout.
 *  1. Плавная прокрутка Lenis на одном тикере с GSAP (на тач-устройствах прокрутка нативная).
 *  2. Якорные ссылки: плавный переход к блоку.
 *  3. Появление блоков по data-reveal (см. globals.css).
 * При prefers-reduced-motion Lenis не запускается, а содержимое видно сразу (это делает CSS).
 */
export function MotionRoot() {
  useEffect(() => {
    window.__motionReady = true
    const mm = gsap.matchMedia()

    // 1. Lenis + ScrollTrigger на одном тикере.
    mm.add(mq.motion, () => {
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: false })
      setLenis(lenis)
      lenis.on('scroll', ScrollTrigger.update)
      const tick = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      return () => {
        gsap.ticker.remove(tick)
        lenis.destroy()
        setLenis(null)
      }
    })

    // 3. Появление блоков.
    mm.add(mq.motion, () => {
      const inGroup = (el: Element) => !!el.closest('[data-reveal-group]')

      const play = (el: HTMLElement, delay = 0) => {
        const own = parseFloat(el.dataset.revealDelay || '0')
        const at = delay + own
        switch (el.dataset.reveal) {
          case 'lines':
            gsap.to(el.querySelectorAll('.line__inner'), {
              y: 0,
              yPercent: 0,
              duration: dur.line,
              ease: ease.out,
              stagger: dur.stagger,
              delay: at,
              clearProps: 'willChange',
            })
            break
          case 'rule':
            gsap.to(el, { scaleX: 1, duration: 1.4, ease: ease.out, delay: at })
            break
          case 'mask':
            gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: ease.out, delay: at })
            break
          default:
            gsap.to(el, { opacity: 1, y: 0, duration: dur.block, ease: ease.out, delay: at })
        }
      }

      // Группа: элементы внутри появляются по очереди, когда группа входит в экран.
      gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
        const items = gsap.utils
          .toArray<HTMLElement>('[data-reveal]', group)
          .filter((el) => el.closest('[data-reveal-group]') === group)
        const step = parseFloat(group.dataset.revealGroup || '') || 0.08
        ScrollTrigger.create({
          trigger: group,
          start: 'top 86%',
          once: true,
          onEnter: () => items.forEach((el, i) => play(el, i * step)),
        })
      })

      // Одиночные элементы.
      const singles = gsap.utils.toArray<HTMLElement>('[data-reveal]').filter((el) => !inGroup(el))
      ScrollTrigger.batch(singles, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => (batch as HTMLElement[]).forEach((el, i) => play(el, i * 0.08)),
      })
    })

    // 2. Якорные ссылки.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
      if (!link) return
      const id = decodeURIComponent(link.getAttribute('href')!.slice(1))
      if (!id || !document.getElementById(id)) return
      event.preventDefault()
      goToSection(id)
    }
    document.addEventListener('click', onClick)

    // После загрузки шрифтов и картинок высоты блоков могут измениться — пересчитать триггеры.
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)

    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('load', refresh)
      mm.revert()
    }
  }, [])

  return null
}
