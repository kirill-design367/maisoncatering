'use client'

// Настройка анимаций не должна задерживать первую отрисовку и собираться в одну длинную задачу.
// defer() ставит настройку в очередь: очередь начинает выполняться после первого кадра
// и загрузки GSAP, по одной настройке за задачу. На сами анимации это не влияет — меняется только момент,
// когда браузер тратит время на подготовку.

import { loadMotion } from './gsap'

type Setup = () => void | (() => void)

type Job = { setup: Setup; cleanup?: void | (() => void); done: boolean; cancelled: boolean }

const queue: Job[] = []
let started = false
let running = false

function runNext() {
  const job = queue.shift()
  if (!job) {
    running = false
    return
  }
  if (!job.cancelled) {
    job.cleanup = job.setup()
    job.done = true
  }
  setTimeout(runNext, 0)
}

function kick() {
  if (running) return
  running = true
  setTimeout(runNext, 0)
}

let ready = false

function start() {
  if (started) {
    if (ready) kick()
    return
  }
  started = true
  // Два кадра: первый кадр браузер уже нарисовал. После него подгружается GSAP,
  // и очередь начинает выполняться.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      loadMotion().then(() => {
        ready = true
        kick()
      })
    }),
  )
}

/**
 * Отложить настройку до момента после первой отрисовки.
 * Возвращает функцию для useEffect: отменяет ещё не выполненную настройку или вызывает её очистку.
 * first: true — поставить в начало очереди (первый экран).
 */
export function defer(setup: Setup, opts: { first?: boolean } = {}): () => void {
  const job: Job = { setup, done: false, cancelled: false }
  if (opts.first) queue.unshift(job)
  else queue.push(job)
  start()
  return () => {
    job.cancelled = true
    if (job.done && typeof job.cleanup === 'function') job.cleanup()
  }
}
