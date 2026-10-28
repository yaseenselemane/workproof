# WorkProof

**Proof you can do the job, not just a CV.**

WorkProof turns a job ad an employer already has into a 45-minute test of the real work, sent to candidates' phones and scored blind. It is built for the Credify System Thinking Challenge 2026, challenge area 04: *how can employers identify capable graduates who lack traditional work experience?*

## The idea in one paragraph

South Africa already pays employers to hire young people through the Employment Tax Incentive, yet graduate unemployment rose from 10.3% to 12.4% between Q4 2025 and Q2 2026 (Stats SA QLFS). Money was never the whole constraint: employers still can't tell who is capable, and a bad junior hire costs a manager far more than a missed good one. So instead of asking graduates for more evidence, WorkProof makes **being wrong about a graduate cheap**: a short work sample, a written scoring sheet, blind scoring and a receipt for every decision. The full argument, the system map and the evidence are in [`docs/`](docs/).

## What it does

1. **Ad X-ray.** Paste a job ad. Written rules mark each line as a *proxy* (years of experience, school marks, degree, own transport), *trainable* (a software tool) or a *real task*. It flags ads titled "Junior" whose requirements read Intermediate or Senior, and raises a fairness flag on proxies that screen by circumstance. Rules, not AI, so every flag can be explained. It also hands back **the same ad rewritten without the proxies**, ready to copy, which is useful even if the employer never sends a test.
2. **Kit.** The real tasks become up to three abilities, a 45-minute test and a four-level scoring sheet. The sample ad has a hand-built kit; any other ad is drafted by Claude, or by rules when Claude isn't set up. Each kit says where it came from, and **the employer can edit every word** before sending; once sent, it locks.
3. **Live candidate link.** A link and QR code. Candidates take the test on their own phones. For the bookkeeping sample, each candidate gets their own ledger with three of six possible planted errors (20 combinations), so answers can't be passed around.
4. **Live inbox.** Answers arrive within about two seconds, shown by candidate number only.
5. **Blind scoring.** Each answer is scored against the written levels, with an answer key for that candidate's planted errors and one suggested live follow-up question. Names unlock only after every answer is scored.
6. **The filter you didn't use.** At the end of the test, candidates say how many years of experience they have. The scorer never sees it. Once names unlock, WorkProof shows what the ad's experience rule would have done to these real candidates, for example: *"Your ad's '2+ years' rule would have rejected your top scorer."*
7. **Decision receipt.** Scores, the answer key, declared AI use, the follow-up answer and the decision, plus feedback for the candidate built from the scoring sheet. An "invite" decision shows a note that the hire may qualify for the Employment Tax Incentive. Age is never asked.
8. **90-day check-in.** After hiring, the employer records how it is going. The inbox lists check-ins against test scores, so over time an employer can see whether the test predicts the job and improve it.

Candidates may use AI tools during the test, as they would at work, and are asked to say which. The live follow-up question checks understanding.

## Technologies

- **React 19 + TypeScript + Vite** (Vite rather than Next.js because it runs well on a 6.8 GB laptop)
- **Tailwind CSS 4**, self-hosted fonts (Plus Jakarta Sans, IBM Plex Mono): the app makes no third-party requests at runtime except to Supabase
- **Motion** for in-app transitions, **GSAP** for the X-ray scan, the receipt and the landing page, **Lenis** for smooth scrolling on the landing page only. Everything respects the reduced-motion setting.
- **Supabase**: Postgres, Realtime broadcast, and an Edge Function
- **Claude Opus 5.5** via the Anthropic SDK in the `draft-kit` Edge Function, with structured JSON output and server-side refusal fallback
- **qrcode** for the candidate link QR code

## Run it

Requires Node 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. With no `.env.local`, WorkProof runs in **local mode**: everything works, and answers sync between tabs in the same browser. Open the candidate link in a second tab to try the full flow.

### Connect Supabase (needed for phones)

1. Create a Supabase project and run the three files in [`supabase/migrations/`](supabase/migrations/) in order (`0001`, `0002`, `0003`) in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
3. Optional, for Claude-drafted kits: deploy [`supabase/functions/draft-kit`](supabase/functions/draft-kit/index.ts) and add an `ANTHROPIC_API_KEY` secret under Edge Functions → Secrets.

Phones can't open `localhost`. Open the app at your computer's network address (Vite prints it as `Network:`), or set `VITE_PUBLIC_URL`, so the QR code points somewhere a phone can reach.

### Tests

```bash
node --test src/lib/*.test.ts   # 15 tests: X-ray rules and ad rewrite, planted errors and answer key, rules kit, experience-filter comparison
npm run build                   # type-check and production build
```

## How the data is protected

Both tables have row-level security on and **no policies**, so the browser cannot read or write them directly. Every operation goes through one of six `SECURITY DEFINER` functions:

| Who | Can | Checked by |
|---|---|---|
| Candidate | fetch the test, see taken candidate numbers (not names), submit once | the invite code |
| Employer | list answers with names, save scores, the follow-up answer and the decision | a per-invite employer key that never leaves the employer's browser |

Scores are validated on the server (A, B, C only, values 1–4) and merged per ability, so two quick saves can't overwrite each other. The realtime channel only carries a "changed" ping; no answer data crosses it.

## Known limitations

- **No employer accounts.** The employer key lives in one browser. Clearing site data loses access to that link's answers.
- **Anyone with a candidate link can submit**, as with a shared form, so a link could be spammed. A real deployment needs rate limiting.
- **Planted-error tests exist only for the bookkeeping sample.** Other roles get a written task scored against the sheet, with no automatic answer key.
- **Years of experience are self-reported** and used only for the comparison after scoring, never to filter.
- **The 90-day check-in is the employer's own judgement;** with a handful of hires it is a signal, not a statistic.
- **The answer key is an aid, not a grade.** It matches on rand amounts and on what each error is about; the scorer decides.
- **The rules X-ray reads bullet points** under "Requirements" and "Duties" headings. Ads written as prose need reformatting first.
- **Candidate numbers** are picked at random from those not taken; two candidates starting in the same second could draw the same one.
- **Realtime** depends on a websocket; if it drops, the inbox falls back to refreshing every 8 seconds.
- **Claude-drafted kits** need an Anthropic API key and cost a few cents each; without one, new ads get the rules kit.
- The Supabase project is in eu-west-1 (Ireland), the closest region on offer, so live updates take about two seconds from South Africa.

## How it was built

Built by Yaseen Selemane, using Claude Code as an AI engineering assistant. Who did what is set out in [`AI_USE.md`](AI_USE.md).

## Repository layout

```
src/lib/        X-ray rules, planted-error ledgers, rules kit, live sync, state (with tests)
src/pages/      Landing, Ad, X-ray, Kit, Link, Candidate, Live inbox, Score, Receipt
supabase/       database migrations and the draft-kit Edge Function
docs/           thesis, system map, job-ad evidence (CSV)
```
