# LeaseRight — Foundation Synthesis (Phase 1 integration)

> Integrates `10_PERSONAS_AND_ROLES`, `20_JOURNEYS_AND_NARRATIVE`, `30_DATA_MODEL_AND_SYSTEMS`.
> Resolves the cross-cutting conflicts the three specialists surfaced. Conceptual only.
> Created 2026-07-01. Read the three source specs for full detail; this is the reconciliation layer.

## Decisions confirmed (2026-07-08, Justin)

- **D1–D7: all confirmed.** One canonical person-object; derived status (drag = a real
  transition); Launch = freeze-and-diff; plan-vs-actual is structural; role = permission lens
  over one owner dataset with outsider scoping; decisions write through with approval-gating for
  lower-trust roles; create-project → intake → model → launch first-run.
- **Lender (was O2): export-only, NO app access.** The lender never gets a seat; they receive a
  generated package/export. Remove any notion of a lender login.
- **Roles (was O1): expanded.** Asset Manager is promoted from a permission tier to a **first-class
  role**. **Lead Broker** is added as a role that activates **only on the broker-assisted route**.
  Canonical role set: Owner · Asset Manager · Leasing Agent · Lead Broker (conditional) · Property
  Manager · Lender-observer (export-only).
- **Surfaces (was O4): confirmed.** Build the prototype around the 7 primary surfaces — Model,
  Today, Pipeline, Inbox, Rents, Applications, Reports — and demote/defer the rest.
- **Ripple to propagate:** the expanded role set changes the role × permission × surface matrix in
  `10_PERSONAS_AND_ROLES.md` and the role-scoping model in `30_DATA_MODEL_AND_SYSTEMS.md`. Refresh
  both to carry Asset Manager and Lead Broker before the prototype rebuild.

## Headline

The three specs agree on the core diagnosis: **v6 is a set of beautiful, disconnected surfaces
because it has no shared spine.** The same person exists as four unlinked records (Prospect,
Inbox thread, Application, Resident); the Model's plan and the live actuals are separate hand-authored
numbers; pipeline stage, application status, and unit status can all disagree. Fixing the spine is
the single highest-leverage move, and it's conceptual, not a build problem.

They also converged — independently — on the two most important mechanisms (freeze-and-diff at
Launch; derive status from one truth). That convergence is the signal the foundation is sound.

## Reconciled decisions (recommended — flagged where Justin should confirm)

**D1 — One canonical person-object.** Lead → Application → Lease → Resident is ONE continuous
object across its lifecycle, not four records. Every surface reads the same object. (Fixes the
"Alex Rivera exists three times" defect.)

**D2 — Status is derived, drag is a shortcut.** A Lead's pipeline stage is *derived* from its
furthest-progressed child state, so Pipeline and Applications can never disagree. Dragging a card
in Pipeline performs the underlying transition (drag to APPLIED → creates a stub Application).
One truth, no sync bugs. *Confirm: OK that drag = a real state change, not a cosmetic move?*

**D3 — Launch = freeze-and-diff.** At the Launch event the active Scenario is frozen as an
immutable **baseline plan**; live actuals accrue separately; all plan-vs-actual variance (Today
velocity, Reports) compares actuals to that frozen baseline. Fixes v6's two-independent-curves bug.
*This is the demo's "aha" hinge — the command center turns on already populated from the model.*
*Confirm: freeze a snapshot (recommended) vs. let the model keep living and mutating?*

**D4 — Plan-vs-actual is structural.** A small set of shared quantities (absorption curve,
velocity, rent-by-type, concession spend, occupancy, carry/days-to-goal, staffing) each carry a
*plan* value (from Model) and an *actual* value (from live entities). Variance is a property of
the data, not a feature bolted onto each view.

**D5 — Role is a permission lens over ONE owner dataset, with scoping for outsiders.** Reconciles
the Personas "visibility flows up to the owner" principle with the Data "role shouldn't fully
partition data" principle: the **owner/asset-manager see everything**; internal leasing agents see
their assignments; **external** collaborators are row-scoped (a broker sees only their own assigned
leads and their own scorecard; the lender is read-only aggregates/exports). Visibility flows up,
never sideways between competitors.

**D6 — Decisions write through, with approval only when trust requires it.** Accepting a Today
decision (e.g., "drop 3BR to $3,200") directly mutates the target entity when done by
owner/asset-manager; when a lower-trust role initiates, it becomes a *proposal* the owner approves.
So Decision has an optional approval sub-state keyed to role.

**D7 — First run.** New user → Create Project → choose stage (pre-funding / funded-prelaunch /
active lease-up / stabilized) → guided intake → model → Launch. The **owner signs up first** and
invites collaborators; the app must deliver value to a team of one, pre-funding, before asking for
any staffing change.

## The golden path (the one story the prototype must tell)

The Meridian (260u, East Austin, sponsor J. Mori) + one lead, Alex Rivera (Zillow 2BR inquiry).
Build lender-ready model → fund → **Launch** (board turns on, pre-populated, nothing re-entered) →
Alex arrives in Inbox → becomes a scored/SLA card in Pipeline and a decision in Today → call →
tour → application → approve → e-sign lease → deposit to escrow → resident record. Every primary
tab moves in lockstep, and the weekly sponsor/lender report writes itself because plan (beat 1) and
actuals (beats 4–11) are the same numbers. See `20_JOURNEYS_AND_NARRATIVE.md`.

## Decisions — CONFIRMED by Justin, 2026-07-03

- **O1 — Asset Manager: permission tier** for now, not a deeply-designed launch role.
- **O2 — Lender access: exports-only** for the prototype. No observer seat.
- **O3 — D2 and D3 CONFIRMED:** drag in Pipeline performs the real underlying state
  transition, and Launch freezes the active scenario as an immutable baseline plan.
- **O4 — The prototype is built around the 7 primary surfaces** (Model, Today, Pipeline,
  Inbox, Rents, Applications, Reports). Maintenance / Vendors / Ledger / Collections /
  Residents / Documents are demoted or deferred.

The foundation is locked. Phase 2 (Model & underwriting depth, UX system, strategy) and
the rebuild plan (`70_REBUILD_PLAN.md`) proceed from these decisions.

## What Phase 2 would cover (if we proceed)

- **Product Strategy** — differentiation vs AppFolio/Buildium/Yardi + brokers; the $1/unit + payments logic; sharpened for the developer buyer.
- **Model & Underwriting depth** — intake fields, absorption math, scenario mechanics, broker-vs-in-house calculator, lender package (the wedge).
- **UX/UI system** — codify the two-mode design (calm advisory Model / dense live ops), first-run and empty states, interaction patterns.

Then a prototype **rebuild plan** sequenced around the spine above.
