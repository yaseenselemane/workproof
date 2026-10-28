import { test } from 'node:test'
import assert from 'node:assert/strict'
import { oldFilter } from './oldFilter.ts'
import type { Submission } from './types.ts'

const sub = (name: string, years: number | undefined, a: 1 | 2 | 3 | 4, b: 1 | 2 | 3 | 4, c: 1 | 2 | 3 | 4): Submission => ({
  id: name, candidateNo: 1, name, minutes: 30, submittedAt: 0, followUp: '', decision: null,
  answers: { errors: [], note: '', ai: 'None', ...(years === undefined ? {} : { yearsExperience: years }) },
  scores: { A: a, B: b, C: c },
})

test('a "2+ years" rule would have rejected the best scorer', () => {
  const f = oldFilter([sub('Lerato', 0, 4, 4, 3), sub('Pieter', 4, 2, 2, 1)], 2)
  assert.deepEqual(f.rejected.map(s => s.name), ['Lerato'])
  assert.equal(f.best?.name, 'Lerato')
  assert.equal(f.bestScore, 11)
  assert.equal(f.bestRejected, true)
})

test('unknown years and unscored answers are left out, not guessed', () => {
  const unscored = { ...sub('Sam', 0, 1, 1, 1), scores: {} }
  const f = oldFilter([sub('Ayanda', undefined, 4, 4, 4), unscored, sub('Pieter', 4, 2, 2, 1)], 2)
  assert.deepEqual(f.known.map(s => s.name), ['Pieter'])
  assert.equal(f.rejected.length, 0)
})

test('an ad with no years requirement rejects nobody', () => {
  assert.equal(oldFilter([sub('Lerato', 0, 4, 4, 3)], 0).rejected.length, 0)
})
