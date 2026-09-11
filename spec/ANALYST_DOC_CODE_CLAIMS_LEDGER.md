# Analyst — doc-vs-code claims ledger

**Project:** LeaseRight
**Package:** Analyst (AUDIT, read-only)
**As of:** 2026-09-10
**Method:** every claim below was checked against the working tree at
`Prospeer/Projects/Active/LeaseRight` (HEAD `b961b36`, clean). Evidence is a
`file:line` citation from `components/*.jsx`, `LeaseRight.html`, or `git log`.
This file is the only artifact written by this mission; it changes no code and
resolves no contradiction — other missions act on it.

## Verification boundary (read this before trusting a verdict)

Two things could **not** be executed in this session, so no claim that depends on
running code is marked confirmed:

- `graphify query` was not authorized in this non-interactive session, so all
  orientation came from direct file reads and `grep`. This does not weaken any
  verdict — every verdict cites a line, not a graph.
- `node` execution was not authorized, so `resolveRefs(SEED)` and
  `Selectors.__selfTest()` could not be **run**. Their source is present and
  readable; their pass/fail is `unverifiable` here.

A structural finding that follows from this: **neither self-check is invoked at
load.** `__selfTest` is defined at `components/selectors.jsx:248` and exported at
`:298`, but the only occurrences of `__selfTest(` in the repo are its own
definition and comment — nothing calls it. Same for `resolveRefs`
(`components/model-data.jsx:366`, exported `:470`, never called). Every document
that says "the self-test passes" is describing a function someone ran by hand
once, not a check the prototype performs.

---

## 1. The headline finding

The `spec/` documents were written between 2026-07-03 and 2026-09-02. The code
they describe was last moved on 2026-09-08. Most claims survive that gap. **Two
do not, and both point the same way: the documents understate what is built.**

`components/store.jsx` was added to git on **2026-09-01 12:24:24 -0400**
(`git log --diff-filter=A -- components/store.jsx` → `e3ad2ff`). The two
documents that assert it does not exist are dated **2026-09-02** — written after
the file landed. This is not staleness from the 09-08 commits; it is a claim that
was already wrong when it was made. The most likely explanation is that the
Implementer and Overseer passes inspected a different tree than this one
(`SOURCE_OF_TRUTH.md` records that the GitHub repo and this folder had drifted,
and commit `f97bbfa`, "Preserve canonical LeaseRight work before status
reconciliation", is a 09-08 reconciliation of exactly that drift). I could not
confirm which tree they read, so the *cause* is unverifiable; the *contradiction*
is not.

---

## 2. Contradicted claims, ranked by how much they mislead the next build step

### C1 — "N3 absent" / "No `store.jsx`" — **CONTRADICTED** (highest impact)

| | |
|---|---|
| **Claim** | "Store (N3) **Missing.** No `store.jsx`. `app.jsx` has no `StoreProvider`. Views still copy `data.jsx` literals." Evidence given: "`components/` has 11 jsx files, none named store" |
| **Source** | `spec/80_IMPLEMENTER_PLAN.md:121`; restated as "N3 absent" at `spec/80_IMPLEMENTER_PLAN.md:579` |
| **Verdict** | **Contradicted** |

Code evidence:

- `components/store.jsx` exists — 84 lines, in git since 2026-09-01 (`e3ad2ff`).
- `components/store.jsx:69-72` defines `StoreProvider` over `useReducer`;
  `:74-78` `useStore`; `:80-82` `useSelector`; `:84` exports all three.
- `components/app.jsx:180` — `ReactDOM.createRoot(...).render(<StoreProvider><App /></StoreProvider>)`.
- `components/app.jsx:63` — `const { state, dispatch } = useStore();`
- `LeaseRight.html:51` — `<script type="text/babel" src="components/store.jsx?v=20260901-model-to-launch">`, loaded after `selectors.jsx` and before the view files, exactly as `70_REBUILD_PLAN.md:130` specifies.
- `components/` holds **12** `.jsx` files, not 11; one of them is named `store`.

Every action `70_REBUILD_PLAN.md:130` requires is present as a documented
`switch` case returning new objects: `contactLead` `:10`, `bookTour` `:13`,
`submitApplication` `:18`, `approveApplication` `:23`, `signLease` `:26`,
`collectDeposit` `:29`, `acceptDecision` `:32`, `setRent` `:35`,
`dragLeadToStage` `:38`, `setActiveScenario` `:41`, `launchProject` `:47`. Three
more exist beyond the spec: `updateModel` `:44`, `setActiveProject` `:58`,
`setProjectStage` `:60`, `updateProject` `:62`.

**Why this ranks first:** `80_IMPLEMENTER_PLAN.md:590` instructs the next builder
not to "resume the N3–N17 queue." A builder who reads §3.1 literally will
schedule N3 and N4 as unstarted foundation work. Both are done. N3's reducer is
also the thing N12–N16 are supposed to consume, so mis-stating it corrupts the
dependency graph for five downstream tasks.

### C2 — "Launch tab is **locked**" / "Most fields are still display literals" — **CONTRADICTED**

| | |
|---|---|
| **Claim** | "Model (pre-funding) … Launch tab is **locked**. Most fields are still display literals." Evidence given: "`modelTabs` launch `status: \"locked\"`" |
| **Source** | `spec/80_IMPLEMENTER_PLAN.md:116` |
| **Verdict** | **Contradicted** (both halves) |

Code evidence:

- `components/module-views.jsx:778` — the launch tab's status is **not** the
  literal `"locked"`; it is `launched ? "live" : scenarioApproved ? "ready" : "locked"`.
- `components/module-views.jsx:894` — lock is computed per tab and clears once
  `scenarioApproved` is true; `:897` disables the button only while `locked`.
- `components/module-views.jsx:773` — `launch()` dispatches
  `{ type: "launchProject", projectId: activeProject.id }`.
- `components/store.jsx:47-57` — that reducer case sets `stage: "active_leaseup"`,
  stamps `launchedAt`, and freezes the active scenario as `baseline` via
  `Object.freeze` (`:51`).
- `components/module-views.jsx:915` — the primary CTA walks intake → approve →
  continue → launch; `:1204` and `:1300` render the launch section; `:1223`
  offers "Open Today →" after launch.
- On "display literals": intake fields are real controlled `<input>`s
  (`components/module-views.jsx:947`) and write through to the store
  (`:753-759` `updateProject`, `:762` `unitCount`, `:764` `updateModel`).

**Why this ranks second:** a builder planning the "Model → Launch → actuals" demo
path will budget for building the launch transition. It exists, including the
frozen baseline that `70_REBUILD_PLAN.md:146` (N9) calls for. See U1 below for
the part of N9 that genuinely is missing, so this does not get over-read.

### C3 — "no view consumes the shared `Selectors.` spine" is right, but "active operating screens still use legacy literals **and local state**" is now partly wrong — **CONTRADICTED IN PART**

| | |
|---|---|
| **Claim** | "The Model directly calls the corrected `brokerEconomics` helper, but no view consumes the shared `Selectors.` spine; active operating screens still use legacy literals and local state." |
| **Source** | `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md:215` |
| **Verdict** | **Confirmed** on the `Selectors.` half; **contradicted** on "no view consumes the store" |

Code evidence for the confirmed half — `grep -rn "sharedQuantities\|deriveLeadStage\|stageCounts\|variance(\|Selectors" components/*.jsx LeaseRight.html`, excluding `selectors.jsx` itself, returns **zero results**. No view calls `deriveLeadStage`, `stageCounts`, `sharedQuantities`, or `variance`. `brokerEconomics` is the sole exception.

Code evidence for the contradicted half — two views do read the store:

- `components/module-views.jsx:13` — `ResidentsView` builds `residentRows` from `useSelector(state => state.residents.map(...))`.
- `components/module-views.jsx:743-745` — `PreconView` takes `dispatch` from `useStore()` and reads `activeProject` / `activeModel` through `useSelector`.
- `components/module-views.jsx:1039-1040` — scenario **selection** is store-backed (`activeModel.activeScenarioId`) and dispatches `setActiveScenario`.

The precise, defensible statement is: *the store is mounted and two views consume
it; no view consumes the derived-quantity selectors; the seven primary operating
surfaces are untouched.* Overseer's sentence collapses those into one and reads
as "nothing is wired."

### C4 — "`grep` shows lead `source` values are ILS / Direct / Referral / Drive-by" — **CONTRADICTED (cosmetic)**

| | |
|---|---|
| **Claim** | Originator rail missing; evidence cites lead `source` values as "ILS / Direct / Referral / Drive-by" |
| **Source** | `spec/80_IMPLEMENTER_PLAN.md:123` |
| **Verdict** | **Contradicted** on the literal; **confirmed** on the conclusion |

Actual `source` values in `components/model-data.jsx`: `Direct` ×9, `Zillow` ×5,
`Referral` ×3, `Drive-by` ×1. There is no literal `"ILS"` — Zillow and Zumper are
ILS platforms and the doc paraphrased. The underlying point stands: no source
value denotes an outside originator. Listed for completeness only; it misleads
no one.

---

## 3. Confirmed claims

### Spine and wiring

| # | Claim | Source | Code evidence |
|---|---|---|---|
| F1 | N1 done: one `SEED` graph, 24 leads each once, first-class `unit-####` rows, `resolveRefs` present, script tag after `data.jsx` | `80_IMPLEMENTER_PLAN.md:118`; `70_REBUILD_PLAN.md:128` | `model-data.jsx:355` `const SEED`; `grep -c 'id: "lead-'` → **24**; `unit-0204`…`unit-0820` at `model-data.jsx:91-105`; `resolveRefs` `:366`; `LeaseRight.html:49` loads `model-data.jsx` immediately after `data.jsx:48`. See U2 for the unit-count nuance. |
| F2 | N2 done: pure `deriveLeadStage`, `stageCounts`, `sharedQuantities`, `variance`, `__selfTest`; imports no React | `80_IMPLEMENTER_PLAN.md:119` | `selectors.jsx:96` `deriveLeadStage`; `:297` exports all five; header `:1-32` and the file contain no React import; `LeaseRight.html:50`. |
| F3 | **The Model view calls `brokerEconomics`** | `80_IMPLEMENTER_PLAN.md:120,128`; `PROJECT.md:41`; `BUILDER_IMPLEMENTATION_AND_VERIFICATION.md:138`; `OVERSEER…:215` | `module-views.jsx:742` — `const E = brokerEconomics(B);` inside `PreconView` (`:739`), fed by `BROKER_ECONOMICS` (`:741`, defined `data.jsx:473-484`). Function defined `selectors.jsx:59`. |
| F4 | `brokerEconomics` output drives the rendered strategy cards | `70_REBUILD_PLAN.md:139` ("PreconView's `strategyOptions` read from it"); `80_IMPLEMENTER_PLAN.md:120` | `module-views.jsx:787-790` builds `strategyOptions` from `E.inHouseCost` / `E.hybridCost` / `E.exclusiveCost`; rendered at `:990` and `:1063`; summary lines at `:1081-1083`, `:1262-1264`, `:1275-1278`. |
| F5 | Velocity removed from the staffing ranking | `80_IMPLEMENTER_PLAN.md:120`; `BUILDER…:141` | `module-views.jsx:788-790` — all three options carry `velocity: "test actual"`. `selectors.jsx:57-58` documents the deliberate omission. |
| F6 | `feePeriod` month/year, hybrid = payroll + share × exclusive, carry-day equivalent | `80_IMPLEMENTER_PLAN.md:120` | `selectors.jsx:64` `feePeriod`; `:67-68` `periodMonths`; `:70-72` hybrid; `:75` `carryPerDay = carryPerMonth / (365/12)`; `:85-86` carry-day equivalents. |
| F7 | No `first-year` string survives in `components/` | `80_IMPLEMENTER_PLAN.md:120`; `80_IMPLEMENTER_PLAN.md:576` | `grep -rn "first-year\|first year" components/` → **no matches**. The remaining fee-basis label is `"50% of first month's rent"` (`model-data.jsx:127`). |

### Legacy literals in the operating surfaces — all three resolved

| # | Claim | Source | Code evidence |
|---|---|---|---|
| F8 | **Pipeline still reads legacy literals** — `useState(PROSPECTS)` | `80_IMPLEMENTER_PLAN.md:117,127`; `PROJECT.md:41`; `BUILDER…:93` | **`components/pipeline-view.jsx:119`** — `const [cards, setCards] = useState(PROSPECTS);`. `PROSPECTS` arrives as a global (`:1`). No `useStore`/`useSelector`/`dispatch` anywhere in the file. N12 (`70_REBUILD_PLAN.md:154`) requires `grep -c "useState(PROSPECTS)" === 0`; it is 1. |
| F9 | **Inbox still reads legacy literals** — `useState(INBOX_THREADS)` | same | **`components/inbox-view.jsx:142`** — `const [threads, setThreads] = useState(INBOX_THREADS);`, and `:143` `useState(INBOX_THREADS[0].id)`. Global at `:1`. No store hook in the file. |
| F10 | **Rents still reads legacy literals** — `useState(UNIT_MATRIX)` | same | **`components/other-views.jsx:8`** — `const [rows, setRows] = useState(UNIT_MATRIX);` inside `RentOptimizer` (`:7`). `UNIT_MATRIX` also read directly at `:10`, `:11`, `:13`. No store hook in the file. N16 (`70_REBUILD_PLAN.md:158`) requires `grep -c "useState(UNIT_MATRIX)" === 0`; it is 1. |
| F11 | Today keeps its own `rent3b` | `BUILDER…:94`; `70_REBUILD_PLAN.md:157` (N15 done-when) | **`components/today-view.jsx:246`** — `const [rent3b, setRent3b] = useState(3400);`, consumed at `:434`, `:439-440`, `:458`. Nothing dispatches `acceptDecision` or `setRent`; the reducer cases (`store.jsx:32`, `:35`) are unreached. |
| F12 | Applications reads `APPLICATIONS`; nav badges hardcoded | `BUILDER…:93`; `80_IMPLEMENTER_PLAN.md:117` | `shell.jsx:49` — `const NAV_BADGES = { model: 2, inbox: 4, pipeline: 2, today: 3, applications: 5, maintenance: 1 };`, consumed `:430`. N17 (`70_REBUILD_PLAN.md:159`) requires this object no longer feed the UI; it does. |
| F13 | Secondary PM modules still mount | `80_IMPLEMENTER_PLAN.md:115` | `app.jsx:134-146` routes `residents`, `collection`, `maintenance`, `ledger`, `vendors`, `documents`, plus `listings`, `market`, `concessions`, `lp`, `settings`. |

### Seed, roles, and the missing originator rail

| # | Claim | Source | Code evidence |
|---|---|---|---|
| F14 | UI identity is one hardcoded owner: "Jordan Mori · owner · $1/unit · forever" | `80_IMPLEMENTER_PLAN.md:122` | `shell.jsx:350` "Jordan Mori"; `:351` "owner · $1/unit · forever"; repeated `:449`. |
| F15 | Seed users are owner + in-house agent only; every tour is Priya | `80_IMPLEMENTER_PLAN.md:122` | `model-data.jsx:53-54` — `user-mori` (owner), `user-priya` (leasing_agent). All four `agentId` values are `"user-priya"`. |
| F16 | Orgs are sponsor + cleaning vendor; no locator org, no originator user, no Registration or Commission entity | `80_IMPLEMENTER_PLAN.md:123`; `80_IMPLEMENTER_PLAN.md:578` | `model-data.jsx:47-48` — `org-mori` (sponsor), `org-paragon` (vendor). No `Registration`/`Commission` array in `SEED` (`:355`); no originator view in `app.jsx:130-147`. |
| F17 | Static React-UMD + Babel; no backend, no auth, no production payment rail | `80_IMPLEMENTER_PLAN.md:114`; `BUILDER…:87`; `OVERSEER…:215` | `LeaseRight.html:45-47` load React/ReactDOM/Babel from unpkg; `:48-59` are the only app scripts. No fetch/auth/network call in `components/`. |
| F18 | No durable store (state does not survive reload) | `OVERSEER…:215` | `store.jsx:70` initialises from `cloneSeed()` on every mount; `store.jsx:5`. Only `app.jsx:80-81` persist anything, and only UI prefs (`leaseright_tab_v1`, `leaseright_tweaks_v2`). *Note:* this is true of **persistence**, not of the store's existence — see C1. |

### The Meridian arithmetic — every §3.2 figure recomputed and confirmed

All inputs from `components/data.jsx:473-484` (`units 260`, `avgRent 2180`,
`feePct 0.50`, `feePeriod "month"`, `inHouseMonthly 18500`, `hybridMonthly 9500`,
`months 9`, `locatorShareOfLeases 0.40`, `carryPerMonth 227000`).

| # | Claim | Source | Recomputation |
|---|---|---|---|
| F19 | Exclusive $283,400 = `260 × 2180 × 0.5`; year basis $3,400,800 | `BUILDER…:102`; `80_IMPLEMENTER_PLAN.md:120` | `260 × 2180 × 1 × 0.5 = 283,400` ✓ ; `× 12 = 3,400,800` ✓. Asserted at `selectors.jsx:286-287`. |
| F20 | Hybrid $198,860 = $85,500 payroll + $113,360 commissions | `BUILDER…:139-140` | `9500 × 9 = 85,500`; `283,400 × 0.4 = 113,360`; sum `198,860` ✓ (`selectors.jsx:70-72`). |
| F21 | Hybrid savings $84,540 = 11.3 carry days | `BUILDER…:142`; `OVERSEER…:465` | `283,400 − 198,860 = 84,540`; `carryPerDay = 227,000 ÷ 30.4167 = 7,463.0`; `84,540 ÷ 7,463.0 = 11.33 → 11.3` ✓ (`selectors.jsx:75,86`; rendered `module-views.jsx:1083,1278`). |
| F22 | In-house $166,500; savings-vs-broker $116,900 | `70_REBUILD_PLAN.md:139` | `18,500 × 9 = 166,500` ✓ ; `283,400 − 166,500 = 116,900` ✓ (`selectors.jsx:69,73`). *But see U3 — `__selfTest` does not assert either figure.* |
| F23 | Three lease-up durations coexist: 9 months staffing / 7.53 months carry / ~79-week curve | `80_IMPLEMENTER_PLAN.md:135-140` | `data.jsx:480` `months: 9`; `1,710,000 ÷ 227,000 = 7.533 mo` (`model-data.jsx:110`, `data.jsx:482`); `data.jsx:70` `PLAN_CURVE` length **79**; intake copy `data.jsx:450` "78wk from CO", `:451` "242 units / 73 weeks". ✓ |
| F24 | Scenario carry is authored, not computed: Downside +$670K over 70 days (~$148K unexplained); Aggressive −$610K over 119 days (~$278K unexplained) | `80_IMPLEMENTER_PLAN.md:141-145` | `model-data.jsx:110-112`. Base Jul 28 2026 → Downside Oct 6 2026 = **70 days**; `670,000 ÷ 70 = 9,571/day` vs `7,463` → `670,000 − 522,410 = 147,590 ≈ $148K` ✓. Aggressive Mar 31 2026 → Base = **119 days**; `610,000 ÷ 119 = 5,126/day` → `888,097 − 610,000 = 278,097 ≈ $278K` ✓. |
| F25 | Three actual velocities coexist: 8.07 / 7.2 / 9.2 per week; 3BR tail = 55 weeks | `80_IMPLEMENTER_PLAN.md:146-152`; `80_IMPLEMENTER_PLAN.md:581` | `data.jsx:71` `ACTUAL_CURVE` week 15 = **121** → `121 ÷ 15 = 8.07` ✓. `velocityActual` `2.3 + 2.9 + 1.6 + 0.4 = 7.2` (`model-data.jsx:81-84`) ✓. `data.jsx:452` "9.2 leases/wk", also `:74,76,84` ✓. `ut-3br`: `28 − 6 = 22` remaining at `0.4/wk` = **55 weeks** (`model-data.jsx:84`) ✓. |
| F26 | Hybrid mis-priced on the plan object: `staffingPlan.model = "hybrid"` but `cost: 166500`; all three scenarios carry `staffingCost: 166500` | `80_IMPLEMENTER_PLAN.md:153-156` | `model-data.jsx:128` — `staffingPlan: { model: "hybrid", fteCount: 2, cost: 166500, ... }`; `:110`, `:111`, `:112` each `staffingCost: 166500`. The card shows `198,860` (`module-views.jsx:1264`); the stored plan does not. ✓ |

---

## 4. Unverifiable claims

Marked unverifiable rather than guessed, per the contract.

| # | Claim | Source | Why unverifiable |
|---|---|---|---|
| U1 | "`launchProject` … instantiates `Unit` rows from the unit mix"; "`__selfTest()` asserts `baseline` is unchanged after a later `setActiveScenario`"; "creates `units.length === Σ unitMix.count`" (N9 done-when) | `70_REBUILD_PLAN.md:146` | This is a *done-when*, not a status claim, so it has no verdict — but for the record: `store.jsx:47-57` freezes the baseline and sets the stage yet creates **no** units, and `store.jsx:46` says so ("unit generation land in N9"). No `__selfTest` case covers baseline immutability (`selectors.jsx:248-294`). N9 is therefore **partially** built, which no document states either way. |
| U2 | N1 "first-class `Unit`s under a single ID convention" | `70_REBUILD_PLAN.md:128`; `80_IMPLEMENTER_PLAN.md:118` | Confirmed as a **type** (`model-data.jsx:91-105`), but only **13** `unit-####` rows exist against 260 total units (`data.jsx:474`) / `Σ totalUnits = 60+100+72+28 = 260` (`model-data.jsx:81-84`). Whether 13 illustrative rows satisfy "first-class Units" is a spec-reading judgment, not a fact the repo settles. |
| U3 | "`resolveRefs(SEED)` returns zero dangling references"; "The selector self-test passes"; "derived stage counts partition all 24 leads" | `BUILDER…:133-134`; `OVERSEER…:463` | The assertions exist in source (`selectors.jsx:253-258` sums stage counts; `:262-275` occupancy; `:286-291` fee identities; `model-data.jsx:366` `resolveRefs`) but **neither function is invoked anywhere in the repo**, and `node` execution was not authorized in this session. The claims are plausible and were presumably true when run by hand; they are not currently checkable, and nothing re-checks them when the seed changes. |
| U4 | "Loaded the browser prototype, opened Model → Scenarios, verified the corrected breakdown and carry warning render, and found no application errors" | `BUILDER…:143-144` | A past manual browser action. Not reproducible from the repository; no artifact records it. The rendering code it describes does exist (`module-views.jsx:1063-1083`). |
| U5 | "`git diff --check` passed" | `OVERSEER…:464` | A past command run against a tree state that no longer exists (HEAD has moved to `b961b36`). |
| U6 | Which tree the 2026-09-02 Implementer/Overseer passes actually inspected | inferred from C1 | `store.jsx` was in git from 2026-09-01 12:24 (`e3ad2ff`); the documents are dated 2026-09-02. `SOURCE_OF_TRUTH.md` and commit `f97bbfa` ("Preserve canonical LeaseRight work before status reconciliation", 2026-09-08) establish that a divergence existed, but nothing in the repo records which checkout each agent read. Cause unknown; the contradiction in C1 stands regardless. |
| U7 | All business claims — take rate, retention, PPV, `$1/unit`, pilot pricing, sponsor willingness to pay, AppFolio scale | `OVERSEER…`, `BUILDER_PAYMENT_ECONOMICS_REASSESSMENT.md`, `STRATEGIST_PAYMENT_ENGINE_REASSESSMENT.md`, `CONTRARIAN_PAYMENTS_ENGINE.md` | Out of scope for a doc-vs-code ledger: they assert facts about the market and a future contract, not about `components/*.jsx`. They cannot be confirmed or contradicted from the repository and are not attempted here. |

---

## 5. Status of the N-queue as the code actually stands

Not a claim in any document — assembled here because C1 and C2 make the
documents' own status table unusable for planning. Cited so the next mission does
not have to re-derive it.

| Task | Document says | Code says | Evidence |
|---|---|---|---|
| N1 seed graph | Done | **Done** | `model-data.jsx:355`, `LeaseRight.html:49` |
| N2 selectors | Done | **Done** (but never invoked — U3) | `selectors.jsx:297`, `LeaseRight.html:50` |
| N3 store | **Absent** | **Done** | `store.jsx:69-84`, `LeaseRight.html:51` |
| N4 mount store | not stated | **Done** | `app.jsx:180`, `:63`, `:74-75` |
| N5 one absorption curve | not stated | **Not done** | `Math.exp` appears **twice** — `data.jsx:70` and `module-views.jsx:865`; no `absorptionCurve` function exists (only a comment at `selectors.jsx:182`). N5 done-when requires exactly one occurrence, in `selectors.jsx`. |
| N6 scenarios from store | not stated | **Partial** | Selection is store-backed and dispatches (`module-views.jsx:1039-1040`), but the list still iterates the `MODEL_SCENARIOS` literal (`data.jsx:521`), which N6 forbids. |
| N7 → I0 `brokerEconomics` | Done | **Done** | `selectors.jsx:59`, `module-views.jsx:742,787-790` |
| N8 intake store-controlled | not stated | **Partial — write-only** | Edits dispatch (`module-views.jsx:764`), but values are read from local `intakeValues` with a `data.jsx` literal fallback (`:947`, `:763`), never from `activeModel.intake`. N8's done-when ("PreconView reads intake field **values** from the store") is unmet. |
| N9 launch + freeze baseline | "Launch tab locked" | **Partial** | Stage machine + `Object.freeze` baseline done (`store.jsx:47-57`); unit instantiation absent (`store.jsx:46`). |
| N10 gate surfaces by stage | not stated | **Not done** | No `stage` / `pre_funding` / lock logic in `shell.jsx`; `app.jsx:130-147` routes every tab unconditionally. |
| N11 derived variance | not stated | **Not done** | `variance` is uncalled outside `selectors.jsx`. |
| N12 Pipeline → store | Not done | **Not done** | `pipeline-view.jsx:119` |
| N13 Inbox → store | Not done | **Not done** | `inbox-view.jsx:142` |
| N14 Applications → store | Not done | **Not done** | no store hook in the `ApplicationsView` path |
| N15 Today decisions write through | Not done | **Not done** | `today-view.jsx:246` |
| N16 Rents → store | Not done | **Not done** | `other-views.jsx:8` |
| N17 one source for all counts | Not done | **Not done** | `shell.jsx:49,430` |

The one-line summary a planner needs: **the spine (N1–N4) and the Model half of
Phase 1–2 (N7, most of N8, most of N9) are built; N5, N10–N17 are not; the seven
operating surfaces are untouched.** `PROJECT.md:40-41` states this more
accurately than `80_IMPLEMENTER_PLAN.md:121` does, except that it too omits N3
and N4.

---

## 6. What is *not* contradicted, and matters

Every claim the documents make about the operating surfaces reading legacy
literals is **correct, line for line**. Pipeline (`pipeline-view.jsx:119`), Inbox
(`inbox-view.jsx:142`), Rents (`other-views.jsx:8`), Today's `rent3b`
(`today-view.jsx:246`), and the nav badges (`shell.jsx:49`) are all exactly as
described. Every arithmetic finding in `80_IMPLEMENTER_PLAN.md` §3.2 —
the three durations, the two unexplained carry deltas, the three velocities, the
55-week 3BR tail, the hybrid plan-object mismatch — recomputes correctly from the
current seed. The corrected `brokerEconomics` wiring is real and complete.

So the documents' *strategic* conclusion is not disturbed by anything in this
ledger. The prototype still proves workflow language and one corrected
calculator, not a connected operating system. The corrections in §2 change the
**build plan**, not the **business read**.
