# Credify System Thinking Challenge 2026 — thesis

**Challenge area 04 — Graduate Employability**
*How can employers identify capable graduates who lack traditional work experience?*

Yaseen Selemane · 28 October 2026

---

## The spine (say this in one breath)

> Employers don't lack information about graduates. They're drowning in it.
> So stop trying to prove the graduate is good — make **being wrong about a
> graduate cheap**.

---

## The experiment South Africa already ran (lead with this)

This is the part no borrowed analysis will have. Stats SA, Quarterly Labour
Force Survey **Q2 2026**, released 11 August 2026:

| Measure | Q2 2026 |
|---|---|
| Official unemployment | 33.6% |
| Youth 15–34 | 47.4% |
| Youth 15–24 | 62.8% |
| **Graduate unemployment** | **12.4%** (10.3% in Q4 2025, 12.2% in Q1 2026) |
| NEET, 15–24 | 36.4% of ~10.4m |

South Africa **already pays employers to hire young people**. The Employment
Tax Incentive reduces an employer's PAYE bill for workers aged 18–29, claimed
monthly through the EMP201 return; it does not touch the employee's wage. It is
live in 2026.

Put the two together:

> The state already made it cheaper to take a chance on a young person.
> Graduate unemployment went **up** anyway — 10.3% to 12.4% in two quarters.
> **Money was never the whole constraint. The employer still cannot tell who is
> capable.**

The ETI de-risked the *cost* of a wrong hire. It did not de-risk the
*judgement*. The evaluation kit is the missing half of a policy this country
already built — which also answers "why would anyone adopt this": the subsidy
is already on the table and employers still hesitate.

**Verify before slides:** confirm the 12.4% against the Q2 media release (it is
taken from the Q2 presentation slides) and confirm ETI rates at sars.gov.za —
vendor blogs disagree (R1,000 vs R1,500/month; R6,500 vs R7,500 ceiling). The
argument needs only that the incentive exists, not its exact rand value.

**Do not claim** employers under-use the ETI. No uptake data was found. The
provable claim is "the incentive exists and the problem persists."

---

## Why the obvious answer fails

The intuitive response is *give employers more evidence*: portfolios, verified
projects, skill badges. Two things are wrong with it.

**1. Signal saturation.** A junior role draws hundreds of applications and gets
seconds of attention each. Every new evidence platform makes the stack heavier,
not more legible. When everyone adds signal, signal becomes noise — and the
candidates who most need to stand out are the ones with the least ability to
buy attention. Adding evidence is a move inside a game the graduate is losing;
it does not change the game.

**2. Risk asymmetry — the one with teeth.** A bad junior hire costs a manager
months of supervision and visible reputational damage. A missed good hire costs
them nothing anyone will ever measure. Over-filtering on degree, prior
experience and referral is therefore *rational behaviour*, not laziness or
prejudice. An incentive that asymmetric cannot be fixed by handing the
disadvantaged side more paperwork.

Both causes point the same way: the constraint sits with the **employer**, not
the graduate. Almost every submission will build for the graduate. That is the
mistake.

## The intervention

An employer-side **evaluation kit**. A real job ad goes in; out comes

1. the three *observable behaviours* that predict success in that role, with
   proxy requirements (years of experience, degree class) stripped out;
2. a short work sample — about 45 minutes — that tests those three and nothing
   else;
3. an anchored scoring rubric a **human** fills in.

The tool never ranks candidates and never decides. It drafts; a person scores.
That line is a design position, not an omission, and it is where the fairness
argument lives.

Why this lowers the cost of being wrong: the employer's evaluation effort stops
being burned once per candidate and becomes a reusable artifact; the decision
becomes auditable after the fact; and a structured work sample is a far better
predictor of job performance than the unstructured interview or the years-of-
experience filter it replaces. *(Grounding: the Schmidt & Hunter selection-
validity meta-analyses. VERIFY the figures before they go on a slide.)*

## The intervention we rejected

A graduate portfolio / verified-project platform.

Using Donella Meadows' leverage points: a portfolio platform intervenes on
**information flow** — a weak tier, because it adds to a channel that is already
saturated. Changing *who bears evaluation cost* and *how the decision is made*
intervenes on the **rules** tier, which is stronger. The information tier is
necessary but not sufficient; our layer sits on top of it rather than against
it.

*(Tone discipline: Credify partly is the information tier. The position is
"necessary but not sufficient, and this complements it" — never "your model is
wrong.")*

## What would prove this wrong

- Junior job ads turn out to be mostly reasonable about experience — then the
  saturation claim weakens and the argument leans entirely on asymmetry.
- Employers say they already run structured work samples for juniors — then the
  gap is adoption, not design, and the intervention should target adoption.
- Hiring managers report that a missed good hire *is* measured where they work —
  then the asymmetry is weaker than claimed.

## Evidence collected — job ads, 28 Oct 2026

**Headline: 1 in 3 "junior" roles are ranked above junior by the employer
itself.** CareerJunction search "junior": 59 live ads — every result, not a
sample. 30 carry "Junior" in the title. Their employer-set level field:
Junior 20 · Intermediate 8 · Senior 1 · Executive 1 → **10 of 30 mismatched.**
No interpretation involved: it's the employer's own field contradicting the
employer's own title. Data: `evidence/junior_ads_careerjunction.csv`.

**Quote for the deck:** Pnet, "Site Agent / Junior contracts manager" —
"Minimum 8–10 years' experience in construction."

**Pnet, floor only:** of 24 junior ads read, 8 state an experience requirement,
6 of them 2+ years. The other 16 were not verified (Pnet blocked automated reads
mid-collection), so present it as "at least", never as a rate.
Data: `evidence/junior_ads_pnet.csv`.

**The word matters (second pass, same day):** same measure across the other
entry-level labels on CareerJunction —

| Label in title | Live ads with it | Ranked above junior |
|---|---|---|
| Junior | 30 (of 59 results) | **10 — 33%** |
| Graduate / trainee / intern | 7 unique | 1 — 14% |

"Junior" is the most common entry-level label *and* the one most often attached
to roles the employer itself ranks higher. "Graduate" ads tend to say the honest
thing ("No experience? No problem!"). Pitch line: **"junior" has become the word
employers use for "experienced but cheap."** Caveat: 7 is a tiny group —
present the contrast as a pattern, not a rate. The one mismatch there is itself
quotable: "MQA Intern" at Mintek, ranked Intermediate.
Data: `evidence/entry_labels_careerjunction.csv`. "Data Entry Clerk" was
excluded as a false match for "entry level".

**Limits to state if asked:** one day's snapshot, two boards, recruiter-posted
ads over-represented (Datafin posts many). One stale ad from April 2024 is in
the 30 and is a Junior/Junior match, so it doesn't inflate the mismatch.

## Open decisions

- Repo name, public vs. access instructions
- Stack: single page + thin backend, API key server-side
