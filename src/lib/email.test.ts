import { test } from 'node:test'
import assert from 'node:assert/strict'
import { companyFrom, composeUrl, emailHtml, emailSubject, emailText, type EmailInput } from './email.ts'

const input = (decision: EmailInput['decision']): EmailInput => ({
  role: 'Junior Bookkeeper', company: companyFrom('Mthembu Hardware & Building Supply (Pty) Ltd · Centurion'),
  firstName: 'Lerato', decision, total: 11,
  abilities: [{ id: 'A', name: 'Reconciles a bank statement accurately', score: 4 }, { id: 'B', name: 'Finds errors', score: 4 }, { id: 'C', name: 'Explains <clearly>', score: 3 }],
  strengths: 'What you did well: reconciling.', growth: 'To grow: explain the cause.',
})

test('the company name drops the legal suffix and the town', () => {
  assert.equal(companyFrom('Mthembu Hardware & Building Supply (Pty) Ltd · Centurion'), 'Mthembu Hardware & Building Supply')
  assert.equal(companyFrom(''), 'the hiring team')
})

test('each decision gets its own subject and next step', () => {
  assert.match(emailSubject(input('interview')), /invitation to a final interview/)
  assert.match(emailSubject(input('decline')), /your test result and feedback/)
  assert.match(emailText(input('interview')), /reply to this email/)
  assert.match(emailText(input('hold')), /still making our decision/)
  assert.match(emailText(input('decline')), /won't be taking your application further/)
})

test('the designed email carries the edited text, every ability, and escapes what people typed', () => {
  const html = emailHtml(input('interview'), 'Hi Lerato,\n\nCome in <Tuesday>.')
  assert.match(html, /Come in &lt;Tuesday&gt;\./)
  assert.match(html, /Reconciles a bank statement accurately/)
  assert.match(html, /Explains &lt;clearly&gt;/)
  assert.match(html, /11<span[^>]*>\/12/)
  assert.doesNotMatch(html, /undefined|<script/)
})

test('compose links open Gmail, Outlook or the email app with the address and subject filled in', () => {
  const g = new URL(composeUrl('gmail', 'lerato@example.com', 'Junior Bookkeeper: invitation & next steps'))
  assert.equal(g.hostname, 'mail.google.com')
  assert.equal(g.searchParams.get('to'), 'lerato@example.com')
  assert.equal(g.searchParams.get('su'), 'Junior Bookkeeper: invitation & next steps')
  assert.equal(g.searchParams.get('body'), null)
  const o = new URL(composeUrl('outlook', 'lerato@example.com', 'Hi', 'Line one\n\nLine two'))
  assert.equal(o.hostname, 'outlook.office.com')
  assert.equal(o.searchParams.get('body'), 'Line one\n\nLine two')
  assert.match(composeUrl('app', 'lerato@example.com', 'Hi there'), /^mailto:lerato@example\.com\?subject=Hi%20there$/)
})
