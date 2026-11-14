'use client'

import { useEffect } from 'react'
import { dur, ease, gsap, mq, ScrollTrigger } from '@/lib/gsap'

/**
 * Поведение блока «Форматы мероприятий».
 *
 * Десктоп (строки-ссылки):
 *  — наведение: строка сдвигается вправо, остальные приглушаются, рядом с курсором появляется
 *    кадр формата и мягко идёт за ним;
 *  — клавиатура: при фокусе строки то же состояние, кадр стоит на месте — справа в строке;
 *  — prefers-reduced-motion: без следования и сдвига, кадр просто проявляется у строки.
 * Мобильный (аккордеон): раскрыт один пункт, высота анимируется один раз на нажатие.
 *
 * Разметка статическая (Formats.tsx): компонент только навешивает поведение по data-атрибутам.
 */
export function FormatsInteractive() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-formats]')
    if (!root) return
    const mm = gsap.matchMedia()

    // Условия одним объектом: при смене любого из них (ширина, мышь, reduced motion)
    // прежнее поведение полностью снимается и навешивается заново.
    mm.add({ desktop: mq.desktop, mobile: mq.mobile, motion: mq.motion, hover: mq.hover }, (context) => {
      const { desktop, motion, hover } = context.conditions as Record<string, boolean>
      return desktop ? initRows(root, motion, hover) : initAccordion(root, motion)
    })

    return () => mm.revert()
  }, [])

  return null
}

/** Длительность проявления при prefers-reduced-motion. */
const FADE = 0.15
/** Непрозрачность текста строк, на которые курсор не наведён. */
const DIM = 0.35

const { clamp } = gsap.utils

// ── Десктоп: строки и кадр у курсора ─────────────────────────────────────────

/** Размеры и границы, по которым считается положение кадра. Снимаются при входе курсора и ресайзе. */
type Metrics = {
  /** Размер кадра. */
  w: number
  h: number
  /** Сдвиг названия активной строки. */
  shift: number
  /** Отступ кадра от курсора. */
  offset: number
  /** Левая граница кадра для каждой строки: кадр не закрывает её название. */
  minX: number[]
  /** Правая граница: кадр не доходит до колонки цен. */
  maxX: number
  /** Верх и низ списка, координаты документа: кадр держится между первой и последней линиями. */
  top: number
  bottom: number
  /** Середины строк по вертикали, координаты документа. */
  rowMid: number[]
  /** Границы экрана: под шапкой и над нижним краем окна. */
  viewTop: number
  viewBottom: number
}

function initRows(root: HTMLElement, motion: boolean, hover: boolean): () => void {
  const list = root.querySelector<HTMLElement>('[data-formats-rows]')
  const preview = root.querySelector<HTMLElement>('[data-formats-preview]')
  const frame = preview?.querySelector<HTMLElement>('[data-formats-frame]')
  if (!list || !preview || !frame) return () => {}

  const rows = gsap.utils.toArray<HTMLAnchorElement>('[data-formats-row]', list)
  const texts = rows.map((row) => row.querySelector<HTMLElement>('[data-formats-text]')!)
  const names = rows.map((row) => row.querySelector<HTMLElement>('[data-formats-name]')!)
  const prices = rows.map((row) => row.querySelector<HTMLElement>('[data-formats-price]')!)
  const photos = gsap.utils.toArray<HTMLElement>('[data-formats-photo]', preview)
  const imgs = photos.map((photo) => photo.querySelector<HTMLImageElement>('img')!)

  /** Строка под курсором и строка в фокусе клавиатуры (−1 — нет). */
  let hovered = -1
  let focused = -1
  /** Чем сейчас управляется кадр: последним действием — курсором или клавиатурой. */
  let mode: 'pointer' | 'focus' | null = null
  /** Строка, состояние которой показано. */
  let active = -1
  /** Кадр показан (или показывается) / кадр ещё виден на экране (в том числе пока растворяется). */
  let shown = false
  let visible = false
  /** С какой стороны от курсора стоит кадр: 1 — справа, −1 — слева. */
  let side = 1
  let m: Metrics | null = null
  /** Последние координаты курсора и прокрутка: обработчик движения ничего не читает из вёрстки. */
  const pointer = { x: 0, y: 0 }
  let scrollY = window.scrollY

  // Кадр идёт за курсором с запаздыванием. При reduced motion он не двигается — ставится сразу.
  const xTo = motion ? gsap.quickTo(preview, 'x', { duration: 0.7, ease: ease.soft }) : null
  const yTo = motion ? gsap.quickTo(preview, 'y', { duration: 0.7, ease: ease.soft }) : null
  if (motion) gsap.set(frame, { scale: 0.92 })

  // ── Загрузка кадров: только когда список подошёл к экрану ──
  let armed = false
  const arm = () => {
    if (armed) return
    armed = true
    observer.disconnect()
    preview.setAttribute('data-armed', '')
    // Кадры скрыты, поэтому загрузку запускаем явно и декодируем заранее:
    // первое появление у курсора не должно дёргаться.
    imgs.forEach((img) => {
      img.loading = 'eager'
      img.decode().catch(() => {})
    })
  }
  const observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && arm(), {
    rootMargin: '60% 0px',
  })
  observer.observe(list)

  // ── Измерения: один раз при входе курсора, фокусе и ресайзе ──
  const measure = () => {
    arm()
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const gap = 2 * rem
    const shift = 1.5 * rem
    const w = preview.offsetWidth
    const h = preview.offsetHeight
    const box = list.getBoundingClientRect()
    const header = document.querySelector<HTMLElement>('[data-header]')?.offsetHeight ?? 0
    scrollY = window.scrollY

    // Колонка цен неприкосновенна: кадр останавливается перед самой длинной ценой.
    const priceLeft = Math.min(...prices.map((price) => price.getBoundingClientRect().left))
    const maxX = Math.min(priceLeft - gap, window.innerWidth - rem) - w

    m = {
      w,
      h,
      shift,
      offset: gap,
      // Правый край названия берётся без текущего сдвига строки и с запасом на полный сдвиг.
      minX: names.map((name) => name.getBoundingClientRect().right - Number(gsap.getProperty(name, 'x')) + shift + gap),
      maxX,
      top: box.top + scrollY,
      bottom: box.bottom + scrollY,
      rowMid: rows.map((row) => {
        const rect = row.getBoundingClientRect()
        return rect.top + rect.height / 2 + scrollY
      }),
      viewTop: header + rem,
      viewBottom: window.innerHeight - rem,
    }
  }

  // ── Положение кадра ──
  const target = (metrics: Metrics) => {
    // Если между названием и ценой места меньше ширины кадра, приоритет у цены.
    const minX = Math.min(metrics.minX[active], metrics.maxX)
    let x: number
    let y: number

    if (mode === 'pointer' && motion) {
      // Кадр справа от курсора; у правого края списка переходит налево от него.
      // Порог возврата сдвинут, чтобы кадр не метался на границе.
      const right = pointer.x + metrics.offset
      if (side > 0 && right > metrics.maxX) side = -1
      else if (side < 0 && right < metrics.maxX - metrics.offset * 2) side = 1
      x = side > 0 ? right : pointer.x - metrics.offset - metrics.w
      y = pointer.y + scrollY - metrics.h / 2
    } else {
      // Клавиатура и reduced motion: кадр стоит в правой части строки, по её середине.
      x = metrics.maxX
      y = metrics.rowMid[active] - metrics.h / 2
    }

    x = clamp(minX, metrics.maxX, x)
    // Сначала — в пределах списка (между первой и последней линиями), затем — в пределах экрана.
    y = clamp(metrics.top, Math.max(metrics.top, metrics.bottom - metrics.h), y) - scrollY
    y = clamp(metrics.viewTop, Math.max(metrics.viewTop, metrics.viewBottom - metrics.h), y)
    return { x: Math.round(x), y: Math.round(y) }
  }

  const place = (snap: boolean) => {
    if (!m || active < 0) return
    const { x, y } = target(m)
    if (xTo && yTo) {
      // snap: кадр появляется сразу на месте, а не летит из прошлой точки.
      if (snap) {
        xTo(x, x)
        yTo(y, y)
      } else {
        xTo(x)
        yTo(y)
      }
    } else {
      gsap.set(preview, { x, y })
    }
  }

  // ── Фотографии в кадре: стопка слоёв, нужный проявляется поверх предыдущего ──
  const layer = photos.map(() => 0) // 0 — слой скрыт, иначе его порядок в стопке
  let topLayer = 0

  const showPhoto = (index: number, instant: boolean) => {
    const fade = motion ? 0.5 : FADE
    const photo = photos[index]

    if (instant) {
      // Кадр только появляется: фотография ставится сразу, остальные убираются.
      photos.forEach((other, k) => {
        gsap.killTweensOf(other)
        gsap.set(other, { autoAlpha: k === index ? 1 : 0, zIndex: k === index ? 1 : 0 })
        layer[k] = k === index ? 1 : 0
      })
      topLayer = 1
    } else {
      const wasHidden = layer[index] === 0
      if (wasHidden) {
        topLayer += 1
        layer[index] = topLayer
        gsap.set(photo, { zIndex: topLayer })
      }
      // Слои выше растворяются и открывают нужный; слои ниже скрываются, когда он проявился.
      photos.forEach((other, k) => {
        if (k === index || layer[k] < layer[index]) return
        gsap.to(other, { autoAlpha: 0, duration: fade, ease: ease.soft, overwrite: true, onComplete: () => void (layer[k] = 0) })
      })
      gsap.to(photo, {
        autoAlpha: 1,
        duration: fade,
        ease: ease.soft,
        overwrite: true,
        onComplete: () => {
          photos.forEach((other, k) => {
            if (k === index || layer[k] === 0 || layer[k] > layer[index]) return
            gsap.set(other, { autoAlpha: 0 })
            layer[k] = 0
          })
        },
      })
      if (!wasHidden) return
    }

    // Лёгкий наезд внутри кадра — только для появляющейся фотографии.
    if (motion) gsap.fromTo(imgs[index], { scale: 1.08 }, { scale: 1, duration: 1.1, ease: ease.soft, overwrite: true })
  }

  // ── Состояние строк ──
  const setActive = (index: number) => {
    active = index
    const shift = m?.shift ?? 0
    rows.forEach((_, k) => {
      gsap.to(texts[k], {
        opacity: index < 0 || k === index ? 1 : DIM,
        duration: motion ? dur.hover : FADE,
        ease: ease.soft,
        overwrite: 'auto',
      })
      if (motion) gsap.to(names[k], { x: k === index ? shift : 0, duration: dur.hover, ease: ease.soft, overwrite: 'auto' })
    })
  }

  const show = () => {
    shown = true
    side = 1
    root.setAttribute('data-preview-open', '')
    preview.setAttribute('data-shown', '')
    place(!visible)
    visible = true
    gsap.to(frame, { autoAlpha: 1, scale: 1, duration: motion ? dur.hover : FADE, ease: ease.soft, overwrite: true })
  }

  const hide = () => {
    shown = false
    gsap.to(frame, {
      autoAlpha: 0,
      scale: motion ? 0.92 : 1,
      duration: motion ? 0.4 : FADE,
      ease: ease.soft,
      overwrite: true,
      onComplete: () => {
        visible = false
        root.removeAttribute('data-preview-open')
        preview.removeAttribute('data-shown')
      },
    })
  }

  /** Привести строки и кадр к текущему состоянию: кто активен — курсор или клавиатура. */
  const apply = () => {
    const index = mode === 'pointer' ? hovered : mode === 'focus' ? focused : -1
    if (index >= 0 && !m) measure()
    const changed = index !== active
    if (changed) setActive(index)
    if (index < 0) {
      if (shown) hide()
      return
    }
    if (changed) showPhoto(index, !visible)
    if (shown) place(false)
    else show()
  }

  // ── Курсор ──
  const isMouse = (event: PointerEvent) => event.pointerType !== 'touch'

  const onListEnter = (event: PointerEvent) => {
    if (!isMouse(event)) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    measure()
  }

  const onListMove = (event: PointerEvent) => {
    if (!isMouse(event)) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    if (hovered < 0) return
    if (mode !== 'pointer') {
      mode = 'pointer'
      apply()
    } else {
      place(false)
    }
  }

  const onListLeave = () => {
    hovered = -1
    mode = focused >= 0 ? 'focus' : null
    apply()
  }

  const onRowEnter = rows.map((_, index) => (event: PointerEvent) => {
    if (!isMouse(event)) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    hovered = index
    mode = 'pointer'
    apply()
  })

  // ── Клавиатура ──
  const onFocusIn = (event: FocusEvent) => {
    const row = (event.target as Element).closest<HTMLAnchorElement>('[data-formats-row]')
    const index = row ? rows.indexOf(row) : -1
    if (row && index >= 0 && row.matches(':focus-visible')) {
      focused = index
      mode = 'focus'
      measure()
    } else {
      // Фокус от клика мышью состояния не меняет.
      focused = -1
      mode = hovered >= 0 ? 'pointer' : null
    }
    apply()
  }

  const onFocusOut = (event: FocusEvent) => {
    // Переход на соседнюю строку обработает focusin — кадр не гаснет между строками.
    if (rows.includes(event.relatedTarget as HTMLAnchorElement)) return
    focused = -1
    mode = hovered >= 0 ? 'pointer' : null
    apply()
  }

  // ── Прокрутка и ресайз ──
  // Кадр закреплён относительно окна, а строки едут вместе со страницей: при прокрутке
  // положение пересчитывается по сохранённым координатам, без чтения вёрстки.
  const onScroll = () => {
    scrollY = window.scrollY
    if (shown) place(false)
  }

  const onResize = () => {
    m = null
    if (!shown) return
    measure()
    place(true)
  }

  if (hover) {
    list.addEventListener('pointerenter', onListEnter)
    list.addEventListener('pointermove', onListMove, { passive: true })
    list.addEventListener('pointerleave', onListLeave)
    rows.forEach((row, index) => row.addEventListener('pointerenter', onRowEnter[index]))
  }
  list.addEventListener('focusin', onFocusIn)
  list.addEventListener('focusout', onFocusOut)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)

  return () => {
    observer.disconnect()
    list.removeEventListener('pointerenter', onListEnter)
    list.removeEventListener('pointermove', onListMove)
    list.removeEventListener('pointerleave', onListLeave)
    rows.forEach((row, index) => row.removeEventListener('pointerenter', onRowEnter[index]))
    list.removeEventListener('focusin', onFocusIn)
    list.removeEventListener('focusout', onFocusOut)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)

    // Твины из обработчиков matchMedia сам не откатывает — снимаем их и возвращаем исходный вид.
    const touched = [preview, frame, ...photos, ...imgs, ...texts, ...names]
    gsap.killTweensOf(touched)
    gsap.set(touched, { clearProps: 'all' })
    root.removeAttribute('data-preview-open')
    preview.removeAttribute('data-shown')
  }
}

// ── Мобильный: аккордеон ─────────────────────────────────────────────────────

type AccordionItem = {
  toggle: HTMLButtonElement
  panel: HTMLElement
  inner: HTMLElement
  img: HTMLImageElement
  link: HTMLElement
}

function initAccordion(root: HTMLElement, motion: boolean): () => void {
  const items: AccordionItem[] = gsap.utils.toArray<HTMLElement>('[data-formats-item]', root).map((el) => ({
    toggle: el.querySelector<HTMLButtonElement>('[data-formats-toggle]')!,
    panel: el.querySelector<HTMLElement>('[data-formats-panel]')!,
    inner: el.querySelector<HTMLElement>('[data-formats-panel-inner]')!,
    img: el.querySelector<HTMLImageElement>('[data-formats-panel] img')!,
    link: el.querySelector<HTMLElement>('[data-formats-panel-link]')!,
  }))

  /** Раскрытый пункт (−1 — все закрыты). */
  let open = -1
  let tween: gsap.core.Tween | null = null

  const isOpen = (item: AccordionItem) => item.panel.hasAttribute('data-open')

  /**
   * Сколько страницу нужно дополнительно прокрутить, чтобы раскрытый пункт целиком поместился
   * на экране: кадр и ссылка не должны остаться под нижним краем. Заголовок пункта при этом
   * не уходит под шапку.
   */
  const revealDistance = (item: AccordionItem, panelHeight: number) => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const header = document.querySelector<HTMLElement>('[data-header]')?.offsetHeight ?? 0
    const rect = item.toggle.getBoundingClientRect()
    const overflow = rect.bottom + panelHeight - (window.innerHeight - rem)
    const room = rect.top - (header + 0.5 * rem)
    return Math.max(0, Math.min(overflow, room))
  }

  const setOpen = (next: number) => {
    open = next
    items.forEach((item, k) => item.toggle.setAttribute('aria-expanded', String(k === next)))
    tween?.kill()

    // Текущие высоты раскрытых пунктов (в том числе тех, что ещё не успели закрыться).
    const plan = items
      .map((item, k) => ({ item, k, from: isOpen(item) ? item.panel.offsetHeight : 0, to: 0 }))
      .filter(({ item, k }) => isOpen(item) || k === next)

    const opening = plan.find(({ k }) => k === next)
    if (opening) {
      const { item, from } = opening
      item.panel.setAttribute('data-open', '')
      item.panel.style.height = `${from}px`
      // Кадр грузится в момент раскрытия, не дожидаясь, пока панель вырастет.
      item.img.loading = 'eager'
      opening.to = item.inner.offsetHeight
    }

    // Пункты, закрывающиеся выше нажатого, сдвигают его вверх. Чтобы нажатый заголовок
    // оставался под пальцем, страница прокручивается на ту же величину.
    const above = plan.filter(({ k, to }) => to === 0 && k < next)
    const reveal = opening ? revealDistance(opening.item, opening.to) : 0

    const finish = () => {
      plan.forEach(({ item, to }) => {
        if (to === 0) item.panel.removeAttribute('data-open')
        item.panel.style.height = ''
      })
      // Высота страницы изменилась — пересчитать точки срабатывания.
      ScrollTrigger.refresh()
    }

    if (!motion) {
      const shift = above.reduce((sum, { from }) => sum + from, 0)
      finish()
      window.scrollBy(0, reveal - shift)
      return
    }

    const state = { t: 0 }
    let scrolled = 0
    tween = gsap.to(state, {
      t: 1,
      duration: 0.6,
      ease: ease.inOut,
      onUpdate: () => {
        let shift = 0
        plan.forEach(({ item, k, from, to }) => {
          // Целые пиксели: прокрутка компенсирует сдвиг точно, без дрожания.
          const height = Math.round(from + (to - from) * state.t)
          item.panel.style.height = `${height}px`
          if (to === 0 && k < next) shift += from - height
        })
        const goal = Math.round(reveal * state.t) - shift
        if (goal !== scrolled) {
          window.scrollBy(0, goal - scrolled)
          scrolled = goal
        }
      },
      onComplete: finish,
    })

    if (opening) {
      // Кадр проявляется с лёгким наездом, ссылка — следом.
      gsap.fromTo(opening.item.img, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: ease.out, delay: 0.1, overwrite: true })
      gsap.fromTo(opening.item.link, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: ease.out, delay: 0.3, overwrite: true })
    }
  }

  const onToggle = items.map((_, index) => () => setOpen(open === index ? -1 : index))
  items.forEach((item, index) => item.toggle.addEventListener('click', onToggle[index]))

  return () => {
    tween?.kill()
    items.forEach((item, index) => {
      item.toggle.removeEventListener('click', onToggle[index])
      item.toggle.setAttribute('aria-expanded', 'false')
      item.panel.removeAttribute('data-open')
      item.panel.style.height = ''
      gsap.killTweensOf([item.img, item.link])
      gsap.set([item.img, item.link], { clearProps: 'all' })
    })
  }
}
