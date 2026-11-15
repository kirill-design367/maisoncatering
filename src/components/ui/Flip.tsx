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
 * В покое виден обычный текст (.flip__text): его читают скринридеры, находит поиск по странице,
 * переводит переводчик браузера, и набран он как любой другой текст. Поверх лежит то же слово,
 * разобранное на буквы-ячейки (.flip__row): оно показывается только на время наведения.
 * Знак и его дубль в ячейке рисуются псевдоэлементами из data-ch — в тексте страницы слово стоит один раз.
 * Браузер не кернит знаки из разных ячеек, поэтому кернинг возвращается ячейкам из таблицы шрифта:
 * слой ячеек ложится на обычный текст точно, подмена не видна.
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
      <span className="flip__text">{text}</span>
      <span className="flip__row" aria-hidden="true">
        {chars.map((ch, i) => {
          const kern = i < chars.length - 1 ? table[shown[i] + shown[i + 1]] : undefined
          // style передаётся только там, где есть кернинг: пустое свойство зря раздувало бы HTML
          return <span key={i} data-ch={ch === ' ' ? NBSP : ch} {...(kern ? { style: { marginRight: `${kern / 1000}em` } } : null)} />
        })}
      </span>
    </span>
  )
}
