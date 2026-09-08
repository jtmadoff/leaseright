# 80 — Implementer plan: product, agent role, and the next build

> M4D Implementer package. Debate mode. Independent position formed from the
> *current* repository (post-Builder I0), then checked against the Contrarian,
> Strategist, Builder, and Overseer briefs as peers — not as instructions.
>
> Refreshed 2026-09-01 after inspecting the live prototype. This document is the
> concrete product and implementation plan. It does not rebuild the prototype.
> It tells the next builder what to ship, what to stop, and what evidence counts.
>
> Business recommendation remains `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`.
> Where this plan and the Overseer memo disagree, the memo wins on *what to
> test and how to charge*; this plan wins on *how to build the test*.
>
> **Payment-engine correction (2026-09-02):**
> `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` supersedes this plan's statements that payment take
> rate is only a remote expansion hypothesis. Net rent-processing economics are the intended
> long-term engine, screened at 5–10 bps until a written quote exists; 25 bps is a stretch case and
> 50 bps is not a planning case. Ten bps can authorize a beta but does not prove the core P&L;
> retention through stabilization and a low-CAC stabilized-unit acquisition path are controlling.
> The fixed-fee Model/operations pilot remains the paid wedge, with payment diligence added to
> Phase A and live money movement deferred to a separately gated beta after partner, legal, and
> shadow-reconciliation readiness.

---

## 1. Independent position

**The fee-basis lie is fixed. The Model is still not a pricing instrument.
The next bottleneck is sponsor-sourced reconciliation, not the spine queue.**

LeaseRight should be an **owner-owned lease-up command center** whose default
operating model is **hybrid**: one on-site operator works owner leads in
Pipeline/Today, and **external locators / Realtors originate clients through a
zero-login registration → apply → commission-status loop**. They are not
Pipeline users, not scorecard subjects, and not a `Lead Broker` guest role.

`$1/unit forever` is a positioning line, not a P&L. Net rent-processing economics
are the intended long-term engine, but the repo has no partner terms or margin
evidence. The next company milestone is one **paid, stage-gated, one-building validation**:
Phase A Model reconstruction, then a conditional 60-day Phase B. It is not
finishing `spec/70_REBUILD_PLAN.md` N3–N17, a backend, or broker RBAC.

The first invoice is a **fixed, upfront five-figure project fee**, with the
sponsor's reconciled carry shown as the *value anchor*, not as a contingent
success fee. Payment take rate stays a modeled sensitivity until sponsor statements
and partner terms exist; commission take rate stays a separate later hypothesis.

I formed this from the code. The Contrarian is right that locators are missing
and that guest-broker RBAC is the wrong surface. The Strategist is right that
staffing, carry, and absorption still describe three different buildings. The
Overseer is right that validation beats a broader rebuild, and right that
pilot-one payment must not be litigated against realized savings.

Where I push back:

- **Do not "fix" Meridian into a consistent fake.** Gate 0 is a data contract
  run against a named sponsor's source files. Pretty demo math is still demo.
- **Do not treat "don't rebuild" as "touch nothing" after a paid building
  exists.** The public prototype is already the sales artifact. Once the
  sponsor pays, the next code is the Phase A Model instrument. The thin
  originator URL follows only after the real commission, attribution, dispute,
  and brokerage/payee inputs exist — not N3.
- **Do not encode carry-share as the invoice.** The Model can *show* carry at
  risk. The contract is a fixed fee. Attribution on n=1 is a dispute machine.
- **Do not add a fake locator to the Meridian seed and call that the agent
  test.** Originator entities belong in the pilot data contract. Seed theater
  is not evidence.

---

## 2. One recommendation

Ship and test this product, in this order:

1. **Owner command center** (existing 7 surfaces: Model · Today · Pipeline ·
   Inbox · Rents · Applications · Reports) remains the buyer product.
2. **Hybrid is the default staffing model**, not a compromise on the way to
   in-house. In-house-only and exclusive-broker-only stay as *inputs*, not as
   three products. Velocity is observed, never authored to pick a winner.
3. **Split "agent" into two product surfaces:**
   - **Operator** (Priya today): full workbench. Already designed.
   - **Originator** (locator / tenant-rep / Realtor): live availability +
     published terms + client registration + evidence the agent *holds* +
     tour/apply link + commission owed/approved/paid-on-date. No LeaseRight
     nav, no Today, no SLA clock, no owner scorecard.
4. **Monetize the middle** on the first paid pilot: a per-project Model /
   lease-up-ops fee scoped by deliverables and project band. Carry becomes the
   value case after Phase A; it is not the first quote formula. Keep `$1/unit`
   as secondary positioning and use payment diligence to test the intended
   land-and-expand engine.
5. **The next engineering after payment is Phase A against a real building.**
   Build a thin originator URL only if the Phase B preconditions clear — not
   the store rebuild, guest login, or a payments rail.

Go/no-go after one real 100–400 unit project (Austin/Texas if a qualified
sponsor is available): sponsor pays; an operator runs ≥80% of eligible new
leads through the LeaseRight flow for four consecutive weeks; at least three
unique originator registrations with one downstream tour/application and no
unresolved attribution dispute. Fail payment and operator adoption and stop.
Do not expand into generic PM.

A same-submarket second building tests originator reuse *if* Phase B clears.
It is not required to start the first engagement.

---

## 3. Evidence from the actual repository (as of this inspection)

### 3.1 What is already built

| Layer | State | Evidence |
|-------|--------|----------|
| Public prototype | Static React-UMD + Babel-in-browser. No backend, no auth, no persistence except UI prefs. Netlify static. | `README.md`, `LeaseRight.html`, `netlify.toml` → `/`, `/app`, `/leaseright` |
| Visual OS | Dense dark console with ~17 views. Primary nav is the 7 lease-up surfaces. Secondary PM modules still render. | `components/shell.jsx` `NAV`; `app.jsx` still mounts Residents, Ledger, Maintenance, Vendors, Collection, Documents |
| Model (pre-funding) | Guided intake stepper, scenario cards, staffing comparison, lender-package chrome. Launch tab is **locked**. Most fields are still display literals. | `components/module-views.jsx` `PreconView`; `modelTabs` launch `status: "locked"` |
| Live ops dioramas | Today / Pipeline / Inbox / Rents / Applications / Reports all render rich mock data. Drag, accept, and suggested actions are **local-only**. | `pipeline-view.jsx` `useState(PROSPECTS)`; `inbox-view.jsx` `useState(INBOX_THREADS)`; `other-views.jsx` `useState(UNIT_MATRIX)`; `shell.jsx` `NAV_BADGES` hardcoded |
| Spine data (N1) | **Done.** One `SEED` graph: 24 leads each once, first-class `unit-####` rows, `resolveRefs` designed to return zero dangling refs. | `components/model-data.jsx`; script tag in `LeaseRight.html` after `data.jsx` |
| Spine selectors (N2) | **Done.** Pure `deriveLeadStage`, `stageCounts`, `sharedQuantities`, `variance`, `__selfTest`. | `components/selectors.jsx` |
| Honest staffing function (I0 / supersedes N7) | **Done by Builder.** `brokerEconomics(inputs)` with `feePeriod` month/year, hybrid = payroll + share × exclusive, carry-day equivalent, velocity removed from the ranking. Model view consumes it. No `first-year` string survives in `components/`. | `selectors.jsx`; `module-views.jsx` `const E = brokerEconomics(B)`; `__selfTest` asserts `260*2180*0.5 === 283400` and year-basis `3400800` |
| Store (N3) | **Missing.** No `store.jsx`. `app.jsx` has no `StoreProvider`. Views still copy `data.jsx` literals. | `spec/70_REBUILD_PLAN.md` N3; `components/` has 11 jsx files, none named store |
| Roles | **Specified, not built.** UI identity is one hardcoded owner. Seed users: owner + in-house agent only. | `shell.jsx` "Jordan Mori · owner · $1/unit · forever"; `SEED.users` = `user-mori`, `user-priya`; every tour `agentId` is Priya |
| Originator rail | **Missing.** No locator org, no originator user, no `Registration`, no `Commission` entity, no originator view. | `model-data.jsx` orgs = sponsor + cleaning vendor; lead `source` values are ILS / Direct / Referral / Drive-by |
| Payments | Mock records only. Staffing actual still echoes plan cost because commission is not an entity. | `selectors.jsx` comment on staffing actual |

N1 and N2 are real foundation work. From the user's point of view they are
almost dead: Pipeline/Inbox/Rents still read `data.jsx`. The one live
exception is `brokerEconomics`, which the Model view now calls.

### 3.2 What is missing (ranked by whether it blocks the test)

**Blocks a carry-based value case or a lender claim (Phase A — do not invent
numbers):**

1. Three lease-up durations still coexist in the same seed:
   - Staffing: `BROKER_ECONOMICS.months = 9` → ~39 weeks.
   - Base carry: `$1,710,000 ÷ $227,000/mo` → **7.53 months / ~32.7 weeks**.
   - Absorption: `PLAN_CURVE` length 79; delivery Jan 15 2025 → stabilize
     Jul 28 2026 → **~80 weeks**. Intake copy says "78wk from CO" and
     "242 units / 73 weeks."
2. Scenario carry is authored, not computed. At `$227,000/mo` ≈ `$7,463/day`:
   - Base → Downside is 70 days and `$670,000` (implied `$9,571/day`,
     **~$148K** unexplained).
   - Base → Aggressive is 119 days and `$610,000` (implied `$5,126/day`,
     **~$278K** unexplained).
3. Three *actual* velocities coexist:
   - `ACTUAL_CURVE` week 15 = 121 leases → **8.07/wk**.
   - Unit-type `velocityActual` sums to **7.2/wk**.
   - `PRECON` copy says **"9.2 leases/wk"** trailing 12 weeks.
   Aggressive plan is 5.1/wk. Actuals beat the upside case; the 3BR tail
   (`ut-3br`: 22 remaining at 0.4/wk → **55 weeks**) only fits the 79-week
   reading.
4. Hybrid is still mis-priced on the *plan object*: `staffingPlan.model`
   is `"hybrid"` but `cost: 166500` (in-house). All three scenarios still
   carry `staffingCost: 166500`. The Model *card* now shows Hybrid
   `$198,860`; the stored plan does not.

These are not evening-polish bugs. They are why Phase A exists. **Do not
reconcile them by editing Meridian until a sponsor's source file is the
input.** Label the demo illustrative if it is shown before Phase A.

**Blocks the agent question (build only after a named building + authorization):**

5. No originator identity, license, brokerage, registration, frozen terms,
   or commission-status record.
6. No inventory surface an outside agent can trust without logging into the
   owner's console. No confirmation the agent *holds* (email to agent +
   sponsoring brokerage).

**Does not block the test (defer):**

7. Shared store / write-through spine (N3–N17). Needed if an *operator*
   must click the golden path end-to-end without the demo falling apart.
   Not needed to sell Phase A or to take a registration.
8. First-run create-project canvas, role chrome, presenter mode, production
   auth, listing syndication, screening, e-sign, money movement.
9. Broker guest login, row-scoping, owner scorecard (`70` Q4, `10_PERSONAS`
   §2.3). Heaviest role to build; least likely to be used.

### 3.3 Dangerous leftover in the rebuild plan

`70_REBUILD_PLAN.md` **N7 done-when** still says `__selfTest()` should
reproduce `$283.4K / $166.5K / $116.9K`. Builder already shipped the
corrected function. **Do not execute N7 as written.** I0 superseded it.

Continuing N3 because it is "next in the night-shift queue" is the wrong
implementer move. `70` was sequenced to perfect a prototype. This mission
is to find out whether the business works.

---

## 4. Practical agent-role design (what to build)

Do not implement the six-role matrix in `10_PERSONAS` §3 for MVP. Implement
**two human jobs** plus exports.

### 4.1 Operator — already the Pipeline user

**Who:** in-house leasing agent, PM leasing staff, or (if hired) an exclusive
lease-up desk running *this building's* leads.

**Surface:** Today (scoped to leasing actions), Pipeline, Inbox, Applications,
read-only Rents. No Model. No money movement. No other originators' books.
An external operator is project-scoped: no owner banking, no cross-project
underwriting, no other firms' data.

**Job:** respond inside SLA, tour, apply, get the unit signed. This is Priya.
Keep her.

**Do not** make this person also be the locator.

### 4.2 Originator — new, thin, mostly not an app

**Who:** apartment locator, tenant representative, or Realtor arriving *with
a client*.

**Surface:** one page, magic link or public URL (`?surface=originator` is
enough). No owner chrome.

| Step | What they see | What LeaseRight records |
|------|----------------|-------------------------|
| 1. Inventory | Live unit type, asking/effective rent, concession, eligibility, **posted commission**, protection window — *before* register | Trust is the point; impression optional |
| 2. Register | Agent name, license, sponsoring brokerage, client identity, unit/type, consent to published rules | `Registration`; terms in force are **frozen** for this claim |
| 3. Evidence they hold | Immediate confirmation copy — to the agent **and** the sponsoring brokerage — with client, unit/type, timestamp, protection period, frozen terms | Pilot-one can be a `mailto:` / displayed email artifact; the record must exist outside the landlord DB |
| 4. Send | One trackable tour and/or application link | Same `Lead`, `source = locator`, `originatorId` |
| 5. Status | registered → toured → applied → leased → commission approved → paid, plus any dispute outcome and reason | Owner sees source + cost per signed lease, not private client books |
| 6. Pay status | Commission owed, approved, paid-on-date, days from lease execution to pay | `Commission` entity. Actual payout is **outside** LeaseRight in pilot one. Default payee in a Texas pilot is the sponsoring brokerage, subject to counsel |

**What they never see:** Model, Reports, other leads, SLA clocks, scorecards,
F-keys, Today.

**Why this is lower friction than guest Pipeline:** no second CRM, no unpaid
data-entry, no adversarial measurement. The owner still gets attribution
because the registration *is* the event.

In Texas, compensated apartment locators are generally licensed and a sales
agent generally receives transaction compensation through the sponsoring
broker. Record license + brokerage. Do not invent a payee path without
counsel. Official references live in the Overseer memo; re-check them before
a live Austin pilot.

### 4.3 Owner

Unchanged as buyer and data controller: Model, all seven surfaces, Reports,
invite Operator, publish originator terms (commission % of first **month**,
protection window), commission liability. Sees aggregate conversion and cost
per signed lease.

Lender remains **export-only** (confirmed O2). Asset Manager stays a
permission tier on the owner dataset, not a second product (confirmed O1).

### 4.4 What we are explicitly not building

- Lead Broker guest workspace
- Owner-facing broker scorecard as a v1 artifact
- Hard row-scoping of Pipeline for originators (`70` Q4 — moot)
- Agent marketplace / overflow auction
- Commission payout rail (show the obligation; don't move money)
- Originator login as a requirement
- Carry-share success fee on realized savings

---

## 5. Fastest credible test

Not a rebuilt app. Not interviews-only once a building is named.

**Collect payment, run Phase A Model reconstruction, then conditionally run a
60-day Phase B, followed by a same-submarket repeat only if the rail clears.**
That is the Overseer geometry. This section is how to run it with the repo
that exists.

### Commercial gate — sell the staged engagement

Start only after Justin names a validation target and the sponsor signs and
pays the fixed, scoped five-figure engagement. The first fee is based on the
deliverables and project band, not Meridian's untrustworthy carry delta.

Before Phase A, include counsel-drafted continuity terms covering assignment or assignment efforts
on sale, successor-PM payment-path treatment/right to bid, a right of first refusal on processing at
stabilization, and lender cash-management disclosure. Refusal marks the engagement **wedge-only**;
it does not block a profitable fixed-fee pilot.

### Phase A — make the Model a trustworthy instrument

After payment, rebuild the pilot Model
from the sponsor's source underwriting and operating records. One delivery
schedule, one stabilization definition, one lease count, one velocity
convention, one carry rate, one concession method, one scenario formula.
Every displayed date and cost must derive from those inputs. Freeze the
agreed baseline before live operations.

Also collect the payment-engine evidence defined by the canonical Overseer memo: processor
statements and method mix, fee payer, returns/disputes/failures, settlement and reconciliation,
PM/PMS/processor contract and termination rights, lender lockbox/DACA terms, post-stabilization
owner/manager, and one written partner proposal translated into expected net bps of PPV. This is a
diligence/readout workstream, not a payment surface.

Prefer a sponsor with existing stabilized units and use those statements for the payment-history and
shadow-ledger tests. A later live beta still requires the separate partner/legal/reconciliation gate;
the stabilized asset only avoids waiting for the lease-up property to produce rent volume.

**Do not quote a carry-based value, and do not demo project economics as if
they were the sponsor's, until Phase A clears.**

If a meeting happens *before* Phase A, the Model screen must be labeled
illustrative. Showing today's carry/scenario cards as a quote is worse than
waiting.

Interview five originators and two exclusive lease-up brokers during Phase A.
Do not build or invite them into a product surface until the sponsor supplies
written commission terms, attribution rules, a dispute owner, and a
brokerage/payee path. If the Model or operating data path cannot reconcile,
deliver the paid baseline/variance memo and stop there.

### Phase B — conditional 60-day operating test

Use a real 100–400-unit lease-up in one launch market, recommended
Austin/Texas if a qualified sponsor is available. Default staffing: hybrid.
Activate Phase B only after Phase A produces a frozen baseline and the
operator accepts one data path.

| Gate | Stimulus | Pass | Fail |
|------|----------|------|------|
| **Operator adoption** | Existing 7 surfaces as the daily board. Disclose local-only clicks until I3 exists. Dual-run against their sheet/CRM is allowed *as measurement* | Four consecutive weeks, ≥80% of eligible new leads through the LeaseRight flow; weekly report generated from the same records | Spreadsheet remains the real operating system |
| **Mechanism proxies** | vs. the operator's pre-pilot baseline | Record median lead-arrival→human-contact, inquiry→tour by source, DOM for the stalled unit type | Using willingness-to-pay as a substitute for these numbers |
| **Originator behavior** | Thin URL (I2) or, if I2 is not yet live, a form that still emails agent + brokerage and freezes published terms | Invite 5 active local originators; ≥3 unique client registrations; ≥1 downstream tour/application; no unresolved attribution dispute. Route at the slowest unit type first when the asset supports it | They refuse to leave Follow Up Boss / texts; they demand the owner's full pipeline; a contested claim with no visible outcome |
| **Lender value** | PDF/spreadsheet or read-only report link from the reconciled baseline | A changed diligence request, reserve, reporting requirement, or credit conversation | No change → keep it as an owner report, drop "lender-ready front door" as the company story |

Lender review is useful and **not** the first gate.

### Stage 2 — only if Phase B clears operator use and originator behavior

Repeat the originator rail at a second building in the same submarket without
re-recruiting the first cohort. `2 of 5` originators registering at both
buildings is an early continue signal, not proof of a network. If reuse does
not appear, keep the rail as a project feature and run LeaseRight as a
productized per-project business.

### Investment gate (do not pretend this is PMF)

- **Connected MVP (I3 = N3/N4 + N12–N14 only)** if payment, operator use, and
  agent registration all clear Phase B *and* the operator cannot run without
  a clickable golden path.
- **Narrow to paid modeling/reporting** if the sponsor pays but the workbench
  is not adopted.
- **Keep the command center and ingest agent activity externally** if
  operators adopt but originators reject a LeaseRight surface.
- **Explore network / take-rate** only after cross-building repeat behavior.
- **Stop** if sponsor payment and operator adoption both fail. Do not retreat
  into generic PM.

### Monetization quote (same conversations)

Present in this order:

1. Fixed per-project Model + lease-up-ops pilot (Justin names the five-figure
   number; implementer does not invent it).
2. Reconciled carry-at-risk as the *why*, not as the invoice formula.
3. `$1/unit` as a *later* ops price, not the reason to start.

Do not quote payment take-rate until a partner exists. Do not quote a
commission take-rate in pilot one.

---

## 6. Implementation sequence (do / defer / don't)

Constraint for all code: static React-UMD + Babel, no new deps, no backend,
respect `SOURCE_OF_TRUTH.md` (LeaseRight, dense dark console).

### Do not start until Justin names a building, authorizes the pilot, and the sponsor pays

The four tasks below are specified so the next evening can execute without
re-litigating product. They are **gated**. Building them against Meridian
fiction is how the last calculator lie happened.

### G0 — Pilot Model instrument (Phase A)

| | |
|--|--|
| **Goal** | One sponsor-sourced Model whose displayed dates and costs all derive from a single input set. Freeze that baseline. |
| **Inputs (required, from the sponsor — not from `data.jsx`)** | Unit mix and counts; asking/effective rent by type; concession method; delivery / first-unit / stabilization definition; target occupancy and implied lease count; carry $/period; payroll; exclusive/locator fee basis and expected originator share; weekly planned absorption *or* the formula that produces it; weekly actuals to date if the building is live. |
| **One convention, written on the freeze sheet** | Velocity unit (leases/wk); week-start day; whether "leased" means signed, funded, or moved-in; carry day-count basis (actual/360 vs 365); scenario formula (`carry = carryPerDay × days(delivery, stabilize)` or the sponsor's own). |
| **Files** | Prefer a new `pilot/` JSON or a clearly labeled `SEED` overlay — do **not** silently overwrite Meridian demo literals. Wire `PreconView` scenario/carry/staffing lines to `brokerEconomics` + the new derived duration/carry functions. Add `__selfTest` that: (a) scenario carry deltas equal `carryPerDay × dateDelta` within $1; (b) staffing months equal the same duration used for carry; (c) absorption end-count equals `round(targetOcc × units)`. |
| **Done-when** | A reviewer can point at every number on the Model/Reports quote card and name the source cell. Launch remains a freeze, not an animation. Meridian demo, if still visible, is labeled **illustrative**. |
| **Maps to** | Overseer Phase A. Replaces "make Meridian internally pretty." Not N5–N8 as written. |

### I2 — Originator page (thin)

| | |
|--|--|
| **Goal** | One originator loop a locator can complete without opening Pipeline. |
| **Files** | new `components/originator-view.jsx`; `LeaseRight.html` script tag; `app.jsx` mount on `?surface=originator` (or `/originator` redirect). Optional: 2–3 `SEED` rows *in the pilot overlay* — brokerage org, originator user, one `Registration`, one `Commission` — not a fake rewrite of all 24 Meridian leads. |
| **Done-when** | Published terms visible before register. Register captures agent, license, brokerage, client, unit/type. Confirmation text is copyable / `mailto:` to agent **and** brokerage, with frozen terms. Status stepper includes dispute outcome. Commission owed / approved / paid-on-date / days-to-pay render. Owner Reports still do not expose other clients. `resolveRefs` still `[]`. |
| **Maps to** | Overseer originator loop + Strategist neutrality constraint. Contrarian "zero-login path." |

I2 starts only after Phase A interviews and after the sponsor provides the
written commission, attribution, dispute, and brokerage/payee inputs. For
Phase B, a form may substitute if it still satisfies the same done-when
(published terms, freeze, dual confirmation). Do not use a form that only
timestamps a row in a landlord sheet.

### I-LOG — Operator mechanism log (no store)

| | |
|--|--|
| **Goal** | Collect the Phase B proxy metrics without N3. |
| **Files** | A Reports-adjacent table or a `pilot/` CSV template: `lead_id, arrived_at, first_human_contact_at, source, unit_type, originator_id, stage, tour_at, applied_at, leased_at`. Pre-pilot baseline is a second sheet filled from the operator's existing CRM/export. |
| **Done-when** | Four weeks of the log can produce median contact time, inquiry→tour by source, and stalled-type DOM without reading Slack. Duplicate-entry rate is a recorded field, not a vibe. |

### I3 — Store + golden path (only if the operator test requires it)

N3 + N4 store mount, then **only** N12/N13/N14 (Pipeline, Inbox, Applications
write-through) for one named lead. Skip N5–N11, N15–N17, and all Phase 4
daytime work until Phase B is active and adopted.

I3 jumps ahead of I2 **only if** Justin names an operator who will work live
in the prototype this month (see §7.1). G0 still ships first.

### Do now, even before the Justin calls — I-SAFE

If the public prototype will be shown before Gate 0, add a one-line
illustrative disclaimer on Model (and hide or footnote the authored scenario
carry as "not computed from the carry rate"). Relabel `$1/unit · forever` in
`shell.jsx` so it is not read as the pilot price. **Do not** recompute
Meridian carry to force consistency.

This is demo hygiene, not Gate 0. Builder already did the load-bearing half
(I0). I-SAFE is the remaining half if anyone is still walking sponsors
through Netlify.

### Defer (do not start)

- N5 duplicate absorption curves, N6/N8 intake-as-store, N11 derived Reports,
  N15–N17 Today/Rents/badge unification
- Phase 4: first-run canvas, calm-UI pass, presenter mode, role chrome,
  Launch animation, simulated ACH
- Production backend, auth, listing feeds, screening, e-sign, payouts
- Asset Manager as a designed role; lender observer login (already rejected)
- Fake locator rows in the Meridian seed "so the demo has an agent"

### Don't

- Broker guest RBAC / scorecard
- Optimizing User Mode §1 (in-house as company strategy)
- Implementing N7's current done-when
- Generic PM (Maintenance, Vendors, full Ledger, Collections)
- Success-fee-on-actuals in the quote card
- Commission take-rate or originator charges in pilot one

---

## 7. Debate: what would change my mind, and the opposing weaknesses

### 7.1 What would change *this* implementer position

1. **Justin names a sponsor who will operate live in the prototype this
   month.** Then I3 jumps ahead of I2, because a broken drag demo kills the
   deal. G0 still ships first.
2. **ICP is sub-50 unit portfolios, not Meridian-shaped ground-up.** Locator
   rail shrinks; in-house workbench is enough; I2 becomes optional.
3. **The buyer is an exclusive lease-up brokerage**, not the sponsor. Invert
   D7: Pipeline is *their* product; sponsor gets Model + Reports. Different
   company.
4. **A locator shop agrees in writing** to live inside a landlord portal.
   Then a real login (still not a scorecard) can replace the magic-link page.
5. **A payments partner is contracted and the separate legal/shadow-ledger gates clear.** Then
   ordinary rent collection can leave mock status in a capped ACH beta. Security deposits and
   third-party payouts remain separately gated. At that point, re-scope Rents as the
   stabilization-handoff surface for payment enrollment, contract continuity, successor owner/PM
   state, the transition checklist, and realized `$/retained unit/year`. Until then, do not
   architecture around money movement.
6. **Justin has source underwriting that already reconciles duration, carry,
   and absorption.** Then G0 is copy-in, not redesign, and the Strategist's
   "absence of the product" claim downgrades to fixture cleanup.
7. **Sponsors reject carry as a conversation** in the first pricing meeting.
   Then drop carry from the quote card and keep the fixed fee with a simpler
   scope list. That would also weaken the Strategist's pricing architecture.

### 7.2 Opposing views — likely weakness

**Canon (`PRODUCT_DIRECTION` + `70` as next work).** Finish the spine, support
three operating models, invite brokers as scoped guests, keep `$1/unit` +
payments as the story. *Weakness:* it treats a connected diorama as the
bottleneck. The bottleneck is an unreconciled Model and an agent role nobody
is in the seed to play. N7 as written would launder the old bug; N3 as next
work would polish the wrong artifact.

**Overseer "validation before rebuild" taken as zero code.** *Weakness:* the
prototype is already public. Walking a sponsor through authored scenario
carry that cannot be reproduced from `$227K/mo` is the same class of error
I0 just killed. Validation does not require N3–N17; after a named building
it does require G0 and a registration surface that is not a landlord-only
timestamp.

**Contrarian "pay agents through the product" as v1, and "Typeform is
enough."** *Weakness on pay:* a payout rail is a fintech project; the
testable behavior is registration + visible obligation + days-to-pay.
*Weakness on Typeform:* a form that does not publish terms before register
and does not copy the brokerage fails the neutrality constraint. A form that
does those things *is* I2, whether it lives in JSX or not.

**Strategist carry-share pricing as the company-defining architecture.**
*Weakness:* it is the right *sales math* and the wrong *invoice*. On one
building with no counterfactual, a fee that is a fraction of modeled carry
invites the sponsor to argue the model; a fee that is a fraction of realized
carry invites a dispute. Implementer default: fixed fee, carry shown beside
it. After three real pricing conversations, a published schedule can be
tested — that is already the Overseer reconciliation.

**Strategist "two buildings or you cannot falsify the network."** *Weakness:*
delaying the first invoice to secure a second asset converts a validation
pilot into a multi-project services sale. Geometry is right as Stage 2, not
as a start condition. If Justin can identify a second eligible building
without delaying Stage 1, reserve it.

**Personas "visibility flows up; score the broker."** *Weakness:* that loop
is designed for the exclusive the sponsor wants to fire, not the locator who
fills units. Same word ("broker"), two jobs. Implementing the matrix is how
the MVP grows RBAC instead of a registration URL.

**Prior Implementer plan (this file, morning version).** Right that I0 had
to ship before customer meetings, and right that N3 was not the company
task. *Now stale:* I0 is done; fee-basis is no longer a Justin decision;
adding a locator to Meridian SEED before a named building would recreate
demo theater. Gate 0 is the remaining instrument, and it needs a real
sponsor file.

---

## 8. Decisions that require Justin

Only these. Everything else in this document is implementer default. Do **not**
re-ask fee-basis (Builder corrected the label; month-basis arithmetic stands),
store vs pub-sub (`70` Q1), re-baseline (`70` Q2), per-type vs per-unit rent
(`70` Q3), broker row-scoping (`70` Q4 — out of scope), simulated ACH (`70`
Q5), Monday item id, production stack, services-vs-network as a company
identity, or a specific carry-share percentage.

1. **Name the first validation target.** Recommended default: one 100–400-unit
   ground-up lease-up in Austin/Texas with a long-term-holder sponsor that controls
   the payment stack, an operator willing to use the workflow, and meaningful
   locator/Realtor activity. Prefer a sponsor with an existing stabilized asset so payment evidence
   is available during the pilot. If
   practical, identify a second eligible building in the same submarket, but
   do not delay the first paid pilot to secure it. If the real target is
   sub-50u, say so before I2.
2. **Authorize the commercial and resource gate.** Approve a fixed, upfront
   five-figure pilot scoped from deliverables and project band, with validation
   before further rebuild. Phase A is paid Model reconstruction; Phase B is
   conditional operating/originator validation, with payment-volume and processor
   diligence added to Phase A and counsel-drafted continuity terms added to the commercial package.
   This authorizes the team to treat `$1/unit forever`
   as secondary positioning, rent-processing economics as the intended long-term
   engine, and the actual payment and commission take rates as unvalidated
   sensitivities. Pick the pilot fee; implementer will not invent it.

If Justin instead wants a clickable golden path for a named demo next week,
that is decision (1) in §7.1 — tell us the date and we do G0 then I3.

Justin does **not** need to choose agent screen details, framework, lender
login, or a payments partner now.

---

## 9. Mission outcome (this package)

- Inspected the HomeBase LeaseRight repo as it stands after Builder I0:
  prototype, `spec/00`–`70`, `PRODUCT_DIRECTION`, `SCOPE_AUDIT`, seed +
  selectors, Model view, Netlify entry points, and the Contrarian /
  Strategist / Builder / Overseer briefs as peers.
- Independent recommendation: hybrid owner command center + originator rail;
  fixed-fee paid validation; **G0 against a named sponsor, not a prettier
  Meridian**; I2 after authorization; I3 only if an operator must click.
- Verified in source: no `first-year` string in `components/`; Model calls
  `brokerEconomics`; `__selfTest` asserts month/year fee identities; hybrid
  card math is payroll + 40% share; seed still has no originator; views still
  do not call `Selectors.` except that global `brokerEconomics`; N3 absent;
  duration/carry/actual-velocity still contradict (9-month staffing vs 7.53-month
  carry vs ~79-week curve; 8.07 vs 7.2 vs 9.2 leases/wk).
- Rewrote this plan so the next builder does not execute the stale I0 queue
  or N7-as-written. Pointed `spec/70_REBUILD_PLAN.md` at the current sequence.

No prototype behavior was changed in this pass. G0 / I2 / I-SAFE wait on
Justin's two decisions (I-SAFE can ship in an evening if a sponsor meeting
is booked before those decisions land).

**Blockers:** none technical. The only genuine blockers are the two Justin
calls in §8. Until those land, do not resume the N3–N17 queue, and do not
fabricate a reconciled Meridian.
