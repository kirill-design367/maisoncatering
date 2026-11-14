'use client'

import type GSAP from 'gsap'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

// GSAP и ScrollTrigger подгружаются после первой отрисовки, а не вместе со страницей:
// первый экран виден сразу, библиотека анимаций не задерживает его.
// Все компоненты берут gsap и ScrollTrigger из этого файла, а пользуются ими только внутри defer()
// (src/lib/schedule.ts) — к этому моменту библиотека уже загружена.

/** Доступен после loadMotion(). Внутри defer() — всегда. */
export let gsap: typeof GSAP
/** Доступен после loadMotion(). Внутри defer() — всегда. */
export let ScrollTrigger: typeof ScrollTriggerType

export type Timeline = gsap.core.Timeline
export type Tween = gsap.core.Tween

let loading: Promise<void> | null = null

/** Загрузить GSAP и ScrollTrigger (один раз) и зарегистрировать плагин. */
export function loadMotion(): Promise<void> {
  loading ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([core, st]) => {
    gsap = core.gsap
    ScrollTrigger = st.ScrollTrigger
    gsap.registerPlugin(ScrollTrigger)
    gsap.defaults({ ease: 'expo.out', duration: 1 })
  })
  return loading
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
