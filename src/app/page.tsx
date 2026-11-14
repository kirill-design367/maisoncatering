import { Header } from '@/components/header/Header'
import { MobileBar } from '@/components/header/MobileBar'
import { MobileMenu } from '@/components/header/MobileMenu'
import { Hero } from '@/components/sections/Hero'
import { Directions } from '@/components/sections/Directions'

export default function Page() {
  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержанию
      </a>
      <Header mobileMenu={<MobileMenu />} />
      <main id="main">
        <Hero />
        <Directions />
        <section className="section" style={{ minHeight: '120svh', position: 'relative', zIndex: 1 }}>
          <div className="wrap">
            <h2 className="t-display t-h2">Форматы мероприятий</h2>
          </div>
        </section>
      </main>
      <MobileBar />
    </>
  )
}
