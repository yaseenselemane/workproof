import { useEffect, useRef, useState } from 'react'
import { Link as RLink } from 'react-router-dom'
import QRCode from 'qrcode'
import { AnimatePresence, motion } from 'motion/react'
import { useHiring } from '../lib/store.tsx'
import { liveMode } from '../lib/live.ts'
import { Button, Card, CardHead, Heading, Icon, LinkButton, Page } from '../components/ui.tsx'

export default function LinkPage() {
  const { kit, openInvite, inviteCode, submissions, liveError } = useHiring()
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  // Phones can't open "localhost"; VITE_PUBLIC_URL (or opening the app on its network address) fixes the QR.
  const base = (import.meta.env.VITE_PUBLIC_URL as string | undefined)?.replace(/\/$/, '') || location.origin
  const unreachable = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(base)
  const url = inviteCode ? `${base}/t/${inviteCode}` : ''

  useEffect(() => {
    if (kit && !inviteCode) openInvite().catch(e => setError((e as Error).message))
    // openInvite is recreated every store render; the guard above makes this run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit, inviteCode])

  useEffect(() => {
    if (url) QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#121815', light: '#ffffff' } }).then(setQr, () => setQr(null))
  }, [url])

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true) }
    catch { input.current?.select() } // clipboard refused: leave the link selected to copy by hand
  }

  if (!kit) {
    return <Page><Heading main="Build the kit first." /><LinkButton to="/app/kit">Go to the kit</LinkButton></Page>
  }

  const submitted = [...submissions].sort((a, b) => b.submittedAt - a.submittedAt)

  return (
    <Page>
      <Heading kicker="Step 4 · live candidate link" main="One link." light="Every candidate takes the same test, on their own phone." />
      {(error || liveError) && <Card className="mb-4 ring-2 ring-proxy"><p className="text-[14px]">{error || liveError}</p></Card>}
      <div className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card aria-label="The link">
          <CardHead title="Scan or send" sub={`${kit.role} · ${kit.test.minutes} minutes from first tap`} />
          <div className="mx-auto mb-5 grid aspect-square w-full max-w-[260px] place-items-center rounded-2xl bg-ground p-4">
            {qr ? <img src={qr} alt={`QR code for ${url}`} className="h-full w-full rounded-xl" /> : <span className="font-mono text-[12px] text-muted">Making the code…</span>}
          </div>
          <label htmlFor="link" className="mb-1.5 block text-[13px] font-semibold">Candidate link</label>
          <div className="flex gap-2">
            <input id="link" ref={input} readOnly value={url} className="min-h-11 min-w-0 flex-1 rounded-full bg-ground px-4 font-mono text-[13px] outline-none focus:ring-2 focus:ring-proof" />
            <Button variant="secondary" onClick={copy} aria-live="polite">{copied ? <><Icon.Check /> Copied</> : <><Icon.Copy /> Copy</>}</Button>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-proof">Open as a candidate in a new tab <Icon.ArrowUpRight width={15} height={15} /></a>
          {liveMode === 'supabase' && unreachable && (
            <p className="mt-4 rounded-2xl bg-work-tint p-3 text-[12.5px] text-work">Phones can't open "localhost". Open WorkProof at this computer's network address (the "Network" line when the dev server starts), or use the deployed site, and the QR code will point there.</p>
          )}
          {liveMode === 'local' && (
            <p className="mt-4 rounded-2xl bg-work-tint p-3 text-[12.5px] text-work">Local mode: answers sync between tabs in this browser. Connect Supabase so candidates can use their own phones.</p>
          )}
        </Card>

        <Card aria-label="Submissions so far">
          <CardHead
            title="Who has submitted"
            sub="Candidates appear as numbers. Names stay hidden until every answer is scored."
            action={<span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-proof"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-proof opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-proof" /></span>Live</span>}
          />
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {submitted.map(s => (
                <motion.li key={s.id} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
                  <span className="font-mono font-medium">Candidate {String(s.candidateNo).padStart(2, '0')}{s.sample && <span className="ml-2 rounded-full bg-ground px-2 py-0.5 text-[11px] text-muted">sample</span>}</span>
                  <span className="rounded-full bg-proof-tint px-3 py-1 text-[12.5px] font-semibold text-proof-deep">Submitted · {new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {submitted.length === 0 && <p className="text-[14px] text-muted">No submissions yet.</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton to="/app/live">Open the live inbox <Icon.ArrowRight /></LinkButton>
            <RLink to="/app/kit" className="inline-flex min-h-11 items-center px-2 text-[14px] font-medium text-muted">Back to the kit</RLink>
          </div>
        </Card>
      </div>
    </Page>
  )
}
