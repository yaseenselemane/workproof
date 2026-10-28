import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useHiring } from '../lib/store.tsx'
import { proxyLoad, rewriteAd } from '../lib/xray.ts'
import { SAMPLE_AD } from '../data/sample.ts'
import type { AdLine } from '../lib/types.ts'
import { Button, Card, CardHead, Heading, Icon, Kicker, KindTag, Page, BigNum, kindStyle } from '../components/ui.tsx'

function Line({ line }: { line: AdLine }) {
  const k = kindStyle(line.kind)
  return (
    <li className="xr-line relative flex items-center justify-between gap-3 overflow-hidden rounded-xl px-3.5 py-2.5">
      <span aria-hidden className={`xr-bg absolute inset-0 origin-left ${k.cls.split(' ')[0]}`} />
      <span className={`relative min-w-0 font-mono text-[13.5px] ${line.kind === 'proxy' ? 'text-proxy-ink' : ''}`}>
        {line.text}
        {line.kind === 'proxy' && <span aria-hidden className="xr-strike absolute left-0 right-0 top-1/2 h-[1.5px] origin-left bg-proxy" />}
        {line.kind === 'proxy' && <span className="sr-only"> (struck out: proxy)</span>}
      </span>
      <span className="xr-tag relative"><KindTag kind={line.kind} why={line.why} /></span>
    </li>
  )
}

export default function Xray() {
  const { xray, adText } = useHiring()
  const nav = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const rewriteBox = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)
  const load = proxyLoad(xray)
  const rewritten = rewriteAd(xray)

  async function copyRewrite() {
    try { await navigator.clipboard.writeText(rewritten); setCopied(true) }
    catch { rewriteBox.current?.select() } // clipboard refused: leave it selected to copy by hand
  }
  const sections = (['requirements', 'duties', 'other'] as const)
    .map(s => ({ s, lines: xray.lines.filter(l => l.section === s) }))
    .filter(g => g.lines.length)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      // Only animate when motion is welcome; otherwise the CSS final state simply shows.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const lines = gsap.utils.toArray<HTMLElement>('.xr-line')
        const step = 0.16
        const t = gsap.timeline({ delay: 0.25 })
        t.fromTo('.xr-scan', { top: '0%', opacity: 1 }, { top: '100%', duration: lines.length * step + 0.3, ease: 'none' }, 0)
        lines.forEach((el, i) => {
          const at = i * step + 0.15
          t.from(el.querySelector('.xr-bg'), { scaleX: 0, duration: 0.35, ease: 'power2.out' }, at)
          t.from(el.querySelector('.xr-tag'), { opacity: 0, x: 10, duration: 0.3 }, at + 0.05)
          const strike = el.querySelector('.xr-strike')
          if (strike) t.from(strike, { scaleX: 0, duration: 0.3, ease: 'power2.inOut' }, at + 0.12)
        })
        t.to('.xr-scan', { opacity: 0, duration: 0.25 })
        const n = { v: 0 }
        t.to(n, { v: load.requirementProxies, duration: lines.length * step, ease: 'none', onUpdate: () => { if (counter.current) counter.current.textContent = String(Math.round(n.v)) } }, 0.2)
        t.from('.xr-side > *', { opacity: 0, y: 14, stagger: 0.12, duration: 0.45, ease: 'power2.out' }, lines.length * step * 0.6)
        tl.current = t
      })
    }, root)
    return () => ctx.revert()
  }, [xray, load.requirementProxies])

  const total = Math.max(1, xray.lines.length)

  return (
    <Page>
      <div ref={root}>
        <Heading
          kicker="Step 2 · Ad X-ray"
          main={load.proxies ? 'Part of this ad tests who the candidate was.' : 'This ad tests the job.'}
          light={load.proxies ? 'The rest tests the job.' : 'Nothing here filters on background.'}
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card aria-label="The ad, marked up">
            <CardHead
              title={xray.title}
              sub={xray.employer || 'Employer not stated'}
              action={<button type="button" onClick={() => tl.current?.restart()} className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-muted ring-1 ring-line hover:text-ink">Scan again</button>}
            />
            {adText.trim() === SAMPLE_AD.trim() && <p className="-mt-2 mb-3 font-mono text-[11.5px] text-muted">Sample ad · fictional employer</p>}
            <div className="relative">
              <span aria-hidden className="xr-scan pointer-events-none absolute left-0 right-0 z-10 h-[3px] rounded-full bg-proof opacity-0 shadow-[0_0_18px_4px_rgb(15_122_90/0.35)]" />
              {sections.length === 0 && <p className="rounded-xl bg-ground p-4 text-[14px] text-muted">No bulleted lines found. Put each requirement and duty on its own line starting with "-".</p>}
              {sections.map(g => (
                <div key={g.s} className="mb-3">
                  <Kicker className="mb-2 block pl-1">{g.s === 'other' ? 'Other' : g.s === 'requirements' ? 'Requirements' : 'Duties'}</Kicker>
                  <ul className="flex flex-col gap-1.5">{g.lines.map(l => <Line key={l.text} line={l} />)}</ul>
                </div>
              ))}
            </div>
          </Card>

          <div className="xr-side flex flex-col gap-4">
            {xray.labelMismatch && (
              <Card className="ring-2 ring-proxy">
                <div className="mb-2 flex items-center gap-2 font-semibold text-proxy-ink"><Icon.Alert /> Junior label check</div>
                <p className="text-[14.5px]"><strong>Titled {xray.labelMismatch.titled}. Reads {xray.labelMismatch.reads}.</strong> {xray.labelMismatch.reason} As written, it filters out the graduates who could learn it fastest.</p>
                <p className="mt-3 font-mono text-[11.5px] text-muted">Seen in 10 of 30 live &ldquo;Junior&rdquo; ads on CareerJunction</p>
              </Card>
            )}
            <Card>
              <CardHead title="Proxy load" sub="Requirements that test background, not ability" />
              <div className="flex items-baseline gap-2">
                <BigNum tone="proxy" className="text-[48px]" main={<span ref={counter}>{load.requirementProxies}</span>} tail={` / ${load.requirements}`} />
                <span className="text-[13.5px] text-muted">requirements</span>
              </div>
              <div role="img" aria-label={`${load.proxies} proxy, ${load.trainable} trainable, ${load.review} to review, ${load.tasks} real tasks`} className="mt-4 flex h-9 gap-1 overflow-hidden rounded-xl">
                {load.proxies > 0 && <span style={{ flex: load.proxies }} className="hatch bg-proxy" />}
                {load.trainable > 0 && <span style={{ flex: load.trainable }} className="hatch bg-train" />}
                {load.review > 0 && <span style={{ flex: load.review }} className="hatch bg-work" />}
                {load.tasks > 0 && <span style={{ flex: load.tasks }} className="hatch bg-proof" />}
                {xray.lines.length === 0 && <span style={{ flex: total }} className="bg-ground" />}
              </div>
              <p className="mt-2 text-[13px] text-muted">{load.proxies} proxy · {load.trainable} trainable{load.review ? ` · ${load.review} to review` : ''} · {load.tasks} real tasks</p>
            </Card>
            {xray.fairness.length > 0 && (
              <Card>
                <CardHead title="Fairness flag" />
                <p className="text-[14px]">{xray.fairness.map(f => `"${f}"`).join(' and ')} screen people out by circumstance, not ability. Check {xray.fairness.length > 1 ? 'them' : 'it'} against your Employment Equity obligations before keeping {xray.fairness.length > 1 ? 'them' : 'it'}.</p>
              </Card>
            )}
            <Button onClick={() => nav('/app/kit')} disabled={!load.tasks} className="min-h-13 w-full">
              Build the kit from the {load.tasks} real task{load.tasks === 1 ? '' : 's'} <Icon.ArrowRight />
            </Button>
            {!load.tasks && <p className="text-[13px] text-muted">No duties found. Add a "Duties" heading above the tasks.</p>}
          </div>
        </div>

        {load.tasks > 0 && (
          <Card className="mt-4" aria-label="The ad without proxies">
            <CardHead
              title={<label htmlFor="rewrite">Your ad, without the proxies</label>}
              sub="The same job, advertised by what the work is. Useful even if you never send a test."
              action={<Button variant="secondary" onClick={copyRewrite} aria-live="polite">{copied ? <><Icon.Check /> Copied</> : <><Icon.Copy /> Copy</>}</Button>}
            />
            <textarea id="rewrite" ref={rewriteBox} readOnly value={rewritten} rows={Math.min(18, rewritten.split('\n').length + 1)}
              className="w-full resize-y rounded-2xl bg-ground px-5 py-4 font-mono text-[13px] leading-relaxed text-ink outline-none focus:ring-2 focus:ring-proof" />
            {load.proxies > 0 && <p className="mt-2 text-[13px] text-muted">Removed: {xray.lines.filter(l => l.kind === 'proxy').map(l => `"${l.text}"`).join(', ')}.</p>}
          </Card>
        )}
      </div>
    </Page>
  )
}
