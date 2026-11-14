'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Плагины регистрируются один раз здесь. Все компоненты берут gsap и ScrollTrigger из этого файла.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
  gsap.defaults({ ease: 'expo.out', duration: 1 })
}

/** Easing и длительности проекта. Линейных переходов нет, кроме scrub-анимаций, привязанных к скроллу. */
export const ease = {
  /** Появление: быстро входит, долго и мягко останавливается. */
  out: 'expo.out',
  /** Отклик на курсор и нажатие. */
  soft: 'power3.out',
  /** Переход между двумя видимыми состояниями (сплит, вкладки, меню). */
  inOut: 'power3.inOut',
  /** Только для scrub: движение привязано к скроллу. */
  scrub: 'none',
} as const

export const dur = {
  /** Строка заголовка. */
  line: 1.2,
  /** Текст, линии, кадры. */
  block: 1.0,
  /** Отклик на курсор. */
  hover: 0.6,
  /** Смена состояния (вкладка, аккордеон). */
  swap: 0.7,
  /** Сдвиг между строками заголовка. */
  stagger: 0.09,
} as const

/** Медиа-условия для gsap.matchMedia(). */
export const mq = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 1024px)',
  mobile: '(max-width: 1023.98px)',
  /** Есть мышь или трекпад: эффекты наведения и следования за курсором. */
  hover: '(hover: hover) and (pointer: fine)',
} as const

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(mq.reduced).matches
}

export { gsap, ScrollTrigger }
