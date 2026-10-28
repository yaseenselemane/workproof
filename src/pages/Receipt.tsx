import { useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import gsap from 'gsap'
import { useHiring, allScored, total } from '../lib/store.tsx'
import { matchErrors } from '../lib/ledger.ts'
import type { Decision } from '../lib/types.ts'
import { BigNum, Button, Card, CardHead, Heading, Icon, LinkButton, Page } from '../components/ui.tsx'
import { tag } from './Live.tsx'

const DECISIONS: { v: Decision; label: string }[] = [
  { v: 'interview', label: 'Invite to final interview' },
  { v: 'hold', label: 'Hold' },
  { v: 'decline', label: 'Not this time' },
]

export default function Receipt() {
  const { id } = useParams()
  const { submissions, kit, patch, inviteCode, loaded } = useHiring()
  const s = submissions.find(x => x.id === id)
  const paper = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useLayoutEffect(() => {
    if (!paper.current) return
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.rc-row', { opacity: 0, y: -6, duration: 0.3, stagger: 0.06, ease: 'power1.out' })
        gsap.from(paper.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power2.out' })
      })
    }, paper)
    return () => ctx.revert()
  }, [id])

  if (!loaded) return <Page><p className="animate-pulse text-muted">Loading the receipt…</p></Page>
  if (!s || !kit) return <Page><Heading main="No receipt here yet." /><LinkButton to="/app/live">Back to the inbox</LinkButton></Page>

  const revealed = allScored(submissions)
  const ledger = kit.test.gets.includes('october_ledger.csv')
  const found = ledger ? matchErrors(s.candidateNo, s.answers.errors).filter(e => e.found).length : null
  const scored = kit.abilities.map(a => ({ a, v: s.scores[a.id] ?? 0, text: kit.rubric.find(r => r.ability === a.id)?.levels[(s.scores[a.id] ?? 1) - 1] ?? '' }))
  const strong = scored.filter(x => x.v === 4)
  const weakest = [...scored].sort((x, y) => x.v - y.v)[0]
  const nextLevel = weakest && weakest.v < 4 ? kit.rubric.find(r => r.ability === weakest.a.id)?.levels[weakest.v] : null
  const feedback = [
    `Thank you for taking the ${kit.role} test.`,
    strong.length ? `What you did well: ${strong.map(x => x.a.name.toLowerCase()).join('; ')}.` : `Your strongest area: ${[...scored].sort((x, y) => y.v - x.v)[0]?.a.name.toLowerCase()}.`,
    nextLevel && weakest ? `To grow: on "${weakest.a.name.toLowerCase()}", the next level looks like this: ${nextLevel.toLowerCase()}.` : 'You reached the top level on every ability we tested.',
  ].join(' ')

  async function copy() {
    try { await navigator.clipboard.writeText(feedback); setCopied(true) } catch { setCopied(false) }
  }

  const row = 'rc-row flex justify-between gap-4 border-b border-dashed border-line py-2.5 text-[14px]'

  return (
    <Page>
      <Heading kicker="Decision receipt" main="Every decision leaves a record." light="So a wrong one can be traced and fixed." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div ref={paper} className="rounded-[var(--radius-card)] bg-card p-6 sm:p-8" aria-label="Receipt">
          <div className="rc-row mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[19px] font-bold">WorkProof receipt</p>
              <p className="font-mono text-[12px] text-muted">{inviteCode}-{String(s.candidateNo).padStart(2, '0')} · {new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <BigNum main={total(s)} tail=" / 12" className="text-[34px]" tone="proof" />
          </div>
          <div className={row}><span className="text-muted">Role</span><span className="text-right font-medium">{kit.role}</span></div>
          <div className={row}><span className="text-muted">Candidate</span><span className="text-right font-medium">{revealed ? `${s.name} (${tag(s.candidateNo)})` : `${tag(s.candidateNo)} · name unlocks when all are scored`}</span></div>
          {scored.map(x => (
            <div key={x.a.id} className={row}><span className="text-muted">{x.a.id} · {x.a.name}</span><span className="text-right"><strong className="font-mono">{x.v}/4</strong> <span className="text-muted">{x.text}</span></span></div>
          ))}
          {found !== null && <div className={row}><span className="text-muted">Answer key</span><span className="font-medium">{found} of 3 planted errors named</span></div>}
          <div className={row}><span className="text-muted">AI declared</span><span className="text-right font-medium">{s.answers.ai}</span></div>
          <div className={row}><span className="text-muted">Live question</span><span className="max-w-[60%] text-right">{s.followUp || <span className="text-muted">Not recorded</span>}</span></div>
          <div className={row}><span className="text-muted">Scored</span><span className="font-medium">Blind, against the written sheet</span></div>
          <div className={`${row} border-0`}><span className="text-muted">Decision</span><span className="font-semibold text-proof">{DECISIONS.find(d => d.v === s.decision)?.label ?? 'Not decided yet'}</span></div>
        </div>

        <div className="flex flex-col gap-4">
          <Card aria-label="Decision">
            <CardHead title="Decide" sub="The test informs the decision. A person makes it." />
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Decision">
              {DECISIONS.map(d => (
                <label key={d.v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-4 text-[14.5px] font-medium transition-colors ${s.decision === d.v ? 'bg-proof text-white' : 'bg-ground hover:bg-proof-tint'}`}>
                  <input type="radio" name="decision" className="sr-only" checked={s.decision === d.v} onChange={() => patch(s.id, { decision: d.v })} aria-label={d.label} />
                  {s.decision === d.v ? <Icon.Check /> : <span className="h-[18px] w-[18px] rounded-full ring-1 ring-faint" />}
                  {d.label}
                </label>
              ))}
            </div>
          </Card>
          {s.decision === 'interview' && (
            <Card className="ring-2 ring-proof">
              <CardHead title="Employment Tax Incentive" />
              <p className="text-[14px]">If this candidate is aged 18 to 29, this hire may qualify for the Employment Tax Incentive, claimed through your monthly EMP201. Confirm the current rules with SARS before relying on it.</p>
              <p className="mt-2 text-[12.5px] text-muted">The test lowers the risk of a wrong judgement; the incentive lowers the cost. Age is never asked during the test.</p>
            </Card>
          )}
          <Card>
            <CardHead title="Feedback for the candidate" sub="Built from the scoring sheet, so it's specific." />
            <p className="rounded-2xl bg-ground px-4 py-3 text-[14px]">{feedback}</p>
            <Button variant="secondary" className="mt-3" onClick={copy}>{copied ? <><Icon.Check /> Copied</> : <><Icon.Copy /> Copy feedback</>}</Button>
          </Card>
          <LinkButton to="/app/live" variant="ghost">Back to the inbox</LinkButton>
        </div>
      </div>
    </Page>
  )
}
