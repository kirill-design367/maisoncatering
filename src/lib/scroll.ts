'use client'

import type Lenis from 'lenis'
import { prefersReducedMotion } from './gsap'

// Один экземпляр Lenis на страницу. Создаёт и уничтожает его MotionRoot.
let lenis: Lenis | null = null

export function setLenis(instance: Lenis | null) {
  lenis = instance
}

export function getLenis(): Lenis | null {
  return lenis
}

/** Остановить / возобновить прокрутку страницы (полноэкранное меню). */
export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

function headerOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim()
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return raw.endsWith('rem') ? parseFloat(raw) * rem : parseFloat(raw) || 0
}

/**
 * Плавно прокрутить к блоку. Экран заявки и первый экран занимают всё окно и встают вплотную
 * к верху; остальные блоки — под шапкой.
 */
export function scrollToTarget(target: HTMLElement, opts: { immediate?: boolean } = {}) {
  const flush = target.hasAttribute('data-scroll-flush')
  const offset = flush ? 0 : -headerOffset() + 1
  const immediate = opts.immediate || prefersReducedMotion()
  // Позиция считается здесь и передаётся числом: по элементу Lenis сам добавляет
  // scroll-padding-top страницы, и отступ под шапку получился бы двойным.
  const top = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY + offset))
  if (lenis) {
    lenis.scrollTo(top, {
      immediate,
      duration: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      force: true,
    })
  } else {
    window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' })
  }
}

/** Перейти к блоку по id: прокрутка, адресная строка и фокус для клавиатуры и скринридеров. */
export function goToSection(id: string, opts: { immediate?: boolean; focus?: boolean } = {}) {
  const target = document.getElementById(id)
  if (!target) return
  scrollToTarget(target, opts)
  if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`)
  if (opts.focus !== false) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }
}
