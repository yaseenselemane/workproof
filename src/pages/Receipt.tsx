import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import gsap from 'gsap'
import { useHiring, allScored, total } from '../lib/store.tsx'
import { matchErrors } from '../lib/ledger.ts'
import { companyFrom, composeUrl, emailHtml, emailSubject, emailText, type MailVia } from '../lib/email.ts'
import type { Checkin, Decision } from '../lib/types.ts'
import { BigNum, Button, Card, CardHead, Heading, Icon, LinkButton, Page } from '../components/ui.tsx'
import { tag } from './Live.tsx'

export const OUTCOMES: { v: Checkin['outcome']; label: string }[] = [
  { v: 'strong', label: 'Doing better than expected' },
  { v: 'expected', label: 'Doing what we hoped' },
  { v: 'struggling', label: 'Struggling' },
]

const VIA: [MailVia, string][] = [['gmail', 'Gmail'], ['outlook', 'Outlook'], ['app', 'Email app']]
const savedVia = (): MailVia => {
  try { const v = localStorage.getItem('wp:mailvia'); return VIA.some(([k]) => k === v) ? (v as MailVia) : 'gmail' } catch { return 'gmail' }
}

// Selection copy works on plain-http addresses too, where the async clipboard API is blocked, and it keeps the design.
function copyRich(html: string) {
  const box = document.createElement('div')
  box.innerHTML = html
  box.style.cssText = 'position:fixed;left:-9999px;top:0'
  document.body.appendChild(box)
  const sel = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(box)
  sel?.removeAllRanges()
  sel?.addRange(range)
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  sel?.removeAllRanges()
  box.remove()
  return ok
}

const DECISIONS: { v: Decision; label: string }[] = [
  { v: 'interview', label: 'Invite to final interview' },
  { v: 'hold', label: 'Hold' },
  { v: 'decline', label: 'Not this time' },
]

export default function Receipt() {
  const { id } = useParams()
  const { submissions, kit, patch, inviteCode, loaded, xray } = useHiring()
  const s = submissions.find(x => x.id === id)
  const paper = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [outcome, setOutcome] = useState<Checkin['outcome'] | null>(null)
  const [checkNote, setCheckNote] = useState('')
  const [mailText, setMailText] = useState<string | null>(null)
  const [editingMail, setEditingMail] = useState(false)
  const [copyState, setCopyState] = useState<'' | 'copied' | 'failed'>('')
  const [via, setVia] = useState<MailVia>(savedVia)
  // A new decision means a different email; drop any edits made to the old one.
  useEffect(() => { setMailText(null); setEditingMail(false); setCopyState('') }, [s?.decision])

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
  const strengths = strong.length ? `What you did well: ${strong.map(x => x.a.name.toLowerCase()).join('; ')}.` : `Your strongest area: ${[...scored].sort((x, y) => y.v - x.v)[0]?.a.name.toLowerCase()}.`
  const growth = nextLevel && weakest ? `To grow: on "${weakest.a.name.toLowerCase()}", the next level looks like this: ${nextLevel.toLowerCase()}.` : 'You reached the top level on every ability we tested.'
  const feedback = [`Thank you for taking the ${kit.role} test.`, strengths, growth].join(' ')

  // The employer's own email app sends it, so the message comes from them and WorkProof needs no mail service.
  // A compose link can only carry plain text, so the designed version is copied for the employer to paste in.
  const email = s.answers.email
  const mailIn = s.decision ? {
    role: kit.role, company: companyFrom(xray.employer), firstName: s.name.split(' ')[0] ?? s.name, decision: s.decision, total: total(s),
    abilities: scored.map(x => ({ id: x.a.id, name: x.a.name, score: x.v })), strengths, growth,
  } : null
  const body = mailIn ? mailText ?? emailText(mailIn) : ''
  const viaLabel = VIA.find(([k]) => k === via)?.[1] ?? 'Gmail'
  const pickVia = (v: MailVia) => { setVia(v); try { localStorage.setItem('wp:mailvia', v) } catch { /* remembered for this visit only */ } }
  const open = (withBody: boolean) => {
    if (!mailIn || !email) return
    const url = composeUrl(via, email, emailSubject(mailIn), withBody ? body : '')
    if (via === 'app') window.location.href = url
    else window.open(url, '_blank', 'noopener')
  }
  function copyAndOpen() {
    if (!mailIn) return
    setCopyState(copyRich(emailHtml(mailIn, body)) ? 'copied' : 'failed')
    open(false)
  }

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
          {typeof s.answers.yearsExperience === 'number' && (
            <div className={row}>
              <span className="text-muted">Experience</span>
              <span className="max-w-[62%] text-right">
                {revealed
                  ? <>{s.answers.yearsExperience} years{xray.requiredYears > 0 && s.answers.yearsExperience < xray.requiredYears && <span className="text-proxy-ink"> · the ad's {xray.requiredYears}+ year rule would have rejected them</span>}</>
                  : <span className="text-muted">Shown once every answer is scored</span>}
              </span>
            </div>
          )}
          <div className={row}><span className="text-muted">AI declared</span><span className="text-right font-medium">{s.answers.ai}</span></div>
          <div className={row}><span className="text-muted">Live question</span><span className="max-w-[60%] text-right">{s.followUp || <span className="text-muted">Not recorded</span>}</span></div>
          <div className={row}><span className="text-muted">Scored</span><span className="font-medium">Blind, against the written sheet</span></div>
          {s.checkin && (
            <div className={row}>
              <span className="text-muted">90-day check-in</span>
              <span className="max-w-[62%] text-right"><strong>{OUTCOMES.find(o => o.v === s.checkin!.outcome)?.label}</strong>{s.checkin.note && <span className="text-muted"> · {s.checkin.note}</span>}</span>
            </div>
          )}
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
          <Card aria-label="Send the result">
            <CardHead title="Send the result" sub="Opens your email app with the message already written. Read it, then send." />
            {!revealed ? (
              <p className="text-[14px] text-muted">Contact details unlock once every answer is scored.</p>
            ) : email && !mailIn ? (
              <><p className="font-mono text-[13px] text-muted">{email}</p><p className="mt-2 text-[13.5px] text-muted">Choose a decision first, and the email writes itself.</p></>
            ) : email && mailIn ? (
              <>
                <p className="mb-3 text-[13.5px]"><span className="text-muted">To</span> <span className="font-mono">{email}</span><br /><span className="text-muted">Subject</span> {emailSubject(mailIn)}</p>
                {editingMail ? (
                  <textarea aria-label="Email wording" rows={12} value={body} onChange={e => setMailText(e.target.value)} className="w-full rounded-2xl bg-ground px-4 py-3 text-[14px] leading-relaxed outline-none focus:ring-2 focus:ring-proof" />
                ) : (
                  <iframe title="Email preview" sandbox="" srcDoc={emailHtml(mailIn, body)} className="h-[560px] w-full rounded-2xl ring-1 ring-line" />
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Send with">
                  <span className="mr-1 text-[13px] text-muted">Send with</span>
                  {VIA.map(([v, label]) => (
                    <button key={v} type="button" role="radio" aria-checked={via === v} onClick={() => pickVia(v)}
                      className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${via === v ? 'bg-proof text-white' : 'bg-ground hover:bg-proof-tint'}`}>{label}</button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={copyAndOpen}>{`Copy ${s.decision === 'interview' ? 'invite' : 'email'} & open ${viaLabel}`}</Button>
                  <Button variant="secondary" onClick={() => setEditingMail(v => !v)}>{editingMail ? 'Show the design' : 'Edit wording'}</Button>
                </div>
                <p role="status" className="mt-2 text-[12.5px] text-muted">
                  {copyState === 'copied' ? `Copied. In the new ${viaLabel} message, click in the body and press Ctrl+V.`
                    : copyState === 'failed' ? "This browser wouldn't copy. Use plain text instead."
                    : `Opens ${viaLabel} with the address and subject filled in; paste (Ctrl+V) to add the designed email.`}{' '}
                  <button type="button" onClick={() => open(true)} className="text-proof underline">Plain text instead</button>
                </p>
              </>
            ) : (
              <p className="text-[14px] text-muted">This candidate didn't leave an email. Copy the feedback below and send it another way.</p>
            )}
          </Card>
          {s.decision === 'interview' && (
            <Card className="ring-2 ring-proof">
              <CardHead title="Employment Tax Incentive" />
              <p className="text-[14px]">If this candidate is aged 18 to 29, this hire may qualify for the Employment Tax Incentive, claimed through your monthly EMP201. Confirm the current rules with SARS before relying on it.</p>
              <p className="mt-2 text-[12.5px] text-muted">The test lowers the risk of a wrong judgement; the incentive lowers the cost. Age is never asked during the test.</p>
            </Card>
          )}
          {s.decision === 'interview' && (
            <Card aria-label="90-day check-in">
              <CardHead title="90-day check-in" sub="If you hire them, come back after 90 days. Over time this shows whether the test predicts the job." />
              {s.checkin && outcome === null ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[14px]"><strong>{OUTCOMES.find(o => o.v === s.checkin!.outcome)?.label}</strong> <span className="text-muted">· recorded {new Date(s.checkin.at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })}</span></p>
                  <Button variant="secondary" onClick={() => { setOutcome(s.checkin!.outcome); setCheckNote(s.checkin!.note) }}>Change</Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2" role="radiogroup" aria-label="How is the hire going?">
                    {OUTCOMES.map(o => (
                      <label key={o.v} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-4 text-[14px] font-medium transition-colors ${outcome === o.v ? 'bg-proof text-white' : 'bg-ground hover:bg-proof-tint'}`}>
                        <input type="radio" name="checkin" className="sr-only" checked={outcome === o.v} onChange={() => setOutcome(o.v)} aria-label={o.label} />
                        {outcome === o.v ? <Icon.Check /> : <span className="h-[18px] w-[18px] rounded-full ring-1 ring-faint" />}
                        {o.label}
                      </label>
                    ))}
                  </div>
                  <label htmlFor="checknote" className="mb-1.5 mt-3 block text-[13px] font-semibold">One line on why <span className="font-normal text-muted">(optional)</span></label>
                  <input id="checknote" value={checkNote} onChange={e => setCheckNote(e.target.value)} maxLength={300} className="min-h-11 w-full rounded-2xl bg-ground px-4 text-[14px] outline-none focus:ring-2 focus:ring-proof" />
                  <Button className="mt-3" disabled={!outcome} onClick={() => { if (outcome) { patch(s.id, { checkin: { outcome, note: checkNote.trim(), at: Date.now() } }); setOutcome(null) } }}>Save check-in</Button>
                </>
              )}
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
