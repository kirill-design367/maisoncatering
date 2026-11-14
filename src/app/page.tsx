import { a11y } from '@/data/site'
import { Header } from '@/components/header/Header'
import { MobileBar } from '@/components/header/MobileBar'
import { MobileMenu } from '@/components/header/MobileMenu'
import { Hero } from '@/components/sections/Hero'
import { Directions } from '@/components/sections/Directions'
import { Formats } from '@/components/sections/Formats'
import { Menu } from '@/components/sections/Menu'
import { Sets } from '@/components/sections/Sets'
import { Process } from '@/components/sections/Process'
import { Gallery } from '@/components/sections/Gallery'
import { Request } from '@/components/sections/Request'

export default function Page() {
  return (
    <>
      <a href="#main" className="skip-link">
        {a11y.skipLink}
      </a>
      <Header mobileMenu={<MobileMenu />} />
      <main id="main">
        <Hero />
        <Directions />
        <Formats />
        <Menu />
        <Sets />
        <Process />
        <Gallery />
        <Request />
      </main>
      <MobileBar />
    </>
  )
}
