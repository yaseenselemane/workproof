import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plantedFor, matchErrors, filesFor } from './ledger.ts'
import { SEED_SUBMISSIONS } from '../data/sample.ts'

test('every candidate gets exactly three distinct errors, and neighbours differ', () => {
  for (let n = 1; n <= 40; n++) assert.equal(new Set(plantedFor(n).errors.map(e => e.id)).size, 3)
  assert.notDeepEqual(plantedFor(7).errors, plantedFor(8).errors)
})

test('ledger and bank close to different balances by exactly the planted errors', () => {
  const close = (csv: string) => Number(csv.trim().split('\n').at(-1)!.split(',').at(-1))
  const files = filesFor(2) // duplicate (-4850), missing charge (+312), unrecorded deposit (-6200)
  const diff = close(files['october_ledger.csv']) - close(files['october_bank_statement.csv'])
  assert.equal(Math.round(diff * 100) / 100, -4850 + 312 - 6200)
})

test('seeded answers match the answer key they claim to', () => {
  const [lerato, pieter] = SEED_SUBMISSIONS
  assert.equal(matchErrors(lerato!.candidateNo, lerato!.answers.errors).filter(e => e.found).length, 3)
  assert.equal(matchErrors(pieter!.candidateNo, pieter!.answers.errors).filter(e => e.found).length, 1)
})

test('a correct answer counts without the amount, and a wrong one still does not', () => {
  // Candidate 14's errors: missing bank charge, Dlamini deposit in the wrong month, PPC amount wrong.
  const hits = (a: string[]) => matchErrors(14, a).filter(e => e.found).map(e => e.id)
  assert.deepEqual(hits(['Bank charges not captured']), ['missing-charge'])
  assert.deepEqual(hits(['Dlamini deposit is in September', 'cement payment looks off']), ['wrong-month', 'wrong-amount'])
  assert.deepEqual(hits(['Cashbuild paid twice']), []) // real error type, but not one planted for this candidate
})
