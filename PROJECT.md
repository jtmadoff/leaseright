---
project: LeaseRight
company: Prospeer
stage: "Venture build"
as_of: 2026-09-10
next_action: "Justin: name a long-term-holder validation target with payment-stack authority—preferably with existing stabilized units—and authorize one fixed five-figure, stage-gated paid pilot with continuity terms and payment diligence; live payments remain a separately gated beta (spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md)."
definition_of_done: "ONGOING — not public launch. Next milestone is one paid, stage-gated validation: collected sponsor payment; a continuity screen; a reconciled frozen baseline; payment-volume/processor diligence; then conditional operator/originator validation. Live rent processing starts only after partner economics, legal architecture, shadow reconciliation, and beta gates clear."
owner: Justin
as_of_source: git log through b961b36 (latest commit dated 2026-09-08) and repository code inspected 2026-09-10; business context remains the 2026-09-02 Overseer synthesis
---

# LeaseRight — Lease-up operating system

## Metadata
- **Company:** Prospeer
- **Type:** Digital/Creative Project — product build
- **Repo:** `https://github.com/jtmadoff/leaseright`
- **Hosting:** Netlify static deploy
- **Naming:** formerly **LeaseUp**. Renamed to LeaseRight over trademark conflict risk.
  The superseded LeaseUp prototypes are archived under `Archive/LeaseUp_prototypes/`.

## Current State

**The thesis**, from `PRODUCT_DIRECTION.md`: a lease-up operating system for developers
and small-to-mid portfolio owners who need units rented on time without the cost and
bloat of traditional property management software or full-service brokerage. Positioned
historically at **$1 per unit forever** for the core software layer, developer-first rather than
property-manager-first, built around lease-up velocity rather than generic property administration.
Justin confirmed on 2026-09-02 that `$1/unit` is secondary positioning: net rent-processing
economics on volume routed through LeaseRight are the intended long-term engine.

**Repository state, verified 2026-09-10 from git log and current code:** the latest commit is
`b961b36` (2026-09-08), a merge that reconciled the status UI and product journey into the
canonical project. The merged journey starts with a welcome and project-stage choice,
then makes required property intake the first Model step. Intake edits write to the in-memory store;
completion unlocks scenario selection, approval unlocks review and launch, and launch freezes the
selected scenario as a baseline before routing to Today. The same merge replaced prominent filled
status badges, pulsing queue dots, navigation counts, and ticker/clock chrome with quieter border,
dot, and text treatments. The implementation touched `LeaseRight.html` and seven files under
`components/`, including the new `components/store.jsx`; it does not add a backend or durable
project persistence.

The N1 normalized `SEED` graph and N2 selectors remain present, and the Model view calls
`brokerEconomics`. Pipeline, Inbox, and Rents still initialize from the legacy top-level
`PROSPECTS`, `INBOX_THREADS`, and `UNIT_MATRIX` literals in `components/data.jsx`, rather than the
shared `SEED`/store. Their interactions therefore remain local UI state.

**Overseer read, 2026-09-02** (`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`): the current
business model does not work as stated; the strongest testable version is a paid owner
command center with **hybrid** execution and a low-friction **originator**
(locator/Realtor) rail. The first pilot is one fixed-fee, stage-gated building engagement:
collect payment, reconcile the sponsor's Model, then activate the operating and originator tests
only when the baseline, data path, commission policy, and brokerage/payee path are ready. A
same-submarket second building tests whether originator reuse can become a network. A live payments
build is not the next milestone, even though net rent-processing economics are the intended
long-term engine. Do not continue N3–N17 before the paid validation pilot clears its gates. See
`spec/80_IMPLEMENTER_PLAN.md` for the build sequence.

The payment engine should be screened at 5–10 bps net; 25 bps is a stretch contract case, not a
market quote, and 50 bps is no longer a planning case. At the current assumptions, 10 bps is only
`$1.66/unit/month` and needs about `$1B` PPV / 50K units for `$1M` of annual net payment revenue.
Core-engine classification also requires evidence that the payment contract survives stabilization
and that retained units can be acquired economically.

**Payment-engine correction, 2026-09-02:** the intended long-term economic engine is LeaseRight's
net share of rent-processing economics, not `$1/unit`. This changes target selection and adds
payment diligence, partner-pricing, legal-architecture, and shadow-reconciliation gates, but it
does not turn the current static prototype or Phase B into a live payment rail. The fixed-fee
Model/operations pilot remains the paid wedge; prefer a long-term holder with payment-stack
authority and existing stabilized units. Add a counsel-drafted contract-continuity test before
Phase A; a sponsor that rejects continuity can still validate a profitable wedge, but not the
payment engine. The canonical reconciliation is in
`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`; all three payment memos remain detailed peer inputs.

**What exists**, from `README.md`: a deliberately static HTML prototype. `LeaseRight.html`
is the primary app file, with components in `components/*.jsx`. It uses React UMD and
Babel in the browser so the design can be shared and iterated without a build step.
Deployed at `leaserightbeta.netlify.app`.

## Open Items
- [x] **Set a definition of done for the next milestone.** Paid validation pilot — not
      public launch. Detail in `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`.
- [x] **Reconcile the source-of-truth path.** This HomeBase folder is canonical
      (`SOURCE_OF_TRUTH.md`; `README.md` updated).
- [ ] **Justin decisions:** name the first validation target; authorize one fixed five-figure,
      stage-gated paid pilot and validation before rebuild
      (`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`).
- [ ] **Payment-engine validation:** target a long-term holder with collections authority; obtain
      contract-continuity terms, processor statements, and a written partner proposal; authorize
      live money movement only after legal architecture and shadow reconciliation clear
      (`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`).
- [ ] **Confirm the Monday venture link.** The Prospeer board carries a LeaseRight
      venture; no `monday_item` id is recorded here yet.

## Reference
- `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` — **current canonical business recommendation**:
  payment-engine underwriting, reconciled agent-role design, test gates, and owner decisions
- `spec/BUILDER_PAYMENT_ECONOMICS_REASSESSMENT.md` — detailed Builder payment-engine feasibility
  analysis (peer input; reconciled into the current Overseer memo)
- `spec/PAYMENT_ENGINE_ECONOMICS_VALIDATION.ipynb` — reproducible PPV, take-rate, AppFolio scale,
  and retention-sensitivity calculations supporting the canonical payment recommendation
- `spec/80_IMPLEMENTER_PLAN.md` — current implementation translation of the Overseer recommendation (refreshed 2026-09-01 after Builder I0). Business conclusions stay in the Overseer memo; this file owns sequence, files, and done-whens.
- `spec/CONTRARIAN_MODEL_AND_AGENTS.md` — contrarian brief (peer)
- `spec/CONTRARIAN_PAYMENTS_ENGINE.md` — 2026-09-02 contrarian pressure-test of processing-fee share
  as the economic engine (peer input; reconciled into the current Overseer memo)
- `spec/STRATEGIST_PAYMENT_ENGINE_REASSESSMENT.md` — 2026-09-02 strategist reassessment of the
  payment engine (peer input, reconciled into the current Overseer memo): converts the take rate
  into `$/unit/month`, argues retention rather than take rate is the dominant variable, and proposes
  a contract-continuity falsifier and a stabilized-units target preference for the pilot
- `spec/STRATEGIST_ARCHITECTURE_AND_CRITIQUE.md` — strategist brief (peer): its Model arithmetic,
  originator-neutrality, mechanism-metric, and second-building findings are folded into the current
  Overseer memo; its carry-share pricing and additional owner decisions are not canonical
- `PRODUCT_DIRECTION.md` — core thesis, positioning, pricing
- `SOURCE_OF_TRUTH.md` — canonical file designation
- `SCOPE_AUDIT.md` — scope review
- `README.md` — prototype architecture and local preview instructions
- `LeaseRight.html` — primary app file
- `components/` — JSX component files
- `netlify.toml` — deploy config

## Key Files
- `Archive/LeaseUp_prototypes/` — superseded LeaseUp V2–V5 prototypes and design brief,
  folded in 2026-08-06 when the naming was resolved
