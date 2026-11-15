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
/** Длительность качания: целое число периодов. */
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
/** Десктоп: название и текст шага стоят под бокалом и идут следом за ним. */
const AFTER_GLASS = 0.4
/** Какая доля места под бокал должна быть на экране, чтобы бокал поехал. */
const GLASS_IN_VIEW = 0.75
/** Область наблюдения продлена вверх: часть, оказавшаяся выше окна, тоже считается вошедшей. */
const ABOVE = 100000

type Kind = 'num' | 'rail' | 'glass' | 'body'
const ORDER: Kind[] = ['num', 'rail', 'glass', 'body']

/**
 * Движение блока «Как проходит».
 *  Появление: стойка прочерчивается, номер поднимается из-за неё, бокал въезжает по стойке справа,
 *  будто его вешают, и покачивается до остановки.
 *  Каждая часть запускается, когда сама входит в экран (бокал — когда место под него видно на три четверти;
 *  на мобильной раскладке нижний край экрана — верх закреплённой кнопки заявки): сцена не проходит
 *  за краем окна. Бокал никогда не трогается раньше своей цифры и стойки: если они ещё не запущены,
 *  он запускает их сам и ждёт. Если всё вошло в экран разом, порядок тот же — его держат паузы.
 *  На десктопе шаги идут по очереди слева направо, текст — следом за бокалом; на мобильном каждый шаг
 *  сам по себе, а текст стоит рядом с цифрой и появляется вместе с ней.
 *  Часть, которая оказалась выше окна или срезана его верхним краем (заход по якорю, перезагрузка
 *  с середины, скачок прокрутки), показывается сразу, без движения.
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
            onUpdate: () => {
              const t = clock.t
              // последний множитель доводит размах ровно до нуля к концу: без него бокал в последнем
              // кадре доворачивался бы скачком на остаток угла
              const settle = 1 - (t / SWING) ** 4
              set(Math.exp(-DAMPING * t) * settle * (from * Math.cos(OMEGA * t) + kick * Math.sin(OMEGA * t)))
            },
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
          const desktop = window.matchMedia(mq.desktop)

          /** Моменты запуска частей шага (секунды от загрузки страницы): по ним держится порядок. */
          const starts = new WeakMap<HTMLElement, Partial<Record<Kind, number>>>()
          const startsOf = (step: HTMLElement) => {
            let entry = starts.get(step)
            if (!entry) starts.set(step, (entry = {}))
            return entry
          }
          let lineAt: number | undefined
          /** Бокал уже на месте: можно качать по наведению. */
          const hung = new WeakSet<HTMLElement>()
          if (!hidden) steps.forEach((step) => hung.add(step))

          const play: Record<Kind, (el: HTMLElement, delay: number) => void> = {
            num: (el, delay) => {
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
            },
            rail: (el, delay) => {
              const step = stepOf(el)
              if (step) startsOf(step).rail = now() + delay
              else lineAt = now() + delay
              // сплошная стойка десктопа длинная — 1,4 с; короткий отрезок на телефоне — 0,7 с
              gsap.to(el, { scaleX: 1, duration: step ? 0.7 : 1.4, ease: ease.out, delay })
            },
            glass: (hang, delay) => {
              const step = stepOf(hang)
              const glass = hang.querySelector<HTMLElement>('[data-process-glass]')
              const drawing = glass?.querySelector('[data-process-swing]')
              if (!step || !glass || !drawing) return
              const started = startsOf(step)
              const railAt = desktop.matches ? lineAt : started.rail
              // не раньше своей цифры и не раньше, чем стойка дочерчена до бокала
              const at = Math.max(
                now() + delay,
                started.num !== undefined ? started.num + AFTER_NUM : 0,
                railAt !== undefined ? railAt + AFTER_RAIL : 0,
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
            },
            body: (el, delay) => {
              const step = stepOf(el)
              const started = step ? startsOf(step) : {}
              // десктоп: текст под бокалом — следом за ним; мобильный: текст рядом с цифрой — вместе с ней
              const lead = desktop.matches
                ? started.glass !== undefined
                  ? started.glass + AFTER_GLASS
                  : 0
                : started.num !== undefined
                  ? started.num + AFTER_NUM
                  : 0
              gsap.to(el, { opacity: 1, y: 0, duration: dur.block, ease: ease.out, delay: Math.max(now() + delay, lead) - now() })
            },
          }

          // Показать без анимации.
          const show: Record<Kind, (el: HTMLElement) => void> = {
            num: (el) => gsap.set(el.querySelectorAll('.line__inner'), { y: 0, yPercent: 0 }),
            rail: (el) => gsap.set(el, { scaleX: 1 }),
            glass: (hang) => {
              const step = stepOf(hang)
              if (step) hung.add(step)
              gsap.set(hang.querySelector('[data-process-glass]'), { opacity: 1, clearProps: 'transform' })
            },
            body: (el) => gsap.set(el, { opacity: 1, y: 0 }),
          }

          const observers: IntersectionObserver[] = []
          let frame = 0
          let resizeTimer = 0
          let onLayout: (() => void) | undefined
          let onResize: (() => void) | undefined

          if (hidden) {
            /** Части, которые ещё скрыты. */
            const pending = new Map<HTMLElement, Kind>()
            steps.forEach((step) => {
              ;(['num', 'rail', 'body'] as const).forEach((kind) => {
                const el = part(step, kind)
                if (el) pending.set(el, kind)
              })
            })
            if (line) pending.set(line, 'rail')
            hangs.forEach((hang) => pending.set(hang, 'glass'))

            const settle = (el: HTMLElement) => {
              pending.delete(el)
              observers.forEach((observer) => observer.unobserve(el))
            }
            const start = (kind: Kind, el: HTMLElement, delay: number) => {
              if (!pending.has(el)) return
              settle(el)
              play[kind](el, delay)
            }
            const reveal = (kind: Kind, el: HTMLElement) => {
              if (!pending.has(el)) return
              settle(el)
              show[kind](el)
            }

            // Части, вошедшие в экран, запускаются не из самого наблюдателя, а в следующем кадре и в порядке
            // «цифра → стойка → бокал → текст»: порядок вызова наблюдателей браузер не гарантирует,
            // а бокал должен знать, когда тронулись его цифра и стойка.
            const queue: { kind: Kind; el: HTMLElement }[] = []
            const flush = () => {
              frame = 0
              const batch = queue.splice(0).filter((item) => pending.has(item.el))
              // Пороги цифры и стойки считаются от высоты окна, порог бокала — от высоты самого бокала:
              // на высоком окне бокал может сработать первым. Тогда он сам запускает свои цифру и стойку.
              batch
                .filter((item) => item.kind === 'glass')
                .forEach(({ el }) => {
                  const step = stepOf(el)
                  if (!step) return
                  const num = part(step, 'num')
                  const rail = desktop.matches ? line : part(step, 'rail')
                  if (num && pending.has(num)) batch.push({ kind: 'num', el: num })
                  if (rail && pending.has(rail)) batch.push({ kind: 'rail', el: rail })
                })
              ORDER.forEach((kind) => {
                batch
                  .filter((item, i) => item.kind === kind && batch.findIndex((other) => other.el === item.el) === i)
                  // шаги — слева направо (сверху вниз), как в разметке
                  .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
                  .forEach((item, order) => start(kind, item.el, order * STEP_STAGGER))
              })
            }

            const watch = (kind: Kind, options: IntersectionObserverInit, ratio = 0) => {
              const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                  const el = entry.target as HTMLElement
                  const box = entry.boundingClientRect
                  // скрыта в этой раскладке (display: none) или ещё не вошла
                  if (!pending.has(el) || (box.width === 0 && box.height === 0)) return
                  if (!entry.isIntersecting || entry.intersectionRatio < ratio) return
                  // выше окна или срезана его верхним краем — показать сразу, без движения
                  if (box.top < 0) reveal(kind, el)
                  else {
                    queue.push({ kind, el })
                    frame ||= requestAnimationFrame(flush)
                  }
                })
              }, options)
              pending.forEach((itemKind, el) => itemKind === kind && observer.observe(el))
              observers.push(observer)
            }

            const observe = () => {
              observers.splice(0).forEach((observer) => observer.disconnect())
              if (!pending.size) return
              const height = window.innerHeight
              // На мобильной раскладке внизу закреплена кнопка заявки: видимая область кончается на её верхе.
              const bar = desktop.matches ? 0 : (document.querySelector<HTMLElement>('[data-mobile-bar]')?.offsetHeight ?? 0)
              const below = (share: number, gap: number) => Math.round(Math.max(height * share, bar + gap))
              const margin = (bottom: number) => `${ABOVE}px 0px -${bottom}px 0px`
              watch('num', { rootMargin: margin(below(0.14, 16)) })
              // стойка: сплошная на десктопе, свой отрезок у шага на мобильном
              watch('rail', { rootMargin: margin(below(0.08, 8)) })
              // запас 0,01 — на округление доли
              watch('glass', { rootMargin: margin(bar), threshold: [0, GLASS_IN_VIEW] }, GLASS_IN_VIEW - 0.01)
              watch('body', { rootMargin: margin(below(0.08, 8)) })
            }
            observe()

            // Смена раскладки (поворот планшета): под уже висящими бокалами стойка должна быть сразу —
            // вместо сплошной линии свои отрезки и наоборот.
            onLayout = () => {
              let any = false
              steps.forEach((step) => {
                if (!hung.has(step)) return
                any = true
                const rail = part(step, 'rail')
                if (rail) reveal('rail', rail)
              })
              if (any && line) reveal('rail', line)
              observe()
            }
            desktop.addEventListener('change', onLayout)
            // Отступы наблюдателей заданы в пикселях от высоты окна — при изменении размера пересчитать.
            onResize = () => {
              window.clearTimeout(resizeTimer)
              resizeTimer = window.setTimeout(observe, 200)
            }
            window.addEventListener('resize', onResize)
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
            window.clearTimeout(resizeTimer)
            if (onLayout) desktop.removeEventListener('change', onLayout)
            if (onResize) window.removeEventListener('resize', onResize)
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
