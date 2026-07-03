# LeaseRight — Product Bible (v0 seed)

> Shared source of truth for the prototype-perfection effort. Every specialist reads this
> BEFORE working and writes findings back into their own spec file. If your work contradicts
> something here, flag it explicitly rather than silently diverging — the lead integrates.
>
> Created 2026-07-01. Phase: Foundation (conceptual spec only — NO code changes yet).

## 1. What we are doing (and not doing)

- **Goal of this phase:** fill the *conceptual* gaps that must be settled before we rebuild the
  "perfect prototype." We are NOT engineering a real app, NOT writing production code, NOT
  choosing a build stack. We are producing clear, coherent product thinking.
- **Deliverable:** specification documents in this `spec/` folder. Prose + tables + diagrams-as-text.
- **After this phase:** review the foundation together, THEN decide whether to run Phase 2
  (Strategy, Model/underwriting depth, UX system) and eventually a prototype rebuild.

## 2. The product in one paragraph

LeaseRight is a lease-up operating system for real-estate **developers and small-to-mid
portfolio owners** who need to get units rented on time without the cost and bloat of
traditional property-management software (AppFolio/Buildium/Yardi) or full-service brokerage.
The wedge is **pre-funding**: help the sponsor build a lender-ready lease-up model, then turn
that model into the live lease-up command center once funded, and stay in place afterward as the
payments + resident system of record. Pricing: ~$1/unit for software; money is made on payments,
deposits, and banking. Full thesis: `../PRODUCT_DIRECTION.md`. Scope audit: `../SCOPE_AUDIT.md`.

## 3. Primary audience for the "perfect prototype" — LOCKED

**Developer / owner / asset manager customers.** Optimize everything for the person who would
actually run lease-up. NOT fundraising/investors right now — do not shape the prototype around a
VC pitch. Lenders matter only as an *output audience* the developer must satisfy (the model must
be lender-ready), not as the primary user.

## 4. Current state of the prototype (v6 — corrected read, 2026-07-01)

Static React-UMD + Babel-in-browser prototype; all data is hardcoded mock in `components/data.jsx`;
no backend, no auth, no persistence beyond UI prefs. Deployed as flat files on Netlify. Runs
locally at `http://localhost:4174/LeaseRight.html`.

It is a **two-mode** design:
- **Model (pre-funding):** calm/light advisory theme. Editable guided intake
  (Property · Units · Comps · Rents · Strategy), left stepper (Intake → Scenarios → Rents →
  Model output → Launch), base/downside/aggressive scenarios, broker-vs-in-house economics,
  market-rent confidence scoring, lender package. This is partly real, not just a mock.
- **Live ops (post-launch):** dense dark "terminal" theme. Today = a decisions console
  (e.g., "3-bedrooms have stalled" → Accept new rent / Add concession / Hold), a LIVE feed, and
  velocity-vs-plan. Pipeline = 6-stage funnel NEW → CONTACTED → TOURED → APPLIED → APPROVED →
  SIGNED with scored lead cards, SLA timers, source + unit tags.
- **~17 views total.** Primary nav: Model · Today · Pipeline · Inbox · Rents · Applications ·
  Reports. Secondary/demoted: Residents, Ledger, Maintenance, Vendors, Listings, Market,
  Concessions, Collection, Documents.

## 5. The biggest known gaps (from SCOPE_AUDIT + current read)

1. **No spine.** Views don't share a model — moving a lead in Pipeline doesn't update Today,
   Applications, or Reports. There is no single connected lead-to-lease story.
2. **No first-time / create-project path.** The app assumes "The Meridian" already exists.
3. **No explicit roles.** Sponsor / asset manager / leasing agent / broker / PM / lender all
   see the same thing.
4. **Model → actuals disconnect.** Model assumptions don't flow into live plan-vs-actual.
5. Payments/deposits (the business model) are notional.

## 6. Foundation workstreams (Phase 1)

- **10 — Personas & Roles** (`10_PERSONAS_AND_ROLES.md`): who the users really are, centered on
  the developer/owner; jobs-to-be-done; the collaborator roles; a role × permission × surface matrix.
- **20 — Journeys & Narrative** (`20_JOURNEYS_AND_NARRATIVE.md`): the end-to-end journey, the
  single golden-path demo story, first-run/empty states, and where v6 breaks the story.
- **30 — Data Model & Systems** (`30_DATA_MODEL_AND_SYSTEMS.md`): the conceptual entity + state
  model (Project, Unit, Lead, Tour, Application, Lease, Deposit, Resident, Comp, Scenario, User,
  Decision, Report) that makes the surfaces cohere; plan-vs-actual linkage.

## 7. Working agreements

- Conceptual only. No edits to `components/*.jsx`. No new app code.
- Read `../PRODUCT_DIRECTION.md`, `../SCOPE_AUDIT.md`, and the `components/*.jsx` before writing.
- End every spec with an **Open Questions / Conflicts** section for the lead to reconcile.
- Optimize for the developer/owner customer. When in doubt, cut anything that doesn't help a
  sponsor get funded, lease units faster, reduce broker/PM bloat, or win the payment relationship.
