import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rulesKit, thirdPerson } from './rulesKit.ts'
import { xrayAd } from './xray.ts'

test('duty verbs become third person', () => {
  assert.equal(thirdPerson('Reconcile bank statements'), 'Reconciles bank statements')
  assert.equal(thirdPerson('Process invoices'), 'Processes invoices')
  assert.equal(thirdPerson('Supply stock'), 'Supplies stock')
  assert.equal(thirdPerson('Keep the owner informed'), 'Keeps the owner informed')
})

test('any ad with duties gets a complete kit: up to 3 abilities, each with a 4-level sheet', () => {
  const ad = 'Junior Sales Rep\nAcme\nRequirements\n- 3 years experience\nDuties\n- Call new leads\n- Log every call in the CRM\n- Prepare weekly quotes\n- Visit key accounts'
  const kit = rulesKit(xrayAd(ad))
  assert.equal(kit.source, 'rules')
  assert.deepEqual(kit.abilities.map(a => a.id), ['A', 'B', 'C'])
  assert.equal(kit.abilities[0]!.fromDuty, 'Call new leads')
  assert.equal(kit.rubric.length, 3)
  assert.ok(kit.rubric.every(r => r.levels.length === 4))
  assert.match(kit.test.task, /call new leads; log every call/)
})

test('fewer duties means fewer abilities, never invented ones', () => {
  const kit = rulesKit(xrayAd('Clerk\nShop\nDuties\n- File invoices'))
  assert.equal(kit.abilities.length, 1)
  assert.equal(kit.rubric.length, 1)
})
