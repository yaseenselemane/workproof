import type { Submission } from './types.ts'

const score = (s: Submission) => (s.scores.A ?? 0) + (s.scores.B ?? 0) + (s.scores.C ?? 0)
const scored = (s: Submission) => !!(s.scores.A && s.scores.B && s.scores.C)

/**
 * What the ad's experience requirement would have done to the people who actually took the test.
 * Candidates who didn't give their years are left out rather than guessed.
 */
export function oldFilter(subs: Submission[], requiredYears: number) {
  const known = subs.filter(s => scored(s) && typeof s.answers.yearsExperience === 'number')
  const rejected = known.filter(s => s.answers.yearsExperience! < requiredYears)
  const best = [...known].sort((a, b) => score(b) - score(a))[0] ?? null
  return {
    requiredYears,
    known,
    rejected,
    best,
    bestScore: best ? score(best) : 0,
    bestRejected: !!best && rejected.includes(best),
    wouldReject: (s: Submission) => typeof s.answers.yearsExperience === 'number' && s.answers.yearsExperience < requiredYears,
  }
}
