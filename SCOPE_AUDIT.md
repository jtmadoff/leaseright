# LeaseRight shipped-scope audit

**As of:** 2026-09-10
**Code inspected through:** 2026-09-08 (`b961b36`)
**Scope:** `components/*.jsx` and their mounts in `LeaseRight.html` / `components/app.jsx`

This replaces the July 3 scope audit. The old “missing” lists and recommended build passes are
retired because the component set changed materially. This file now records what is actually
present, what is connected, and what remains a mock or local interaction.

Business scope and product conclusions are not decided here. The canonical recommendation remains
`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`; the current implementation sequence and done-whens are
in `spec/80_IMPLEMENTER_PLAN.md`.

---

## 1. Component inventory

The current component directory contains 12 JSX files:

| File | Shipped responsibility |
|---|---|
| `app.jsx` | App mount, first-run routing, tab routing, active project, UI preferences |
| `atoms.jsx` | Shared visual primitives |
| `data.jsx` | Legacy authored display data and formatting helpers |
| `inbox-view.jsx` | Inbox and local message interactions |
| `model-data.jsx` | Normalized `SEED` graph and `resolveRefs` |
| `module-views.jsx` | Residents, Collection, Maintenance, Ledger, Listings, Market, Concessions, welcome/Model, Settings, Applications, Reports, Vendors, Documents |
| `other-views.jsx` | Rents and fallback placeholders |
| `pipeline-view.jsx` | Pipeline board and local drag state |
| `selectors.jsx` | Pure stage, shared-quantity, variance, and broker-economics functions |
| `shell.jsx` | Primary navigation, sidebar, property switcher, command palette |
| `store.jsx` | Shared context/reducer/actions |
| `today-view.jsx` | Today queue/grid/table presentations and local decision interactions |

All 12 are loaded or reached by the primary entry path. The app is still a static browser prototype:
there is no backend, production auth, durable application state, or live payment integration.

---

## 2. Primary sponsor journey

The intended visible sequence still exists in the shell:

`Model → Today → Pipeline → Inbox → Rents → Applications → Reports`

The current degree of implementation is:

| Surface | What is shipped | Connection boundary |
|---|---|---|
| Model | Product-first welcome; three starting stages; five-step editable intake; progress/status UI; Base/Downside/Aggressive cards; staffing comparison; lender review; launch handoff. | Intake saves and scenario selection use the store, but the view still renders many `data.jsx` and local literals. It is not sponsor-sourced or internally reconciled. |
| Today | Rich queue, grid, and table treatments with decisions, KPIs, and actions. | Decisions and pricing changes are local; they do not write normalized subjects in the store. |
| Pipeline | Lead stages, filters, SLA flags, source/unit context, drag/drop, and detail treatment. | Cards initialize from `PROSPECTS`; drag changes only local state and creates no shared application. |
| Inbox | Thread filters, unread/SLA status, conversation pane, suggested replies, and local send behavior. | Threads initialize from `INBOX_THREADS`; messages/actions do not advance the shared lead. |
| Rents | Editable unit-type matrix, comp/effective comparisons, suggestions, and modeled impact. | Rows initialize from `UNIT_MATRIX`; “Publish changes” does not dispatch to store `UnitType` records. |
| Applications | Screening queue, deposit/status display, detail view, and decision controls. | Reads `APPLICATIONS`; approve/request/decline controls do not write applications, leases, units, or payments. |
| Reports | Authored plan/actual presentation, narrative, and PDF/model/deck/GL controls. | Reads `LP_REPORT`; variances are not selector-derived and controls do not create exports. |

The primary journey is therefore visually broad but only partially connected. Model and Residents
are the current store consumers; the lead-to-lease operating surfaces are still separate dioramas.

---

## 3. September 1–8 scope now shipped

Claims that were “missing” in the July audit but are now present:

### First-time project start: **partially shipped**

- The welcome screen has an explicit “Start a project” action.
- The user selects pre-funding, funded/pre-launch, or active lease-up.
- The selection writes the active seeded project’s stage and routes to property intake.
- Property name, sponsor, address, submarket, delivery date, and target stabilization fields render.

Boundary: the flow mutates the active seeded project rather than creating a new project record;
“stabilized” is not offered; team invitation is only a cosmetic downstream control.

### Intake wizard: **shipped as a prototype, partially store-backed**

- Property, Units, Comps, Rents, and Strategy steps render with required-field gating.
- Inputs are editable, progress is visible, and saves dispatch `updateProject` / `updateModel`.
- Unit count writes to the project.

Boundary: field definitions and current edit values are local, most downstream calculations do not
derive from saved intake, and there is no import or sponsor-source traceability.

### Scenario and staffing comparison: **partially shipped**

- Base, Downside, and Aggressive cards render.
- Selecting a card dispatches `setActiveScenario`.
- `brokerEconomics(inputs)` supplies the displayed in-house, hybrid, and broker costs.
- Staffing costs and savings are labeled illustrative; velocity is “test actual.”

Boundary: scenario card values still come from `MODEL_SCENARIOS`, not a single store-derived sponsor
model. Authored carry and dates are not reconciled to one duration/carry formula.

### Model status and launch UI: **partially shipped**

- Plan, Scenarios, Review, and Launch show locked/ready/approved/live status.
- Completing intake unlocks Scenarios; approval advances to Review and Launch.
- Launch sets the project stage to `active_leaseup`, timestamps it, and freezes a copy of the
  selected scenario in model state.

Boundary: completion and approval flags are local UI state; the baseline freeze is shallow; launch
does not create units, gate navigation, or make Pipeline/Applications/Rents/Reports consume the
baseline.

### Calm/status-focused shell: **shipped in the primary header**

- The primary header no longer renders the scrolling tape, clock, visible F-key labels, nav hover
  peeks, or primary-tab badges.
- Navigation labels, project context, search, and a quiet notification dot remain.
- Today defaults to the queue layout and animated urgency was reduced.

Boundary: hardcoded `NAV_BADGES` and `PEEK_DATA` still feed the sidebar or remain in the file; this
was a presentation change, not shared-count derivation.

### Resident handoff/status: **shipped against normalized store data**

- Residents derives each row by joining resident, lead, unit, lease, and payment records.
- Move-in, deposit, and payment-attention filters/KPIs come from those records.

Boundary: upstream Applications cannot create this handoff through the UI, so it demonstrates the
normalized read path rather than an end-to-end workflow.

---

## 4. Secondary modules actually present

The July audit described several areas as future or excessive. They are not absent: all of the
following render from `module-views.jsx` and are reachable through the sidebar.

| Module | Current scope |
|---|---|
| Residents | Store-derived resident handoff, move-in, deposit, and payment status |
| Collection | Authored collection KPIs, failed payments, aging, and payment methods |
| Maintenance | Authored work orders, priority/SLA filters, and work-order detail |
| Ledger | Authored account balances and transaction/reconciliation presentation |
| Listings | Authored feed health and listing performance |
| Market | Authored comp set and market context |
| Concessions | Authored programs, cost/conversion/expiration treatment |
| Vendors | Authored COI/W-9/status records and controls |
| Documents | Authored folders/recent documents and document controls |
| Settings | Authored property, payment, feed, team, market, and compliance settings |

Except for Residents, these modules remain largely display-level mock data and cosmetic/local
controls. Their presence must not be reported as production PM, accounting, syndication, document,
or payment capability.

---

## 5. Scope still absent or incomplete

The following claims are verified against the current files:

- **No connected lead-to-lease story:** a lead cannot move through Inbox/Pipeline → tour →
  application → lease → deposit → Residents → Reports in shared state.
- **No originator product:** there is no originator route/view, registration entity, commission
  entity, frozen-terms confirmation, brokerage notification, or commission-status presentation.
- **No explicit role model:** the shell renders one hardcoded owner identity; there is no role-based
  permission or surface gating.
- **No stage-gated navigation:** after welcome, all primary and sidebar views remain reachable for
  every selected project stage.
- **No functional lender/report export:** lender review and export buttons render but do not create
  a PDF, workbook, deck, or GL file.
- **No market-rent ingestion/data moat:** comps and confidence values are authored; there is no
  scrape/import, freshness/provenance workflow, or signed-lease feedback loop.
- **No production application/screening/lease workflow:** application data and controls are mock.
- **No live payment capability:** payment records are seed data; there is no partner integration,
  legal architecture, settlement, reconciliation, or money movement.
- **No pilot mechanism log:** the required contact/source/tour/application/lease timestamps and
  duplicate-entry measurement artifact are absent.
- **Demo hygiene remains partial:** staffing economics say “illustrative,” but scenario carry lacks
  the required warning and `$1/unit · forever` remains in two shell locations.

---

## 6. Retired July recommendations

The old four-pass recommendation (“Make Model Real,” “Connect Model to Launch,” “Build One
Lead-to-Lease Story,” “Calm the UI”) is no longer an authoritative queue:

- The intake, status, launch, store mount, and calm-header portions have partly or fully shipped.
- The downstream connections and named-lead golden path have not shipped.
- Whether to finish those connections is gated by the paid validation sequence in the canonical
  business memo and the current done-whens in `spec/80_IMPLEMENTER_PLAN.md`.

This audit therefore makes no new build or business recommendation. It records the current scope so
future work is not credited early and shipped work is not described as missing.
