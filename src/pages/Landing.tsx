import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Icon, Kicker } from '../components/ui.tsx'
import { Mark } from '../components/Shell.tsx'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  ['Ad X-ray', 'Paste the ad you already have. Written rules flag every line that tests background instead of ability.'],
  ['The kit', 'The real tasks become three abilities, a 45-minute test, and a scoring sheet with every level spelled out.'],
  ['Live link', "Candidates take the test on their own phones. Each gets their own planted errors, so answers can't be shared."],
  ['Score blind', 'Answers arrive without names. Names unlock only after the last score, and every decision leaves a receipt.'],
]

export default function Landing() {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        // Smooth scroll only here: inside the working tool it would feel slippery.
        const lenis = new Lenis({ lerp: 0.1 })
        lenis.on('scroll', ScrollTrigger.update)
        const raf = (t: number) => lenis.raf(t * 1000)
        gsap.ticker.add(raf)
        gsap.ticker.lagSmoothing(0)

        gsap.from('.ld-hero > *', { opacity: 0, y: 24, stagger: 0.1, duration: 0.8, ease: 'power3.out' })
        gsap.utils.toArray<HTMLElement>('.ld-reveal').forEach(el => {
          gsap.from(el, { opacity: 0, y: 40, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
        })
        gsap.from('.ld-unit', { scale: 0.4, opacity: 0, stagger: 0.025, duration: 0.4, scrollTrigger: { trigger: '.ld-units', start: 'top 80%' } })
        gsap.to('.ld-unit-hit', { backgroundColor: '#c2410c', stagger: 0.06, scrollTrigger: { trigger: '.ld-units', start: 'top 65%', end: 'bottom 45%', scrub: true } })
        gsap.from('.ld-step', { opacity: 0, y: 30, stagger: 0.12, duration: 0.6, scrollTrigger: { trigger: '.ld-steps', start: 'top 80%' } })

        return () => { gsap.ticker.remove(raf); lenis.destroy() }
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="bg-ground">
      <div className="mx-auto max-w-[1200px] px-[max(16px,env(safe-area-inset-left))]">
        <header className="flex items-center justify-between py-5">
          <span className="flex items-center gap-2.5"><Mark /><span className="text-[19px] font-bold">WorkProof</span></span>
          <Link to="/app" className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white no-underline hover:bg-proof">Try it</Link>
        </header>

        <section className="ld-hero flex min-h-[78vh] flex-col justify-center gap-6 py-16">
          <Kicker>Credify System Thinking Challenge 2026 · graduate employability</Kicker>
          <h1 className="max-w-[16ch] text-balance text-[clamp(44px,8vw,96px)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Proof you can do the job, <span className="text-faint">not just a CV.</span>
          </h1>
          <p className="max-w-[56ch] text-[clamp(16px,1.6vw,19px)] text-muted">WorkProof turns a job ad an employer already has into a 45-minute test of the real work, scored blind. It lowers the cost of being wrong about a graduate.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/app" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-proof px-6 text-[15px] font-semibold text-white no-underline hover:bg-proof-deep">Try it with a sample ad <Icon.ArrowRight /></Link>
            <a href="#why" className="inline-flex min-h-12 items-center rounded-full px-5 text-[15px] font-medium text-ink no-underline ring-1 ring-line hover:bg-card">Why it works</a>
          </div>
        </section>

        <section id="why" className="grid gap-4 py-10 md:grid-cols-[1.2fr_1fr]">
          <div className="ld-reveal rounded-[var(--radius-card)] bg-card p-8">
            <Kicker>Stats SA · Q2 2026</Kicker>
            <p className="tabular mt-4 text-[clamp(72px,12vw,140px)] font-semibold leading-none tracking-[-0.04em]">12.4<span className="text-faint">%</span></p>
            <p className="mt-3 text-[17px]">of graduates are unemployed, <strong>up from 10.3%</strong> two quarters earlier. Youth unemployment is 47.4%.</p>
          </div>
          <div className="ld-reveal hatch flex flex-col justify-between gap-6 rounded-[var(--radius-card)] bg-proof p-8 text-white">
            <Kicker className="text-white/75">The experiment that already ran</Kicker>
            <p className="text-[clamp(22px,2.6vw,30px)] font-semibold leading-tight">South Africa already pays employers to hire young people, through the Employment Tax Incentive.</p>
            <p className="text-[17px] text-white/90">Graduate unemployment went up anyway. Money was never the whole problem. Employers still can't tell who is capable.</p>
          </div>
        </section>

        <section className="py-16">
          <div className="ld-reveal mb-8 max-w-[30ch]">
            <Kicker>CareerJunction · every live &ldquo;junior&rdquo; ad · 28 Oct 2026</Kicker>
            <h2 className="mt-3 text-balance text-[clamp(32px,5vw,56px)] font-semibold leading-[1.05] tracking-[-0.03em]">1 in 3 &ldquo;junior&rdquo; jobs <span className="text-faint">are ranked above junior by the employer itself.</span></h2>
          </div>
          <div className="ld-units grid max-w-[620px] grid-cols-10 gap-2" role="img" aria-label="30 squares, one per ad. 10 turn clay: ads the employer ranks Intermediate, Senior or Executive.">
            {Array.from({ length: 30 }, (_, i) => <span key={i} className={`ld-unit aspect-square rounded-[6px] bg-[#c3ccd4] ${i >= 20 ? 'ld-unit-hit' : ''}`} />)}
          </div>
          <p className="ld-reveal mt-6 max-w-[60ch] text-[16px] text-muted">One ad titled &ldquo;Junior contracts manager&rdquo; asks for a minimum of 8 to 10 years&rsquo; experience. Graduate-titled ads mostly say the honest thing. The word &ldquo;junior&rdquo; has become shorthand for &ldquo;experienced but cheap&rdquo;.</p>
        </section>

        <section className="py-16">
          <p className="ld-reveal max-w-[22ch] text-balance text-[clamp(30px,4.6vw,54px)] font-semibold leading-[1.08] tracking-[-0.03em]">So we stopped trying to prove the graduate is good. <span className="text-proof">We made being wrong about one cheap.</span></p>
          <div className="ld-steps mt-12 grid gap-4 md:grid-cols-4">
            {STEPS.map(([h, b], i) => (
              <div key={h} className="ld-step flex flex-col gap-3 rounded-[var(--radius-card)] bg-card p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ground font-mono text-[13px] text-muted">{i + 1}</span>
                <h3 className="text-[18px] font-semibold">{h}</h3>
                <p className="text-[14.5px] text-muted">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ld-reveal my-16 flex flex-col items-start gap-6 rounded-[var(--radius-card)] bg-ink p-8 text-white sm:p-12">
          <p className="max-w-[24ch] text-balance text-[clamp(28px,4vw,46px)] font-semibold leading-tight">See it on a real-style ad in under five minutes.</p>
          <Link to="/app" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-proof px-6 text-[15px] font-semibold text-white no-underline hover:bg-proof-deep">Start with the sample ad <Icon.ArrowRight /></Link>
        </section>

        <footer className="flex flex-col gap-1 border-t border-line py-8 text-[12.5px] text-muted">
          <p>Sources: Stats SA Quarterly Labour Force Survey Q2 2026; CareerJunction and Pnet listings read on 28 October 2026; SARS Employment Tax Incentive.</p>
          <p>Built by Yaseen Selemane for the Credify System Thinking Challenge 2026. <Link to="/privacy" className="text-proof">Privacy notice</Link></p>
        </footer>
      </div>
    </div>
  )
}
