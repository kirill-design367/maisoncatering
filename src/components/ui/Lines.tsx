import type { ElementType } from 'react'

type Props = {
  /** Строки заголовка. Перенос задаёт дизайн, а не браузер. */
  lines: readonly string[]
  as?: ElementType
  className?: string
  id?: string
  /** Задержка появления, секунды. */
  delay?: number
  /** false — заголовок не анимируется сам (им управляет блок, например первый экран). */
  reveal?: boolean
}

/**
 * Заголовок, появляющийся построчно: каждая строка выезжает из-под своей маски.
 * Разметка статическая, анимацию запускает MotionRoot по data-reveal="lines".
 */
export function Lines({ lines, as: Tag = 'h2', className, id, delay, reveal = true }: Props) {
  return (
    <Tag id={id} className={className} data-reveal={reveal ? 'lines' : undefined} data-reveal-delay={delay || undefined}>
      {lines.map((line, i) => (
        <span className="line" key={i}>
          <span className="line__inner">{i < lines.length - 1 ? `${line} ` : line}</span>
        </span>
      ))}
    </Tag>
  )
}
