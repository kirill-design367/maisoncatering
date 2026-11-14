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
 * Куда встать, чтобы блок был виден лучшим образом.
 *  — Первый экран и экран заявки (data-scroll-flush) занимают всё окно: встают вплотную к верху.
 *  — Блок с отмеченной частью (data-scroll-anchor, например карта меню) показывает её целиком:
 *    по центру под шапкой, если помещается.
 *  — Остальные блоки: заголовок встаёт под шапку с небольшим воздухом, а не через весь верхний отступ блока.
 */
function targetTop(target: HTMLElement): number {
  const scrollY = window.scrollY
  const rect = target.getBoundingClientRect()
  if (target.hasAttribute('data-scroll-flush')) return rect.top + scrollY

  const header = headerOffset()
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const anchor = target.querySelector<HTMLElement>('[data-scroll-anchor]')
  if (anchor) {
    const box = anchor.getBoundingClientRect()
    const free = window.innerHeight - header - box.height
    return box.top + scrollY - header - Math.max(rem, free / 2)
  }

  const padTop = parseFloat(getComputedStyle(target).paddingTop) || 0
  const air = Math.min(padTop, 4.5 * rem)
  return rect.top + scrollY + padTop - air - header + 1
}

/** Плавно прокрутить к блоку. */
export function scrollToTarget(target: HTMLElement, opts: { immediate?: boolean } = {}) {
  const immediate = opts.immediate || prefersReducedMotion()
  // Позиция считается здесь и передаётся числом: по элементу Lenis сам добавляет
  // scroll-padding-top страницы, и отступ под шапку получился бы двойным.
  const top = Math.max(0, Math.round(targetTop(target)))
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
