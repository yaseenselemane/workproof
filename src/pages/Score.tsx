import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useHiring, total } from '../lib/store.tsx'
import { matchErrors } from '../lib/ledger.ts'
import type { AbilityId } from '../lib/types.ts'
import { BigNum, Button, Card, CardHead, Heading, Icon, Kicker, LinkButton, Page } from '../components/ui.tsx'
import { tag } from './Live.tsx'

export default function Score() {
  const { id } = useParams()
  const { submissions, kit, patch, loaded } = useHiring()
  const nav = useNavigate()
  const s = submissions.find(x => x.id === id)
  const [follow, setFollow] = useState<string | null>(null)

  if (!loaded) return <Page><p className="animate-pulse text-muted">Loading answers…</p></Page>
  if (!s || !kit) return <Page><Heading main="That answer isn't here." /><LinkButton to="/app/live">Back to the inbox</LinkButton></Page>

  const ledger = kit.test.gets.includes('october_ledger.csv')
  const key = ledger ? matchErrors(s.candidateNo, s.answers.errors) : []
  const question = s.answers.errors[0] ? `Why did you flag "${s.answers.errors[0]}"?` : 'Walk me through how you approached it.'
  const complete = !!(s.scores.A && s.scores.B && s.scores.C)
  const next = submissions.find(x => x.id !== s.id && !(x.scores.A && x.scores.B && x.scores.C))

  // Send only the changed ability; both the store and the server merge it into the rest.
  const setScore = (a: AbilityId, v: 1 | 2 | 3 | 4) => patch(s.id, { scores: { [a]: v } })

  return (
    <Page>
      <Heading kicker="Blind scoring" main={tag(s.candidateNo)} light="· name hidden until everyone is scored" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-4">
          <Card aria-label="Their answers">
            <CardHead title="Their answers" sub={`${s.minutes} minutes · AI used: ${s.answers.ai}`} />
            <Kicker className="mb-2 block">{ledger ? 'Errors they named' : 'Answers'}</Kicker>
            <ul className="mb-4 flex flex-col gap-1.5">
              {s.answers.errors.map(e => <li key={e} className="rounded-xl bg-ground px-3.5 py-2.5 font-mono text-[13px]">{e}</li>)}
              {s.answers.errors.length === 0 && <li className="text-[13.5px] text-muted">None</li>}
            </ul>
            {ledger && <><Kicker className="mb-2 block">Note to the owner</Kicker><p className="rounded-xl bg-ground px-3.5 py-3 text-[14px]">{s.answers.note || <span className="text-muted">No note</span>}</p></>}
          </Card>
          {ledger && (
            <Card aria-label="Answer key">
              <CardHead title="Answer key for this candidate" sub="Their three planted errors. Matched on the rand amount." />
              <ul className="flex flex-col gap-2">
                {key.map(k => (
                  <li key={k.id} className="flex items-start gap-2.5 text-[14px]">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${k.found ? 'bg-proof text-white' : 'ring-1 ring-line text-faint'}`}>{k.found ? <Icon.Check width={13} height={13} /> : null}</span>
                    <span className={k.found ? '' : 'text-muted'}>{k.key}{!k.found && <span className="sr-only"> (not named)</span>}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card aria-label="Follow-up question">
            <CardHead title="Ask one question live" sub="AI can find an error. Only understanding explains it." />
            <p className="mb-3 rounded-xl bg-proof-tint px-3.5 py-3 text-[14.5px] font-medium text-proof-deep">{question}</p>
            <label htmlFor="follow" className="mb-1.5 block text-[13px] font-semibold">What they said</label>
            <textarea id="follow" rows={3} value={follow ?? s.followUp} onChange={e => setFollow(e.target.value)} onBlur={() => follow !== null && patch(s.id, { followUp: follow })}
              className="w-full rounded-2xl bg-ground px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-proof" />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {kit.rubric.map(r => {
            const ab = kit.abilities.find(a => a.id === r.ability)
            return (
              <Card key={r.ability} aria-label={`Score ${r.ability}`}>
                <fieldset>
                  <legend className="mb-3 flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-proof font-mono text-[13px] text-white">{r.ability}</span>
                    <span className="text-[15px] font-semibold">{ab?.name}</span>
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {r.levels.map((lv, i) => {
                      const v = (i + 1) as 1 | 2 | 3 | 4
                      const on = s.scores[r.ability] === v
                      return (
                        <label key={i} className={`relative flex cursor-pointer flex-col gap-1.5 rounded-2xl p-3 text-[13px] transition-colors ${on ? 'bg-proof text-white' : 'bg-ground hover:bg-proof-tint'}`}>
                          <input type="radio" name={`s-${r.ability}`} className="sr-only" checked={on} onChange={() => setScore(r.ability, v)} aria-label={`${v}: ${lv}`} />
                          {on && <motion.span layoutId={`pick-${r.ability}`} className="absolute inset-0 rounded-2xl ring-2 ring-proof-deep" />}
                          <span className="font-mono text-[15px] font-semibold">{v}</span>
                          <span className={on ? 'text-white/90' : 'text-muted'}>{lv}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              </Card>
            )
          })}
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div><BigNum main={total(s)} tail=" / 12" className="text-[40px]" /><p className="mt-1 text-[13px] text-muted">{complete ? 'Scored.' : 'Score all three to finish.'}</p></div>
            <div className="flex flex-wrap gap-2">
              {next && <Button variant="secondary" onClick={() => nav(`/app/score/${next.id}`)} disabled={!complete}>Next unscored</Button>}
              <Button onClick={() => nav(`/app/receipt/${s.id}`)} disabled={!complete}>Make a decision <Icon.ArrowRight /></Button>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
