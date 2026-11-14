'use client'

// Связь между блоками без общего состояния: ссылка несёт data-атрибут,
// блок-получатель слушает клики по документу.
//
//   <a href="#menu" data-menu-format="wedding">      → «Меню» открывает вкладку формата
//   <a href="#request" data-request-format="wedding"> → форма подставляет формат
//   <a href="#request" data-request-set="canape">     → форма подставляет «Доставка сета» и сет
//
// Переход к блоку делает общий обработчик якорных ссылок в MotionRoot.

export function onDelegatedClick(selector: string, handler: (el: HTMLElement, event: MouseEvent) => void): () => void {
  const listener = (event: MouseEvent) => {
    const el = (event.target as Element | null)?.closest<HTMLElement>(selector)
    if (el) handler(el, event)
  }
  document.addEventListener('click', listener)
  return () => document.removeEventListener('click', listener)
}
