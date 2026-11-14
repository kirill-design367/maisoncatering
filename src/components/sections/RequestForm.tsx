'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { contacts, requestSection, sets } from '@/data/site'
import { onDelegatedClick } from '@/lib/bus'
import { ScrollTrigger } from '@/lib/gsap'
import {
  buildRequestMessage,
  DELIVERY_FORMAT,
  emptyRequest,
  formatOptions,
  isRequestFormatId,
  isSetId,
  setOptionLabel,
  type RequestValues,
} from './requestMessage'
import styles from './request.module.css'

/** Что сказать под кнопками: ничего, «текст скопирован» или «скопировать не удалось». */
type Status = 'idle' | 'copied' | 'failed'

/** Поля, значение которых — строка как есть (формат проверяется отдельно). */
type TextField = Exclude<keyof RequestValues, 'format'>

const ids = {
  name: 'request-name',
  format: 'request-format',
  set: 'request-set',
  date: 'request-date',
  guests: 'request-guests',
  comment: 'request-comment',
  manual: 'request-text',
} as const

/** Сегодняшняя дата по часам посетителя, ГГГГ-ММ-ДД — нижняя граница поля «Дата». */
function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Запасной путь для браузеров без Clipboard API: выделить текст в невидимом поле и скопировать командой. */
function copyViaSelection(text: string): boolean {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const area = document.createElement('textarea')
  area.value = text
  area.readOnly = true
  // 16px — чтобы iOS не увеличивал страницу на время фокуса.
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px'
  document.body.appendChild(area)
  area.focus({ preventScroll: true })
  area.setSelectionRange(0, text.length)
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  area.remove()
  previous?.focus({ preventScroll: true })
  return copied
}

/** Скопировать текст в буфер. Возвращает, получилось ли. Запись начинается сразу, в момент вызова. */
function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => copyViaSelection(text),
    )
  }
  return Promise.resolve(copyViaSelection(text))
}

/**
 * Форма заявки. Сайт ничего не отправляет и не хранит: форма собирает текст,
 * а человек сам отправляет его в мессенджере.
 *  — WhatsApp (кнопка отправки формы, она же Enter в поле): чат открывается с готовым текстом.
 *  — MAX: открыть чат с текстом по ссылке нельзя, поэтому текст копируется в буфер,
 *    открывается профиль, а под кнопками появляется подсказка.
 * Ни одно поле не обязательно: пустая форма открывает чат с приветствием.
 * Полям намеренно не задан name — даже без скриптов браузер не унесёт введённое в адресную строку.
 */
export function RequestForm() {
  const [values, setValues] = useState<RequestValues>(emptyRequest)
  const [status, setStatus] = useState<Status>('idle')
  const [minDate, setMinDate] = useState<string>()
  const manualRef = useRef<HTMLTextAreaElement>(null)
  const wasRendered = useRef(false)

  const isDelivery = values.format === DELIVERY_FORMAT
  const copyFailed = status === 'failed'

  // Любая правка сбрасывает подсказку: она говорила о тексте, которого больше нет.
  const update = (patch: Partial<RequestValues>) => {
    setValues((current) => ({ ...current, ...patch }))
    setStatus('idle')
  }

  const onText =
    (field: TextField) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      update({ [field]: event.target.value })

  const onFormat = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target
    update({ format: isRequestFormatId(value) ? value : '' })
  }

  // Сегодняшняя дата известна только в браузере: страница собрана заранее.
  useEffect(() => {
    setMinDate(todayIso())
  }, [])

  // Ссылки других блоков подставляют формат или сет (см. src/lib/bus.ts).
  // Сам переход к форме делает общий обработчик якорных ссылок.
  useEffect(() => {
    const offFormat = onDelegatedClick('[data-request-format]', (link) => {
      const id = link.dataset.requestFormat ?? ''
      if (!isRequestFormatId(id)) return
      setValues((current) => ({ ...current, format: id }))
      setStatus('idle')
    })
    const offSet = onDelegatedClick('[data-request-set]', (link) => {
      const id = link.dataset.requestSet ?? ''
      if (!isSetId(id)) return
      setValues((current) => ({ ...current, format: DELIVERY_FORMAT, set: id }))
      setStatus('idle')
    })
    return () => {
      offFormat()
      offSet()
    }
  }, [])

  // Поле сета и поле с готовым текстом меняют высоту блока — точки привязки к скроллу надо пересчитать.
  // refresh(true) дожидается конца прокрутки: поле может появиться, пока страница едет к форме.
  useEffect(() => {
    // ScrollTrigger подгружается после первой отрисовки; если его ещё нет — пересчитывать нечего.
    if (wasRendered.current) ScrollTrigger?.refresh(true)
    wasRendered.current = true
  }, [isDelivery, copyFailed])

  // Скопировать не удалось: показываем текст уже выделенным — остаётся нажать «копировать».
  useEffect(() => {
    if (!copyFailed) return
    manualRef.current?.focus()
    manualRef.current?.select()
  }, [copyFailed])

  const openWhatsapp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = encodeURIComponent(buildRequestMessage(values))
    window.open(`${contacts.whatsappUrl}?text=${text}`, '_blank', 'noopener')
    setStatus('idle')
  }

  const openMax = () => {
    // Порядок важен: вкладка открывается в том же нажатии, не дожидаясь буфера, —
    // иначе браузер примет её за всплывающее окно и заблокирует.
    const copying = copyText(buildRequestMessage(values))
    window.open(contacts.maxProfileUrl, '_blank', 'noopener')
    copying.then((copied) => setStatus(copied ? 'copied' : 'failed'))
  }

  const { fields } = requestSection
  const manualText = copyFailed ? buildRequestMessage(values) : ''

  return (
    <form className={styles.form} onSubmit={openWhatsapp} noValidate data-reveal-group>
      <div className={styles.row} data-reveal="fade">
        <div className={styles.field}>
          <label className={`t-label ${styles.label}`} htmlFor={ids.name}>
            {fields.name.label}
          </label>
          <div className={styles.control}>
            <input
              id={ids.name}
              className={styles.input}
              type="text"
              autoComplete="name"
              placeholder={fields.name.placeholder}
              value={values.name}
              onChange={onText('name')}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={`t-label ${styles.label}`} htmlFor={ids.format}>
            {fields.format.label}
          </label>
          <div className={`${styles.control} ${styles.selectControl}`}>
            <select
              id={ids.format}
              className={`${styles.input} ${styles.select}`}
              data-empty={values.format === '' || undefined}
              value={values.format}
              onChange={onFormat}
            >
              <option value="">{fields.format.placeholder}</option>
              {formatOptions.map((option) => (
                <option value={option.id} key={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Сет выбирают только при доставке. У поля нет data-reveal: оно появляется позже остальных, своей анимацией. */}
      {isDelivery && (
        <div className={`${styles.field} ${styles.appear}`}>
          <label className={`t-label ${styles.label}`} htmlFor={ids.set}>
            {fields.set.label}
          </label>
          <div className={`${styles.control} ${styles.selectControl}`}>
            <select
              id={ids.set}
              className={`${styles.input} ${styles.select}`}
              data-empty={values.set === '' || undefined}
              value={values.set}
              onChange={onText('set')}
            >
              <option value="">{fields.set.placeholder}</option>
              {sets.map((set) => (
                <option value={set.id} key={set.id}>
                  {setOptionLabel(set)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className={styles.row} data-reveal="fade">
        <div className={styles.field}>
          <label className={`t-label ${styles.label}`} htmlFor={ids.date}>
            {fields.date.label}
          </label>
          <div className={styles.control}>
            <input
              id={ids.date}
              className={`${styles.input} ${styles.date}`}
              type="date"
              min={minDate}
              data-empty={values.date === '' || undefined}
              value={values.date}
              onChange={onText('date')}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={`t-label ${styles.label}`} htmlFor={ids.guests}>
            {fields.guests.label}
          </label>
          <div className={styles.control}>
            <input
              id={ids.guests}
              className={`${styles.input} ${styles.number}`}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              autoComplete="off"
              placeholder={fields.guests.placeholder}
              value={values.guests}
              onChange={onText('guests')}
            />
          </div>
        </div>
      </div>

      <div className={styles.field} data-reveal="fade">
        <label className={`t-label ${styles.label}`} htmlFor={ids.comment}>
          {fields.comment.label}
        </label>
        <div className={styles.control}>
          <textarea
            id={ids.comment}
            className={`${styles.input} ${styles.textarea}`}
            rows={3}
            autoComplete="off"
            placeholder={fields.comment.placeholder}
            value={values.comment}
            onChange={onText('comment')}
          />
        </div>
      </div>

      <div className={styles.actions} data-reveal="fade">
        <div className={styles.buttons}>
          <button type="submit" className="btn">
            {requestSection.submitWhatsapp}
          </button>
          <button type="button" className="btn btn--ghost" onClick={openMax}>
            {requestSection.submitMax}
          </button>
        </div>

        {/* Одна строка состояния. Слов «отправлено» здесь не бывает: сайт ничего не отправляет. */}
        <p className={`t-small ${styles.status}`} role="status" aria-live="polite">
          {status === 'copied' && requestSection.maxHint}
          {status === 'failed' && requestSection.maxHintFailed}
        </p>

        {copyFailed && (
          <div className={`${styles.field} ${styles.manual} ${styles.appear}`}>
            <label className={`t-label ${styles.label}`} htmlFor={ids.manual}>
              {requestSection.manualLabel}
            </label>
            <textarea
              id={ids.manual}
              ref={manualRef}
              className={styles.manualText}
              rows={Math.min(manualText.split('\n').length + 1, 9)}
              readOnly
              value={manualText}
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
        )}

        <p className={`t-small t-muted ${styles.privacy}`}>{requestSection.privacy}</p>
      </div>
    </form>
  )
}
