import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import type { Kit } from '../lib/types.ts'
import * as live from '../lib/live.ts'
import { filesFor } from '../lib/ledger.ts'
import { Button, Icon, Kicker } from '../components/ui.tsx'
import { Mark } from '../components/Shell.tsx'

type Saved = { no: number; start: number; name: string; done?: boolean }

const key = (code: string) => `wp:cand:${code}`
const loadSaved = (code: string): Saved | null => { try { return JSON.parse(localStorage.getItem(key(code)) ?? 'null') } catch { return null } }
const saveSaved = (code: string, s: Saved) => { try { localStorage.setItem(key(code), JSON.stringify(s)) } catch { /* keeps working, just not across refresh */ } }

function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

const field = 'min-h-12 w-full rounded-2xl bg-white px-4 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-proof'

export default function Candidate() {
  const { code = '' } = useParams()
  const [kit, setKit] = useState<Kit | null | undefined>(undefined)
  const [saved, setSaved] = useState<Saved | null>(() => loadSaved(code))
  const [name, setName] = useState(saved?.name ?? '')
  const [errors, setErrors] = useState(['', '', ''])
  const [note, setNote] = useState('')
  const [ai, setAi] = useState('')
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    live.warm(code)
    live.getInvite(code).then(setKit, e => { setProblem((e as Error).message); setKit(null) })
  }, [code])
  useEffect(() => {
    if (!saved || saved.done) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [saved])

  if (kit === undefined) return <Frame><p className="animate-pulse text-muted">Loading your test…</p></Frame>
  if (!kit) return <Frame><h1 className="text-[22px] font-semibold">This link isn't active.</h1><p className="mt-2 text-muted">{problem ?? 'Check the link with the employer who sent it.'}</p></Frame>

  const isLedgerTest = kit.test.gets.includes('october_ledger.csv')
  const limit = kit.test.minutes * 60_000

  async function start() {
    setBusy(true)
    try {
      // shortcut: two candidates starting in the same second could draw the same number; fine at shortlist scale.
      const taken = await live.takenNumbers(code)
      const s = { no: live.freeNumber(taken), start: Date.now(), name: name.trim() }
      saveSaved(code, s); setSaved(s)
    } catch (e) { setProblem((e as Error).message) } finally { setBusy(false) }
  }

  async function send() {
    if (!saved) return
    setBusy(true)
    try {
      await live.submit(code, {
        candidateNo: saved.no, name: saved.name, answers: { errors: errors.filter(e => e.trim()), note: note.trim(), ai: ai.trim() || 'None' },
        minutes: Math.max(1, Math.round((Date.now() - saved.start) / 60_000)), submittedAt: Date.now(), scores: {}, followUp: '', decision: null,
      })
      const s = { ...saved, done: true }
      saveSaved(code, s); setSaved(s)
    } catch (e) { setProblem((e as Error).message) } finally { setBusy(false) }
  }

  if (saved?.done) {
    return (
      <Frame>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-proof text-white"><Icon.Check width={30} height={30} /></motion.div>
        <h1 className="text-[26px] font-semibold leading-tight">Submitted. Thank you.</h1>
        <p className="mt-3 text-muted">Your answers are scored without your name, against the same sheet as everyone else. Whatever the decision, you'll get feedback on what you did well and what to work on.</p>
        <p className="mt-6 font-mono text-[12px] text-muted">Candidate {String(saved.no).padStart(2, '0')} · {kit.role}</p>
      </Frame>
    )
  }

  if (!saved) {
    return (
      <Frame>
        <Kicker>{kit.role}</Kicker>
        <h1 className="mt-2 text-[28px] font-semibold leading-[1.15] tracking-tight">Show what you can do in {kit.test.minutes} minutes.</h1>
        <p className="mt-3 text-muted">No CV, no years-of-experience filter. Just the work the job actually involves.</p>
        <ul className="mt-6 flex flex-col gap-3 text-[14.5px]">
          {[
            ['The timer starts when you tap Start.', `You have ${kit.test.minutes} minutes.`],
            ['AI tools are allowed.', 'Just say which ones you used, like you would at work.'],
            ['Your name is hidden.', 'The person scoring sees only your answers until everyone is scored.'],
          ].map(([b, t]) => <li key={b} className="flex gap-3"><span className="mt-0.5 text-proof"><Icon.Check /></span><span><strong>{b}</strong> {t}</span></li>)}
        </ul>
        <label htmlFor="name" className="mb-1.5 mt-7 block text-[14px] font-semibold">Your name</label>
        <input id="name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={field} />
        <p className="mt-1.5 text-[12.5px] text-muted">Only shown to the employer after scoring is finished.</p>
        {problem && <p className="mt-3 text-[13.5px] text-proxy-ink">{problem}</p>}
        <Button onClick={start} disabled={!name.trim() || busy} className="mt-6 min-h-13 w-full">Start the test</Button>
      </Frame>
    )
  }

  const left = Math.max(0, limit - (now - saved.start))
  const mm = String(Math.floor(left / 60_000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, '0')
  const files = isLedgerTest ? filesFor(saved.no) : null

  return (
    <div className="min-h-screen bg-ground">
      <div className="sticky top-0 z-10 bg-ink text-white">
        <div className="mx-auto flex max-w-[560px] items-center justify-between px-4 py-3">
          <span className="text-[17px] font-bold">WorkProof</span>
          <span role="timer" aria-label={`${mm} minutes ${ss} seconds left`} className={`tabular rounded-full px-3 py-1 font-mono text-[15px] ${left < 5 * 60_000 ? 'bg-proxy' : 'bg-white/10'}`}>{left ? `${mm}:${ss} left` : "Time's up"}</span>
        </div>
        <div className="h-1 bg-white/10"><div className="h-1 bg-proof transition-[width] duration-1000" style={{ width: `${100 - (left / limit) * 100}%` }} /></div>
      </div>

      <div className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 py-6">
        <div>
          <Kicker>{kit.role} · Candidate {String(saved.no).padStart(2, '0')}</Kicker>
          <p className="mt-2 text-[15px]">{kit.test.task}</p>
        </div>
        {files && (
          <div className="flex flex-col gap-2">
            {Object.entries(files).map(([n, text]) => (
              <button key={n} type="button" onClick={() => download(n, text)} className="flex min-h-12 items-center justify-between gap-2 rounded-2xl bg-white px-4 text-left font-mono text-[13px] ring-1 ring-line hover:ring-proof">
                <span className="inline-flex items-center gap-2"><Icon.File width={15} height={15} />{n}</span><Icon.Download width={16} height={16} />
              </button>
            ))}
          </div>
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[15px] font-semibold">{isLedgerTest ? 'Errors you found' : 'Your answers'}</legend>
          {(isLedgerTest ? ['Error 1', 'Error 2', 'Error 3'] : kit.abilities.map(a => `${a.id} · ${a.name}`)).map((label, i) => (
            <div key={label}>
              <label htmlFor={`e${i}`} className="mb-1 block text-[12.5px] text-muted">{label}</label>
              <input id={`e${i}`} value={errors[i] ?? ''} onChange={e => setErrors(v => v.map((x, j) => (j === i ? e.target.value : x)))} className={field} />
            </div>
          ))}
        </fieldset>
        {isLedgerTest && (
          <div>
            <label htmlFor="note" className="mb-1.5 block text-[15px] font-semibold">Note to the owner, in three lines</label>
            <textarea id="note" rows={4} value={note} onChange={e => setNote(e.target.value)} className={`${field} py-3`} />
          </div>
        )}
        <div>
          <label htmlFor="ai" className="mb-1.5 block text-[15px] font-semibold">AI tools you used <span className="font-normal text-muted">(allowed)</span></label>
          <input id="ai" value={ai} onChange={e => setAi(e.target.value)} placeholder="None, or e.g. ChatGPT to check a formula" className={field} />
        </div>
        {problem && <p className="text-[13.5px] text-proxy-ink">{problem}</p>}
        <Button onClick={send} disabled={busy || errors.every(e => !e.trim())} className="min-h-13 w-full">Submit my answers</Button>
      </div>
    </div>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ground px-4 py-8">
      <div className="mx-auto max-w-[480px]">
        <div className="mb-8 flex items-center gap-2.5"><Mark /><span className="text-[18px] font-bold">WorkProof</span></div>
        <div className="rounded-[var(--radius-card)] bg-card p-6">{children}</div>
      </div>
    </div>
  )
}
