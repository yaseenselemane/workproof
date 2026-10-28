import type { Kit, Submission } from '../lib/types.ts'

/** Fictional employer. Shown in the UI as a sample so it is never mistaken for a real advert. */
export const SAMPLE_AD = `Junior Bookkeeper
Mthembu Hardware & Building Supply (Pty) Ltd · Centurion

We are a growing family hardware business looking for a Junior Bookkeeper.

Requirements
- Minimum 2 years' bookkeeping experience
- Matric with a 70%+ average
- BCom Accounting preferred
- Own reliable transport
- Experience on Sage Pastel

Duties
- Process supplier invoices and payments
- Reconcile bank statements monthly
- Maintain debtors and creditors ledgers
- Prepare VAT201 returns for review
- Keep the owner informed on cash flow`

/** Written for the sample ad and labelled as stored in the UI; new ads are drafted by AI (Groq). */
export const SAMPLE_KIT: Kit = {
  role: 'Junior Bookkeeper',
  source: 'stored-sample',
  abilities: [
    { id: 'A', name: 'Reconciles a bank statement accurately', fromDuty: 'Reconcile bank statements monthly' },
    { id: 'B', name: 'Finds and corrects errors in a ledger', fromDuty: 'Maintain debtors and creditors ledgers' },
    { id: 'C', name: 'Explains a discrepancy to the owner in plain words', fromDuty: 'Keep the owner informed on cash flow' },
  ],
  test: {
    minutes: 45,
    gets: ['october_ledger.csv', 'october_bank_statement.csv'],
    task: "One month of the shop's ledger and its bank statement. Three errors are planted in the ledger. Reconcile the two, correct what's wrong, then write the owner a three-line note explaining what happened.",
  },
  rubric: [
    { ability: 'A', levels: ['No reconciliation produced', 'Started; difference left unexplained', 'Reconciles with one small unexplained gap', 'Reconciles to the cent'] },
    { ability: 'B', levels: ['None found', 'One found', 'Two found and corrected', 'All three found, corrected, causes named'] },
    { ability: 'C', levels: ['No note, or jargon only', 'Numbers without meaning', 'Clear: the owner knows what happened', 'Clear, and says how to stop it recurring'] },
  ],
}

/** Seeded so the inbox isn't empty in a demo; every one is tagged "sample" on screen. */
export const SEED_SUBMISSIONS: Submission[] = [
  {
    id: 'seed-02',
    candidateNo: 2,
    name: 'Lerato Mokoena',
    answers: {
      errors: ['Cashbuild payment of R4,850 entered twice', 'Bank charges R312 never captured', 'Khumalo Construction EFT of R6,200 missing from the ledger'],
      note: 'The ledger was off by three things: a Cashbuild payment entered twice, a missing bank charge, and an unrecorded customer EFT.',
      ai: 'None',
      yearsExperience: 0,
    },
    minutes: 44,
    submittedAt: Date.now() - 1000 * 60 * 26,
    scores: {},
    followUp: '',
    decision: null,
    sample: true,
  },
  {
    id: 'seed-15',
    candidateNo: 15,
    name: 'Pieter van Wyk',
    answers: { errors: ['Bank charges of R312 not captured'], note: '', ai: 'Copilot, to read the statement', yearsExperience: 4 },
    minutes: 29,
    submittedAt: Date.now() - 1000 * 60 * 9,
    scores: {},
    followUp: '',
    decision: null,
    sample: true,
  },
]
