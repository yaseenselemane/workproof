import type { Decision } from './types.ts'

/** Everything the result email needs. Built from the job's own kit, so one template fits every ad. */
export type EmailInput = {
  role: string
  company: string
  firstName: string
  decision: Decision
  total: number
  abilities: { id: string; name: string; score: number }[]
  /** The two feedback sentences from the scoring sheet: what went well, and what the next level looks like. */
  strengths: string
  growth: string
}

/** "Mthembu Hardware & Building Supply (Pty) Ltd · Centurion" → "Mthembu Hardware & Building Supply". */
export const companyFrom = (employer: string) =>
  (employer.split('·')[0] ?? '').replace(/\(Pty\)|\bLtd\b|\bLimited\b/gi, '').replace(/\s+/g, ' ').trim() || 'the hiring team'

const HEADINGS: Record<Decision, string> = {
  interview: "You're invited to a final interview",
  hold: "We're still deciding",
  decline: 'Thank you for taking the test',
}

export type MailVia = 'gmail' | 'outlook' | 'app'

/** A compose link for the employer's own mail: Gmail or Outlook on the web, or the computer's email app. */
export function composeUrl(via: MailVia, to: string, subject: string, body = '') {
  const e = encodeURIComponent
  if (via === 'gmail') return `https://mail.google.com/mail/?view=cm&fs=1&to=${e(to)}&su=${e(subject)}${body ? `&body=${e(body)}` : ''}`
  if (via === 'outlook') return `https://outlook.office.com/mail/deeplink/compose?to=${e(to)}&subject=${e(subject)}${body ? `&body=${e(body)}` : ''}`
  return `mailto:${to}?subject=${e(subject)}${body ? `&body=${e(body)}` : ''}`
}

export const emailSubject = (i: EmailInput) =>
  i.decision === 'interview' ? `${i.role}: invitation to a final interview` : `${i.role}: your test result and feedback`

/** The editable body, as plain paragraphs separated by blank lines. */
export function emailText(i: EmailInput) {
  const next = {
    interview: "We'd like to invite you to a final interview. Please reply to this email with two or three times that suit you this week.",
    hold: "We're still making our decision and will let you know by email.",
    decline: "We won't be taking your application further this time, but we wanted you to have feedback from the scoring sheet.",
  }[i.decision]
  return [
    `Hi ${i.firstName},`,
    `Thank you for taking the ${i.role} test for ${i.company}. ${next}`,
    `${i.strengths} ${i.growth}`,
    `Kind regards,\n${i.company}`,
  ].join('\n\n')
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The designed email: inline styles and tables only, because email apps ignore stylesheets. */
export function emailHtml(i: EmailInput, text: string) {
  const font = "font-family:Arial,Helvetica,sans-serif"
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p style="margin:0 0 14px;${font};font-size:16px;line-height:1.5;color:#121815">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
  const dots = (n: number) => [1, 2, 3, 4].map(k =>
    `<td style="width:14px;height:14px;padding:0 2px"><div style="width:14px;height:14px;border-radius:4px;background:${k <= n ? '#0F7A5A' : '#DCE2DE'}"></div></td>`).join('')
  const rows = i.abilities.map(a => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E1E6E3;${font};font-size:14px;color:#121815">${esc(a.name)}</td>
          <td style="padding:10px 0;border-top:1px solid #E1E6E3" align="right"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${dots(a.score)}<td style="padding-left:8px;${font};font-size:14px;font-weight:bold;color:#121815">${a.score}/4</td></tr></table></td>
        </tr>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#EEF1EF">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1EF"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td align="center" style="padding-bottom:24px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:32px;height:32px;border-radius:16px;background:#0F7A5A;${font};font-size:18px;font-weight:bold;color:#ffffff" align="center">&#10003;</td>
        <td style="padding-left:10px;${font};font-size:22px;font-weight:bold;color:#121815">WorkProof</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:20px 20px 0 0;padding:36px 32px 28px">
      <p style="margin:0 0 6px;${font};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#5C6862">${esc(i.role)} · ${esc(i.company)}</p>
      <h1 style="margin:0 0 22px;${font};font-size:30px;line-height:1.15;font-weight:bold;color:#121815">${esc(HEADINGS[i.decision])}</h1>
      ${paragraphs}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:#F5F7F6;border-radius:14px">
        <tr><td style="padding:18px 20px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="${font};font-size:13px;font-weight:bold;color:#5C6862">Your scores</td>
              <td align="right" style="${font};font-size:26px;font-weight:bold;color:#0F7A5A">${i.total}<span style="color:#A9B3AE">/${i.abilities.length * 4}</span></td>
            </tr>${rows}
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="background:#0B5E45;border-radius:0 0 20px 20px;padding:20px 32px">
      <p style="margin:0;${font};font-size:15px;font-weight:bold;color:#ffffff">Scored blind</p>
      <p style="margin:4px 0 0;${font};font-size:14px;line-height:1.5;color:#E2F2EA">Your name was hidden until every answer was scored against the same written sheet.</p>
    </td></tr>
    <tr><td align="center" style="padding:28px 16px 6px;${font};font-size:18px;color:#121815">Proof you can do the job, not just a CV.</td></tr>
    <tr><td align="center" style="padding:8px 16px;${font};font-size:12px;line-height:1.6;color:#5C6862">Sent by ${esc(i.company)} using WorkProof.<br>You received this because you took the ${esc(i.role)} test.</td></tr>
  </table>
</td></tr></table>
</body></html>`
}
