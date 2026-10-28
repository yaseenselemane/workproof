import { useNavigate } from 'react-router-dom'
import { useHiring } from '../lib/store.tsx'
import { SAMPLE_AD } from '../data/sample.ts'
import { Button, Card, CardHead, Heading, Icon, Kicker, Page, BigNum, CountUp } from '../components/ui.tsx'

export default function Ad() {
  const { adText, setAdText } = useHiring()
  const nav = useNavigate()
  const isSample = adText.trim() === SAMPLE_AD.trim()

  return (
    <Page>
      <Heading kicker="Step 1 · employer" main="Start with the job ad" light="you already have." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHead
            title={<label htmlFor="ad">Job ad</label>}
            sub="Paste it as it is. WorkProof reads which lines test ability, and which only test background."
            action={isSample
              ? <span className="rounded-full bg-ground px-3 py-1 font-mono text-[11.5px] text-muted">Sample · fictional employer</span>
              : <button type="button" onClick={() => setAdText(SAMPLE_AD)} className="rounded-full px-3 py-1 text-[12.5px] font-medium text-proof ring-1 ring-line hover:bg-proof-tint">Use the sample</button>}
          />
          <textarea
            id="ad"
            value={adText}
            onChange={e => setAdText(e.target.value)}
            rows={20}
            spellCheck={false}
            className="w-full resize-y rounded-2xl bg-ground px-5 py-4 font-mono text-[13.5px] leading-relaxed text-ink outline-none ring-1 ring-transparent focus:ring-proof"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => nav('/app/xray')} disabled={!adText.trim()}>
              X-ray this ad <Icon.ArrowRight />
            </Button>
            <span className="text-[13px] text-muted">Runs on written rules, so every flag can be explained.</span>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="hatch relative overflow-hidden bg-proof text-white">
            <Kicker className="text-white/75">Why start with the ad</Kicker>
            <div className="mt-3 flex items-baseline gap-2">
              <BigNum main={<><CountUp to={1} /> in 3</>} className="text-[52px] text-white" />
            </div>
            <p className="mt-2 text-[14.5px] leading-snug text-white/90">
              job ads titled <strong className="text-white">Junior</strong> on CareerJunction are ranked above junior by the employer&rsquo;s own level setting.
            </p>
            <p className="mt-4 font-mono text-[11.5px] text-white/75">10 of 30 live ads · 28 Oct 2026</p>
          </Card>
          <Card>
            <CardHead title="What happens next" />
            <ol className="flex flex-col gap-3">
              {[
                ['X-ray', 'separates real tasks from proxy requirements.'],
                ['Kit', 'turns the tasks into a 45-minute test and a scoring sheet.'],
                ['Link', "sends the test to candidates' phones."],
                ['Score blind', 'then decide, with a receipt for every decision.'],
              ].map(([b, t], i) => (
                <li key={b} className="flex gap-3 text-[14px]">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ground font-mono text-[12px] text-muted">{i + 1}</span>
                  <span><strong>{b}</strong> {t}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </Page>
  )
}
