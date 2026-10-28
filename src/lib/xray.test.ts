import { test } from 'node:test'
import assert from 'node:assert/strict'
import { xrayAd, proxyLoad, rewriteAd } from './xray.ts'
import { SAMPLE_AD } from '../data/sample.ts'

test('sample ad: proxies, trainable tool and duties land where the X-ray screen says', () => {
  const x = xrayAd(SAMPLE_AD)
  assert.equal(x.title, 'Junior Bookkeeper')
  assert.match(x.employer, /Mthembu/)
  const byText = Object.fromEntries(x.lines.map(l => [l.text, l]))
  assert.equal(byText["Minimum 2 years' bookkeeping experience"]?.why, 'years, not ability')
  assert.equal(byText['Matric with a 70%+ average']?.why, 'school results')
  assert.equal(byText['BCom Accounting preferred']?.why, 'credential')
  assert.equal(byText['Own reliable transport']?.why, 'circumstance')
  assert.equal(byText['Experience on Sage Pastel']?.kind, 'trainable')
  assert.equal(byText['Reconcile bank statements monthly']?.kind, 'task')
  assert.deepEqual(proxyLoad(x), { proxies: 4, trainable: 1, tasks: 5, review: 0, requirementProxies: 4, requirements: 5 })
})

test('junior label check fires on years, reads Senior at 5+', () => {
  assert.equal(xrayAd(SAMPLE_AD).labelMismatch?.reads, 'Intermediate')
  const senior = xrayAd('Junior Site Agent\nEmcon\nRequirements\n- Minimum 8-10 years experience in construction')
  assert.equal(senior.labelMismatch?.reads, 'Senior')
  assert.equal(xrayAd('Junior Clerk\nShop\nRequirements\n- Matric').labelMismatch, null)
})

test('fairness flags only circumstance, school results and age', () => {
  assert.deepEqual(xrayAd(SAMPLE_AD).fairness, ['Matric with a 70%+ average', 'Own reliable transport'])
})

test('requiredYears is the most any requirement asks for', () => {
  assert.equal(xrayAd(SAMPLE_AD).requiredYears, 2)
  assert.equal(xrayAd('Clerk\nShop\nRequirements\n- Matric').requiredYears, 0)
})

test('the rewritten ad keeps every task, teaches the tool, and drops every proxy', () => {
  const ad = rewriteAd(xrayAd(SAMPLE_AD))
  for (const task of ['Reconcile bank statements monthly', 'Prepare VAT201 returns for review']) assert.match(ad, new RegExp(task))
  assert.match(ad, /What we will teach you\n- Sage Pastel/)
  for (const proxy of ['2 years', '70%', 'BCom', 'transport']) assert.doesNotMatch(ad, new RegExp(proxy))
  assert.match(ad, /45-minute test/)
  assert.doesNotMatch(ad, /\n\n\n/)
})
