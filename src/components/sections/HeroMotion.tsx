'use client'

import { useEffect } from 'react'
import { ease, gsap, mq } from '@/lib/gsap'

/**
 * Движение первого экрана.
 *  — Вход (один раз при загрузке): буквы MAISON выезжают из-под масок, тарелка
 *    доворачивается и «садится» на место, затем проявляются подписи и кнопка.
 *  — Прокрутка: тарелка медленно вращается и уходит вниз; следующий блок накрывает её своим краем.
 *    Подписи под тарелкой при этом растворяются, чтобы тарелка не шла поверх текста.
 * Исходные состояния входа заданы в hero.module.css (только при работающем JS и без reduced motion),
 * поэтому тарелка видна с первой отрисовки и не ждёт скриптов.
 */
export function HeroMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-hero]')
    if (!root) return
    const mm = gsap.matchMedia()

    mm.add(mq.motion, () => {
      const q = gsap.utils.selector(root)

      // Вход.
      const intro = gsap.timeline({ defaults: { ease: ease.out } })
      intro
        .to(q('[data-hero-letter]'), { y: 0, yPercent: 0, duration: 1.5, stagger: 0.07 }, 0.1)
        .to(q('[data-hero-plate-intro]'), { rotation: 0, scale: 1, duration: 2, ease: 'expo.out' }, 0)
        .to(q('[data-hero-fade]'), { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, 0.7)

      // Прокрутка: вращение и уход вниз привязаны к скроллу первого экрана.
      const scrub = gsap.timeline({
        defaults: { ease: ease.scrub },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
      scrub
        .to(q('[data-hero-spin]'), { rotation: 150, duration: 1 }, 0)
        .to(q('[data-hero-plate]'), { y: () => window.innerHeight * 0.55, duration: 1 }, 0)
        // Подписи и кнопка уступают место тарелке: растворяются за первую треть прокрутки.
        .to(q('[data-hero-text]'), { autoAlpha: 0, y: -32, duration: 0.3 }, 0)

      return () => {
        intro.kill()
      }
    })

    return () => mm.revert()
  }, [])

  return null
}
