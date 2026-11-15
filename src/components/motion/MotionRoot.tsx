'use client'

import { useEffect } from 'react'
import type Lenis from 'lenis'
import { dur, ease, gsap, mq, ScrollTrigger } from '@/lib/gsap'
import { defer } from '@/lib/schedule'
import { goToSection, setLenis } from '@/lib/scroll'

/**
 * Общий слой движения страницы. Подключается один раз в layout.
 *  1. Плавная прокрутка Lenis на одном тикере с GSAP (на тач-устройствах прокрутка нативная,
 *     Lenis там не загружается).
 *  2. Якорные ссылки: плавный переход к блоку.
 *  3. Появление блоков по data-reveal (см. globals.css).
 *  4. Отклик кнопок на касание (на тач-экранах наведения нет).
 * При prefers-reduced-motion Lenis не запускается, а содержимое видно сразу (это делает CSS).
 */
export function MotionRoot() {
  useEffect(() => defer(setup), [])

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

    import('lenis')
      .then(({ default: LenisClass }) => {
        if (cancelled) return
        lenis = new LenisClass({ lerp: 0.1, smoothWheel: true, anchors: false })
        setLenis(lenis)
        lenis.on('scroll', ScrollTrigger.update)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)
      })
      // Не загрузилась — остаётся обычная прокрутка браузера.
      .catch(() => {})

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
          // шторка — на вложенном элементе (см. globals.css)
          gsap.to(el.firstElementChild, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: ease.out, delay: at })
          break
        default:
          gsap.to(el, { opacity: 1, y: 0, duration: dur.block, ease: ease.out, delay: at })
      }
    }

    // Показать сразу, без анимации: блок уже выше экрана (страница открыта с середины,
    // по якорю или восстановлена после перезагрузки) — анимировать то, чего не видно, незачем.
    const show = (el: HTMLElement) => {
      switch (el.dataset.reveal) {
        case 'lines':
          gsap.set(el.querySelectorAll('.line__inner'), { y: 0, yPercent: 0 })
          break
        case 'rule':
          gsap.set(el, { scaleX: 1 })
          break
        case 'mask':
          gsap.set(el.firstElementChild, { clipPath: 'inset(0% 0 0 0)' })
          break
        default:
          gsap.set(el, { opacity: 1, y: 0 })
      }
    }
    const passed = (entry: IntersectionObserverEntry) => !entry.isIntersecting && entry.boundingClientRect.bottom < 0

    // За входом в экран следит IntersectionObserver: он не читает раскладку и не требует
    // пересчёта позиций, в отличие от десятков отдельных триггеров.
    const groups = new Map<Element, { group: HTMLElement; items: HTMLElement[] }>()
    const groupObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const found = groups.get(entry.target)
          if (!found) return
          if (entry.isIntersecting) {
            const step = parseFloat(found.group.dataset.revealGroup || '') || 0.08
            found.items.forEach((el, i) => play(el, i * step))
          } else if (passed(entry)) {
            found.items.forEach(show)
          } else {
            return
          }
          groupObserver.unobserve(entry.target)
        })
      },
      // группа срабатывает, когда её верх поднялся на 14% высоты экрана от нижнего края
      { rootMargin: '0px 0px -14% 0px' },
    )
    const singleObserver = new IntersectionObserver(
      (entries) => {
        let order = 0
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) play(el, order++ * 0.08)
          else if (passed(entry)) show(el)
          else return
          singleObserver.unobserve(el)
        })
      },
      { rootMargin: '0px 0px -10% 0px' },
    )

    // Группа: элементы внутри появляются по очереди, когда группа входит в экран.
    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
        (el) => el.closest('[data-reveal-group]') === group,
      )
      // У группы может не быть собственной высоты (её дети расставлены абсолютно) —
      // тогда наблюдаем за первым её элементом.
      const target = group.getBoundingClientRect().height > 0 ? group : (items[0] ?? group)
      groups.set(target, { group, items })
      groupObserver.observe(target)
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

  // 4. Нажатие на кнопку пальцем: короткий «глоток» заливки (стили — .btn[data-pressed] в globals.css).
  // Метка держится четверть секунды: отклик виден и при самом быстром касании.
  // Обработчик касания нужен и сам по себе: без него Safari на iPhone не включает :active.
  const pressed = new Map<Element, number>()
  const release = (btn: Element) => {
    window.clearTimeout(pressed.get(btn))
    pressed.delete(btn)
    btn.removeAttribute('data-pressed')
  }
  const onPress = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return
    const btn = (event.target as Element | null)?.closest('.btn')
    if (!btn) return
    window.clearTimeout(pressed.get(btn))
    btn.setAttribute('data-pressed', '')
    pressed.set(
      btn,
      window.setTimeout(() => release(btn), 260),
    )
  }
  // Касание перешло в прокрутку — отклик не нужен.
  const onPressCancel = (event: PointerEvent) => {
    const btn = (event.target as Element | null)?.closest('.btn')
    if (btn && pressed.has(btn)) release(btn)
  }
  document.addEventListener('pointerdown', onPress, { passive: true })
  document.addEventListener('pointercancel', onPressCancel, { passive: true })

  // Страница открыта сразу по ссылке с якорем (…/#request): встать на блок по тем же правилам,
  // что и при клике, — браузер сам этого не умеет (экран заявки должен встать вплотную к верху).
  const initial = decodeURIComponent(location.hash.slice(1))
  if (initial && document.getElementById(initial)) goToSection(initial, { immediate: true, focus: false })

  // ScrollTrigger сам пересчитывает позиции при событии load. Если шрифты догрузились позже
  // (высота заголовков могла измениться) — пересчитать ещё раз.
  let disposed = false
  document.fonts?.ready.then(() => {
    if (!disposed && document.readyState === 'complete') ScrollTrigger.refresh()
  })

  return () => {
    disposed = true
    document.removeEventListener('click', onClick)
    document.removeEventListener('pointerdown', onPress)
    document.removeEventListener('pointercancel', onPressCancel)
    pressed.forEach((_, btn) => release(btn))
    mm.revert()
  }
}
