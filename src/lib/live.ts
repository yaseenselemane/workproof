import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import type { Kit, Submission } from './types.ts'
import { SEED_SUBMISSIONS } from '../data/sample.ts'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const db = url && anon ? createClient(url, anon) : null

/** 'local' syncs tabs in one browser only; 'supabase' syncs across devices. Shown in the UI. */
export const liveMode: 'local' | 'supabase' = db ? 'supabase' : 'local'

type Row = {
  id: string; invite_code: string; candidate_no: number; name: string; answers: Submission['answers']
  minutes: number; submitted_at: string; scores: Submission['scores']; follow_up: string
  decision: Submission['decision']; sample: boolean; checkin: Submission['checkin']
}

const fromRow = (r: Row): Submission => ({
  id: r.id, candidateNo: r.candidate_no, name: r.name, answers: r.answers, minutes: r.minutes,
  submittedAt: Date.parse(r.submitted_at), scores: r.scores ?? {}, followUp: r.follow_up ?? '',
  decision: r.decision, sample: r.sample, checkin: r.checkin ?? null,
})

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message) }

// --- local mode: localStorage plus a BroadcastChannel so other tabs hear changes ---
const read = <T,>(k: string, fallback: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode: in-memory only */ } }
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('workproof') : null
const localListeners = new Set<(code: string) => void>()
bc?.addEventListener('message', e => localListeners.forEach(l => l((e as MessageEvent<string>).data)))
const notifyLocal = (code: string) => { bc?.postMessage(code); localListeners.forEach(l => l(code)) }
const subsKey = (code: string) => `wp:subs:${code}`

// --- supabase mode: one realtime room per link; a "changed" ping tells employer tabs to refetch.
// The ping carries no data, so nothing private crosses the public channel.
type Room = { ch: RealtimeChannel; ready: Promise<void>; listeners: Set<() => void> }
const rooms = new Map<string, Room>()
function room(code: string): Room {
  let r = rooms.get(code)
  if (!r) {
    const listeners = new Set<() => void>()
    const ch = db!.channel(`wp-${code}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'changed' }, () => listeners.forEach(l => l()))
    const ready = new Promise<void>(res => ch.subscribe(status => { if (status === 'SUBSCRIBED') res() }))
    r = { ch, ready, listeners }
    rooms.set(code, r)
  }
  return r
}
/** Join the room early (when a candidate opens the test) so the submit ping isn't waiting on a handshake. */
export function warm(code: string) { if (db) room(code) }

async function ping(code: string) {
  const r = room(code)
  await Promise.race([r.ready, new Promise(res => setTimeout(res, 3000))])
  await r.ch.send({ type: 'broadcast', event: 'changed', payload: {} })
}

export function newCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return 'WP-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Creates the link and returns the employer key that unlocks answers ('' in local mode). */
export async function createInvite(code: string, kit: Kit): Promise<string> {
  if (!db) {
    write(`wp:invite:${code}`, kit)
    write(subsKey(code), SEED_SUBMISSIONS)
    notifyLocal(code)
    return ''
  }
  const seeds = SEED_SUBMISSIONS.map(s => ({ candidateNo: s.candidateNo, name: s.name, answers: s.answers, minutes: s.minutes, submittedAt: s.submittedAt }))
  const { data, error } = await db.rpc('create_invite', { p_code: code, p_kit: kit, p_seeds: seeds })
  fail(error)
  return data as string
}

export async function getInvite(code: string): Promise<Kit | null> {
  if (!db) return read<Kit | null>(`wp:invite:${code}`, null)
  const { data, error } = await db.rpc('get_kit', { p_code: code })
  fail(error)
  return (data as Kit | null) ?? null
}

export async function takenNumbers(code: string): Promise<number[]> {
  if (!db) return read<Submission[]>(subsKey(code), []).map(s => s.candidateNo)
  const { data, error } = await db.rpc('taken_numbers', { p_code: code })
  fail(error)
  return (data as number[]) ?? []
}

export async function listSubmissions(code: string, key: string): Promise<Submission[]> {
  if (!db) return read<Submission[]>(subsKey(code), [])
  const { data, error } = await db.rpc('employer_list', { p_code: code, p_key: key })
  fail(error)
  return (data as Row[]).map(fromRow)
}

export function subscribe(code: string, onChange: () => void): () => void {
  if (!db) {
    const l = (c: string) => { if (c === code) onChange() }
    localListeners.add(l)
    return () => { localListeners.delete(l) }
  }
  const r = room(code)
  r.listeners.add(onChange)
  // Fallback in case a ping is missed (sleeping phone, flaky wifi): refetch every 8s.
  const poll = setInterval(onChange, 8000)
  return () => { r.listeners.delete(onChange); clearInterval(poll) }
}

export async function submit(code: string, s: Omit<Submission, 'id'>) {
  if (!db) {
    write(subsKey(code), [...read<Submission[]>(subsKey(code), []), { ...s, id: crypto.randomUUID() }])
    return notifyLocal(code)
  }
  const { error } = await db.rpc('submit_answers', {
    p_code: code, p_candidate_no: s.candidateNo, p_name: s.name, p_answers: s.answers, p_minutes: s.minutes,
  })
  fail(error)
  await ping(code)
}

/** Apply a patch the way the server does: scores merge per ability, other fields replace. */
export const merge = (s: Submission, p: Partial<Submission>): Submission =>
  ({ ...s, ...p, scores: p.scores ? { ...s.scores, ...p.scores } : s.scores })

export async function update(code: string, key: string, id: string, patch: Partial<Submission>) {
  if (!db) {
    write(subsKey(code), read<Submission[]>(subsKey(code), []).map(s => (s.id === id ? merge(s, patch) : s)))
    return notifyLocal(code)
  }
  const { error } = await db.rpc('employer_update', {
    p_code: code, p_key: key, p_id: id,
    p_scores: patch.scores ?? null, p_follow_up: patch.followUp ?? null, p_decision: patch.decision ?? null,
    p_checkin: patch.checkin ?? null,
  })
  fail(error)
  await ping(code)
}

/** A shortlist-style number not already taken, so candidates aren't numbered in arrival order. */
export function freeNumber(taken: number[]) {
  const free = Array.from({ length: 30 }, (_, i) => i + 1).filter(n => !taken.includes(n))
  return free[Math.floor(Math.random() * free.length)] ?? taken.length + 1
}
