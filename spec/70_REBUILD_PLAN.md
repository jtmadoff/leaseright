# 70 — Rebuild Plan (sequencing the spine rebuild)

> **2026-09-01 status.** N1 (`model-data.jsx`) and N2 (`selectors.jsx`) are done. The corrected
> economics selector now also derives explicit month/year, payroll, outside-originator share, and
> carry-day comparisons; it supersedes N7's original broken oracle. The next
> company milestone is **not** N3–N17. Business recommendation:
> `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`. Implementation sequence:
> `spec/80_IMPLEMENTER_PLAN.md` (G0 against a named sponsor, then I2, then I3 only
> if an operator must click). Resume this queue only if Justin names a live
> operator demo that needs a clickable golden path (then I3 = N3/N4 + N12–N14 only).
> Do not execute N7 as written. Do not "reconcile" Meridian demo numbers in lieu of Gate 0.
>
> Turns the locked foundation (`40_FOUNDATION_SYNTHESIS.md`, decisions **D1–D7** confirmed by
> Justin 2026-07-03) into an ordered, task-level build plan for the prototype. Read the four
> Phase-1 specs (`00`–`40`), `../PRODUCT_DIRECTION.md`, and `../SCOPE_AUDIT.md` first — this doc
> assumes them and does not re-argue them.
>
> Created 2026-07-08. **This is a plan, not code.** No `components/*.jsx` or `*.html` file is
> touched by writing it. It respects `../SOURCE_OF_TRUTH.md`: the product is **LeaseRight**, the
> direction is the dense dark operating console, and we do **not** revert to the old light-sidebar
> prototype.

---

## 0. What we are rebuilding around

The confirmed spine, restated so every task below can be checked against it:

- **D1** — One canonical person-object: `Lead → Application → Lease → Resident` is ONE object.
- **D2** — Pipeline stage is *derived* from the furthest-progressed child state; drag performs the
  real underlying transition (drag to APPLIED creates a stub Application). *(confirmed O3)*
- **D3** — Launch freezes the active Scenario as an immutable **baseline**; actuals accrue
  separately; all variance compares actual to that frozen baseline. *(confirmed O3)*
- **D4** — Plan-vs-actual is structural: a small set of shared quantities each carry a plan value
  (Model) and an actual value (live entities).
- **D5** — Role is a permission lens over one owner dataset; outsiders are row-scoped.
  *(Asset Manager = permission tier only, O1; lender = exports-only, O2.)*
- **D6** — Accepting a Today decision writes through to the target entity (approval sub-state only
  where a lower-trust role initiates).
- **D7** — First run: owner creates a project → picks stage → guided intake → model → Launch.
  First value must be deliverable by a **team of one**, pre-funding.

**The 7 primary surfaces** (O4): Model · Today · Pipeline · Inbox · Rents · Applications · Reports.
Maintenance / Vendors / Ledger / Collections / Residents / Documents stay demoted/deferred.

**The single demo the rebuild must tell** (golden path, `20_JOURNEYS §2`): The Meridian + Alex
Rivera, one Zillow inquiry becoming a signed lease and cleared deposit that moves every tab, with
the weekly report writing itself because plan (beat 1) and actuals (beats 4–11) are the same numbers.

---

## 1. The stack reality every task must respect

From `../SOURCE_OF_TRUTH.md`, the `00_PRODUCT_BIBLE §4` read, and the code as of 2026-07-08:

- **Static React-UMD + Babel-in-browser. No build step, no backend, no new dependencies.** This is
  a hard constraint from the task and the brand rules — the plan proposes **none** of those.
- Files load as **ordered `<script type="text/babel">` tags in `LeaseRight.html`** and talk to each
  other through the **`window` global namespace** (each file ends in `Object.assign(window, {…})`).
  Load order is: `data → atoms → shell → today-view → other-views → pipeline-view → inbox-view →
  module-views → app`. `index.html` is only a redirect to `LeaseRight.html`.
- **There is no shared state today.** Every view holds its own `useState(SOME_LITERAL)` copied from
  `data.jsx` (`PipelineView` → `useState(PROSPECTS)`, `InboxView` → `useState(INBOX_THREADS)`,
  `RentOptimizer` → `useState(UNIT_MATRIX)`, `PriorityCarousel` → local `rent3b`). Nothing
  propagates between views. This is *why* v6 is "beautiful dioramas."

**Architecture decision that unblocks everything (recommended, confirm in Open Questions Q1):**
build the spine as a **hand-rolled store** — a React **Context + `useReducer`** over one normalized
state object, plus a library of **pure selector functions** for all derived values. React 18 UMD
already ships hooks; a reducer + context is plain JS, so this adds **zero dependencies and no build
step** and is fully consistent with the stack. Views stop copying literals into local state and
instead *read from the store and dispatch actions*. This is the mechanism that makes D1–D6 real.

Concretely this introduces **three new files** (each a normal `text/babel` script + `window`
export, each requiring one new `<script>` tag inserted at the right position in `LeaseRight.html`):

- `components/model-data.jsx` — the normalized seed graph (one connected Meridian dataset).
- `components/selectors.jsx` — pure derive functions (no React): stage counts, derived lead stage,
  the D4 shared quantities, variance, absorption curve, broker economics.
- `components/store.jsx` — `StoreProvider` / `useStore` / `useSelector` + the reducer & actions.

Load order for the new files: `model-data` and `selectors` after `data.jsx` (they may reuse its raw
literals as a source), `store.jsx` after them, and all three **before** `shell/*-view/module-views`
(which will consume them), with `app.jsx` last. Registering a file in `LeaseRight.html` is itself a
code-verifiable step and is baked into the relevant task done-whens.

---

## 2. Ordered phases (mapped to SCOPE_AUDIT's four build passes)

`SCOPE_AUDIT`'s "Recommended Next Build Pass" predates the foundation synthesis, so its four passes
assume a spine that does not exist yet. The plan therefore inserts **Phase 0 — The Spine** as an
explicit prerequisite, then runs SCOPE_AUDIT's four passes on top of it. Each pass is now *feasible*
precisely because Phase 0 exists.

| Phase | Maps to | Goal in one line | Spine decisions exercised |
|-------|---------|------------------|---------------------------|
| **Phase 0 — The Spine** | *(prerequisite; not in SCOPE_AUDIT)* | One store, one person-object, one unit convention, derived counts. | D1, D2, D4 |
| **Phase 1 — Make Model Real** | SCOPE_AUDIT **Pass 1** | Editable intake state, scenario toggles, one absorption curve, broker-vs-in-house from inputs. | D4 |
| **Phase 2 — Connect Model to Launch** | SCOPE_AUDIT **Pass 2** | Project stage machine; Launch freezes baseline + instantiates units; Reports variance = actual − baseline. | D3, D4, D7 |
| **Phase 3 — One Lead-to-Lease Story** | SCOPE_AUDIT **Pass 3** | Pipeline/Inbox/Applications/Today/Rents all read+write the store; drag & decisions write through. | D1, D2, D6 |
| **Phase 4 — Calm the UI + first-run + roles** | SCOPE_AUDIT **Pass 4** | Two-mode calm/dense system, first-run canvas, empty states, role chrome, presenter mode. | D5, D7 |

**Phases 0–3 are almost entirely night-shift-sized** (data/state/logic, verifiable by reading
code). **Phase 4 is almost entirely daytime** (visual judgment, rendered browser). The tables in
§3 and §4 split accordingly. Within Phases 0–3 the ordering is dependency-driven, not strict — once
the store exists (N1–N4) the surface-wiring tasks (N12–N17) can run in any order and in parallel
across evenings.

---

## 3. Night-shift task table (paste-ready)

Each task is **one evening, file-scoped, and correctness-verifiable by reading code** — no visual
judgment, no rendered browser. "Self-test" means a small `__selfTest()` function of `console.assert`
statements exported from the module (dependency-free, runnable by eye, and the standing pattern this
stack can support without a test runner). Tasks are written so their **done-when can be pasted
straight into `NIGHTSHIFT.md`**.

> Convention for the queue: title each as `Rebuild Nxx — <goal>`; repo is
> `Prospeer/Projects/Active/LeaseRight`; constraint line for all: *no new deps, no build step, no
> backend; static React-UMD + Babel; respect SOURCE_OF_TRUTH brand rules.*

### Phase 0 — The Spine

| # | Goal | Files touched | Depends on | Done-when |
|---|------|---------------|-----------|-----------|
| **N1** | Normalized seed graph: re-express the Meridian mock as ONE connected object graph — first-class `Unit`s under a single ID convention, and each person (Alex Rivera, Kira Weston, Ethan Park, Sarah Chen…) existing **once** as a `Lead` that carries its Application/Lease/Resident/Thread by reference. | **new** `components/model-data.jsx`; `LeaseRight.html` (add script tag after `data.jsx`) | — | File exports one `SEED` object with arrays `projects, units, unitTypes, leads, tours, applications, leases, residents, payments, scenarios, model, decisions, threads, comps, concessions, listings`. A `resolveRefs(SEED)` self-check returns **zero dangling references** (every `unitId`/`leadId`/`assignedTo` resolves). `grep "Alex Rivera" components/model-data.jsx` returns exactly one definition. New `<script>` tag present in `LeaseRight.html` in the correct position. |
| **N2** | Pure selector library for all derived values: `deriveLeadStage(lead)`, `stageCounts(leads)`, `sharedQuantities(project)` (absorption plan/actual, velocity, rent-by-type, concession spend, occupancy, carry/days-to-goal, staffing — the D4 set), `variance(quantity)`. | **new** `components/selectors.jsx`; `LeaseRight.html` | N1 | Module imports no React (pure). Exports the named functions. `__selfTest()` asserts `stageCounts(SEED.leads)` sums to `SEED.leads.length` and Meridian occupancy = leasedUnits/totalUnits. Reading the file shows **no hardcoded stage counts**. Script tag registered. |
| **N3** | Store provider + reducer + actions: Context + `useReducer` over `SEED`, immutable updates only, with documented actions `contactLead, bookTour, submitApplication, approveApplication, signLease, collectDeposit, acceptDecision, setRent, dragLeadToStage, setActiveScenario, launchProject`. | **new** `components/store.jsx`; `LeaseRight.html` | N1, N2 | Exports `StoreProvider`, `useStore`, `useSelector`. Reducer is a pure `switch` returning **new** objects (reading shows spreads, no in-place mutation). Every action listed above has a case + a one-line doc comment. Script tag registered after `selectors.jsx`, before the view files. |
| **N4** | Mount the store: wrap the app body in `<StoreProvider>` and route the property switcher (`propIdx`) through the store's `projects`, with **no change to any view's behavior yet** (safe incremental cut-over). | `components/app.jsx` | N3 | `app.jsx` renders `<StoreProvider>` around the body; the active project derives from store state; existing views still receive `t` unchanged. Reading shows no view logic moved in this task. |

### Phase 1 — Make Model Real (SCOPE_AUDIT Pass 1)

| # | Goal | Files touched | Depends on | Done-when |
|---|------|---------------|-----------|-----------|
| **N5** | Collapse the **two duplicate absorption curves** into one shared function `absorptionCurve(scenario)`; Model and Reports both call it. (Fixes `20_JOURNEYS §4.5`.) | `components/selectors.jsx`; `components/module-views.jsx` (PreconView + LPReportingView) | N2 | `grep -R "Math.exp" components/` returns exactly **one** occurrence (in `selectors.jsx`). PreconView's local `plan`/`projected` and Reports' plan curve both call `absorptionCurve(...)`. `__selfTest()` asserts the two former call-sites produce identical output. |
| **N6** | Scenario toggles wired to the store: Base/Downside/Aggressive live in `SEED.scenarios` with one `active`; `setActiveScenario` recomputes `sharedQuantities` plan values; PreconView reads the active scenario from the store, not the `MODEL_SCENARIOS` literal. | `components/store.jsx`; `components/module-views.jsx` (PreconView) | N3, N5 | Dispatching `setActiveScenario` changes the plan side of `sharedQuantities`. PreconView reads scenarios from `useSelector`, not `MODEL_SCENARIOS`. Reading shows no local scenario literal driving the view. |
| **N7** | Broker-vs-in-house as a **pure function** `brokerEconomics(inputs)` deriving commission / in-house / hybrid / savings from unit count + avg rent + fee basis, instead of the hardcoded `BROKER_ECONOMICS` totals. | `components/selectors.jsx`; `components/module-views.jsx` (PreconView `strategyOptions`) | N1 | Pure function exported. `__selfTest()` reproduces the doc figures ($283.4K broker / $166.5K in-house / $116.9K savings) from inputs within rounding. PreconView's `strategyOptions` read from it. |
| **N8** | Intake fields become store-controlled (editable model state), not local `const` literals; edits dispatch to the store. | `components/store.jsx`; `components/module-views.jsx` (PreconView intake) | N3 | Editing an intake field dispatches an action and updates store `model`. PreconView reads intake field **values** from the store. Reading shows the intake structure may stay local but its data comes from state. |

### Phase 2 — Connect Model to Launch (SCOPE_AUDIT Pass 2)

| # | Goal | Files touched | Depends on | Done-when |
|---|------|---------------|-----------|-----------|
| **N9** | Project **stage machine** + Launch: `pre_funding → funded_prelaunch → active_leaseup → stabilized`; `launchProject()` **freezes** the active scenario as an immutable `baseline` (D3), instantiates `Unit` rows from the unit mix, and opens the live surfaces. | `components/store.jsx`; `components/selectors.jsx` | N3, N6 | `launchProject` sets `project.stage`, deep-freezes `baseline` (`Object.freeze`), and creates `units.length === Σ unitMix.count`. `__selfTest()` asserts `baseline` is unchanged after a later `setActiveScenario`. Reading the reducer shows units created from the plan. |
| **N10** | Gate surfaces by stage: nav derives which tabs are live vs locked from `project.stage` (pre-funding → only Model live; active → all). | `components/shell.jsx`; `components/app.jsx` | N9 | Tab availability is computed from `project.stage`, not always-on. When `stage === "pre_funding"` the non-Model primary tabs render a locked state. Reading shows the gate reads store state. |
| **N11** | Reports variance is **derived** (`actual − baseline`) via selectors, not authored `LP_REPORT` deltas; the same for `PRECON.variance`. | `components/selectors.jsx`; `components/module-views.jsx` (LPReportingView) | N9 | Variance rows call `variance(...)`. `grep` shows the authored `delta` literals in the Reports path replaced by computed values. `__selfTest()` asserts leased-vs-plan delta equals `actual − baseline`. |

### Phase 3 — One Lead-to-Lease Story (SCOPE_AUDIT Pass 3)

| # | Goal | Files touched | Depends on | Done-when |
|---|------|---------------|-----------|-----------|
| **N12** | Pipeline reads/writes the store; **drag = real transition (D2)**: replace `useState(PROSPECTS)` with store leads; `onDrop` dispatches `dragLeadToStage`, and dragging to APPLIED creates a stub Application. | `components/pipeline-view.jsx` | N3 | `PipelineView` has **no** local card state (`grep -c "useState(PROSPECTS)" === 0`). Drop dispatches an action. Reading the reducer confirms a drag to `applied` creates an `Application` child. Column counts come from `stageCounts`, not `STAGES[].count`. |
| **N13** | Inbox reads/writes the store; `thread.subject` **references a Lead** (same object as the Pipeline card); suggested actions ("Book tour", "Send application") dispatch real transitions instead of being cosmetic. | `components/inbox-view.jsx` | N3, N12 | `InboxView` reads threads from the store. The Alex Rivera thread's `subject` is the **same lead id** used in Pipeline (reading confirms one id). "Book tour"/"Send application" dispatch actions (reading shows handlers, not no-ops). |
| **N14** | Applications reads/writes the store; **Approve** advances the Lead → creates a Lease → flips the Unit; deposit creates a Payment. | `components/module-views.jsx` (ApplicationsView) | N3, N12 | ApplicationsView reads applications as **Lead children** from the store. "Approve · send lease" dispatches `approveApplication` (lead → APPROVED, lease `draft`). Reading shows the target `Unit.availabilityStatus` flips. |
| **N15** | Today decisions **reference entities and write through (D6)**: `PRIORITIES` become `Decision` objects referencing a `UnitType`/`Lead`/`Concession`; `acceptDecision` mutates the subject (3BR accept sets asking rent on the UnitType read by Rents). | `components/today-view.jsx`; `components/store.jsx` | N3 | Accepting the pricing decision dispatches `acceptDecision`, which writes `UnitType.asking` in the store. Reading shows the carousel no longer keeps a local-only `rent3b`. The value Rents reads changes as a result. |
| **N16** | Rents reads/writes the store `UnitType` (asking/effective/suggested); publish dispatches `setRent`; the same UnitType is the one a Today decision writes. | `components/other-views.jsx` (RentOptimizer) | N3, N15 | `grep -c "useState(UNIT_MATRIX)" === 0`. RentOptimizer reads rows from the store and "Publish changes" dispatches. Reading confirms it shares the UnitType object with N15. |
| **N17** | Derive **all** counts from one source: nav badges, nav peeks, KPI strips, and per-view KPIs are computed from selectors — eliminating the header/peek/view disagreement (`20_JOURNEYS §4.7`). | `components/shell.jsx`; `components/today-view.jsx`; `components/pipeline-view.jsx`; `components/inbox-view.jsx` | N2, N3 | `grep` shows the hardcoded `NAV_BADGES` object and `STAGES[].count` literals no longer feed the UI. For at least one metric (e.g. SLA breaches), the header badge, the nav peek count, and the view KPI all call the **same** selector (reading the three call-sites confirms one function). |

**Suggested night ordering:** N1 → N2 → N3 → N4 (must be sequential; they build the substrate),
then N5–N8 (Model) and N12–N17 (surfaces) can be scheduled in any order across evenings, with
N9 → N10 → N11 (Launch/Reports) after N6. N15 before N16 (Rents reads what Today writes).

---

## 4. Daytime-reserved tasks (need a rendered browser or product judgment)

These are **out of scope for the night shift** — each needs visual judgment, a running browser, or a
product call that shouldn't be made unattended. One-line reason each.

| # | Task | Why it's daytime |
|---|------|------------------|
| **D-a** | First-run "Create your first project" zero-state canvas (D7). | Net-new screen; needs visual design and copy judgment, not just logic. |
| **D-b** | Choose-stage step + guided-intake visual polish ("editable-looking" fields, left stepper). | Layout/interaction feel; must be seen rendered to judge. |
| **D-c** | Per-tab first-run empty states (Pipeline/Inbox/Applications/Reports/Rents). | Each is a designed empty state with CTA copy — visual + wording judgment. |
| **D-d** | **Pass 4 "calm the UI"**: tone down the live tape, reduce simultaneous accents/badges, codify the two-mode (calm advisory Model / dense live ops) system. | The core visual-judgment task of the whole rebuild; inherently "does it feel calmer?" |
| **D-e** | Demo / Golden-Path **presenter mode** (step the story forward one beat). | Interaction that only makes sense watched running end-to-end in a browser. |
| **D-f** | Role-specific view chrome + scoped Today per role (D5). | What each role *sees* is a product judgment; also visual (per-role empty states). |
| **D-g** | The Launch "aha" transition — the command center visibly turning on, pre-populated. | Animation/timing; the payoff moment must be felt on screen. |
| **D-h** | Deposit / first-rent moment surfacing (the payments beat, `20_JOURNEYS §2.10`). | How much of the money moment to show is a product call; also visual. |
| **D-i** | Full golden-path QA: walk all 12 beats across every tab in a rendered browser. | Requires actually driving the app and observing — the definition of not-code-only. |
| **D-j** | Theme/density refinement toward the "calmer sponsor-grade console." | Pure aesthetic tuning per `PRODUCT_DIRECTION` UX principle. |

Note: several daytime tasks *depend on* night-shift tasks (e.g. D-e presenter mode needs the store
N3 + surface wiring N12–N16; D-f roles needs the store; D-i QA needs Phase 3 complete). Sequence the
daytime work **after** the corresponding spine tasks land.

---

## 5. Open questions for Justin

1. **Store shape — confirm the approach.** The plan builds the spine as a hand-rolled React
   Context + `useReducer` + pure selectors across three new files, adding **no dependencies and no
   build step** (fully within the static React-UMD + Babel stack). Alternative would be a tiny
   `window` pub-sub. Recommend Context + reducer. **OK to proceed on that, and OK to add the three
   new `.jsx` files + their `<script>` tags to `LeaseRight.html`?**
2. **Re-baseline policy at Launch** (`30_DATA §Q4`). If a project is re-underwritten mid-lease-up,
   does a new baseline replace the frozen one, and does historical variance rebase? Affects N9/N11.
   Default assumed: **freeze once, never auto-rebase** — confirm.
3. **Pricing granularity** (`30_DATA §Q5`). Rents and Model operate at unit-*type* level, but Units
   and Leases reference specific units. Is asking rent set per type (cascading down) or per unit
   (rolling up)? Affects the Rents ⇄ Today write path (N15/N16). Default assumed: **per-type,
   cascading** — confirm.
4. **Broker row-scoping for the prototype** (`10_PERSONAS §Q3`). For the demo, is broker access
   "your assigned leads only" (hard scoping) or "the whole pipeline, read-mostly" (soft)? This keeps
   role scoping in Phase 4/daytime (D-f) and out of the night shift; confirm hard-vs-soft so D-f is
   scoped correctly.
5. **How much of the deposit → resident conversion to show** (`20_JOURNEYS §Q5–Q6`). The payments
   beat is the business model but is notional in v6. Show the conversion event only (recommended),
   or a fuller simulated transaction? Affects N14 scope and D-h.
6. **Already settled — noted so no one re-opens them:** Asset Manager is a permission tier, not a
   built role (O1); lender is exports-only, no observer login (O2); drag = real transition and
   Launch = freeze (O3); the prototype is the 7 surfaces with the rest demoted (O4).
