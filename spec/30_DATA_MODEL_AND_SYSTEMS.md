# 30 — Data Model & Systems

> Conceptual domain model for the LeaseRight prototype. This is NOT a production database
> schema and picks no tech stack. Its job is to make the currently-disconnected views cohere
> around one shared set of entities, states, and the plan-vs-actual **spine**. Read
> `00_PRODUCT_BIBLE.md`, `../PRODUCT_DIRECTION.md`, and `../SCOPE_AUDIT.md` first.
>
> Created 2026-07-01. Phase: Foundation (conceptual only — no code changes).

---

## 0. Design stance (opinionated)

Six principles govern every decision below:

1. **The Project is the spine's anchor.** Everything hangs off one `Project`. There is no
   global data — every entity is scoped to a project. This is what fixes the "app assumes The
   Meridian exists" gap: a project can exist in a *pre-funding* state with zero live leads.
2. **The Model and the live board are the same object at two life stages.** They are not two
   apps bolted together. A `Project` carries a `Model` (assumptions) and, after **Launch**, a
   live operating dataset (`Unit`, `Lead`, `Application`, `Lease`, `Payment`). "Launch" is an
   explicit state transition, not a data migration.
3. **Plan and actual are the same shape, side by side.** Every quantity the Model forecasts
   (absorption by week, rent by unit type, concession spend, staffing cost) has an *actual*
   counterpart computed from live entities. Plan-vs-actual is not a report feature; it is a
   property of the schema. (See §4, The Spine.)
4. **A Lead is one continuous object from inquiry to keys.** The single biggest v6 defect is
   that Pipeline, Applications, Inbox, and Residents each hold *separate* copies of the same
   person. In this model there is **one** `Lead` that gains an `Application`, then a `Lease`,
   then becomes a `Resident` — never a re-keyed duplicate.
5. **Model only what serves the developer/owner lease-up job.** Per SCOPE_AUDIT: Maintenance,
   Vendors, full Ledger, Collections, full Residents, and standalone Documents are modeled
   *lightly* (thin entities, no lifecycle) so the demoted views still render, but they carry no
   product weight.
6. **Roles are a lens, not a data partition.** Owner, asset manager, leasing agent, broker,
   PM, and lender/observer all read the same entities; role controls *permission and default
   view*, not *which records exist*. (Permission detail is deferred to `10_PERSONAS_AND_ROLES.md`.)

---

## 1. Core entities

Attributes are conceptual (the important ones), not exhaustive column lists. `→` marks a
reference to another entity.

### Project  *(the anchor)*
The building/development being leased up. One per "deal."
- `id`, `name` ("The Meridian"), `sponsor` (→Org), `city`, `submarket`
- `stage`: `pre_funding → funded_prelaunch → active_leaseup → stabilized` *(lifecycle, §3)*
- `unitCount`, `deliveryDate` (CO), `targetStabilizationDate`, `targetOccupancyPct` (e.g. 93%)
- `model` (→Model, 1—1), `launchedAt` (null until Launch)
- Mock fit: `PROPERTIES[]` rows. Today each carries `leased/pace/ahead` — those are *derived
  actuals*, not stored attributes (see §4).

### Model  *(pre-funding assumptions container)*
The lender-ready underwriting of the lease-up. Exactly one per Project; editable pre-Launch,
frozen-as-baseline at Launch.
- `id`, `project` (→Project)
- `unitMixPlan[]` (→UnitTypePlan): per unit type — count, target rent, planned concession,
  planned velocity (leases/wk), confidence
- `absorptionCurvePlan[]`: planned cumulative leased units by week 0..N (the S-curve)
- `activeScenario` (→Scenario), `scenarios[]` (→Scenario)
- `budget`: concessionReserve, marketingBudget, carryCostPerMonth
- `staffingPlan`: model (in-house / broker / hybrid), FTE count, cost
- `marketRentInputs[]` (→MarketRentInput)
- `lenderPackage` (→Report of kind `lender_package`)
- Mock fit: `MODEL_FIELDS`, `MODEL_UNIT_MIX`, `MODEL_SCENARIOS`, `PRECON`, `PRECON_INTAKE`,
  `BROKER_ECONOMICS`, `PLAN_CURVE`.

### UnitTypePlan  *(planned; part of Model)*
One row per unit type in the Model. The **planned** side of a unit type.
- `type` (Studio/1BR/2BR/3BR), `count`, `targetRent`, `plannedConcession`, `plannedVelocity`,
  `confidenceScore`
- Mock fit: `MODEL_UNIT_MIX[]`.

### UnitType  *(live; post-Launch aggregate)*
The **actual** side of a unit type — the pricing/velocity aggregate the Rents view shows.
Created at Launch from each `UnitTypePlan`.
- `project` (→Project), `type`, `totalUnits`, `askingRent`, `effectiveRent`, `compRent`,
  `suggestedRent` (nullable), `domAvg`, `velocityActual`
- Derived: `leasedCount`, `appsCount` (rolled up from Units/Leads)
- Mock fit: `UNIT_MATRIX[]` — already exactly this shape.

### Unit  *(the individual apartment)*
A single leasable unit. Created at Launch (from unit mix) or via property import.
- `id` (e.g. "2BR-1204"), `project` (→Project), `unitType` (→UnitType), `beds`, `sqft`, `floor`
- `askingRent`, `effectiveRent`
- `availabilityStatus`: `not_ready → available → held → leased → occupied` *(lifecycle, §3)*
- `currentLease` (→Lease, nullable), `currentResident` (→Resident, nullable)
- Mock note: v6 has **no first-class Unit list** — unit identity is a *string* on Prospect
  (`"2BR-1204"`), Resident (`"U-312"`), and Application (`"2BR-0914"`), and these two ID
  conventions don't even match. This is a required reconciliation (§6).

### Lead  *(the person, one continuous object)*
A prospective renter, from first inquiry through move-in. **The most important live entity.**
- `id`, `project` (→Project), `name`, `contact`
- `pipelineStage`: `NEW → CONTACTED → TOURED → APPLIED → APPROVED → SIGNED` + `LOST/DEAD`
  *(lifecycle, §3)*
- `source` (Zillow/Apt.com/Referral/Direct/…), `score`, `budget`, `desiredMoveIn`
- `interestedUnit` (→Unit, nullable) / `interestedUnitType` — the unit match
- `assignedTo` (→User: leasing agent or broker), `slaBreached` (derived), `lostReason` (nullable)
- `tours[]` (→Tour), `application` (→Application, 0—1), `thread` (→Thread)
- Mock fit: `PROSPECTS[]`. Note the **stage↔count mismatch**: `STAGES[]` has counts (New 12,
  Contacted 23…) that don't equal the number of `PROSPECTS` rows in each stage. Counts must be
  *derived* from Leads, not stored (§6).

### Tour  *(a scheduled/completed showing)*
- `id`, `lead` (→Lead), `unit` (→Unit), `scheduledAt`, `status`: `requested → booked →
  completed → no_show`, `agent` (→User)
- Mock fit: **absent** in v6 (tours are only implied by `stage: "toured"` and Inbox chatter).
  SCOPE_AUDIT lists tour scheduling as Missing. New entity.

### Application  *(the screening record)*
Created when a Lead applies. **One per Lead** (1—1 through its active cycle).
- `id`, `lead` (→Lead), `unit` (→Unit), `receivedAt`
- `status`: `started → submitted → screening → approved | conditional | denied → lease_sent →
  signed` *(lifecycle, §3)*
- `credit`, `bgCheck`, `incomeStatus`, `rentToIncomeRatio`, `depositStatus`, `recommendation`
- `lease` (→Lease, 0—1), `applicationFee` (→Payment), `documents[]` (→Document)
- Mock fit: `APPLICATIONS[]`. In v6 these are a *separate list* keyed only by name; they must
  become children of Leads (Kira Weston appears in both `PROSPECTS` and `APPLICATIONS`) (§6).

### Lease  *(the executed agreement)*
- `id`, `application` (→Application), `unit` (→Unit), `resident` (→Resident, on signing)
- `status`: `draft → sent → signed → active → ended` *(lifecycle, §3)*
- `startDate`, `endDate`, `rent`, `concessionApplied` (→Concession), `renewalStatus`
- `payments[]` (→Payment), `document` (→Document, the signed PDF)
- Mock fit: implied by Resident rows + `RECENT_DOCS` lease PDFs; no first-class Lease exists. New.

### Resident  *(post-move-in identity for a Lead)*
The **same person** as the Lead, re-presented after signing. Not a new key.
- `id`, `lead` (→Lead, 1—1), `unit` (→Unit), `activeLease` (→Lease)
- `moveInStatus`, `tenure`, `onTimeRecord` (derived from Payments), `renewalStatus`
- Mock fit: `RESIDENTS[]`. Demoted per SCOPE_AUDIT — keep as thin "converted applicant + move-in
  readiness" record; no renewal/delinquency lifecycle in the wedge.

### Payment  *(deposit / fee / rent — the monetization spine)*
Every money movement. Deliberately one entity with a `kind`, because the business model rides on it.
- `id`, `project` (→Project), `lease` (→Lease, nullable), `application` (→Application, nullable)
- `kind`: `application_fee | security_deposit | first_month | rent | other`
- `amount`, `method` (ACH/card/check), `status`: `scheduled → processing → succeeded | failed →
  retrying → resolved` *(lifecycle, §3)*, `attempt`, `nextRetry`
- Mock fit: `FAILED_PAYMENTS`, `COLLECTION_KPIS`, `AR_AGING`, `PAY_METHODS`, `LEDGER_TAPE`
  deposits/fees. Ledger/Collection demoted — model deposits + first rent + failures only.

### Scenario  *(a modeled case)*
- `id`, `model` (→Model), `name` (Base/Downside/Aggressive/… incl. broker-led / in-house / hybrid)
- `leasesPerWeek`, `stabilizeDate`, `concessionCost`, `carryCost`, `staffingCost`, `active` (bool), `note`
- Mock fit: `MODEL_SCENARIOS[]` (+ the broker/in-house cases implied by `BROKER_ECONOMICS`).

### MarketRentInput  *(a rent-evidence source, weighted)*
- `id`, `model` (→Model), `source` (pro forma / comp scrape / broker opinion / LeaseRight
  aggregate / signed lease), `confidence`, per-unit-type rents, `usedInModel` (toggle), `updatedAt`
- Mock fit: `MARKET_RENT_INPUTS[]`. Add `usedInModel` per SCOPE_AUDIT ("Used in model" toggle).

### Comp / CompSet  *(competitor properties)*
- Comp: `id`, `name`, `units`, `occupancy`, `distance`, `concession`, per-unit-type rents, `trend`,
  `self` (bool: is this our project)
- CompSet: the collection attached to a Project's Model (support for Rents + Model + lender package)
- Mock fit: `COMPS[]`. Demoted to support-only (feeds MarketRentInput of source `comp scrape`).

### Concession  *(a pricing program)*
- `id`, `project` (→Project), `name`, `expiresAt`, `appliesToUnitTypes[]`, `costPerLease`,
  `conversionRate`, `unitsApplied`, `status`: `active | archived`, `lenderApproved` (bool)
- Mock fit: `CONCESSIONS[]`. Add `appliesToUnitTypes` + `lenderApproved` per SCOPE_AUDIT.

### Listing  *(a syndication channel presence)*
- `id`, `project` (→Project), `channel` (Zillow/Apt.com/…), `syncStatus`/`health`, `views7`,
  `leads7`, `cpLead`, `unitsLive`, `issues`
- Mock fit: `LISTINGS[]`. Demoted support module; note **it is the origin of `Lead.source`** —
  the missing tie SCOPE_AUDIT flags ("clearer connection to lead pipeline").

### Decision  *(a Today action item — the "decisions console")*
A surfaced, actionable choice with options. This is the console the Today view is built around.
- `id`, `project` (→Project), `kind` (`pricing | lead | concession | application | signature`),
  `rank`, `tone`, `headline`, `recommendation`, `score {impact,risk,recency}`, `impactLabel`
- `subject` (→ polymorphic ref: a UnitType, Lead, Concession, Application, or Lease)
- `options[]` (Accept / Alternative / Hold), `owner` (→User)
- `outcome`: `open → accepted | deferred | dismissed`, `decidedAt`, `decidedBy` *(lifecycle, §3)*
- Mock fit: `PRIORITIES[]` (and legacy `QUEUE`). Key change: a Decision must **reference** a
  live entity, not restate it — accepting "Drop 3BR to $3,200" writes `suggestedRent`/`askingRent`
  on the 3BR `UnitType`. This is the mechanism that makes Today *do* something (§4, §5).

### Task  *(a lightweight follow-up, distinct from Decision)*
Decisions are strategic choices; Tasks are operational to-dos (call lead, chase pay stub, confirm
tour). SLA timers live here.
- `id`, `project`, `type`, `relatedTo` (→Lead/Application/Tour), `dueAt`, `slaBreached`,
  `assignedTo` (→User), `status`: `open → done | snoozed`
- Mock fit: implied by `WATCHING`, SLA flags on Prospects, `suggested` replies in Inbox threads.

### User / Role  *(actor + permission lens)*
- User: `id`, `name`, `org` (→Org), `role`
- Role enum: `owner | asset_manager | leasing_agent | broker | property_manager | lender_observer`
- Mock fit: **absent** — v6 has only owner names as strings (`"J. Mori"`, `"Priya S."`). New.
  Permission matrix is owned by `10_PERSONAS_AND_ROLES.md`; this spec only asserts the enum and
  that role never partitions data.

### Org  *(sponsor / brokerage / PM firm / lender)*
- `id`, `name`, `type` (sponsor / brokerage / pm_firm / lender), `users[]`
- Mock fit: implied by "Mori Development". New, thin.

### Thread / Message  *(unified communication)*
- Thread: `id`, `project`, `kind` (`prospect | resident | vendor | broker`), `subject` (→Lead /
  Resident / Vendor / Org), `channel`, `unread`, `slaFlagged`, `suggestedReplies[]`
- Message: `at`, `from` (them/you/auto), `body`
- Mock fit: `INBOX_THREADS[]`. Key change: `subject` becomes a *reference* to the Lead/Resident,
  so a prospect thread and that prospect's pipeline card are the same person (Alex Rivera appears
  in both `PROSPECTS` and `INBOX_THREADS` today as duplicates).

### Report  *(a generated output package)*
- `id`, `project`, `kind` (`lender_package | weekly_owner | broker_scorecard | lp_letter`),
  `sections[]` (each `status: ready|review|draft`), `period`, `exportState`
- Body is **derived** from live entities + Model (variance = actual vs Model baseline).
- Mock fit: `LENDER_PACKAGE[]`, `LP_REPORT`. Reports read the spine; they store almost nothing.

### Document  *(thin file record)*
- `id`, `project`, `name`, `folder`, `linkedTo` (→Lease/Application/Payment/Unit/Report), `tag`, `at`
- Mock fit: `DOC_FOLDERS`, `RECENT_DOCS`. Demoted: documents exist only as *attachments* to real
  entities, never as a standalone module.

### Lightly-modeled (demoted per SCOPE_AUDIT — thin, no lifecycle)
- **WorkOrder** (`WORK_ORDERS`) → reframe narrowly as *unit readiness / turn blocker* on `Unit`.
- **Vendor** (`VENDORS`) → reframe as *leasing-launch vendor* (photography, signage, cleaning).
- **Account / LedgerEntry** (`ACCOUNTS`, `LEDGER_TAPE`) → keep only as the destination Payments
  post to; no full GL.

---

## 2. Relationship map

```
Org (sponsor) 1───* User
      │
      │ owns
      ▼
Project 1───1 Model 1───* Scenario
   │            │    1───* UnitTypePlan ........(plan side)
   │            │    1───* MarketRentInput
   │            │    1───1 CompSet 1───* Comp
   │            └───1 Report(lender_package)
   │
   ├──1───* Unit *───1 UnitType ...............(actual side; UnitType created from UnitTypePlan @Launch)
   │            │
   │            └──0..1 currentLease (→Lease), 0..1 currentResident (→Resident)
   │
   ├──1───* Lead ──*───1 Unit  (interestedUnit; a Unit has many interested Leads = *—* via interest)
   │          │  ──0..1 assignedTo (→User)
   │          │  1───* Tour ──1 Unit
   │          │  1───1 Application ──1 Unit
   │          │            │   1───1 Lease ──1 Unit
   │          │            │            │  1───* Payment
   │          │            │            └──1 Resident (created on sign/move-in)
   │          │            └──* Payment (application_fee)
   │          └──1───1 Thread 1───* Message   (Lead.thread; same person as pipeline card)
   │
   ├──1───* Concession  (Lease.concessionApplied → Concession)
   ├──1───* Listing     (Lead.source ⇐ Listing.channel)
   ├──1───* Decision ──(subject)→ {UnitType | Lead | Concession | Application | Lease}
   ├──1───* Task ──(relatedTo)→ {Lead | Application | Tour}
   ├──1───* Payment
   ├──1───* Report      (derived from Model baseline + live entities)
   └──1───* Document ──(linkedTo)→ {Lease | Application | Payment | Unit | Report}
```

**The one identity chain that must never fork** (fixes v6's core defect):
`Lead ─1:1→ Application ─1:1→ Lease ─1:1→ Resident`, all bound to the same `Unit`.
Alex Rivera the pipeline card, Alex Rivera the inbox thread, Kira Weston the application, Ethan
Park the resident — each is *one* Lead moving through this chain, not four records.

---

## 3. State machines

### Lead — pipeline
```
NEW ──contact logged──▶ CONTACTED ──tour booked & held──▶ TOURED
  └────────── application started ──────────────┐
CONTACTED / TOURED ──application submitted──▶ APPLIED
APPLIED ──application approved──▶ APPROVED ──lease signed──▶ SIGNED
(any active stage) ──no response / disqualified / chose competitor──▶ LOST (records lostReason)
LOST ──re-engages──▶ CONTACTED   (revive)
SIGNED ──move-in──▶ (Lead is now surfaced as Resident; pipeline card retires)
```
- Triggers: `CONTACTED` = first outbound logged (Task/Thread). `TOURED` = a Tour reaches
  `completed`. `APPLIED` = child Application reaches `submitted`. `APPROVED` = Application
  `approved`. `SIGNED` = Lease `signed`.
- The Lead stage is **derived from its children's states** wherever possible (Application/Lease),
  so Pipeline can never disagree with Applications — the v6 disconnect is structurally impossible.

### Application
```
started ──▶ submitted ──▶ screening ──┬─▶ approved ──▶ lease_sent ──▶ signed
                                      ├─▶ conditional ─▶ (deposit/cosigner) ─▶ approved | denied
                                      └─▶ denied  (terminal; Lead → LOST)
```
- Triggers: `screening` on background/credit/income pull; `approved`/`conditional`/`denied` on
  underwriting decision (often a Today `Decision`); `lease_sent` creates a `Lease(draft→sent)`;
  `signed` mirrors the Lease signing.

### Lease
```
draft ──▶ sent ──(e-sign)──▶ signed ──(start date + deposit cleared)──▶ active ──▶ ended
```
- `signed` triggers: create `Resident`, set `Unit.availabilityStatus = leased`.
- `active` triggers: set `Unit = occupied`, begin recurring rent `Payment`s.

### Unit — availability
```
not_ready ──(CO / turn complete)──▶ available ──(offer/app in progress)──▶ held
held ──(lease signed)──▶ leased ──(move-in)──▶ occupied
held ──(deal falls through)──▶ available     (release)
occupied ──(lease ended / NTV)──▶ available  (turn → not_ready if punch needed)
```

### Payment / Deposit
```
scheduled ──▶ processing ──┬─▶ succeeded (post to Account)
                           └─▶ failed ──▶ retrying ──┬─▶ succeeded
                                                     └─▶ resolved (manual / waived / plan)
```
- `security_deposit` succeeded is a gate for Lease→active. Failures surface as Today Decisions /
  Tasks and Inbox threads.

### Decision (Today)
```
open ──▶ accepted   (writes change to subject entity)
open ──▶ deferred   (snooze; reappears)
open ──▶ dismissed  (logged in action history)
```
- `accepted` is the write hook: accepting a pricing decision sets rents on a `UnitType`;
  accepting a concession-extension edits a `Concession.expiresAt`; accepting an approval advances
  an `Application`. This is what SCOPE_AUDIT calls "connection between Today decisions and Model
  assumptions" and "action history: accepted, deferred, assigned."

### Project (life stage — this IS the Model↔Live bridge)
```
pre_funding ──(lender comfortable / funded)──▶ funded_prelaunch
funded_prelaunch ──【LAUNCH】──▶ active_leaseup ──(target occupancy hit)──▶ stabilized
```
See §4 for exactly what **LAUNCH** does.

---

## 4. THE SPINE — Model ⇄ Live actuals

**Problem it solves.** In v6 the Model page and the live views share nothing: `PLAN_CURVE` and
`ACTUAL_CURVE` are two unrelated arrays; `MODEL_UNIT_MIX` and `UNIT_MATRIX` are two unrelated
tables; `MODEL_SCENARIOS` never touches Today's `HEADLINE`. Plan-vs-actual is *faked* per view.

**The fix — one baseline, one actual, same shape.** Define a small set of **shared quantities**.
For each, the Model produces a *plan* value and the live entities produce an *actual* value,
computed the same way. Variance = actual − plan is then available *everywhere* for free.

| Shared quantity        | PLAN source (Model)                          | ACTUAL source (live entities)                              |
|------------------------|----------------------------------------------|-----------------------------------------------------------|
| Absorption curve       | `Model.absorptionCurvePlan` (S-curve)        | cumulative count of Leads reaching `SIGNED` by week       |
| Velocity (leases/wk)   | `activeScenario.leasesPerWeek`               | trailing-N-week signed-Lease rate                         |
| Rent by unit type      | `UnitTypePlan.targetRent`                    | `UnitType.effectiveRent` (avg of signed Lease rents)      |
| Concession spend       | `Model.budget.concessionReserve` + plan rate | Σ `Concession.costPerLease × unitsApplied`                |
| Occupancy %            | `targetOccupancyPct` on the curve            | leased Units / total Units                                |
| Days-to-goal / carry   | scenario stabilizeDate, carryCostPerMonth    | projected from actual velocity × remaining vacant × carry |
| Staffing cost          | `staffingPlan.cost`                          | actual payroll/commission from live model                 |

**The LAUNCH event (the conversion).** When a Project transitions
`funded_prelaunch → active_leaseup`, LAUNCH does three things — and only these:

1. **Freeze the baseline.** Snapshot the active Scenario + unit mix + curve into an immutable
   `Model baseline`. All future variance is measured against this frozen plan (so editing the
   Model later doesn't rewrite history).
2. **Instantiate live entities from the plan.** For each `UnitTypePlan` create a live `UnitType`
   (seeded with plan rents) and its `Unit` rows (count from the mix), all `not_ready`/`available`.
   Concessions, Listings, and initial Rents inherit Model values.
3. **Open the live surfaces.** Today, Pipeline, Inbox, Applications begin accepting live
   `Lead`/`Tour`/`Application`/`Lease`/`Payment` records. Reports switch from "projected" to
   "actual vs frozen baseline."

After LAUNCH the Model stays editable (re-forecasts, new scenarios) but the **baseline is
fixed**; the Reports variance and Today's plan-vs-actual always compare live actuals to that
baseline. This is the single mechanism that makes "plan-vs-actual everywhere" true rather than
per-view theater.

---

## 5. View → Entity map

Proves the model makes the disconnected views cohere. **R** = reads, **W** = writes.

| View          | Reads (R) / Writes (W)                                                                                          |
|---------------|---------------------------------------------------------------------------------------------------------------|
| **Model**     | R/W Model, UnitTypePlan, Scenario, MarketRentInput, Comp/CompSet, Concession(plan), staffingPlan, budget; W Project.stage (Launch); W Report(lender_package). |
| **Today**     | R Decision, Task, and the **shared quantities** (§4: velocity, pace, days-to-goal, carry); W Decision.outcome — which **writes through** to UnitType (rents), Concession (expiry), Application (approve), Lead (assign). |
| **Pipeline**  | R/W Lead (pipelineStage), Tour, Unit (interest/hold), assignedTo; drag = stage transition (§3). Reads UnitType for match. |
| **Inbox**     | R/W Thread, Message; R Lead/Resident/Vendor/Org (thread.subject); W Task (from suggested actions), Tour (book from thread), Lead.stage (contact logged). |
| **Rents**     | R UnitType (asking/effective/suggested), Comp, Concession, MarketRentInput; R Model plan for variance; W UnitType.askingRent/suggestedRent (often via a Today Decision). |
| **Applications** | R/W Application (status), Payment(application_fee, deposit); W Lease(draft→sent→signed); W Lead.stage (derived); creates Resident on sign. |
| **Reports**   | R Model baseline + all shared quantities + Lead/Application/Lease/Payment/Concession aggregates; W Report.exportState. Read-mostly; stores almost nothing. |
| *(demoted)* Residents / Ledger / Collection / Listings / Market / Concessions / Documents | R Resident, Payment/Account, Listing, Comp, Concession, Document respectively; thin writes. Present but off the golden path. |

Every primary view now touches the **same** Lead/Unit/Application/Lease/Payment objects and the
**same** shared quantities — so moving a lead in Pipeline updates Today's velocity, Applications'
list, and Reports' variance automatically.

---

## 6. Reconciliation with v6 mock data (data.jsx)

**Already fits the model (keep the shape):**
- `PROPERTIES` → Project (add `stage`, `model`; treat `leased/pace/ahead` as *derived*).
- `UNIT_MATRIX` → UnitType (near-perfect: has asking/effective/comp/suggested/dom/vel).
- `PROSPECTS` → Lead (has stage, source, score, budget, move, unit, sla, note).
- `MODEL_UNIT_MIX` / `MODEL_SCENARIOS` / `MODEL_FIELDS` → Model + UnitTypePlan + Scenario.
- `MARKET_RENT_INPUTS` → MarketRentInput; `COMPS` → Comp; `CONCESSIONS` → Concession.
- `APPLICATIONS` → Application; `INBOX_THREADS` → Thread/Message; `PRIORITIES` → Decision.
- `LENDER_PACKAGE` / `LP_REPORT` → Report; `RESIDENTS` → Resident; `FAILED_PAYMENTS` → Payment.

**Must change conceptually:**
1. **Unify person identity.** `PROSPECTS`, `APPLICATIONS`, `INBOX_THREADS`, `RESIDENTS` currently
   hold *independent* copies of the same people (Alex Rivera, Kira Weston, Ethan Park, Sarah Chen
   recur across lists). Collapse to one `Lead` that gains Application → Lease → Resident and owns
   its Thread. **This is the headline change.**
2. **First-class Unit + one unit-ID convention.** Unit is a *string* today, and conventions
   clash (`"2BR-1204"` in Prospects vs `"U-312"` in Residents vs `"2BR-0914"` in Applications).
   Introduce a `Unit` entity with one ID scheme; Leads/Apps/Leases/Residents reference it.
3. **Derive stage counts.** `STAGES[].count` (New 12, Contacted 23…) is hardcoded and disagrees
   with the actual `PROSPECTS` distribution. Counts must be computed from Leads.
4. **Join plan and actual (§4).** `PLAN_CURVE`/`ACTUAL_CURVE`, `MODEL_UNIT_MIX`/`UNIT_MATRIX`,
   `PRECON.variance`/`LP_REPORT` are parallel-but-disconnected. Bind them via the shared
   quantities + frozen baseline so variance is computed, not authored.
5. **Decisions must reference, not restate.** `PRIORITIES` embed literal values (`value: 3200`,
   comps). A Decision should point at the 3BR `UnitType` and write to it on accept.
6. **Add missing entities:** Tour, Lease (first-class), User/Role, Org, Task, Project.stage.
   These are absent in v6 but required by the journey and the spine.
7. **Demote-and-thin:** WorkOrder, Vendor, Account/LedgerEntry, standalone Document keep their
   mock rows but lose lifecycle/product weight (reframed per SCOPE_AUDIT).

---

## Open Questions / Conflicts

1. **Lead vs Resident as one object or two?** This spec asserts `Lead ─1:1→ Resident` (same
   person, re-presented). If `10_PERSONAS_AND_ROLES.md` or a future renewals module needs a
   Resident that outlives its Lead (e.g. renters with no lease-up Lead, or renewal into a new
   lease), we may need Resident as a peer entity. **Decision needed before build.**

2. **Does accepting a Today Decision write directly, or propose a change for approval?** The
   spine assumes accept = write-through (Decision.accepted mutates the UnitType/Concession).
   But if roles (`10_`) say a leasing_agent can *see* a pricing decision but only an owner can
   *accept* it, Decision needs an approval sub-state and a permission gate. **Conflicts likely
   with the Personas permission matrix.**

3. **Where does Lead.pipelineStage live — stored or derived?** I recommend deriving it from
   child states (Application/Lease) so Pipeline and Applications can't disagree. But Pipeline's
   drag-and-drop implies a *directly settable* stage. If both exist, define precedence (does a
   drag to APPLIED create a stub Application?). **Conflicts likely with `20_JOURNEYS` golden-path
   transitions** — the demo must pick one truth.

4. **What exactly freezes at LAUNCH, and can it be re-baselined?** I froze the active Scenario as
   the immutable baseline. If a project is re-underwritten mid-lease-up (lender re-forecast),
   does a new baseline replace the old, and does historical variance rebase? Needs a policy.

5. **Unit-level vs unit-type-level pricing.** Rents view and Model operate at *unit type*
   granularity, but Units, Leads, and Leases reference specific units with their own rents.
   Confirm whether asking rent is set per type (cascading to units) or per unit (rolling up to
   type). Affects the Rents ⇄ Decision write path in §5.

6. **Broker/PM data visibility.** The model says role never partitions data, only permission.
   But a broker arguably should not see *other brokers'* leads, and a lender/observer should see
   aggregates only. If true, that's row-level scoping, contradicting principle §0.6 — **needs
   reconciliation with `10_PERSONAS_AND_ROLES.md`.**
```
