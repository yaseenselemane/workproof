import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useHiring } from '../lib/store.tsx'
import { draftKit } from '../lib/kit.ts'
import { Button, Card, CardHead, Heading, Icon, Kicker, Page } from '../components/ui.tsx'

const spring = { type: 'spring', stiffness: 260, damping: 30 } as const

const SOURCE = {
  'stored-sample': 'Stored kit for the sample ad',
  claude: 'Drafted by Claude · edit before sending',
  rules: 'Drafted by rules from the duties',
} as const

export default function Kit() {
  const { xray, adText, kit, setKit } = useHiring()
  const nav = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [merged, setMerged] = useState(false)
  const tasks = xray.lines.filter(l => l.kind === 'task')

  useEffect(() => {
    if (kit) return
    let alive = true
    setError(null)
    draftKit(adText, xray).then(k => { if (alive) setKit(k) }, e => { if (alive) setError((e as Error).message) })
    return () => { alive = false }
    // setKit is recreated on every store render; listing it would refire the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit, adText, xray])

  // Let the duties sit on screen for a beat, then merge them into the abilities they test.
  useEffect(() => {
    if (!kit) return
    const t = setTimeout(() => setMerged(true), 900)
    return () => clearTimeout(t)
  }, [kit])

  const fromIds = new Map(kit?.abilities.map(a => [a.fromDuty, a.id]) ?? [])
  const proxies = xray.lines.filter(l => l.kind === 'proxy')

  return (
    <Page>
      <Heading kicker={`Step 3 · the kit · ${xray.title}`} main="Three things the job needs." light="One test that shows them." />

      {error && (
        <Card className="mb-4 ring-2 ring-work">
          <p className="text-[14.5px]">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={() => nav('/app')}>Back to the ad</Button>
        </Card>
      )}
      {!kit && !error && <Card className="mb-4"><p className="animate-pulse text-[14.5px] text-muted">Drafting the kit from the {tasks.length} real tasks…</p></Card>}

      {kit && (
        <LayoutGroup>
          <Card className="mb-4" aria-label="From duties to abilities">
            <CardHead
              title={merged ? 'The abilities to test' : 'The real tasks in the ad'}
              sub={merged ? 'Each one traces back to a duty the employer wrote.' : 'Merging into what the job actually needs…'}
              action={<span className="rounded-full bg-ground px-3 py-1 font-mono text-[11.5px] text-muted">{SOURCE[kit.source]}</span>}
            />
            {kit.note && <p className="-mt-2 mb-4 rounded-2xl bg-work-tint px-4 py-2.5 text-[13px] text-work">{kit.note}</p>}
            {!merged ? (
              <div className="flex flex-wrap gap-2">
                {tasks.map(t => (
                  <motion.span key={t.text} layoutId={fromIds.has(t.text) ? `ab-${fromIds.get(t.text)}` : undefined} transition={spring}
                    className="rounded-full bg-proof-tint px-4 py-2 text-[13.5px] font-medium text-proof-deep">{t.text}</motion.span>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {kit.abilities.map(a => (
                  <motion.div key={a.id} layoutId={`ab-${a.id}`} transition={spring} className="flex flex-col gap-3 rounded-2xl bg-ground p-5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-proof font-mono text-[14px] font-medium text-white">{a.id}</span>
                    <span className="text-[16.5px] font-semibold leading-snug">{a.name}</span>
                    <span className="text-[13px] text-muted">From &ldquo;{a.fromDuty}&rdquo;</span>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          <AnimatePresence>
            {merged && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="flex flex-col gap-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <Card aria-label="The test">
                    <CardHead title="The test" action={<span className="font-mono text-[13px] font-medium text-proof">{kit.test.minutes} min · phone or laptop</span>} />
                    <Kicker className="mb-2 block">The candidate gets</Kicker>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {kit.test.gets.map(g => <span key={g} className="inline-flex items-center gap-2 rounded-full bg-ground px-3 py-1.5 font-mono text-[12.5px]"><Icon.File width={14} height={14} />{g}</span>)}
                    </div>
                    <Kicker className="mb-2 block">The task</Kicker>
                    <p className="mb-4 max-w-[64ch] text-[14.5px]">{kit.test.task}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        ['AI allowed', 'Like the real job. Candidates say which tools they used.'],
                        ['Unique errors', "Each candidate's planted errors differ, so answers can't be passed around."],
                        ['One live question', '"Why did you flag that?" AI can find it; only understanding explains it.'],
                      ].map(([h, b]) => <div key={h} className="rounded-2xl bg-ground p-3.5"><p className="text-[13.5px] font-semibold">{h}</p><p className="mt-1 text-[13px] text-muted">{b}</p></div>)}
                    </div>
                  </Card>
                  <div className="flex flex-col gap-4">
                    <Card>
                      <CardHead title="What it replaces" />
                      <ul className="flex flex-col gap-1.5">
                        {proxies.length ? proxies.map(p => <li key={p.text} className="text-[13.5px] text-proxy-ink line-through decoration-proxy">{p.text}</li>) : <li className="text-[13.5px] text-muted">No proxies in this ad.</li>}
                      </ul>
                      <p className="mt-3 text-[13px] text-muted">Built once, used for every candidate on the shortlist.</p>
                    </Card>
                    <Button onClick={() => nav('/app/link')} className="min-h-13 w-full">Send to candidates <Icon.ArrowRight /></Button>
                  </div>
                </div>

                <Card aria-label="Scoring sheet">
                  <CardHead title="Scoring sheet" sub="A person scores. Every level is spelled out, so two scorers land on the same number." />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
                      <thead>
                        <tr className="text-left font-mono text-[11.5px] uppercase tracking-[0.06em] text-muted">
                          <th className="w-[22%] pb-2 pr-3 font-medium">Ability</th>
                          {[1, 2, 3, 4].map(n => <th key={n} className={`px-3 pb-2 font-medium ${n === 4 ? 'text-proof' : ''}`}>{n}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {kit.rubric.map(r => (
                          <tr key={r.ability} className="align-top">
                            <td className="border-t border-line py-3 pr-3 font-semibold">{r.ability} · {kit.abilities.find(a => a.id === r.ability)?.name}</td>
                            {r.levels.map((lv, i) => <td key={i} className={`border-t border-line px-3 py-3 ${i === 3 ? 'bg-proof-tint/60 text-ink' : 'text-muted'}`}>{lv}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      )}
    </Page>
  )
}
