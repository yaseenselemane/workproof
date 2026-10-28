import type { Kit, Xray } from './types.ts'
import { SAMPLE_AD, SAMPLE_KIT } from '../data/sample.ts'
import { rulesKit } from './rulesKit.ts'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Sample ad: its stored kit. Any other ad: Claude drafts it; if Claude is unreachable or not set up,
 * the rules kit stands in, labelled as such. So every ad with duties gets a working kit.
 */
export async function draftKit(adText: string, xray: Xray): Promise<Kit> {
  if (adText.trim() === SAMPLE_AD.trim()) return SAMPLE_KIT
  const tasks = xray.lines.filter(l => l.kind === 'task').map(l => l.text)
  if (!tasks.length) throw new Error('This ad has no duties to build a test from. Add a "Duties" heading above the tasks.')
  if (!url || !anon) return { ...rulesKit(xray), note: 'Claude is not connected, so this kit was drafted from the duties by rules.' }
  try {
    const res = await fetch(`${url}/functions/v1/draft-kit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anon}`, apikey: anon },
      body: JSON.stringify({ title: xray.title, tasks }),
      signal: AbortSignal.timeout(45_000),
    })
    if (!res.ok) throw new Error(await res.text())
    const kit = (await res.json()) as Omit<Kit, 'source'>
    if (!kit.abilities?.length || !kit.rubric?.length) throw new Error('incomplete kit')
    return { ...kit, source: 'claude' }
  } catch {
    return { ...rulesKit(xray), note: "Claude couldn't be reached, so this kit was drafted from the duties by rules." }
  }
}
