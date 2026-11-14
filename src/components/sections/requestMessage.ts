import {
  formatPrice,
  formats,
  requestExtraFormats,
  requestSection,
  sets,
  type DeliverySet,
  type FormatId,
} from '@/data/site'

// Текст заявки для мессенджера. Чистые функции без браузерных API:
// их можно проверить отдельно от формы (см. отчёт о проверке блока).

/** Значение поля «Формат»: пять форматов мероприятий, доставка сета или «Другое». */
export type RequestFormatId = FormatId | keyof typeof requestExtraFormats

/** Состояние формы. Формат и сет хранятся как id — так же, как в data-атрибутах ссылок других блоков. */
export type RequestValues = {
  name: string
  format: RequestFormatId | ''
  /** id сета; в текст попадает только при формате «Доставка сета». */
  set: string
  /** Дата в виде ГГГГ-ММ-ДД — так её отдаёт input[type=date]. */
  date: string
  guests: string
  comment: string
}

export const emptyRequest: RequestValues = { name: '', format: '', set: '', date: '', guests: '', comment: '' }

export const DELIVERY_FORMAT: RequestFormatId = 'delivery'

export const formatOptions: { id: RequestFormatId; title: string }[] = [
  ...formats.map(({ id, title }) => ({ id, title })),
  { id: 'delivery', title: requestExtraFormats.delivery },
  { id: 'other', title: requestExtraFormats.other },
]

export function isRequestFormatId(value: string): value is RequestFormatId {
  return formatOptions.some((option) => option.id === value)
}

export function isSetId(value: string): boolean {
  return sets.some((set) => set.id === value)
}

/** Строка сета в списке формы: «Сет «Канапе» — 4 900 ₽». */
export function setOptionLabel(set: DeliverySet): string {
  return `${set.kind} «${set.name}» — ${formatPrice(set.price)}`
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** «2026-12-12» → «12 декабря 2026». Для пустой или невозможной даты — null. */
export function formatRequestDate(iso: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  // 31 февраля Date молча превращает в март — такую дату в заявку не пишем.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  // Собираем из частей: стандартный формат добавляет в конце « г.».
  const parts = dateFormat.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('day')} ${part('month')} ${part('year')}`
}

/**
 * Текст заявки: приветствие, затем только заполненные поля — по одному на строку, в конце подпись.
 * Пустая форма даёт приветствие и подпись: чат всё равно откроется с готовым началом разговора.
 */
export function buildRequestMessage(values: RequestValues): string {
  const labels = requestSection.message
  const lines: string[] = [labels.greeting]
  const add = (label: string, value: string | null | undefined) => {
    if (value) lines.push(`${label}: ${value}`)
  }

  add(labels.name, values.name.trim())
  add(labels.format, formatOptions.find((option) => option.id === values.format)?.title)

  if (values.format === DELIVERY_FORMAT) {
    const set = sets.find((item) => item.id === values.set)
    if (set) {
      // Название и цена, которые человек видел на сайте. Тип пишем, только если он отличается
      // от подписи строки: «Сет: «Канапе»…», но «Сет: Бокс «Сыр и фрукты»…».
      const kind = set.kind === labels.set ? '' : `${set.kind} `
      add(labels.set, `${kind}«${set.name}», ${formatPrice(set.price)}`)
    }
  }

  add(labels.date, formatRequestDate(values.date))

  const guests = Number.parseInt(values.guests, 10)
  if (guests > 0) add(labels.guests, String(guests))

  add(labels.comment, values.comment.trim())

  lines.push(`— ${labels.signature}`)
  // Неразрывные пробелы (в ценах) в мессенджере не нужны: обычный текст переносится предсказуемее.
  return lines.join('\n').replace(/ /g, ' ')
}
