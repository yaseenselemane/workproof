import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Kit, Submission } from './types.ts'
import { xrayAd } from './xray.ts'
import { SAMPLE_AD } from '../data/sample.ts'
import * as live from './live.ts'

/** employerKey unlocks answers on the server; it never leaves this browser. */
type Session = { adText: string; kit: Kit | null; inviteCode: string | null; employerKey: string }

const KEY = 'wp:session'
const FRESH: Session = { adText: SAMPLE_AD, kit: null, inviteCode: null, employerKey: '' }
const load = (): Session => {
  try { return { ...FRESH, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
  catch { return FRESH }
}

function useHiringState() {
  const [session, setSession] = useState<Session>(load)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  /** The invite code whose answers have arrived at least once; pages show "loading" until it matches. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(session)) } catch { /* per-viewer convenience only */ } }, [session])

  const code = session.inviteCode
  const empKey = session.employerKey
  // A refresh that began before our latest save finished can carry stale scores; these let us drop it.
  const pendingWrites = useRef(0)
  const lastWriteDone = useRef(0)
  const refreshNow = useRef<() => void>(() => {})
  useEffect(() => {
    if (!code) { setSubmissions([]); return }
    const refresh = () => {
      const started = Date.now()
      live.listSubmissions(code, empKey).then(
        list => {
          if (pendingWrites.current > 0 || started < lastWriteDone.current) return
          setSubmissions(list); setLiveError(null); setLoadedFor(code)
        },
        e => setLiveError(String(e.message ?? e)),
      )
    }
    refreshNow.current = refresh
    refresh()
    return live.subscribe(code, refresh)
  }, [code, empKey])

  const xray = useMemo(() => xrayAd(session.adText), [session.adText])

  return {
    ...session,
    xray,
    submissions,
    loaded: !code || loadedFor === code,
    liveError,
    setAdText: (adText: string) => setSession(s => ({ ...s, adText, kit: null, inviteCode: null, employerKey: '' })),
    setKit: (kit: Kit) => setSession(s => ({ ...s, kit })),
    async openInvite() {
      if (!session.kit) throw new Error('Build the kit first')
      if (session.inviteCode) return session.inviteCode
      const inviteCode = live.newCode()
      const employerKey = await live.createInvite(inviteCode, session.kit)
      setSession(s => ({ ...s, inviteCode, employerKey }))
      return inviteCode
    },
    async patch(id: string, p: Partial<Submission>) {
      if (!code) return
      setSubmissions(list => list.map(s => (s.id === id ? live.merge(s, p) : s))) // optimistic; the refresh below confirms it
      pendingWrites.current++
      try { await live.update(code, empKey, id, p) }
      catch (e) { setLiveError(String((e as Error).message ?? e)) }
      finally { pendingWrites.current--; lastWriteDone.current = Date.now(); refreshNow.current() }
    },
    reset: () => setSession(FRESH),
  }
}

type Hiring = ReturnType<typeof useHiringState>
const Ctx = createContext<Hiring | null>(null)

export function HiringProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useHiringState()}>{children}</Ctx.Provider>
}

export function useHiring() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useHiring outside HiringProvider')
  return v
}

/** Names stay hidden until every submitted answer has all three scores. */
export const allScored = (subs: Submission[]) =>
  subs.length > 0 && subs.every(s => s.scores.A && s.scores.B && s.scores.C)

export const total = (s: Submission) => (s.scores.A ?? 0) + (s.scores.B ?? 0) + (s.scores.C ?? 0)
