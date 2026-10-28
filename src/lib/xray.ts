import type { AdLine, Level, LineKind, Xray } from './types.ts'

// Each rule is a readable reason a judge can be shown. Order matters: the first match wins.
const RULES: { kind: LineKind; why: string; test: RegExp }[] = [
  { kind: 'proxy', why: 'years, not ability', test: /\b\d+\s*\+?\s*(?:[-–to]+\s*\d+\s*)?years?\b/i },
  { kind: 'proxy', why: 'school results', test: /\b(matric|grade\s*12|nsc)\b.*\d+\s*%|\d+\s*%.*\b(matric|average)\b/i },
  { kind: 'proxy', why: 'age', test: /\b(age[ds]?\s*\d|under\s*\d{2}|young|youthful)\b/i },
  { kind: 'proxy', why: 'circumstance', test: /\b(own|reliable)\s+(reliable\s+)?(transport|car|vehicle)\b|driver'?s\s+licen[cs]e/i },
  { kind: 'proxy', why: 'credential', test: /\b(degree|bcom|b\.com|bsc|b\.sc|ba\b|diploma|honours|qualification)\b/i },
  { kind: 'proxy', why: 'language, check it is needed', test: /\b(native|mother[-\s]tongue|fluent)\b/i },
  { kind: 'trainable', why: 'a tool', test: /\b(sage|pastel|excel|xero|quickbooks|sap|pastel|caseware|salesforce|office)\b/i },
]

const REQUIREMENTS = /\b(requirements?|qualifications?|you will need|you have|minimum requirements|what you need)\b/i
const DUTIES = /\b(duties|responsibilities|what you('| wi)ll do|key tasks|the role)\b/i
const BULLET = /^\s*[-•*·]\s*/
const ENTRY_TITLE = /\b(junior|jnr|entry[-\s]level|graduate|trainee)\b/i

function classify(text: string, section: AdLine['section']): Pick<AdLine, 'kind' | 'why'> {
  for (const rule of RULES) if (rule.test.test(text)) return { kind: rule.kind, why: rule.why }
  if (section === 'duties') return { kind: 'task', why: 'test this' }
  return { kind: 'review', why: 'check if it matters' }
}

function maxYears(lines: AdLine[]): number {
  let max = 0
  for (const line of lines) {
    for (const m of line.text.matchAll(/\b(\d+)\s*\+?\s*(?:[-–to]+\s*(\d+)\s*)?years?\b/gi)) {
      max = Math.max(max, Number(m[1]))
    }
  }
  return max
}

export function xrayAd(raw: string): Xray {
  const rows = raw.split(/\r?\n/).map(r => r.trim()).filter(Boolean)
  const title = rows[0] ?? 'Untitled role'
  const employer = rows[1] && !BULLET.test(rows[1]) && !REQUIREMENTS.test(rows[1]) ? rows[1] : ''

  let section: AdLine['section'] = 'other'
  const lines: AdLine[] = []
  for (const row of rows.slice(employer ? 2 : 1)) {
    const isBullet = BULLET.test(row)
    // A short non-bullet line naming a section switches section; prose stays where it is.
    if (!isBullet && row.length < 60) {
      if (REQUIREMENTS.test(row)) { section = 'requirements'; continue }
      if (DUTIES.test(row)) { section = 'duties'; continue }
    }
    if (!isBullet) continue
    const text = row.replace(BULLET, '')
    lines.push({ text, section, ...classify(text, section) })
  }

  const years = maxYears(lines)
  let labelMismatch: Xray['labelMismatch'] = null
  const titled = title.match(ENTRY_TITLE)?.[0]
  if (titled && years >= 2) {
    const reads: Level = years >= 5 ? 'Senior' : 'Intermediate'
    labelMismatch = {
      titled: titled.charAt(0).toUpperCase() + titled.slice(1).toLowerCase(),
      reads,
      reason: `It asks for ${years}+ years' experience, which is not an entry-level job.`,
    }
  }

  const fairness = lines
    .filter(l => l.kind === 'proxy' && (l.why === 'circumstance' || l.why === 'school results' || l.why === 'age'))
    .map(l => l.text)

  return { title, employer, lines, labelMismatch, fairness }
}

export function proxyLoad(x: Xray) {
  const req = x.lines.filter(l => l.section === 'requirements')
  return {
    proxies: x.lines.filter(l => l.kind === 'proxy').length,
    trainable: x.lines.filter(l => l.kind === 'trainable').length,
    tasks: x.lines.filter(l => l.kind === 'task').length,
    review: x.lines.filter(l => l.kind === 'review').length,
    requirementProxies: req.filter(l => l.kind === 'proxy').length,
    requirements: req.length,
  }
}
