import type { AbilityId, Kit, Xray } from './types.ts'

const IDS: AbilityId[] = ['A', 'B', 'C']

/** "Reconcile bank statements" -> "Reconciles bank statements". Good enough for duty lines, which start with a verb. */
export function thirdPerson(duty: string) {
  const [verb = '', ...rest] = duty.trim().split(/\s+/)
  const lower = verb.toLowerCase()
  let v = verb
  if (/(s|sh|ch|x|z|o)$/.test(lower)) v = verb + 'es'
  else if (/[^aeiou]y$/.test(lower)) v = verb.slice(0, -1) + 'ies'
  else if (!lower.endsWith('s')) v = verb + 's'
  return [v, ...rest].join(' ')
}

/** A working kit with no AI: up to three duties become abilities, with a written four-level sheet. */
export function rulesKit(x: Xray): Kit {
  const duties = x.lines.filter(l => l.kind === 'task').slice(0, 3)
  const abilities = duties.map((d, i) => ({ id: IDS[i]!, name: thirdPerson(d.text), fromDuty: d.text }))
  return {
    role: x.title,
    source: 'rules',
    abilities,
    test: {
      minutes: 45,
      gets: [],
      task: `Using a realistic example from this kind of role, show how you would ${duties.map(d => d.text.charAt(0).toLowerCase() + d.text.slice(1)).join('; ')}. Write your answer for each one, as if you were doing it on your first week.`,
    },
    rubric: abilities.map(a => ({
      ability: a.id,
      levels: ['Not attempted, or off the point', 'Attempted, but key steps are missing', 'Done correctly, with small gaps', 'Done correctly, explained, and checked'],
    })),
  }
}
