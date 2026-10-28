# AI use disclosure

The Credify guide asks participants to disclose tools, reused code and AI assistance honestly. This is that disclosure.

## Tools used

- **Claude (Anthropic), through Claude Code**, was used throughout: research, analysis, design, code, tests and documentation.
- **Claude Opus 5.5** is also part of the product: the `draft-kit` function asks it to draft a kit for job ads other than the sample. The X-ray itself uses written rules, not AI.
- **Open-source libraries**, listed in `package.json`. No code was copied from templates or other projects.

## What Yaseen decided

- Entering the challenge, and choosing challenge area 04 after weighing it against the other three areas.
- Pushing the work beyond a generic answer: asking for South African grounding (which led to the Stats SA and Employment Tax Incentive argument), and for a sharper job-ad scrape (which led to comparing job-title labels).
- Requiring every feature to be built and working, including the live candidate link on a phone, rather than shown only in the deck.
- The visual direction: the dashboard reference the interface is based on.
- Which tools to use and which to drop, after reviewing recommendations.
- Making the repository public, and every decision about scope and priority during the build.

## What Claude did

- Researched the problem and found the evidence: Stats SA labour figures, the Employment Tax Incentive, and the CareerJunction and Pnet job-ad data.
- Proposed the core argument (make being wrong about a graduate cheap), the system map and the causal loops.
- Designed the interface and wrote the application code, the database schema and security functions, the Edge Function, and the tests.
- Tested the full flow in a browser, found and fixed bugs (including a lost-score race and an answer-key matching gap), and wrote this documentation.

## What Yaseen should be able to explain

Before presenting, Yaseen should be ready to walk a judge through, in his own words: why the problem sits with the employer rather than the graduate; what the two causal loops are; why the portfolio platform was rejected; how the X-ray rules work; why the test allows AI; and how blind scoring and the employer key protect candidates.

## Figures to verify before presenting

- The 12.4% graduate unemployment figure comes from the Stats SA Q2 2026 presentation slides; check it against the official media release.
- Employment Tax Incentive amounts differ between sources. The product only relies on the incentive existing; confirm current rules at sars.gov.za before quoting any amount.
