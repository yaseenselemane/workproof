// October bank statement for the sample shop (the truth), and a ledger with three planted errors
// chosen per candidate, so answers can't be passed between candidates.

type Row = { date: string; detail: string; amount: number }

const BANK: Row[] = [
  { date: '2026-10-02', detail: 'Deposit: cash sales', amount: 12450 },
  { date: '2026-10-03', detail: 'Payment: Builders Warehouse', amount: -8740 },
  { date: '2026-10-06', detail: 'EFT in: Khumalo Construction', amount: 6200 },
  { date: '2026-10-08', detail: 'Payment: Eskom prepaid', amount: -1450 },
  { date: '2026-10-10', detail: 'Payment: Cashbuild', amount: -4850 },
  { date: '2026-10-13', detail: 'Deposit: cash sales', amount: 9980 },
  { date: '2026-10-15', detail: 'Payment: salaries', amount: -18600 },
  { date: '2026-10-17', detail: 'EFT in: Dlamini Plumbing', amount: 2100 },
  { date: '2026-10-21', detail: 'Payment: PPC Cement', amount: -3250 },
  { date: '2026-10-24', detail: 'Deposit: cash sales', amount: 11320 },
  { date: '2026-10-28', detail: 'Payment: SARS VAT', amount: -5410 },
  { date: '2026-10-31', detail: 'Bank charges', amount: -312 },
]
const OPENING = 48320

export type PlantedError = { id: string; key: string; amount: number; name: RegExp }

// Each error rewrites the ledger; a correct answer names its `amount` or what it's about (`name`).
const POOL: { error: PlantedError; apply: (rows: Row[]) => Row[] }[] = [
  {
    error: { id: 'duplicate', key: 'Payment to Cashbuild (R4,850) entered twice', amount: 4850, name: /cashbuild/i },
    apply: rows => rows.flatMap(r => (r.detail === 'Payment: Cashbuild' ? [r, { ...r }] : [r])),
  },
  {
    error: { id: 'missing-charge', key: 'Bank charges of R312 not captured', amount: 312, name: /bank\s*charge/i },
    apply: rows => rows.filter(r => r.detail !== 'Bank charges'),
  },
  {
    error: { id: 'transposed', key: 'Eskom payment captured as R1,540 instead of R1,450', amount: 1450, name: /eskom/i },
    apply: rows => rows.map(r => (r.detail === 'Payment: Eskom prepaid' ? { ...r, amount: -1540 } : r)),
  },
  {
    error: { id: 'wrong-month', key: 'Dlamini Plumbing deposit (R2,100) dated September, not October', amount: 2100, name: /dlamini/i },
    apply: rows => rows.map(r => (r.detail === 'EFT in: Dlamini Plumbing' ? { ...r, date: '2026-09-17' } : r)),
  },
  {
    error: { id: 'unrecorded-deposit', key: 'Khumalo Construction EFT (R6,200) not recorded', amount: 6200, name: /khumalo/i },
    apply: rows => rows.filter(r => r.detail !== 'EFT in: Khumalo Construction'),
  },
  {
    error: { id: 'wrong-amount', key: 'PPC Cement payment captured as R2,350 instead of R3,250', amount: 3250, name: /ppc|cement/i },
    apply: rows => rows.map(r => (r.detail === 'Payment: PPC Cement' ? { ...r, amount: -2350 } : r)),
  },
]

// All 20 ways to pick 3 of 6, in a fixed order, so candidate N always gets the same set.
const COMBOS: number[][] = []
for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) COMBOS.push([a, b, c])

export function plantedFor(candidateNo: number) {
  const picks = COMBOS[candidateNo % COMBOS.length]!.map(i => POOL[i]!)
  const ledger = picks.reduce((rows, p) => p.apply(rows), BANK)
  return { errors: picks.map(p => p.error), ledger }
}

const rand = (n: number) => (n < 0 ? '-' : '') + Math.abs(n).toFixed(2)

function toCsv(rows: Row[], label: string) {
  let bal = OPENING
  const lines = [`date,detail,amount,${label} balance`, `2026-10-01,Opening balance,,${rand(OPENING)}`]
  for (const r of rows) {
    bal += r.amount
    lines.push(`${r.date},"${r.detail}",${rand(r.amount)},${rand(bal)}`)
  }
  return lines.join('\n')
}

export function filesFor(candidateNo: number) {
  return {
    'october_ledger.csv': toCsv(plantedFor(candidateNo).ledger, 'ledger'),
    'october_bank_statement.csv': toCsv(BANK, 'bank'),
  }
}

/** Which planted errors an answer names: by its rand amount (with or without a comma) or by what it's about. */
export function matchErrors(candidateNo: number, answers: string[]) {
  const words = answers.join(' ')
  const digits = words.replace(/[\s,]/g, '')
  return plantedFor(candidateNo).errors.map(e => ({ ...e, found: digits.includes(String(e.amount)) || e.name.test(words) }))
}
