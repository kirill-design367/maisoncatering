import { kerning } from '@/data/kerning.gen'

type Props = {
  text: string
  /** Гарнитура, которой набрана ссылка: от неё зависит кернинг (display — антиква, text — гротеск). */
  font?: 'text' | 'display'
  /** Ссылка набрана прописными (text-transform: uppercase) — кернинг берётся для прописных. */
  caps?: boolean
}

const NBSP = ' '

/**
 * «Перелистывание» текстовой ссылки: при наведении буквы по очереди уходят вверх,
 * а на их место снизу поднимается то же слово. Движение — в CSS (.flip в globals.css).
 *
 * Слово разобрано на буквы-ячейки; сам знак и его дубль рисуются псевдоэлементами из data-ch,
 * поэтому в тексте страницы слово стоит один раз — в .sr-only (его читают скринридеры и поиск).
 * Браузер не кернит знаки из разных ячеек, поэтому кернинг возвращается ячейкам из таблицы шрифта.
 *
 * Только для серверных компонентов: таблица кернинга не должна попадать в браузер.
 * В клиентский компонент готовый <Flip> передаётся через props.
 */
export function Flip({ text, font = 'text', caps = true }: Props) {
  const chars = Array.from(text)
  const shown = chars.map((ch) => (caps ? ch.toUpperCase() : ch))
  const table = kerning[font]

  return (
    <span className="flip">
      <span className="sr-only">{text}</span>
      <span className="flip__row" aria-hidden="true">
        {chars.map((ch, i) => {
          const kern = i < chars.length - 1 ? table[shown[i] + shown[i + 1]] : undefined
          return (
            <span
              key={i}
              className="flip__ch"
              data-ch={ch === ' ' ? NBSP : ch}
              style={kern ? { marginRight: `${kern / 1000}em` } : undefined}
            />
          )
        })}
      </span>
    </span>
  )
}
