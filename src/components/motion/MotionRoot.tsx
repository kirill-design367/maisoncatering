'use client'

import { useEffect } from 'react'
import type Lenis from 'lenis'
import { dur, ease, gsap, mq, ScrollTrigger } from '@/lib/gsap'
import { defer } from '@/lib/schedule'
import { goToSection, setLenis } from '@/lib/scroll'

declare global {
  interface Window {
    __motionReady?: boolean
  }
}

/**
 * Общий слой движения страницы. Подключается один раз в layout.
 *  1. Плавная прокрутка Lenis на одном тикере с GSAP (на тач-устройствах прокрутка нативная,
 *     Lenis там не загружается).
 *  2. Якорные ссылки: плавный переход к блоку.
 *  3. Появление блоков по data-reveal (см. globals.css).
 * При prefers-reduced-motion Lenis не запускается, а содержимое видно сразу (это делает CSS).
 */
export function MotionRoot() {
  useEffect(() => {
    window.__motionReady = true
    return defer(setup)
  }, [])

  return null
}

/** Настройка слоя движения: выполняется после первой отрисовки (см. src/lib/schedule.ts). */
function setup() {
  const mm = gsap.matchMedia()

  // 1. Lenis + ScrollTrigger на одном тикере. Только там, где есть мышь или трекпад:
  // на тач-устройствах прокрутка нативная, и библиотека даже не загружается.
  mm.add(`${mq.motion} and ${mq.hover}`, () => {
    let lenis: Lenis | null = null
    let cancelled = false
    const tick = (time: number) => lenis?.raf(time * 1000)

    import('lenis').then(({ default: LenisClass }) => {
      if (cancelled) return
      lenis = new LenisClass({ lerp: 0.1, smoothWheel: true, anchors: false })
      setLenis(lenis)
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    })

    return () => {
      cancelled = true
      gsap.ticker.remove(tick)
      lenis?.destroy()
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

    // За входом в экран следит IntersectionObserver: он не читает раскладку и не требует
    // пересчёта позиций, в отличие от десятков отдельных триггеров.
    const groups = new Map<Element, HTMLElement[]>()
    const groupObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const group = entry.target as HTMLElement
          const step = parseFloat(group.dataset.revealGroup || '') || 0.08
          groups.get(group)?.forEach((el, i) => play(el, i * step))
          groupObserver.unobserve(group)
        })
      },
      // группа срабатывает, когда её верх поднялся на 14% высоты экрана от нижнего края
      { rootMargin: '0px 0px -14% 0px' },
    )
    const singleObserver = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            play(entry.target as HTMLElement, i * 0.08)
            singleObserver.unobserve(entry.target)
          })
      },
      { rootMargin: '0px 0px -10% 0px' },
    )

    // Группа: элементы внутри появляются по очереди, когда группа входит в экран.
    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
        (el) => el.closest('[data-reveal-group]') === group,
      )
      groups.set(group, items)
      groupObserver.observe(group)
    })

    // Одиночные элементы.
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      if (!inGroup(el)) singleObserver.observe(el)
    })

    return () => {
      groupObserver.disconnect()
      singleObserver.disconnect()
    }
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

  // ScrollTrigger сам пересчитывает позиции при событии load. Если шрифты догрузились позже
  // (высота заголовков могла измениться) — пересчитать ещё раз.
  let disposed = false
  document.fonts?.ready.then(() => {
    if (!disposed && document.readyState === 'complete') ScrollTrigger.refresh()
  })

  return () => {
    disposed = true
    document.removeEventListener('click', onClick)
    mm.revert()
  }
}
