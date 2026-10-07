# 20 — Journeys & Narrative

> Workstream 20 of the LeaseRight prototype-perfection effort. Source of truth: `spec/00_PRODUCT_BIBLE.md`.
> Audience LOCK: the **developer / owner / asset manager** customer. This is a utility story for an operator,
> not a fundraising pitch. Lenders appear only as an *output audience* the developer must satisfy.
> Grounded in the v6 code as of 2026-07-01 (`components/*.jsx`). Conceptual only — no code changes.

---

## 0. Framing: the one question LeaseRight answers

Everything below serves the sponsor's core question (from PRODUCT_DIRECTION):

> *"Are we going to get this building leased on time, at the rents we expected, with the fewest unnecessary people and fees?"*

The narrative arc is: **a model becomes a board, a board becomes a payment relationship.** The developer never re-enters
data, never loses the thread from underwriting to move-in, and never has to assemble a lender/owner update by hand. The
"lender-ready" quality is a byproduct of doing the operator's own job well — not a separate deliverable.

A useful mental model of the whole product is a single **spine**: one `Project` with a stable set of `Unit`s and a set of
`Scenario` assumptions. Every downstream entity (`Lead → Tour → Application → Lease → Deposit → Resident`) hangs off a
Unit, and every report is a *read* over that spine compared to the modeled plan. v6 has all the surfaces but not the spine
(see §5) — this doc describes the story the spine must tell.

---

## 1. The end-to-end lifecycle journey (developer POV)

Eleven stages. For each: the developer's **goal**, the key **actions**, the **decisions**, and the **"aha"** that proves value.
Persona **J. Mori / Mori Development** (the hardcoded owner in `shell.jsx`) runs the whole arc for **The Meridian**, a
260-unit East Austin delivery.

### (a) Pre-funding modeling
- **Goal:** turn a rough deal into a defensible lease-up plan without building a spreadsheet.
- **Actions:** create the project; walk the guided intake — Property → Units → Comps → Rents → Strategy
  (v6 `PreconView`, `intakeSteps`). Each step *builds* an artifact ("Mapped property profile," "Rent matrix,"
  "Absorption scenarios") rather than just capturing fields.
- **Decisions:** which comps to trust (`MARKET_RENT_INPUTS` confidence 62–89%); starting rents per unit type
  (`MODEL_UNIT_MIX`); which operating model — In-house / Hybrid / Broker (`BROKER_ECONOMICS`, `strategyOptions`).
- **Aha:** *"I have a base/downside/aggressive absorption curve and a broker-vs-in-house number in an afternoon, and it
  updated live as I changed rents."* The tangible hook is the **broker-vs-in-house savings** ($116.9K in-house vs broker in
  `BROKER_ECONOMICS`) and the carry cost of delay — dollars, not features.

### (b) Get the lender comfortable
- **Goal:** hand a lender/capital partner a credible lease-up story so financing closes.
- **Actions:** review the Model output section; finish the two "review" items (`LENDER_PACKAGE`: Comp set support, Strategy
  & budget); export the model workbook / lender package.
- **Decisions:** is the base case defensible? is the concession reserve ($480K) and staffing plan realistic?
- **Aha:** *"The package the lender wanted is a click, and every number ties back to a comp or an assumption I can defend."*
  The model output frames itself as *"the model, not an unsupervised financing packet"* (v6 `guidance.lender`) — it protects
  the sponsor from over-promising.

### (c) Fund
- **Goal:** close financing and keep the plan alive instead of letting it die in a spreadsheet.
- **Actions:** mark the project **Funded** (a stage transition the app should own — see §3); the Model becomes the baseline
  of record.
- **Decisions:** lock the underwriting/base `Scenario` as the plan-of-record that live actuals will be measured against.
- **Aha:** *"The thing I sold the lender is the same thing I'm about to operate — nothing gets re-keyed."*

### (d) Launch the lease-up board
- **Goal:** flip from planning to operating with zero re-entry.
- **Actions:** the **Launch** step (v6 `modelTabs` id `launch`, currently `status: "locked"`) → **Create live board**.
  Import/confirm unit data; set channels; go live.
- **Decisions:** which units are available now vs phased delivery; who gets access (leasing agent, broker, PM — §6).
- **Aha:** the promise in v6's own copy: *"Nothing should be re-entered. The model should become the live Rents, Pipeline,
  Applications, and Reports workspace."* The moment the dark "command center" (Today/Pipeline) turns on and is already
  populated with the modeled unit mix and target velocity **is** the wedge paying off.

### (e) Capture leads
- **Goal:** never lose an inquiry; know instantly which are worth chasing.
- **Actions:** leads arrive from Zillow/Apt.com/Zumper/Referral/Direct (`PROSPECTS.source`) into Inbox + Pipeline NEW;
  auto-reply fires (`INBOX_THREADS[].messages[].from === "auto"`); lead is scored (`p.score`) and SLA-timed (`p.sla`).
- **Decisions:** contact now vs assign; which unit to match (`p.unit`).
- **Aha:** *"A hot, pre-checked Zillow lead surfaced at the top of Today with a 20-minute SLA clock — I called before my
  competitor did."* (v6 `PRIORITIES[1]`, Alex Rivera, "past SLA," score 92, pre-check passed.)

### (f) Tours
- **Goal:** convert interest into a scheduled, attributed tour.
- **Actions:** book from Inbox suggested reply ("Book Saturday 2pm") or Pipeline drawer ("Schedule tour"); lead advances
  NEW → CONTACTED → TOURED (`STAGES`).
- **Decisions:** which time; in-person vs self-guided; who hosts.
- **Aha:** *"Booking a tour moved the card, updated the thread, and started the follow-up clock — one action, everything in
  sync."* (This is the promise; v6 does NOT yet propagate it — see §5.)

### (g) Applications
- **Goal:** move a warm tour into a real, screenable application.
- **Actions:** send application link (Inbox: "Send application"); applicant appears in Applications with credit / background
  / income / rent-to-income / deposit status (`APPLICATIONS`).
- **Decisions:** approve / conditional (cosigner) / decline (v6 `action: "approve"`, `"require-cosigner"`).
- **Aha:** *"Kira Weston came back clean and the system already recommended approve — I didn't assemble the file, it
  assembled itself."* (`APPLICATIONS[0]`, status `underwriting`, note "Clean · approve recommended.")

### (h) Approve / sign lease
- **Goal:** execute a lease fast, before the applicant tours a competitor.
- **Actions:** approve → generate lease packet → send for e-sign (v6 references DocuSign in `RECENT_DOCS`) → stage APPLIED →
  APPROVED → SIGNED.
- **Decisions:** final rent & concession applied; move-in date.
- **Aha:** *"Approve-to-signed was minutes, and the unit flipped from vacant to leased everywhere at once."*

### (i) Collect deposit / first rent
- **Goal:** collect money in-platform — the actual business model.
- **Actions:** deposit request → payment (ACH preferred, `PAY_METHODS`); first month's rent; escrow handling (`ACCOUNTS`).
- **Decisions:** handle failed payments / retries (`FAILED_PAYMENTS`).
- **Aha:** *"The deposit cleared into escrow through LeaseRight — the software I bought for a dollar just started earning its
  keep."* This is where PRODUCT_DIRECTION's "payments are the economic engine" becomes visible to the operator.

### (j) Report to stakeholders
- **Goal:** keep lender / LP / owner confident without a weekly call.
- **Actions:** the weekly sponsor report, lender package refresh, and LP letter generate from live actuals
  (`LP_REPORT`, velocity vs plan, `PRECON.variance`).
- **Decisions:** what narrative to send; flag variances (concessions −1.8pp favorable, DOM −8d, NOI +$38K vs plan).
- **Aha:** *"My lender update writes itself from the same data I operate on — actual vs the exact model I financed against."*

### (k) Stabilization / handoff
- **Goal:** hit stabilized occupancy (93% target) and stay resident/payments system-of-record afterward.
- **Actions:** track to stabilization (v6 Today "To stabilization" 121/242, Jun 2027); convert signed leases into residents
  (`RESIDENTS`); keep collections + ledger running.
- **Decisions:** renewals, rent bumps, when/whether to demote leasing surfaces.
- **Aha:** *"Lease-up ended but LeaseRight didn't — leases, deposits, and payment history already live here, so there's no
  reason to migrate to a PM stack."* This is the retention/moat payoff.

---

## 2. THE GOLDEN PATH — the single connected demo story

**One project. One lead. Every primary tab reflects the same progression.** This is the story the rebuilt prototype must
tell end-to-end. Project: **The Meridian**, 260 units, East Austin, sponsor **Mori Development / J. Mori** (matches
`PROPERTIES[0]` and the hardcoded user). Hero lead: **Alex Rivera**, a Zillow inquiry for **2BR-1204** at $2,800/mo, move-in
Jun 1 — already present in v6 in three disconnected places (`PROSPECTS.pr01`, `INBOX_THREADS.t02`, `PRIORITIES.p2`). The
golden path is the act of **connecting those three into one moving object.**

> Design intent: a "Demo / Golden Path" mode should let a presenter step the story forward one beat at a time; each beat
> writes to the shared spine so every tab is consistent at every step.

### Walkthrough (numbered beats — what the user does, what changes elsewhere)

1. **MODEL → build the plan.** J. Mori completes intake for The Meridian. 3BR is flagged low-confidence (68%, `MODEL_UNIT_MIX`).
   Base scenario: 3.3 leases/wk, stabilize Jul 28 2026 (`MODEL_SCENARIOS`).
   *Changes elsewhere:* the unit mix, target rents, and target velocity that will seed every live tab are now set. Live tabs
   remain quiet (v6 already dims the tape on Model and says *"Live leasing… turn on after launch."*).

2. **MODEL → get lender-ready & fund.** Comp-set and strategy review cleared; lender package exported; project marked Funded.
   Base scenario locked as plan-of-record.
   *Changes elsewhere:* Reports now has a baseline; every future actual is measured against *this* curve (`PLAN_CURVE`).

3. **MODEL → Launch.** "Create live board." The command center turns on, pre-populated: Rents shows the modeled matrix,
   Pipeline shows empty stages ready for leads, Reports shows 0 vs plan.
   *Changes elsewhere:* Today/Pipeline/Inbox/Rents/Applications/Reports transition from "locked/empty" to "live."

4. **INBOX → the lead arrives.** Alex Rivera messages via Zillow: *"Is the 2BR still available? Jun 1 move."* Auto-reply
   quotes unit 1204 at $2,800 (`INBOX_THREADS.t02`).
   *Changes elsewhere:* a NEW card appears in **Pipeline** (2BR-1204, score 92, SLA clock started); **Today** surfaces the
   hot-lead decision; the top-bar **badge counts** and nav peeks increment.

5. **TODAY → the SLA decision.** The lead-priority card (`PRIORITIES.p2`) shows "past SLA — call within 10 min, score 92,
   pre-check passed." J. Mori (or agent Priya) clicks **Call now**.
   *Changes elsewhere:* the Pipeline card's SLA flag clears; the Inbox thread logs the outreach; the decision moves to
   "cleared" in Today's history.

6. **PIPELINE → CONTACTED → tour booked.** From the Inbox suggested reply "Book Saturday 2pm," a tour is scheduled.
   *Changes elsewhere:* Alex's card advances NEW → CONTACTED → **TOURED**; a Tour entity exists; Inbox shows the confirmation;
   follow-up task appears in Today.

7. **PIPELINE → APPLIED.** After the tour, "Send application" goes out; Alex submits.
   *Changes elsewhere:* card advances to **APPLIED**; a row appears in **Applications** (credit/background/income/deposit);
   **Applications** KPI "pending" increments; the 2BR-1204 unit shows "1 application" in **Rents**.

8. **APPLICATIONS → approve.** Screening returns clean; system recommends approve; J. Mori approves.
   *Changes elsewhere:* card → **APPROVED**; lease packet generated (Documents); Today shows "lease sent · awaiting signature"
   (mirrors v6 `PROSPECTS.pr15` Sarah Chen pattern).

9. **APPLICATIONS / PIPELINE → SIGNED.** Alex e-signs.
   *Changes elsewhere:* card → **SIGNED**; **unit 1204 flips vacant → leased** in Rents and in the Today unit matrix; leased
   count 121 → 122; **velocity** and **absorption curve** tick up; **Reports** "actual vs plan" improves; the live tape prints
   a LEASE event.

10. **COLLECTION → deposit + first rent.** Deposit requested and paid via ACH; posts to **Escrow** (`ACCOUNTS`); ledger tape
    prints "Security deposit · 2BR-1204."
    *Changes elsewhere:* Collection KPIs update; this is the first dollar of the payment relationship.

11. **RESIDENTS → move-in.** Alex converts from prospect to **Resident** (2BR-1204, Jun 1), like `RESIDENTS` entries.
    *Changes elsewhere:* Pipeline no longer counts Alex as active; Residents count +1; Inbox thread reclassifies
    prospect → resident.

12. **REPORTS → it wrote itself.** The weekly sponsor report and lender refresh now include Alex's lease in velocity-vs-plan
    and the actual-vs-pro-forma NOI (`LP_REPORT`). Nothing was assembled by hand.
    *Changes elsewhere:* closes the loop — the model from beat 1 and the actuals from beats 4–11 are the *same* numbers.

**The single sentence the demo proves:** *One Zillow inquiry became a signed lease and a cleared deposit, and it moved every
screen — Model, Today, Pipeline, Inbox, Rents, Applications, Reports, Collection, Residents — without anyone re-typing a
thing.*

---

## 3. First-run / empty states (create-project path)

SCOPE_AUDIT flags this as a **missing critical feature** ("The app still assumes an existing property"). v6 hardcodes The
Meridian everywhere. Conceptual design for the brand-new user:

### 3.1 Zero state — no projects
- The app opens not to a populated Today but to a **"Create your first project"** canvas. One primary action; the dense
  command center is not shown yet (nothing to command).
- Copy leads with utility: *"Start with a lease-up model. Live leasing turns on after you launch."* (v6 already hints at this
  in the Model top bar.)

### 3.2 Create-project flow
- **Step 1 — Project basics:** name, sponsor, address/submarket, delivery date, unit count.
- **Step 2 — Choose stage** (this is what unlocks the right surfaces): **Pre-funding · Funded/pre-launch · Active lease-up ·
  Stabilized.** The chosen stage gates which tabs are live (a pre-funding project shows only Model; an active project shows
  everything). This single choice is the app's state machine — it is what v6 lacks.
- **Step 3 — Invite team** (optional): assign roles (owner, leasing agent, broker, PM, lender-observer — §6, coordinate with
  Personas spec).

### 3.3 Guided progression: nothing → lender-ready → live
The Model's own left stepper (`modelTabs`) is the empty-state guide: Intake → Scenarios → Rents → Model output → **Launch**.
- Each step shows what it **builds** (already in v6 `intakeSteps[].builds`), so an empty state always previews the payoff.
- **"82% ready"** progress and per-section status (complete / review / draft) tell the user exactly what stands between them
  and a lender-ready model.
- **Launch is locked until the model is ready** (v6 `launch.status: "locked"`) — the app refuses to go live on a half-built
  plan, which protects the operator and reinforces the model-first wedge.

### 3.4 Per-tab empty states (post-launch, pre-data)
Once launched but before leads arrive, each primary tab needs a real empty state, not a blank grid:
- **Pipeline:** empty stage columns with "Connect a listing source to start capturing leads" (v6 Pipeline already renders an
  "EMPTY / DROP HERE" per column — extend it to a first-run CTA).
- **Inbox:** "Connect email / SMS / listing portals" (SCOPE_AUDIT "Channel setup" gap).
- **Applications:** "No applications yet — share your apply link."
- **Reports:** "0 leased vs plan — your first lease will appear here," showing the modeled curve with a flat actual line.
- **Rents:** live immediately (seeded from the model), so it doubles as proof the launch imported everything.

---

## 4. Where v6 BREAKS the story today (concrete disconnects)

The prototype has ~17 views but no shared model ("No spine," Product Bible §5). Each item below is grounded in the code read.

1. **Pipeline moves are local-only.** `PipelineView` holds cards in its own `useState(PROSPECTS)`; dragging a card to a new
   stage calls `setCards` on that component's state. Nothing notifies Today, Applications, Reports, Rents, or the nav badges.
   Moving Alex from NEW to SIGNED changes one board and nothing else.
2. **The same lead exists three times, unlinked.** Alex Rivera is a Pipeline prospect (`PROSPECTS.pr01`), an Inbox thread
   (`INBOX_THREADS.t02`), and a Today priority (`PRIORITIES.p2`) — three separate literals with no shared ID. Acting in one
   place cannot update the others.
3. **Inbox actions are cosmetic.** `InboxView` "suggested replies" and "Book tour / Send application / Move to Applied"
   quick-actions (see the `prospect` branch) render but don't create tours/applications or advance any pipeline stage. "Move
   to Applied" is a button with no handler wired to Pipeline.
4. **Today decisions don't write back to the model.** The Priority carousel's **Accept · $3,200** sets local `rent3b` state
   only; it does not update `UNIT_MATRIX`, the Rents view, `MODEL_UNIT_MIX`, or the model's assumptions. SCOPE_AUDIT names
   this exact gap ("Connection between Today decisions and Model assumptions").
5. **Model → actuals is one-directional and notional.** `PreconView` Launch says *"Nothing should be re-entered… the model
   becomes the live Rents, Pipeline, Applications, Reports"* — but there is no mechanism: the live tabs read their own
   hardcoded arrays (`UNIT_MATRIX`, `PROSPECTS`, `APPLICATIONS`, `LP_REPORT`), not the model's (`MODEL_UNIT_MIX`,
   `MODEL_SCENARIOS`). The plan curve in Reports and the plan curve in Model are **two independent copies** of nearly the same
   `1 - exp(-w/28)` formula (`data.jsx` `PLAN_CURVE` and `PreconView`'s local `plan`).
6. **Applications ↔ Pipeline ↔ Rents don't reconcile.** Applications lists Kira/Miguel/Andre/Jordan/Luka; Pipeline's APPLIED
   column lists Jordan/Kira/Andre; the two sets only partly overlap and are separate literals. Approving in Applications does
   not advance the Pipeline card or flip a unit in Rents/`UNIT_MATRIX`.
7. **Counts are hand-authored, not derived.** `STAGES[].count` (12/23/19/14/8/7) are static and don't match the number of
   `PROSPECTS` actually in each stage (~4/3/4/3/2/2). Nav badges (`NAV_BADGES`), peek counts (`PEEK_DATA`), and KPI strips are
   independently hardcoded, so the same metric disagrees across the header, the peek, and the view.
8. **Deposits/payments are display-only.** `FAILED_PAYMENTS`, `PAY_METHODS`, `ACCOUNTS`, ledger tape render but nothing in the
   lease-signing flow produces a deposit; the business-model moment (§1i) never actually fires.
9. **No stabilization/handoff transition.** There is no state that flips a signed prospect into a `RESIDENTS` record; the two
   lists are disjoint (Ethan Park is `PROSPECTS.pr17` *and* `RESIDENTS.r10`, entered by hand in both).
10. **Occupancy math is inconsistent.** Today/Pipeline headers say 121/260 (46.5%); Today's "To stabilization" says 121/242;
    Reports uses 121 actual / 93 plan. The denominator (242 vs 260) and the target aren't reconciled — a spine would compute
    all three from one source.

Net: v6 is a **set of beautiful dioramas**, not a moving train. The golden path (§2) is precisely the fix — one lead, one ID,
propagating through a shared model.

---

## 5. Role-specific journeys (coordinate with Personas spec)

The golden path above is written for the **owner-operator (J. Mori)**, who sees everything. The same path bends per role.
Product Bible §5 flags "No explicit roles" as a top gap; PRODUCT_DIRECTION defines three operating models. Keep permissions
conceptual here and defer the authoritative role × permission × surface matrix to `10_PERSONAS_AND_ROLES.md`.

| Role | Primary surface | Golden-path difference | What they should NOT see |
|---|---|---|---|
| **Owner / Sponsor** (J. Mori) | Model, Today, Reports | Runs the whole arc; owns the model, launch, pricing/concession decisions, and stakeholder reports. The "aha" is control + the lender package writing itself. | — (sees all) |
| **In-house leasing agent** (Priya S.) | Today, Pipeline, Inbox | Lives in beats 4–9: works the SLA queue, books tours, sends applications, chases signatures. Assigned leads (`p.owner`). "Make a non-enterprise operator feel competent." | Model intake, lender package, ledger/escrow, org settings. |
| **Broker** (external collaborator) | Pipeline (assigned only), Inbox | Guest access to *their* assigned leads/units; logs tours, pushes applications; performance is measured (commission attribution, SLA, conversion). Beats 5–8 only, scoped. | Other brokers' leads, model economics, payments, full reports; sees a broker scorecard, not the owner's P&L. |
| **PM-managed** | Pipeline, Applications, Residents | The developer *makes the PM operate lease-up in LeaseRight for visibility*; PM runs beats 5–11 but the owner retains the data + payment relationship. "Prevent the PM hiding behind vague weekly updates." | Owner's economics/model; cannot export or sever the data relationship. |
| **Lender / observer** | Reports (read-only) | Enters at beat 2, returns at beats 10/12. Sees the lender package and live actual-vs-plan, nothing operational. The developer's incentive to keep this current is what keeps the model honest. | Everything operational (Pipeline, Inbox, Today, ledger detail). Read-only, curated. |

Design implication: role is chosen at project creation / team invite (§3.2), and the **same golden-path events render
differently per role** — e.g., a signed lease is a "unit leased" celebration for the agent, a commission event for the broker,
a velocity-vs-plan tick for the lender, and a deposit-collected moment for the owner.

---

## Open Questions / Conflicts

1. **Project state machine vs entity states (conflict with Data spec).** §3.2 proposes a project-level stage (Pre-funding /
   Funded / Active / Stabilized) that gates surfaces, *and* §1–2 rely on entity-level states
   (Lead: NEW→…→SIGNED; Application: underwriting/pending/approved/review; Unit: vacant/leased). The Data spec
   (`30_DATA_MODEL_AND_SYSTEMS.md`) must own the canonical state enums. **Decision needed:** are Pipeline stage, Application
   status, and Unit status three independent fields or one derived truth? (v6 duplicates them — pr01 is `new` in Pipeline while
   also being the Today SLA lead; a signed prospect and a resident are separate records.) Recommend: **Unit status and lease
   status are derived from the furthest-advanced Lead/Application on that unit**, not stored independently.

2. **Single lead identity.** The golden path requires Alex Rivera to be **one** entity referenced by Inbox, Pipeline, Today,
   Applications, Reports. Today he's three literals. **Decision:** confirm a shared `Lead.id` (and `unitId`) as the join key,
   and that Today priorities are *generated from* leads/units/decisions rather than authored. Coordinate the entity list with
   the Data spec.

3. **Do model assumptions become live actuals, or seed-then-fork?** SCOPE_AUDIT and the Launch copy promise "no re-entry," but
   §1c/§2b also need the base scenario **frozen** as plan-of-record so actual-vs-plan is meaningful. **Decision:** on Launch,
   does the model *become* the live data (one object) or *seed* it and then diverge (plan snapshot + live actuals)?
   Recommend the latter: freeze a plan snapshot; live tabs write actuals; Reports diffs them. This resolves the "two plan
   curves" bug (§4.5) by making one authored and one derived.

4. **Role permissions vs golden-path completeness (conflict with Personas spec).** The demo needs every tab populated, but a
   broker/lender must be *blocked* from most tabs. **Decision:** does the prototype demo as the all-seeing owner and merely
   *illustrate* role scoping, or must the golden path be walkable per-role? Recommend: golden path is owner-mode canonical;
   role views are curated projections of the same events. Personas spec should confirm the surface list per role so §5 and the
   matrix don't diverge.

5. **When does the payment moment appear (business-model visibility)?** Deposits are the first revenue event but are notional
   in v6. **Decision:** is the deposit/first-rent beat (§1i, §2 step 10) in-scope for the perfect prototype, or represented
   symbolically? Given "payments are the economic engine," recommend making it a first-class, visible golden-path beat even if
   the transaction is simulated.

6. **Handoff/stabilization scope.** Residents, Collection, Ledger are "demote" per SCOPE_AUDIT, yet stages (i)–(k) need at
   least the deposit → resident conversion to close the loop. **Decision:** how much of stabilization does the prototype show
   vs stub? Recommend: show the *conversion event* (prospect → resident, deposit → escrow) as the retention payoff; keep
   renewals/delinquency out of the primary story.
