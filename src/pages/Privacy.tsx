import { Link } from 'react-router-dom'
import { Mark } from '../components/Shell.tsx'

const STORED: [string, string, string][] = [
  ['Candidates', 'Name, email, answers, AI tools used, years of experience, time taken, candidate number', 'Scoring and sending the result; name, email and experience stay hidden from the scorer until every answer is scored'],
  ['Employers', 'The job ad, the kit, scores, the live-question answer, the decision and the 90-day check-in', 'Running the test and keeping a record of each decision'],
  ['Your browser only', 'The employer key (unlocks a link\'s answers) and a candidate\'s test progress', 'Never sent anywhere else; clearing site data removes it'],
]

const h2 = 'mt-8 mb-2 text-[18px] font-semibold'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-ground px-4 py-8">
      <div className="mx-auto max-w-[720px]">
        <Link to="/" className="mb-8 flex items-center gap-2.5 no-underline text-ink"><Mark /><span className="text-[18px] font-bold">WorkProof</span></Link>
        <div className="rounded-[var(--radius-card)] bg-card p-6 text-[15px] leading-relaxed sm:p-8">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Privacy notice</h1>
          <p className="mt-2 text-muted">What WorkProof captures, where it is stored, and who can see it. WorkProof is a student prototype built for the Credify System Thinking Challenge 2026; it is designed around POPIA's principle of collecting only what is needed.</p>

          <h2 className={h2}>What we capture</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[14px]">
              <thead><tr className="text-left text-[12px] uppercase tracking-[0.06em] text-muted"><th className="pb-2 pr-3 font-medium">Who</th><th className="pb-2 pr-3 font-medium">What</th><th className="pb-2 font-medium">Why</th></tr></thead>
              <tbody>{STORED.map(([who, what, why]) => <tr key={who} className="align-top"><td className="border-t border-line py-2.5 pr-3 font-semibold">{who}</td><td className="border-t border-line py-2.5 pr-3">{what}</td><td className="border-t border-line py-2.5 text-muted">{why}</td></tr>)}</tbody>
            </table>
          </div>

          <h2 className={h2}>What we never ask for</h2>
          <p>No ID number, age, race, gender, address, photo, CV or school results. No cookies, analytics or advertising trackers.</p>

          <h2 className={h2}>Where it is stored and who can see it</h2>
          <p>Answers are stored in a Supabase database in the EU (Ireland). The browser cannot read the database directly: every read goes through locked functions that check the link code or the employer key. Only the employer who created a link can see its answers, and names and emails unlock only after every answer is scored. The live-update channel carries a "changed" signal, never answer data.</p>

          <h2 className={h2}>AI</h2>
          <p>For job ads other than the sample, the ad's title and duties are sent to Groq to draft the test. Candidate answers, names and emails are never sent to any AI service.</p>

          <h2 className={h2}>Your choices</h2>
          <p>Taking a test is voluntary. To have your answers deleted, ask the employer who sent you the link, or open an issue on the project's <a href="https://github.com/yaseenselemane/workproof/issues" className="text-proof">GitHub page</a>. Automatic deletion after a set period is not built yet; it is on the next-steps list.</p>
        </div>
      </div>
    </div>
  )
}
