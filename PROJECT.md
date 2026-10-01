---
project: LeaseRight
company: Prospeer
stage: "Venture build"
as_of: 2026-09-11
next_action: "Justin: name one long-term-holder validation target with payment-stack authority and authorize one fixed five-figure, stage-gated paid pilot (spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md). Everything else on this project is either built or waiting on that."
definition_of_done: "ONGOING — not public launch. Next milestone is one paid, stage-gated validation pilot. Live rent processing starts only after partner economics, legal architecture, shadow reconciliation, and beta gates clear."
owner: Justin
as_of_source: repository consolidated 2026-09-11 after the first M4D packs; business context is the 2026-09-02 Overseer synthesis
---

# LeaseRight — lease-up operating system

Formerly LeaseUp (renamed over trademark risk). Repo `github.com/jtmadoff/leaseright`, deployed at `leaserightbeta.netlify.app`. This HomeBase folder is canonical; the GitHub repo follows it.

## What it is

A lease-up operating system for developers and small-to-mid portfolio owners who need units rented on time without the cost of full property-management software or full-service brokerage. `$1/unit` is secondary positioning; the intended long-term engine is LeaseRight's net share of rent-processing economics on volume routed through it. The current artifact is a static, no-build React prototype used to sell and shape the first paid pilot — it is not a product with a backend.

## Current implementation update — 2026-10-01

Justin authorized rebuilding intake with Rhode Island as the model state. This supersedes the
older build pause below for intake work. The new path creates independent projects and persists
drafts in browser storage, with backup export/restore, unit-schedule CSV import, evidence review,
calculated planning sensitivities and versioned baseline approval. The legacy operational screens
remain demo-only and are not presented as live output for new projects. Read README.md's Rhode
Island intake section for tested scope and outstanding work. Account-backed persistence and
statewide automatic GIS coverage have not been built.

## What is built today (verified against the code, 2026-09-11)

- **One HTML app, twelve components.** `LeaseRight.html` loads React 18.3.1 and Babel from a CDN with SRI hashes and renders `components/*.jsx` in the browser. No bundler, no server, no persistence beyond the page.
- **The first user journey works end to end in memory.** Welcome → project-stage choice → required property intake (the first Model step) → scenario selection → approval → review and launch, which freezes the chosen scenario as a baseline and routes to Today. `components/store.jsx` holds this state (`StoreProvider`, mounted in `app.jsx`).
- **Model math is real.** The normalized `SEED` graph (`model-data.jsx`) and the N2 selectors (`selectors.jsx`) exist and the Model view calls `brokerEconomics`. The verification gate calls `resolveRefs(SEED)` and `Selectors.__selfTest()` on every run. Those self-checks run in Node as a verification-time guarantee; they are not a browser guarantee.
- **Six primary surfaces are still disconnected demo views.** Today, Pipeline, Inbox, Rents, Applications, and Reports use legacy globals and/or local state rather than the shared store. Of the secondary surfaces, Collection, Maintenance, Ledger, Listings, Market, Concessions, Vendors, Documents, and Settings are also disconnected; Model and Residents are the two connected surfaces.
- **Delivery is hardened.** Netlify publishes only `index.html`, `LeaseRight.html`, and `components/` (specs and the archive are no longer served); security headers are set; `/leaseright` and `/app` redirect to the app.
- **Two-stage verification gate.** `.m4d/project.json` declares `npm test --offline --script-shell=/bin/sh && node .m4d/check.mjs` with a three-minute timeout. The primary check is a seven-test, dependency-free Node suite covering exact selector outputs, seed reference integrity, the selector self-test, and the prototype validator's missing-script failure path; it then validates local script references in both HTML entry points. It needs no install, network, or browser. The second check keeps the existing static/model/browser gate: it runs the Netlify staging command; enforces the strict publish allowlist of `index.html`, `LeaseRight.html`, and files under `components/`; confirms every component script is published byte-identically, referenced by `LeaseRight.html`, cache-busted, and resolvable; calls `resolveRefs(SEED)` and `Selectors.__selfTest()`; and fails if Chrome or Chromium cannot be started or any render assertion fails. M4D runs the complete command on every write mission; a branch cannot merge without it passing.

## What the agent packs did (Sep 10–11)

Two Overseer packs and their follow-ups ran through M4D. Landed on `main`: the public-site publish fix, security headers, the deploy manifest that reads component names from the HTML instead of a hand-typed list, the implementer-plan correction (the status table claimed the store was missing — it was built), three spec reconciliations against shipped code, the PROJECT/README refresh, the production React swap with a visible load-error fallback, and the check gate above. Filed as reports in `spec/`: the Warden delivery/dependency audit and the Analyst doc-vs-code claims ledger. The self-referential `node_modules` symlink that an early merge introduced is untracked and ignored (`node_modules` is ignored in both spellings; nothing on the runtime path uses it). The graph cache under `graphify-out/cache/` is ignored too; the graph itself stays tracked.

The repaired unit-test suite was later recovered from the abandoned test-gate history and made dependency-free: its selector and model-integrity coverage is preserved, while its prototype-validator negative control checks a missing local script without `@babel/parser`, a vendored parser, or an install step. Its package manifest declares tests only; the app remains a static, no-build prototype. The existing deploy-artifact and headless-Chrome assertions remain intact as the second check, and browser unavailability still fails that check.

## Decisions open for Justin

1. **The pilot target.** One long-term holder with payment-stack authority, preferably with stabilized units; one fixed five-figure, stage-gated engagement with continuity terms. Nothing on the build side is waiting on anything else.
2. **Payment-engine diligence** before any live money: processor statements, contract-continuity terms, a written partner proposal, legal architecture, shadow reconciliation (all in the Overseer synthesis).
3. **Monday link.** The Prospeer board carries a LeaseRight venture; no `monday_item` id is recorded here.

## Next two things worth doing

1. Secure the paid pilot and clear its first gate; until then, do not continue N5–N17 from `spec/80_IMPLEMENTER_PLAN.md`.
2. After that gate clears, wire Today, Pipeline, Inbox, Rents, Applications, and Reports to the shared store so the journey's baseline flows into every primary operating surface.

## Where things live

- `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` — the canonical business recommendation and gates (2026-09-02)
- `spec/80_IMPLEMENTER_PLAN.md` — build sequence after the pilot; corrected 2026-09-10
- `spec/ANALYST_DOC_CODE_CLAIMS_LEDGER.md`, `spec/WARDEN_DELIVERY_AND_DEPENDENCY_AUDIT.md` — the two audits behind this document
- `PRODUCT_DIRECTION.md` — thesis and positioning · `SCOPE_AUDIT.md` — scope review · `README.md` — how to preview locally
- `spec/00…70_*.md`, the payment memos, and the contrarian/strategist briefs — peer inputs already reconciled into the Overseer synthesis; read them for reasoning, not for status
- `Archive/LeaseUp_prototypes/` — superseded V2–V5 prototypes
- `CLAUDE.md` — orientation for coding agents · `.m4d/` — M4D project config and check gate
