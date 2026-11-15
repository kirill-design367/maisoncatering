import type { CSSProperties } from 'react'
import styles from './process.module.css'

/**
 * Бокалы блока «Как проходит»: висят на стойке ножкой вверх.
 * Нарисованы линией в 1px той же толщины, что и сама стойка (vector-effect: non-scaling-stroke).
 * Ножка — не штрих SVG, а такая же линия-блок, как стойка: браузер ставит её на сетку пикселей,
 * и в покое она остаётся чёткой линией в 1px при любом положении бокала (штрих SVG, попав между
 * пикселями, размывался на два). Подставка, чаша и край — SVG.
 *
 * Координаты: x = 0 — ось бокала, y = 0 — линия стойки. Подставка лежит на стойке (выше линии),
 * ножка проходит сквозь неё, чаша висит ниже. Единица — 1px при кегле 16px (см. --u в стилях блока).
 */

export type GlassKind = 'flute' | 'white' | 'red' | 'coupe'

/** Сколько места подставка занимает над линией стойки. */
export const GLASS_TOP = 6

type Shape = {
  /** Ширина рисунка. */
  width: number
  /** Высота рисунка ниже линии стойки. */
  height: number
  /** Половина ширины подставки. */
  foot: number
  /** Где ножка переходит в чашу. */
  stem: number
  /** Левая сторона чаши от ножки до края; правая — зеркальная. */
  bowl: string
  /** Край чаши: высота, половина ширины, раскрытие эллипса. */
  rim: [y: number, rx: number, ry: number]
}

const SHAPES: Record<GlassKind, Shape> = {
  // Флюте: узкая высокая чаша.
  flute: {
    width: 40,
    height: 158,
    foot: 14,
    stem: 54,
    bowl: 'M0 54C-4.5 55.5 -9.3 63 -10.3 78C-11.6 100 -13 128 -13 153',
    rim: [153, 13, 2.2],
  },
  // Для белого: чаша-тюльпан, чуть сужается к краю.
  white: {
    width: 56,
    height: 141,
    foot: 15.5,
    stem: 62,
    bowl: 'M0 62C-9 63.5 -22 74 -23.5 94C-24.6 109 -20 124 -18.5 136',
    rim: [136, 18.5, 2.6],
  },
  // Для красного: большая круглая чаша.
  red: {
    width: 76,
    height: 150,
    foot: 16.5,
    stem: 56,
    bowl: 'M0 56C-13 57.5 -32 70 -33.5 94C-34.6 114 -27 132 -24 144',
    rim: [144, 24, 3],
  },
  // Купе: широкая плоская чаша на длинной ножке.
  coupe: {
    width: 84,
    height: 112,
    foot: 15.5,
    stem: 74,
    bowl: 'M0 74C-16 75 -36 84 -38 105',
    rim: [105, 38, 3.4],
  },
}

export function glassSize(kind: GlassKind): { width: number; height: number } {
  const { width, height } = SHAPES[kind]
  return { width, height }
}

export function ProcessGlass({ kind }: { kind: GlassKind }) {
  const { width, height, foot, stem, bowl, rim } = SHAPES[kind]
  const [rimY, rimX, rimR] = rim
  // Подставка: плоский диск над стойкой и конус, который сходится в ножку под ней.
  const flare = `M-${foot - 1} -2.4C-${foot * 0.45} -1.8 -0.5 0.8 0 9`

  return (
    // Рисунок целиком качается вокруг точки подвеса (ProcessMotion).
    <span className={styles.drawing} data-process-swing>
      <svg viewBox={`${-width / 2} ${-GLASS_TOP} ${width} ${height + GLASS_TOP}`} focusable="false">
        <ellipse cx="0" cy="-3.2" rx={foot} ry="2.2" />
        <path d={flare} />
        <path d={flare} transform="scale(-1 1)" />
        <path d={bowl} />
        <path d={bowl} transform="scale(-1 1)" />
        <ellipse cx="0" cy={rimY} rx={rimX} ry={rimR} />
      </svg>
      {/* ножка: от конуса подставки (y = 9) до чаши */}
      <span className={styles.stem} style={{ '--stem': stem } as CSSProperties} />
    </span>
  )
}
