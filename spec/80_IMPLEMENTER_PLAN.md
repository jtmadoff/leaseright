# 80 — Implementer plan: shipped state and gated next work

**As of:** 2026-09-10
**Code inspected through:** 2026-09-08 (`b961b36`)
**Status:** Current implementation source of truth

This file owns implementation sequence, file-level evidence, and done-whens. It was reconciled
against `components/` and `LeaseRight.html`; status is not inferred from older plans or handoffs.

Business recommendations are not owned here. The current business recommendation, pilot gates,
payment-engine underwriting, and decisions for Justin remain in
`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`. If this plan appears to conflict with that memo, the
Overseer memo controls the business conclusion.

Status terms used below:

- **Complete:** the done-when is present in shipped code.
- **Partial:** some substrate or UI exists, but the full done-when is not met.
- **Outstanding:** the required behavior or artifact is absent.
- **Gated:** intentionally waits on the paid-pilot or sponsor inputs defined by the canonical memo.

---

## 1. Current implementation read

LeaseRight remains a static React-UMD/Babel prototype. There is no backend, production auth,
durable application data, processor integration, or live money movement. Local storage retains
only UI preferences and the selected tab; the React store resets from `SEED` on reload.

The September 1–8 work shipped a real first-user and Model-to-launch path:

1. A product-first welcome screen starts a project and asks whether it is pre-funding,
   funded/pre-launch, or active lease-up.
2. Model exposes a five-step property intake (Property, Units, Comps, Rents, Strategy) with visible
   completion status.
3. Model exposes Plan → Scenarios → Review → Launch states with locked/ready/approved/live labels.
4. Scenario selection and saved intake values dispatch into a mounted shared store.
5. Launch changes the project stage and stores a frozen copy of the selected scenario as a
   baseline, then offers a route to Today.
6. Residents now derives its roster and payment/move-in status from the normalized store graph.
7. The shell and atoms were calmed: the primary header no longer shows the live tape, clock,
   function-key labels, hover peeks, or primary-nav badges.

That is meaningful shipped UI and substrate. It is not yet a connected operating system:

- Pipeline still starts from `useState(PROSPECTS)` and drag only mutates local cards.
- Inbox still starts from `useState(INBOX_THREADS)` and sends messages into local thread state.
- Rents still starts from `useState(UNIT_MATRIX)`; “Publish changes” has no dispatch.
- Applications still renders `APPLICATIONS`; its decision buttons have no store actions.
- Reports still renders authored `LP_REPORT` values and cosmetic export buttons.
- Today still uses local decision/rent state rather than store `Decision` and `UnitType` records.
- Sidebar badges and peeks remain hardcoded even though the primary header no longer renders them.
- No originator view, registration entity, commission entity, pilot log, or payment rail exists.

---

## 2. Evidence from the shipped component set

| Layer | Shipped state | Direct evidence |
|---|---|---|
| Entry and mounting | Static browser app; store script loads before views; app is wrapped in `StoreProvider`. | `LeaseRight.html`; `components/app.jsx` |
| Normalized graph (N1) | Complete. `SEED` carries projects, units, leads, tours, applications, leases, residents, payments, scenarios, model, decisions, threads, comps, concessions, and listings. | `components/model-data.jsx` |
| Selectors (N2) | Complete for the originally named selector set. Pure stage, shared-quantity, variance, and staffing-economics functions exist with `__selfTest`. | `components/selectors.jsx` |
| Store (N3) | Complete for the documented action cases. Reducer returns new objects and exports `StoreProvider`, `useStore`, and `useSelector`. | `components/store.jsx` |
| Store mount (N4) | Complete. Active project selection comes from store state. | `components/app.jsx` |
| Staffing correction (I0) | Complete. `brokerEconomics(inputs)` makes fee period and outside-originator share explicit; Model uses the function and labels its savings illustrative. | `components/selectors.jsx`; `components/module-views.jsx` |
| First-run/project intake | Shipped. Welcome, three starting stages, five intake steps, required-field gating, property/unit-count updates, and progress states render. It reuses and edits the active seeded project; it does not create a new project row or invite a team. | `components/app.jsx`; `components/module-views.jsx` |
| Model status UI | Shipped. Plan/Scenarios/Review/Launch expose progress and locked/ready/approved/live states. Approval state is local UI state; active scenario and launch baseline write to the store. | `components/module-views.jsx`; `components/store.jsx` |
| Launch | Partial N9. It sets `active_leaseup`, timestamps launch, and freezes a scenario copy. It does not generate unit rows, deep-freeze a sponsor baseline, gate navigation, or prove downstream surfaces read that baseline. | `components/store.jsx`; `components/app.jsx`; `components/shell.jsx` |
| Residents handoff | Shipped beyond the old plan. Residents derives lead/unit/lease/payment status from store records. | `components/module-views.jsx` `ResidentsView` |
| Primary operating surfaces | Rendered but disconnected. Today, Pipeline, Inbox, Rents, Applications, and Reports still use legacy globals and/or local state. | `components/today-view.jsx`; `components/pipeline-view.jsx`; `components/inbox-view.jsx`; `components/other-views.jsx`; `components/module-views.jsx` |
| Secondary modules | Residents, Collection, Maintenance, Ledger, Listings, Market, Concessions, Vendors, Documents, and Settings render. Except Residents, they remain mostly authored dioramas and local interactions. | `components/module-views.jsx`; `components/shell.jsx` |
| Roles/originators | Not shipped. The shell is one hardcoded owner; `SEED.users` contains the owner and in-house agent. There is no originator surface or first-class registration/commission data. | `components/shell.jsx`; `components/model-data.jsx`; absence of `components/originator-view.jsx` |
| Payments | Mock payment/status records only. No partner, API, reconciliation, settlement, or money movement. | `components/model-data.jsx`; `components/module-views.jsx` |

The component directory now contains 12 JSX files, including `store.jsx`. Any earlier statement that
the store file or provider is missing is retired.

---

## 3. Foundation and rebuild status

This ledger prevents shipped substrate from being confused with complete user workflows.

| Work item | Status | Evidence / remaining boundary |
|---|---|---|
| N1 normalized seed | **Complete** | `model-data.jsx` and entry script are present. |
| N2 pure selectors | **Complete** | Named selectors and self-test are present. |
| N3 store provider/reducer/actions | **Complete** | All documented action cases exist in `store.jsx`. |
| N4 mount store/project switcher | **Complete** | `StoreProvider` wraps `App`; active project is store-backed. |
| N5 shared absorption curve | **Outstanding** | Model still computes a local exponential curve; Reports uses separate authored data. |
| N6 scenario state | **Partial** | Selection dispatches to `SEED.scenarios`, but cards still render `MODEL_SCENARIOS` literals. |
| N7 staffing economics | **Superseded by complete I0** | The corrected function intentionally does not reproduce the stale `$116.9K` savings done-when. |
| N8 store-controlled intake | **Partial** | Saves dispatch to `model.intake`, but input values originate in local `intakeValues` and local field definitions. |
| N9 stage machine/baseline/unit creation | **Partial** | Launch sets stage and freezes one scenario copy; it does not instantiate units or test baseline immutability after scenario changes. |
| N10 stage-gated surfaces | **Outstanding** | Primary and sidebar navigation remain available regardless of project stage after welcome. |
| N11 derived Reports variance | **Outstanding** | Reports reads `LP_REPORT`; it does not call `sharedQuantities`/`variance`. |
| N12 Pipeline write-through | **Outstanding** | Local `PROSPECTS` state; no dispatch on drop. |
| N13 Inbox write-through | **Outstanding** | Local `INBOX_THREADS`; suggested/send actions do not create store transitions. |
| N14 Applications write-through | **Outstanding** | Legacy `APPLICATIONS`; approval/deposit controls are cosmetic. |
| N15 Today write-through | **Outstanding** | Decision completion and pricing remain local. |
| N16 Rents write-through | **Outstanding** | `UNIT_MATRIX` is local; publish does not dispatch. |
| N17 shared counts | **Outstanding** | View metrics and sidebar badges/peeks are not selector-backed. |

N1–N4 are finished foundation work and must not be resumed. The next uncompleted rebuild item is
N5, but N5–N17 remain controlled by the business gates in the canonical Overseer memo.

---

## 4. Current milestone done-whens

Every done-when from the prior version of this file is accounted for below using evidence from
`components/`, not claims in another planning document.

### G0 — Pilot Model instrument (Phase A): **Gated and outstanding**

| Done-when clause | Status | Code evidence |
|---|---|---|
| Every number on the Model/Reports quote card traces to a sponsor source cell. | **Outstanding** | Model and Reports still combine `PRECON`, `MODEL_SCENARIOS`, `LP_REPORT`, local arrays, and seeded values. No pilot overlay or source-cell map exists. |
| Dates, duration, carry, staffing period, and target lease count derive from one sponsor input set and convention. | **Outstanding** | The display still contains independent authored durations, velocities, dates, carry, and staffing inputs. No shared duration/carry derivation or required G0 self-tests exist. |
| Launch freezes the approved baseline instead of animating a fake transition. | **Partial** | `launchProject` stores `Object.freeze({...scenario})`, but approval is local UI state, the freeze is shallow, and downstream surfaces do not read it. |
| Visible Meridian demo economics are clearly illustrative; authored carry is hidden or footnoted as not computed from the carry rate. | **Partial** | Staffing routes and savings say “illustrative.” Scenario cards still show authored carry without the required warning. |

Required next implementation remains sponsor-sourced Model reconstruction after the commercial
gate. Do not silently “fix” Meridian literals into a more consistent fictional building.

### I2 — Originator page: **Gated and outstanding**

| Done-when clause | Status | Code evidence |
|---|---|---|
| Published inventory and commission/protection terms appear before registration. | **Outstanding** | No originator route or view exists. |
| Registration captures agent, license, brokerage, client, and unit/type. | **Outstanding** | No `Registration` entity or form exists. |
| Confirmation is copyable or dual-addressed by `mailto:` to agent and brokerage with frozen terms. | **Outstanding** | No confirmation artifact exists. |
| Status includes dispute outcome and commission owed/approved/paid-on-date/days-to-pay. | **Outstanding** | No originator status stepper or `Commission` entity exists. |
| Owner Reports do not expose other originators’ clients. | **Not yet testable** | There are no originator records or report path to scope. |
| `resolveRefs(SEED)` remains empty. | **Complete as a foundation check** | The current normalized seed resolves with zero dangling references; I2 has not added records. |

I2 remains gated on sponsor-supplied commission, attribution, dispute, and brokerage/payee rules.

### I-LOG — Operator mechanism log: **Gated and outstanding**

| Done-when clause | Status | Code evidence |
|---|---|---|
| Four weeks of records can produce median contact time, inquiry-to-tour by source, and stalled-type DOM. | **Outstanding** | No Reports-adjacent log or `pilot/` CSV/template exists. |
| Duplicate-entry rate is an explicit recorded field. | **Outstanding** | No duplicate-entry field exists in the component or seed data. |

### I3 — Store + named-lead golden path: **Partial substrate only**

| Done-when clause | Status | Code evidence |
|---|---|---|
| N3 store and N4 mount exist. | **Complete** | `store.jsx`, its script tag, provider mount, and active-project wiring are present. |
| Pipeline drag writes the shared lead and creates the required child record. | **Outstanding** | Pipeline mutates local cards only. |
| Inbox actions update the same lead/tour/application records. | **Outstanding** | Inbox mutates local threads only. |
| Applications approval creates/updates lease, unit, and payment state. | **Outstanding** | Buttons have no handlers into the store. |
| One named lead advances across Pipeline, Inbox, Applications, lease, deposit, Residents, and Reports without reload or duplicate identity. | **Outstanding** | No cross-surface golden path is wired. Residents is store-derived, but upstream surfaces cannot create the handoff. |

I3 still starts only if the paid operator test actually requires a clickable golden path.

### I-SAFE — Public-demo hygiene: **Partial**

| Done-when clause | Status | Code evidence |
|---|---|---|
| Staffing economics and savings are labeled illustrative. | **Complete** | Both Model staffing presentations use “illustrative.” |
| Authored scenario carry is hidden or footnoted as not computed from the carry rate. | **Outstanding** | Scenario cards display carry with no such warning. |
| `$1/unit · forever` is not presented as the pilot price. | **Outstanding** | The phrase remains in the user menu and sidebar footer. |

---

## 5. Implementation sequence that remains valid

The business sequence is unchanged:

1. **Commercial gate:** Justin names the validation target and authorizes the fixed, stage-gated
   paid pilot; the sponsor signs and pays under the continuity and diligence terms in the canonical
   memo.
2. **G0 / Phase A:** reconstruct the Model from sponsor source files, document conventions, freeze
   a reconciled baseline, and perform payment-stack diligence. This is not live payments work.
3. **Conditional Phase B:** run the operator mechanism log and, only after written attribution and
   payee rules exist, the thin originator test.
4. **I3 only when demanded by the test:** connect Pipeline, Inbox, and Applications to the mounted
   store for one named lead. Do not mistake the existing reducer cases for shipped workflow.
5. **Later payment beta:** remains separately gated on partner economics, legal architecture,
   shadow reconciliation, and the other requirements in the canonical memo.

Do not build broker guest RBAC, an owner broker scorecard, generic PM expansion, a commission payout
rail, or a success-fee quote card as a substitute for those gates.

---

## 6. Decisions for Justin

The code reconciliation creates no new decision. The outstanding decisions remain the ones in
`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`: name the validation target and authorize the paid,
stage-gated pilot and its payment/continuity diligence. Framework, store shape, lender login, and
payment-provider selection are not decisions required by this document.
