import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useHiring, allScored, total } from '../lib/store.tsx'
import { matchErrors } from '../lib/ledger.ts'
import type { Submission } from '../lib/types.ts'
import { BigNum, Button, Card, Heading, Icon, LinkButton, Page } from '../components/ui.tsx'

export const tag = (n: number) => `Candidate ${String(n).padStart(2, '0')}`

function Row({ s, revealed, ledger }: { s: Submission; revealed: boolean; ledger: boolean }) {
  const scored = !!(s.scores.A && s.scores.B && s.scores.C)
  const isNew = Date.now() - s.submittedAt < 3 * 60_000 && !s.sample
  const found = ledger ? matchErrors(s.candidateNo, s.answers.errors).filter(e => e.found).length : null
  return (
    <motion.li layout initial={{ opacity: 0, y: -24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] bg-card p-5 ${isNew && !scored ? 'ring-2 ring-proof' : ''}`}>
      <div className="min-w-0 flex-1 basis-[360px]">
        <div className="flex flex-wrap items-center gap-2" style={{ perspective: 600 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={revealed ? 'name' : 'no'} initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: 90, opacity: 0 }} transition={{ duration: 0.3 }}
              className={`text-[16px] ${revealed ? 'font-semibold' : 'font-mono font-medium'}`}>
              {revealed ? s.name : tag(s.candidateNo)}
            </motion.span>
          </AnimatePresence>
          {revealed && <span className="font-mono text-[12px] text-muted">{tag(s.candidateNo)}</span>}
          {isNew && !scored && <span className="rounded-full bg-proof px-2.5 py-0.5 text-[11.5px] font-semibold text-white">New</span>}
          {s.sample && <span className="rounded-full bg-ground px-2 py-0.5 text-[11px] text-muted">sample</span>}
        </div>
        <p className="mt-1 text-[13.5px] text-muted">
          {found !== null ? `${found} of 3 planted errors named` : `${s.answers.errors.length} answers`}
          {' · '}{s.answers.note ? 'note to owner' : 'no note'} · AI: {s.answers.ai} · {s.minutes} min
        </p>
      </div>
      <div className="flex items-center gap-4">
        {scored && <BigNum main={total(s)} tail=" / 12" className="text-[26px]" />}
        <LinkButton to={`/app/score/${s.id}`} variant={scored ? 'secondary' : 'primary'}>{scored ? 'Rescore' : 'Score blind'}</LinkButton>
        {scored && <LinkButton to={`/app/receipt/${s.id}`} variant="ghost">Receipt</LinkButton>}
      </div>
    </motion.li>
  )
}

export default function Live() {
  const { submissions, inviteCode, kit, loaded } = useHiring()
  const [revealed, setRevealed] = useState(false)
  const [nudge, setNudge] = useState(false)

  if (!inviteCode) {
    return <Page><Heading main="No test sent yet." light="Send the link first." /><LinkButton to="/app/link">Go to the link</LinkButton></Page>
  }

  const list = [...submissions].sort((a, b) => b.submittedAt - a.submittedAt)
  const done = list.filter(s => s.scores.A && s.scores.B && s.scores.C).length
  const unlockable = allScored(list)
  const ledger = !!kit?.test.gets.includes('october_ledger.csv')

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <Heading kicker={`Live inbox · ${kit?.role ?? ''}`} main="Answers arrive as they're submitted." light={revealed && unlockable ? 'Names shown only after blind scoring.' : 'Nobody has a name yet.'} />
        <div className="ml-auto flex flex-col items-end gap-1.5">
          <Button variant="secondary" onClick={() => (unlockable ? setRevealed(r => !r) : setNudge(true))} aria-describedby="reveal-note">
            {unlockable ? <Icon.Unlock /> : <Icon.Lock />} {revealed ? 'Hide names' : 'Reveal names'}
          </Button>
          <span id="reveal-note" role="status" className={`max-w-[320px] text-right text-[12.5px] ${nudge && !unlockable ? 'text-proxy-ink' : 'text-muted'}`}>
            {unlockable ? 'Every answer is scored. Names can be shown.' : `Names unlock after the last score. ${done} of ${list.length} scored.`}
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [list.length, '', 'submitted'],
          [done, ` / ${list.length}`, 'scored'],
          [list.length ? Math.round(list.reduce((n, s) => n + s.minutes, 0) / list.length) : 0, ' min', 'average time'],
          [list.filter(s => s.answers.ai && s.answers.ai !== 'None').length, ` / ${list.length}`, 'used AI, and said so'],
        ].map(([m, t, l]) => (
          <Card key={String(l)} className="p-4 sm:p-5"><BigNum main={m} tail={t} className="text-[30px]" /><p className="mt-1 text-[13px] text-muted">{l}</p></Card>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>{list.map(s => <Row key={s.id} s={s} revealed={revealed && unlockable} ledger={ledger} />)}</AnimatePresence>
      </ul>
      {list.length === 0 && <Card><p className="animate-pulse text-muted">{loaded ? 'Waiting for the first submission…' : 'Loading answers…'}</p></Card>}
    </Page>
  )
}
