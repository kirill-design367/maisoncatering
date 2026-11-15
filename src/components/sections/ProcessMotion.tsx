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
/** Бокал трогается не раньше, чем через столько секунд после своей цифры… */
const AFTER_NUM = 0.2
/** …и после начала прочерчивания стойки (к этому моменту линия уже дошла до бокала). */
const AFTER_RAIL = 0.35
/** Название и текст шага — следом за бокалом. */
const AFTER_GLASS = 0.4
/** Какая доля места под бокал должна быть на экране, чтобы бокал поехал. */
const GLASS_IN_VIEW = 0.75

type Kind = 'num' | 'rail' | 'glass' | 'body'

/**
 * Движение блока «Как проходит».
 *  Появление: стойка прочерчивается, номер поднимается из-за неё, бокал въезжает по стойке справа,
 *  будто его вешают, и покачивается до остановки; следом проявляются название и текст шага.
 *  Каждая часть запускается, когда сама входит в экран (бокал — когда место под него видно на три четверти):
 *  сцена не проходит за нижним краем окна. Если всё вошло в экран разом, порядок тот же — его держат паузы.
 *  На десктопе шаги идут по очереди слева направо, на мобильном — каждый шаг сам по себе.
 *  Наведение (мышь): бокал мягко качается в ту сторону, куда его «задел» курсор.
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
        const stepOf = (el: Element) => el.closest<HTMLElement>('[data-process-step]')
        const now = () => performance.now() / 1000

        const hangs = steps
          .map((step) => part(step, 'glass')?.parentElement)
          .filter((hang): hang is HTMLElement => !!hang)

        // ── Качание ───────────────────────────────────────────────────────────────
        /** from — начальное отклонение, kick — толчок (оба в градусах). */
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
              // без transform рисунок снова стоит на сетке пикселей: линии чёткие
              gsap.set(el, { clearProps: 'transform' })
              swings.delete(el)
            },
          })
          swings.set(el, tween)
        }

        const mm = gsap.matchMedia()

        mm.add(mq.motion, () => {
          // Исходные состояния появления действуют, только пока у <html> есть класс .js. Если анимации
          // загрузились слишком поздно, запасной показ уже снял его и всё содержимое видно:
          // появление в этом случае не запускаем — бокалы не должны отскакивать и въезжать заново.
          const hidden = document.documentElement.classList.contains('js')

          /** Моменты запуска частей шага (секунды от загрузки страницы): по ним держится порядок. */
          const starts = new WeakMap<HTMLElement, Partial<Record<Kind, number>>>()
          const startsOf = (step: HTMLElement) => {
            let entry = starts.get(step)
            if (!entry) starts.set(step, (entry = {}))
            return entry
          }
          let lineAt: number | null = null
          /** Бокал уже на месте: можно качать по наведению. */
          const hung = new WeakSet<HTMLElement>()
          if (!hidden) steps.forEach((step) => hung.add(step))

          const playNum = (el: HTMLElement, delay: number) => {
            const step = stepOf(el)
            if (step) startsOf(step).num = now() + delay
            gsap.to(el.querySelectorAll('.line__inner'), {
              y: 0,
              yPercent: 0,
              duration: dur.line,
              ease: ease.out,
              delay,
              clearProps: 'willChange',
            })
          }

          const playRail = (el: HTMLElement, delay: number) => {
            const step = stepOf(el)
            if (step) startsOf(step).rail = now() + delay
            else lineAt = now() + delay
            // сплошная стойка десктопа длинная — 1,4 с; короткий отрезок на телефоне — 0,7 с
            gsap.to(el, { scaleX: 1, duration: step ? 0.7 : 1.4, ease: ease.out, delay })
          }

          const playGlass = (hang: HTMLElement, delay: number) => {
            const step = stepOf(hang)
            const glass = hang.querySelector<HTMLElement>('[data-process-glass]')
            const drawing = glass?.querySelector('[data-process-swing]')
            if (!step || !glass || !drawing) return
            const started = startsOf(step)
            const railAt = started.rail ?? lineAt
            // не раньше своей цифры и не раньше, чем стойка дочерчена до бокала
            const at = Math.max(
              now() + delay,
              started.num !== undefined ? started.num + AFTER_NUM : 0,
              railAt !== null && railAt !== undefined ? railAt + AFTER_RAIL : 0,
            )
            const wait = at - now()
            started.glass = at
            hung.add(step)
            // Бокал едет по стойке справа. Путь — чуть больше половины шага, но рисунок не выходит
            // за конец стойки (на мобильном — за свой короткий отрезок).
            const room = hang.offsetWidth - glass.offsetLeft - glass.offsetWidth
            const distance = Math.max(0, Math.min(step.offsetWidth * 0.55, room))
            gsap.fromTo(glass, { x: distance }, { x: 0, duration: 1.4, ease: ease.soft, delay: wait, clearProps: 'transform' })
            gsap.to(glass, { opacity: 1, duration: 0.4, ease: ease.soft, delay: wait })
            // чаша отстаёт от ножки (бокал едет влево — чаша остаётся правее), затем качается до остановки
            swing(drawing, -LAG, 0, wait)
          }

          const playBody = (el: HTMLElement, delay: number) => {
            const step = stepOf(el)
            const glassAt = step ? startsOf(step).glass : undefined
            const at = Math.max(now() + delay, glassAt !== undefined ? glassAt + AFTER_GLASS : 0)
            gsap.to(el, { opacity: 1, y: 0, duration: dur.block, ease: ease.out, delay: at - now() })
          }

          // Часть уже выше экрана (заход по якорю ниже, перезагрузка с середины): показать без анимации.
          const show: Record<Kind, (el: HTMLElement) => void> = {
            num: (el) => gsap.set(el.querySelectorAll('.line__inner'), { y: 0, yPercent: 0 }),
            rail: (el) => gsap.set(el, { scaleX: 1 }),
            glass: (hang) => {
              const step = stepOf(hang)
              if (step) hung.add(step)
              gsap.set(hang.querySelector('[data-process-glass]'), { opacity: 1, x: 0 })
            },
            body: (el) => gsap.set(el, { opacity: 1, y: 0 }),
          }
          const play: Record<Kind, (el: HTMLElement, delay: number) => void> = {
            num: playNum,
            rail: playRail,
            glass: playGlass,
            body: playBody,
          }

          const observers: IntersectionObserver[] = []
          let frame = 0
          if (hidden) {
            // Части, вошедшие в экран, запускаются не из самого наблюдателя, а в следующем кадре и в порядке
            // «цифра → стойка → бокал → текст»: порядок вызова наблюдателей браузер не гарантирует,
            // а бокал должен знать, когда тронулись его цифра и стойка.
            const ORDER: Kind[] = ['num', 'rail', 'glass', 'body']
            const queue: { kind: Kind; el: HTMLElement }[] = []
            const flush = () => {
              frame = 0
              const batch = queue.splice(0)
              ORDER.forEach((kind) => {
                batch
                  .filter((item) => item.kind === kind)
                  // шаги — слева направо (сверху вниз), как в разметке
                  .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
                  .forEach((item, order) => play[kind](item.el, order * STEP_STAGGER))
              })
            }
            const watch = (kind: Kind, targets: (HTMLElement | null)[], options: IntersectionObserverInit, ratio = 0) => {
              const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                  const el = entry.target as HTMLElement
                  if (entry.isIntersecting && entry.intersectionRatio >= ratio) {
                    queue.push({ kind, el })
                    frame ||= requestAnimationFrame(flush)
                  }
                  // Скрытая часть (display: none в другой раскладке) выше экрана не считается.
                  else if (!entry.isIntersecting && entry.boundingClientRect.height > 0 && entry.boundingClientRect.bottom < 0)
                    show[kind](el)
                  else return
                  observer.unobserve(el)
                })
              }, options)
              targets.forEach((el) => el && observer.observe(el))
              observers.push(observer)
            }

            watch('num', steps.map((step) => part(step, 'num')), { rootMargin: '0px 0px -14% 0px' })
            // стойка: сплошная на десктопе, свой отрезок у шага на мобильном
            watch('rail', [line, ...steps.map((step) => part(step, 'rail'))], { rootMargin: '0px 0px -8% 0px' })
            watch(
              'glass',
              hangs,
              { threshold: [0, GLASS_IN_VIEW] },
              // запас на округление доли
              GLASS_IN_VIEW - 0.01,
            )
            watch('body', steps.map((step) => part(step, 'body')), { rootMargin: '0px 0px -8% 0px' })
          }

          // Наведение: бокал качается. Толчок — в сторону движения курсора.
          const hover = window.matchMedia(mq.hover)
          const onEnter = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse' || !hover.matches) return
            const step = event.currentTarget as HTMLElement
            const drawing = step.querySelector('[data-process-swing]')
            if (!drawing || !hung.has(step)) return
            // пока бокал ещё едет по стойке и заметно качается — не перебиваем
            const current = swings.get(drawing)
            if (current && current.time() < 1.1) return
            // сторона входа нужна, только если браузер не сообщил направление: раскладку зря не читаем
            const fromLeft =
              event.movementX !== 0
                ? event.movementX > 0
                : event.clientX < step.getBoundingClientRect().left + step.offsetWidth / 2
            // курсор идёт слева направо — чаша уходит вправо (против часовой), и наоборот
            swing(drawing, Number(gsap.getProperty(drawing, 'rotation')) || 0, fromLeft ? -KICK : KICK)
          }
          steps.forEach((step) => step.addEventListener('pointerenter', onEnter))

          return () => {
            cancelAnimationFrame(frame)
            observers.forEach((observer) => observer.disconnect())
            steps.forEach((step) => step.removeEventListener('pointerenter', onEnter))
          }
        })

        return () => mm.revert()
      }),
    [],
  )

  return null
}
