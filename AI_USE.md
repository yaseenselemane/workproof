# How WorkProof was built

WorkProof is Yaseen Selemane's entry for the Credify System Thinking Challenge 2026. He used **Claude Code**, Anthropic's AI coding assistant, as his main engineering tool, much as a developer works with a pair programmer: Yaseen set the direction and made the decisions; Claude drafted the research, code and documents he asked for; Yaseen reviewed the results and redirected the work when it fell short. The Credify guide asks for AI assistance to be disclosed honestly, and this file does that.

## Yaseen's part

- **The problem and the angle.** Chose challenge area 04 after weighing it against the other three, and rejected the first proposal as too generic. He asked for an answer grounded in South Africa rather than a borrowed one, which produced the core evidence: graduate unemployment rose even though the Employment Tax Incentive already lowers the cost of hiring young people.
- **The evidence.** Challenged the research method (dropping a participant poll that would have exposed the strategy and sampled the wrong group) and pushed for a smarter job-ad analysis, which led to comparing job-title labels and the finding that one in three "junior" roles are ranked higher by the employer.
- **The product bar.** Required every feature to be built and working, including the live candidate link on a real phone, rather than mocked up for the deck.
- **The look.** Chose the visual direction from a dashboard reference, and reviewed the screens.
- **Scope and priorities** throughout: which tools to adopt or drop, what to build first, what to cut, and publishing the code openly.

## Claude's part

Working to those decisions, Claude Code drafted the analysis and system map, ran the job-ad and statistics research, designed and implemented the interface, wrote the application code, database schema and Edge Function, wrote and ran the tests, and drafted this documentation. It also tested the app end to end and fixed the bugs it found.

## AI inside the product

The `draft-kit` Edge Function calls **Claude Opus 5.5** to draft a kit for job ads other than the sample. The Ad X-ray does **not** use AI: it runs on written rules, so every flag can be explained.

## Reused code

None copied from templates or other projects. Open-source libraries are listed in `package.json`.

## Figures to verify

- The 12.4% graduate unemployment figure is from the Stats SA Q2 2026 presentation slides; check it against the official media release before quoting.
- Employment Tax Incentive amounts differ between sources. WorkProof relies only on the incentive existing; confirm current rules at sars.gov.za before quoting an amount.
