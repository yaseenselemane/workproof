import { test } from 'node:test'
import assert from 'node:assert/strict'
import { xrayAd, proxyLoad } from './xray.ts'
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
