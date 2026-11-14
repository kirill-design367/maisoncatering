// ─────────────────────────────────────────────────────────────────────────────
// ВСЕ тексты, цены, составы, шаги, контакты и ссылки сайта — в этом файле.
// Цены, составы и шаги сейчас примерные: после ответа клиента правится только он.
// Компоненты данных не содержат.
// ─────────────────────────────────────────────────────────────────────────────

import type { ImageName } from './images.gen'

// ── Бренд и контакты ─────────────────────────────────────────────────────────

export const brand = {
  /** Латиница допустима только здесь и в названиях мессенджеров. */
  name: 'Maison catering',
  wordmark: 'Maison',
  suffix: 'catering',
  city: 'Сочи',
} as const

export const contacts = {
  phoneDisplay: '+7 901 010-20-39',
  phoneHref: 'tel:+79010102039',
  /** WhatsApp — на этом же номере. Текст заявки добавляется параметром ?text=. */
  whatsappUrl: 'https://wa.me/79010102039',
  /**
   * ЗАГЛУШКА: ссылки на профиль в MAX пока нет. Когда появится — заменить только эту строку.
   * MAX не умеет открывать чат с готовым текстом, поэтому сайт копирует текст заявки
   * в буфер, открывает этот адрес и показывает подсказку.
   */
  maxProfileUrl: 'https://max.ru/',
  city: 'Сочи',
} as const

// ── Навигация ────────────────────────────────────────────────────────────────

export const sectionIds = {
  top: 'top',
  directions: 'directions',
  formats: 'formats',
  menu: 'menu',
  sets: 'sets',
  process: 'process',
  gallery: 'gallery',
  request: 'request',
} as const

export const nav = [
  { label: 'Форматы', href: `#${sectionIds.formats}` },
  { label: 'Меню', href: `#${sectionIds.menu}` },
  { label: 'Сеты', href: `#${sectionIds.sets}` },
  { label: 'Галерея', href: `#${sectionIds.gallery}` },
  { label: 'Контакты', href: `#${sectionIds.request}` },
] as const

export const cta = {
  discussEvent: 'Обсудить событие',
  discussMenu: 'Обсудить меню',
  order: 'Заказать',
  call: 'Позвонить',
} as const

// ── 1. Первый экран ──────────────────────────────────────────────────────────

export const hero = {
  eyebrow: 'Кейтеринг и доставка в Сочи',
  line: 'Еда, ради которой приходят на ваш праздник',
  plateAlt: 'Тарелка с инжиром, свёклой и страчателлой — подача Maison catering',
} as const

// ── 2. Два направления ───────────────────────────────────────────────────────

export type Direction = {
  id: 'events' | 'delivery'
  title: string
  /** Заголовок, разбитый на строки — так он набран на странице. */
  titleLines: string[]
  text: string
  linkLabel: string
  href: string
  image: ImageName
  imageAlt: string
}

export const directions: Direction[] = [
  {
    id: 'events',
    title: 'Выездной кейтеринг',
    titleLines: ['Выездной', 'кейтеринг'],
    text: 'Приезжаем, накрываем, обслуживаем. Свадьбы, корпоративы, банкеты.',
    linkLabel: 'Смотреть форматы',
    href: `#${sectionIds.formats}`,
    image: 'direction-events',
    imageAlt: 'Накрытый стол на террасе с видом на море',
  },
  {
    id: 'delivery',
    title: 'Доставка сетов и боксов',
    titleLines: ['Доставка сетов', 'и боксов'],
    text: 'Готовые сеты к вашему столу. Открыли коробку — фуршет накрыт.',
    linkLabel: 'Смотреть сеты',
    href: `#${sectionIds.sets}`,
    image: 'direction-delivery',
    imageAlt: 'Открытый бокс с закусками',
  },
]

// ── 3–4. Форматы мероприятий и меню ──────────────────────────────────────────

export type FormatId = 'wedding' | 'corporate' | 'banquet' | 'buffet' | 'coffee'

export type EventFormat = {
  id: FormatId
  title: string
  /** Цена «от», ₽ за гостя. */
  priceFrom: number
  image: ImageName
  imageAlt: string
  /** Строки меню. Часть до двоеточия — название подачи, после — состав. */
  menu: string[]
}

export const formatsSection = {
  title: 'Форматы мероприятий',
  titleLines: ['Форматы', 'мероприятий'],
  note: 'Цена — ориентир за гостя. Меню и смету собираем под ваш вкус и бюджет.',
  menuLinkLabel: 'Смотреть меню',
} as const

export const formats: EventFormat[] = [
  {
    id: 'wedding',
    title: 'Свадьба',
    priceFrom: 6500,
    image: 'format-wedding',
    imageAlt: 'Длинный свадебный стол в саду со свечами и цветами',
    menu: [
      'Приветственный фуршет: канапе, брускетты, игристое',
      'Закуски на стол: сырная тарелка, ростбиф, лосось слабой соли',
      'Салат с уткой, грушей и ягодным соусом',
      'Горячее на выбор: дорадо на гриле или телячьи щёчки',
      'Свадебный сладкий стол',
    ],
  },
  {
    id: 'corporate',
    title: 'Корпоратив',
    priceFrom: 3500,
    image: 'format-corporate',
    imageAlt: 'Фуршетная линия с закусками и бокалами в светлом зале',
    menu: [
      'Фуршетные станции: канапе, тарталетки, мини-бургеры',
      'Салаты в порционной подаче',
      'Горячее: куриное филе в сливочном соусе, овощи гриль',
      'Мини-десерты',
      'Лимонады и морсы',
    ],
  },
  {
    id: 'banquet',
    title: 'Банкет',
    priceFrom: 4500,
    image: 'format-banquet',
    imageAlt: 'Банкетная подача: утиная грудка с ягодным соусом и бокал вина',
    menu: [
      'Закуски на стол: мясная и сырная тарелки, овощи, оливки',
      'Салат с креветками и авокадо',
      'Горячее на выбор: утиная грудка с ягодным соусом или сибас',
      'Гарнир: молодой картофель, овощи гриль',
      'Десерт от кондитера',
    ],
  },
  {
    id: 'buffet',
    title: 'Фуршет',
    priceFrom: 2500,
    image: 'format-buffet',
    imageAlt: 'Фуршетный стол с этажерками канапе и тарталеток',
    menu: [
      'Канапе с лососем и сливочным сыром',
      'Тарталетка с ростбифом и луковым конфитюром',
      'Брускетта с инжиром и козьим сыром',
      'Мини-капрезе на шпажке',
      'Профитроли с паштетом из утки',
      'Фруктовые шпажки и мини-десерты',
    ],
  },
  {
    id: 'coffee',
    title: 'Кофе-брейк',
    priceFrom: 900,
    image: 'format-coffee',
    imageAlt: 'Кофе-брейк: кофе, круассаны, ягоды и домашний лимонад',
    menu: [
      'Свежесваренный кофе и чай',
      'Мини-круассаны и слоёная выпечка',
      'Сэндвичи с лососем и с индейкой',
      'Ягоды и фрукты',
      'Домашний лимонад',
    ],
  },
]

export const menuSection = {
  title: 'Меню',
  perGuest: 'за гостя',
  from: 'от',
  customLine: 'Индивидуальное меню — по запросу',
} as const

// ── 5. Сеты и боксы ──────────────────────────────────────────────────────────

export type DeliverySet = {
  id: string
  /** Тип: «Сет», «Бокс», «Большой сет». */
  kind: string
  /** Название без кавычек — кавычки ставит вёрстка. */
  name: string
  /** Количество: «24 штуки», «60 закусок». Может отсутствовать. */
  pieces?: string
  /** На сколько гостей: «на 6–8 гостей». Может отсутствовать. */
  guests?: string
  /** Цена, ₽. */
  price: number
  /** Состав. */
  composition: string[]
  /**
   * Фото сета. Сейчас карточки типографические — фото нет (null).
   * Когда появятся кадры клиента: положить jpg в public/images, выполнить `npm run images`
   * и вписать сюда имя файла без расширения — карточка сама покажет фото.
   */
  photo: ImageName | null
  photoAlt?: string
}

export const setsSection = {
  title: 'Сеты и боксы',
  titleLines: ['Сеты', 'и боксы'],
  note: 'Готовые сеты к вашему столу. Открыли коробку — фуршет накрыт.',
} as const

export const sets: DeliverySet[] = [
  {
    id: 'canape',
    kind: 'Сет',
    name: 'Канапе',
    pieces: '24 штуки',
    guests: 'на 6–8 гостей',
    price: 4900,
    composition: ['Лосось и сливочный сыр', 'Ростбиф', 'Капрезе', 'Креветка'],
    photo: null,
  },
  {
    id: 'bruschetta',
    kind: 'Сет',
    name: 'Брускетты',
    pieces: '20 штук',
    guests: 'на 6–8 гостей',
    price: 5400,
    composition: ['Инжир и козий сыр', 'Вяленые томаты', 'Ростбиф', 'Лосось'],
    photo: null,
  },
  {
    id: 'tartlets',
    kind: 'Сет',
    name: 'Тарталетки',
    pieces: '24 штуки',
    guests: 'на 6–8 гостей',
    price: 5200,
    composition: ['Паштет из утки', 'Краб', 'Грибной жюльен', 'Сливочный сыр с икрой'],
    photo: null,
  },
  {
    id: 'cheese-fruit',
    kind: 'Бокс',
    name: 'Сыр и фрукты',
    guests: 'на 6–8 гостей',
    price: 6500,
    composition: ['Четыре сыра', 'Виноград', 'Инжир', 'Орехи', 'Мёд', 'Крекеры'],
    photo: null,
  },
  {
    id: 'coffee-box',
    kind: 'Бокс',
    name: 'Кофе-брейк',
    pieces: '24 штуки',
    price: 3900,
    composition: ['Мини-круассаны', 'Слоёная выпечка', 'Мини-сэндвичи'],
    photo: null,
  },
  {
    id: 'maison',
    kind: 'Большой сет',
    name: 'Maison',
    pieces: '60 закусок',
    guests: 'на 10–12 гостей',
    price: 12900,
    composition: ['Канапе', 'Брускетты', 'Тарталетки', 'Мини-десерты'],
    photo: null,
  },
]

// ── 6. Как проходит ──────────────────────────────────────────────────────────

export const processSection = {
  title: 'Как проходит',
  titleLines: ['Как', 'проходит'],
} as const

export const steps = [
  { title: 'Заявка', text: 'Рассказываете о событии: дата, формат, число гостей.' },
  { title: 'Меню и смета', text: 'Собираем меню под ваш вкус и бюджет.' },
  { title: 'Дегустация', text: 'Пробуете ключевые блюда до события.' },
  { title: 'Событие', text: 'Приезжаем заранее, накрываем и остаёмся до последнего гостя.' },
] as const

// ── 7. Галерея ───────────────────────────────────────────────────────────────

export const gallerySection = {
  title: 'Галерея',
} as const

export const gallery: { image: ImageName; alt: string }[] = [
  { image: 'gallery-1', alt: 'Пирамида из бокалов игристого' },
  { image: 'gallery-2', alt: 'Сырная тарелка с инжиром, виноградом и мёдом' },
  { image: 'gallery-3', alt: 'Официант выносит поднос с закусками' },
  { image: 'gallery-4', alt: 'Этажерка с десертами и макарон' },
  { image: 'gallery-5', alt: 'Сервировка: тарелка с бордовой салфеткой и веткой оливы' },
  { image: 'gallery-6', alt: 'Вечерняя терраса у моря с накрытыми столами' },
]

// ── 8. Заявка и контакты ─────────────────────────────────────────────────────

/** Значения поля «Формат» сверх пяти форматов мероприятий. */
export const requestExtraFormats = {
  delivery: 'Доставка сета',
  other: 'Другое',
} as const

export const requestSection = {
  title: 'Расскажите о событии',
  titleLines: ['Расскажите', 'о событии'],
  intro: 'Заполните форму — откроется мессенджер с готовым текстом заявки. Отправляете его вы сами.',
  fields: {
    name: { label: 'Имя', placeholder: 'Как к вам обращаться' },
    format: { label: 'Формат', placeholder: 'Выберите формат' },
    set: { label: 'Сет или бокс', placeholder: 'Выберите сет' },
    date: { label: 'Дата' },
    guests: { label: 'Число гостей', placeholder: 'Например, 40' },
    comment: { label: 'Комментарий', placeholder: 'Место, пожелания по меню, бюджет' },
  },
  submitWhatsapp: 'Отправить в WhatsApp',
  submitMax: 'Отправить в MAX',
  maxHint: 'Текст заявки скопирован — вставьте его в чат',
  maxHintFailed: 'Не удалось скопировать текст. Выделите его ниже и скопируйте вручную.',
  privacy: 'Сайт ничего не отправляет и не хранит: заявка уходит только из вашего мессенджера.',
  contactsTitle: 'Контакты',
  messengerWhatsapp: 'WhatsApp',
  messengerMax: 'MAX',
  /** Шаблон сообщения в мессенджер. */
  message: {
    greeting: 'Здравствуйте! Хочу обсудить событие.',
    name: 'Имя',
    format: 'Формат',
    set: 'Сет',
    date: 'Дата',
    guests: 'Гостей',
    comment: 'Комментарий',
    signature: 'Заявка с сайта Maison catering',
  },
} as const

// ── Подвал ───────────────────────────────────────────────────────────────────

export const footer = {
  copyright: 'Maison catering. Кейтеринг и доставка в Сочи',
} as const

// ── Мета ─────────────────────────────────────────────────────────────────────

export const meta = {
  title: 'Maison catering — кейтеринг и доставка сетов в Сочи',
  description:
    'Премиальный кейтеринг в Сочи: свадьбы, корпоративы, банкеты, фуршеты и кофе-брейки от 900 ₽ за гостя. Доставка сетов и боксов от 3 900 ₽. Заявка в WhatsApp или MAX.',
  ogTitle: 'Maison catering — кейтеринг и доставка в Сочи',
  ogDescription: 'Еда, ради которой приходят на ваш праздник. Выездной кейтеринг и доставка сетов и боксов.',
} as const

// ── Форматирование ───────────────────────────────────────────────────────────

const NBSP = ' '

/** 6500 → «6 500 ₽» (с неразрывными пробелами). */
export function formatPrice(value: number): string {
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}₽`
}

/** 6500 → «от 6 500 ₽ за гостя». */
export function formatPricePerGuest(value: number): string {
  return `${menuSection.from}${NBSP}${formatPrice(value)} ${menuSection.perGuest.replace(' ', NBSP)}`
}
