'use client'

import { useEffect } from 'react'
import { dur, ease, gsap, mq } from '@/lib/gsap'
import { defer } from '@/lib/schedule'

// Бокал — маятник на стойке: затухающее колебание вокруг точки подвеса.
/** Период качания, с. */
const PERIOD = 0.9
const OMEGA = (2 * Math.PI) / PERIOD
/** Затухание, 1/с: каждое следующее отклонение примерно вдвое меньше предыдущего. */
const DAMPING = 1.5
/** Длительность качания: целое число периодов, к концу размах меньше 0,02 от начального. */
const SWING = PERIOD * 3
/** Отклонение бокала в начале движения по стойке: чаша отстаёт от ножки, град. */
const LAG = 9
/** Толчок при наведении, град. */
const KICK = 4.5
/** Сдвиг между шагами, когда они появляются вместе (десктоп), с. */
const STEP_STAGGER = 0.2

/**
 * Движение блока «Как проходит».
 *  Появление: стойка прочерчивается, номер выезжает из-под маски, бокал въезжает по стойке справа,
 *  будто его вешают, и покачивается до остановки; следом проявляются название и текст шага.
 *  На десктопе шаги появляются по очереди слева направо, на мобильном — каждый, когда входит в экран.
 *  Наведение (мышь): бокал мягко качается, в ту сторону, куда его «задел» курсор.
 * Двигаются только transform и opacity. При prefers-reduced-motion ничего не запускается:
 * бокалы висят статично (исходных состояний в CSS тоже нет).
 */
export function ProcessMotion() {
  useEffect(
    () =>
      defer(() => {
        const root = document.querySelector<HTMLElement>('[data-process]')
        if (!root) return
        const line = root.querySelector<HTMLElement>('[data-process-line]')
        const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-process-step]'))
        const part = (step: HTMLElement, name: string) => step.querySelector<HTMLElement>(`[data-process-${name}]`)

        /** Качание бокала: from — начальное отклонение, kick — толчок (оба в градусах). */
        const swings = new WeakMap<Element, gsap.core.Tween>()
        const swing = (el: Element, from: number, kick: number, delay = 0) => {
          swings.get(el)?.kill()
          const set = gsap.quickSetter(el, 'rotation', 'deg')
          const clock = { t: 0 }
          set(from)
          const tween = gsap.to(clock, {
            t: SWING,
            duration: SWING,
            delay,
            // ход времени для формулы маятника; сама кривая движения — затухающая синусоида
            ease: ease.scrub,
            onUpdate: () =>
              set(Math.exp(-DAMPING * clock.t) * (from * Math.cos(OMEGA * clock.t) + kick * Math.sin(OMEGA * clock.t))),
            onComplete: () => {
              set(0)
              swings.delete(el)
            },
          })
          swings.set(el, tween)
        }

        const mm = gsap.matchMedia()

        mm.add(mq.motion, () => {
          const played = new WeakSet<HTMLElement>()
          let lineDone = false

          const playLine = () => {
            if (lineDone || !line) return
            lineDone = true
            gsap.to(line, { scaleX: 1, duration: 1.4, ease: ease.out })
          }

          const play = (step: HTMLElement, delay: number) => {
            played.add(step)
            playLine()
            const rail = part(step, 'rail')
            const num = part(step, 'num')
            const glass = part(step, 'glass')
            const body = part(step, 'body')
            const drawing = glass?.querySelector('[data-process-swing]')

            if (rail) gsap.to(rail, { scaleX: 1, duration: 1.2, ease: ease.out, delay })
            if (num) {
              gsap.to(num.querySelectorAll('.line__inner'), {
                y: 0,
                yPercent: 0,
                duration: dur.line,
                ease: ease.out,
                delay,
                clearProps: 'willChange',
              })
            }
            if (glass && drawing) {
              const at = delay + 0.2
              // Бокал едет по стойке справа: путь — чуть больше половины шага (на мобильном — свой отрезок стойки).
              const hang = glass.parentElement as HTMLElement
              const distance = Math.max(0, Math.min(step.offsetWidth * 0.55, hang.offsetWidth - glass.offsetLeft - glass.offsetWidth / 2))
              gsap.fromTo(glass, { x: distance }, { x: 0, duration: 1.4, ease: ease.soft, delay: at })
              gsap.to(glass, { opacity: 1, duration: 0.4, ease: ease.soft, delay: at })
              // чаша отстаёт от ножки (бокал едет влево — чаша остаётся правее), затем качается до остановки
              swing(drawing, -LAG, 0, at)
            }
            if (body) gsap.to(body, { opacity: 1, y: 0, duration: dur.block, ease: ease.out, delay: delay + 0.6 })
          }

          // Шаг уже выше экрана (заход по якорю ниже, перезагрузка с середины): показать без анимации.
          const show = (step: HTMLElement) => {
            played.add(step)
            if (line && !lineDone) {
              lineDone = true
              gsap.set(line, { scaleX: 1 })
            }
            const rail = part(step, 'rail')
            const num = part(step, 'num')
            const glass = part(step, 'glass')
            const body = part(step, 'body')
            if (rail) gsap.set(rail, { scaleX: 1 })
            if (num) gsap.set(num.querySelectorAll('.line__inner'), { y: 0, yPercent: 0 })
            if (glass) gsap.set(glass, { opacity: 1, x: 0 })
            if (body) gsap.set(body, { opacity: 1, y: 0 })
          }

          const observer = new IntersectionObserver(
            (entries) => {
              let order = 0
              entries.forEach((entry) => {
                const step = entry.target as HTMLElement
                if (entry.isIntersecting) play(step, order++ * STEP_STAGGER)
                else if (entry.boundingClientRect.bottom < 0) show(step)
                else return
                observer.unobserve(step)
              })
            },
            { rootMargin: '0px 0px -14% 0px' },
          )
          steps.forEach((step) => observer.observe(step))

          // Наведение: бокал качается. Толчок — в сторону движения курсора.
          const hover = window.matchMedia(mq.hover)
          const onEnter = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse' || !hover.matches) return
            const step = event.currentTarget as HTMLElement
            const drawing = step.querySelector('[data-process-swing]')
            if (!drawing || !played.has(step)) return
            // пока бокал ещё едет по стойке и заметно качается — не перебиваем
            const current = swings.get(drawing)
            if (current && current.time() < 1.1) return
            const box = step.getBoundingClientRect()
            const fromLeft = event.movementX !== 0 ? event.movementX > 0 : event.clientX < box.left + box.width / 2
            // курсор идёт слева направо — чаша уходит вправо (против часовой), и наоборот
            swing(drawing, Number(gsap.getProperty(drawing, 'rotation')) || 0, fromLeft ? -KICK : KICK)
          }
          steps.forEach((step) => step.addEventListener('pointerenter', onEnter))

          return () => {
            observer.disconnect()
            steps.forEach((step) => step.removeEventListener('pointerenter', onEnter))
          }
        })

        return () => mm.revert()
      }),
    [],
  )

  return null
}
