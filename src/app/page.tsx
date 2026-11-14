import { Header } from '@/components/header/Header'
import { Hero } from '@/components/sections/Hero'

export default function Page() {
  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержанию
      </a>
      <Header />
      <main id="main">
        <Hero />
        <section className="section" style={{ minHeight: '120svh', position: 'relative', zIndex: 1 }}>
          <div className="wrap">
            <h2 className="t-display t-h2">Форматы мероприятий</h2>
          </div>
        </section>
      </main>
    </>
  )
}
