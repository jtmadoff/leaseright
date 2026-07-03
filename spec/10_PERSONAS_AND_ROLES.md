# 10 — Personas & Roles

> Foundation workstream 10. Read `00_PRODUCT_BIBLE.md` first. Audience is **LOCKED** to the
> real-estate developer / owner / asset manager who must lease up a building — NOT investors or
> fundraising. Lenders are an *output* audience the developer must satisfy, not a primary user.
>
> This spec defines who the users really are, their jobs-to-be-done, the collaborator roles the
> developer pulls in, a role × permission × surface matrix, which persona each of the ~17 views
> serves, and the implications for a first-time experience. Conceptual only — no code.
>
> Where a claim is grounded in a source doc, it is cited inline (PRODUCT_DIRECTION,
> SCOPE_AUDIT, PRODUCT_BIBLE, or the prototype `data.jsx` / `shell.jsx`). Where I extrapolate
> beyond the docs, it is marked **[extrapolation]**.

---

## 0. Summary of the position

There is exactly **one buyer**: the developer/owner who is on the hook to lease up a building on
schedule, at the rents they underwrote, with the fewest unnecessary people and fees
(PRODUCT_DIRECTION "Product Purpose"). Everyone else in the system is a **collaborator the buyer
invites** — asset manager, in-house leasing agent, external broker, property manager, lender/
capital-partner observer. LeaseRight's role model is therefore not a symmetric multi-tenant RBAC
system; it is **one owner account with a spoke of scoped guests**, most of whom the owner is
using LeaseRight to *hold accountable* rather than to empower as equals.

The prototype today has **no roles at all** — every surface is rendered for a single hardcoded
"Jordan Mori · owner · $1/unit" identity (`shell.jsx` user menu), and the Bible names this as
known gap #3. The whole point of this spec is to decide what *should* exist.

The single most important design consequence: **the owner is the only role that ever sees the
Model and the money.** Brokers and PMs are deliberately kept on the execution surfaces (Pipeline,
Inbox, Applications) and deliberately kept *off* Model, Reports, and Deposits — because the
strategic wedge is "keep all lease-up data owned by the developer" and "expose underperforming
brokers" (PRODUCT_DIRECTION Broker Strategy). Visibility flows *up* to the owner; it does not flow
*out* to the collaborators.

---

## 1. Primary persona(s): the developer / owner / asset manager

The buyer is one archetype with meaningful sub-segments. Rather than invent six thin personas, I
define **one primary persona** and then three axes of variation that change what LeaseRight must
prove. The three *operating models* (owner-led / broker-assisted / PM-managed) are the most
important axis because they determine who else logs in — so they get the deepest treatment.

### 1.1 The core persona — "The Sponsor on the hook"

**Name (prototype-aligned):** Jordan Mori, principal at Mori Development (the identity already
baked into `shell.jsx` and `MODEL_FIELDS`).

**Context.** Jordan is delivering **The Meridian, a 260-unit ground-up in East Austin**, CO'd
around delivery and now ~3.3 months into lease-up at 121/260 leased (`PROPERTIES`, `PRECON`).
Jordan is not a property manager and doesn't want to become one. Jordan's day is carry cost,
lender conversations, and the nagging question: *are we going to hit stabilization on time at the
rents we underwrote?* (PRODUCT_DIRECTION "Product Purpose"). Jordan is cost-sensitive but
sophisticated (PRODUCT_DIRECTION "Primary Customer"): allergic to paying full brokerage
commission (~$283K on this deal per `BROKER_ECONOMICS`) and to signing a Yardi/AppFolio contract
before the building even needs full PM.

**Jobs-to-be-done (in the order Jordan actually hits them):**
1. *Before funding* — "Turn my rough project into a lender-ready lease-up plan so I stop looking
   like I'm guessing." (PRODUCT_DIRECTION Sponsor Intake — this is the acquisition wedge.)
2. *At funding/pre-launch* — "Decide broker vs in-house vs hybrid, and prove the savings."
   (`BROKER_ECONOMICS`, SCOPE_AUDIT Broker/In-House Decision Tool.)
3. *During lease-up* — "Know every morning what actually needs a decision today, and see it get
   done, without daily status calls." (Today console; PRODUCT_DIRECTION User Modes goals.)
4. *Weekly* — "Send the lender/LP a credible update I didn't have to build in Excel." (Reports.)
5. *Continuously* — "Keep control of my data, my leads, and eventually my payments — even when a
   broker or PM is doing the day-to-day." (PRODUCT_DIRECTION User Modes, Business Model.)

**Goals:** hit stabilization on schedule; protect achieved rent vs pro forma; minimize commission
leakage and PM overhead; keep lender/LP confidence high; own the data and the payment relationship
so LeaseRight becomes the permanent system of record (PRODUCT_DIRECTION Market Wedge).

**Pains:** lease-up data scattered across broker spreadsheets, texts, and weekly calls
(SCOPE_AUDIT Pipeline/Inbox rationale); no single answer to "are we on pace"; opaque broker
performance; the model dying in a spreadsheet after funding (PRODUCT_DIRECTION Pre-Funding Entry
Point); being asked to change staffing behavior before there's proof it works (PRODUCT_DIRECTION
Strategic Risk).

**What "success looks like this week."** Concretely, for The Meridian: *the 3BR stall is
resolved* (drop to $3,200 accepted, unblocking 22 units — `PRIORITIES` p1), *Alex Rivera got
called inside SLA and booked a tour* (p2), *the "1 month free" concession decision is made before
it expires* (p3), *velocity stays above plan* (9.2 vs 7.0/wk — `HEADLINE`), and *the weekly owner
report goes out without a fire drill.* Success is not "used every feature" — it is "inaction was
made visible and then cleared" (PRODUCT_DIRECTION "make inaction visible").

**What earns trust/adoption before payments monetization kicks in.** This is the crux of the
$1/unit strategy — the software must be genuinely useful before it asks to touch money
(PRODUCT_DIRECTION Strategic Risk). Jordan will trust LeaseRight if:
- The **Model is real and lender-usable on day one** — editable intake, base/downside/aggressive
  scenarios, a broker-vs-in-house number Jordan can defend, and an export a lender will accept
  (SCOPE_AUDIT "Make Model Real"). This is the wedge that gets Jordan in *before* AppFolio/Yardi
  are even considered.
- The **model carries into live ops** instead of dying — assumptions become the plan-vs-actual
  baseline (SCOPE_AUDIT Pass 2; Bible gap #4). Seeing "leased 121 vs model 93, +28" (`PRECON`)
  is the moment Jordan believes the tool is one continuous system, not two demos.
- **One clean lead-to-lease story works end to end** — a lead enters, gets matched, toured,
  applied, approved, signed, and every tab updates (SCOPE_AUDIT Lead-to-Lease Demo Flow; Bible
  gap #1 "no spine").
- It **replaces the weekly broker call**, not just the spreadsheet — Jordan can see broker
  performance without asking.

### 1.2 Segmentation axis A — operating model (determines who else logs in)

This axis is the most consequential for the role model. All three must be first-class; adoption
cannot require one perfect operating model (PRODUCT_DIRECTION Strategic Risk).

**A1. Owner-led / in-house leasing — the best case (PRODUCT_DIRECTION User Modes §1).**
Jordan hires or assigns an internal leasing person, often on-site, and LeaseRight is *their*
daily workflow. Here LeaseRight's job is to **make a non-enterprise leasing operator feel
competent** and to replace brokerage dependency. The owner still watches, but the leasing agent
lives in the product. This is the model the whole product should be optimized to make succeed —
it is where the $1/unit + payments economics work best because the owner owns the whole stack.

**A2. Broker-assisted leasing — the realistic transition (PRODUCT_DIRECTION User Modes §2).**
Jordan still uses brokers, but LeaseRight becomes the command center. Brokers receive assigned
leads, log tours, push applications. Product job: **empower productive brokers, expose
underperforming ones, prevent lead/status fragmentation, and keep all data owned by the
developer.** The trust dynamic is asymmetric on purpose — the broker gets a workspace; the owner
gets a scorecard.

**A3. PM-managed leasing — common but least ideal (PRODUCT_DIRECTION User Modes §3).**
Jordan makes the property manager use LeaseRight during lease-up even if the PM runs another
system internally. Product job: **give the owner live visibility so the PM can't hide behind
vague weekly updates, and preserve the owner's data + payments relationship.** The PM is the
lowest-trust collaborator — granted operational access but never Model or money.

### 1.3 Segmentation axis B — portfolio shape [partly extrapolation]

The prototype already ships a **property switcher with three assets** — The Meridian (260u,
Austin), Luminary Midtown (188u, Nashville), Brix on Sixth (142u, Denver) (`PROPERTIES`). That
implies the buyer is not always a single-asset first-timer.

- **First-time / single-asset sponsor.** One deal, everything on the line, no dedicated leasing
  staff yet. Enters at the Model wedge pre-funding. Needs the strongest hand-holding and empty
  states. **This is the persona the first-run experience must be built for** (see §5).
- **Small-to-mid portfolio holder (2–8 assets).** The prototype's implied reality. Needs the
  property switcher, cross-asset "which building is behind" awareness (Brix is "behind −5" in
  `PROPERTIES`), and probably an **asset manager** collaborator (§2.1). Values the fact that the
  model doesn't die and that reporting is repeatable across deals.

### 1.4 Segmentation axis C — hold intent [extrapolation, grounded in CRE reality]

- **Merchant-builder / build-to-sell.** Optimizes for *speed to stabilization* and a clean
  lender/buyer-ready package, because the exit is a sale at stabilization. Cares most about
  Model, absorption pace, and Reports; cares least about long-run resident/renewal features
  (which SCOPE_AUDIT already demotes anyway). LeaseRight's "stay in place after stabilization"
  pitch is *weaker* here — the payment relationship may transfer to the buyer.
- **Long-term holder.** Optimizes for *achieved rent quality and durable NOI*; more willing to
  invest in the in-house model and to keep LeaseRight as the permanent payments/resident layer
  post-stabilization. This is the segment where the full PRODUCT_DIRECTION thesis (wedge →
  operating layer → permanent infrastructure) pays off end to end.

**Design implication:** default the product to the *long-term holder, in-house* framing (it
exercises the whole thesis) but never *require* it — the merchant-builder must be able to get to
a lender package and a fast stabilization without adopting resident/renewal machinery.

---

## 2. Collaborator roles the developer pulls in

These are **invited guests scoped by the owner**, not co-equal tenants. For each: who they are,
what they need to see/do, and the trust/accountability dynamic. Ordered from highest trust
(inside the owner's org) to lowest (external, being measured).

### 2.1 Asset Manager (inside the owner's org — highest delegated trust)

**Who.** The owner's right hand on a portfolio; often the person actually driving lease-up
decisions day to day when the principal is raising the next deal. Most relevant to the
2–8-asset holder (§1.3). **[extrapolation — not yet in the prototype, but implied by the
multi-property switcher.]**

**Needs to see/do.** Nearly everything the owner sees *except* org-level admin and banking
setup: run the Model, accept/defer Today decisions, manage Pipeline and Rents, generate Reports,
approve applications. In practice the asset manager is a **near-owner** with money-movement and
org-admin withheld.

**Trust/accountability dynamic.** This is a *delegation* relationship, not a *watch* relationship
— the owner trusts the AM to act, and the AM's job is to keep the owner out of the weeds. The
Reports surface is how the AM keeps the principal confident without a standing call. This role
also solves a real prototype ambiguity: the hardcoded "owner" today behaves like an AM (accepting
pricing decisions in `PRIORITIES`), so the AM/owner split should be a *permission* distinction,
not two different products.

### 2.2 In-house Leasing Agent (inside the org — operational trust)

**Who.** The on-site or in-house leasing person in operating model A1. The single most important
*non-owner* user, because making them competent is the whole "replace brokerage" bet
(PRODUCT_DIRECTION User Modes §1).

**Needs to see/do.** Live execution: their assigned Pipeline (leads, SLA timers, tour
scheduling, drag-drop stage changes), Inbox (prospect conversations, suggested replies, tour/
chase templates), the day's Today decisions *scoped to leasing* (call this lead, chase that
application), and read access to Rents (so they can quote correctly) — but **not edit** Rents,
and **not** Model, Reports, or money. They convert leads to applications and hand off signed
leases.

**Trust/accountability dynamic.** Empowerment first, accountability second — the owner *wants*
this person to win. But their activity (response time to SLA, tours booked, applications pushed)
is exactly the data that later proves in-house beats broker. **Success = the agent feels
competent and the owner gets visibility "without daily status calls"** (PRODUCT_DIRECTION §1).

### 2.3 External Broker (outside the org — the measured collaborator)

**Who.** Third-party leasing broker(s) in model A2. Explicitly treated as an **external
collaborator, not the system owner** (PRODUCT_DIRECTION Broker Strategy).

**Needs to see/do.** A **guest workspace** scoped to *their assigned leads and units only*
(PRODUCT_DIRECTION potential broker features: guest access, lead assignment + SLA tracking, tour
logging, commission attribution). They can act on their pipeline, log tours, upload notes, push
applications through — but they see **only their own book**, never the whole pipeline, never the
Model, never other brokers' or in-house numbers, never the owner's money or full reporting.

**Trust/accountability dynamic.** This is the sharpest dynamic in the product and the one the UI
must handle carefully: LeaseRight should **not frame itself as anti-broker** in the interface
(PRODUCT_DIRECTION Broker Strategy) — the broker's own view should feel empowering ("here are your
leads, here's your SLA, here's your commission"). But the *owner's* view of that same data is a
**broker performance scorecard** that exposes underperformance (SCOPE_AUDIT Reports; "Broker
performance report"). Same events, two audiences: empowerment facing the broker, accountability
facing the owner. Commission attribution is what keeps the broker honest and the owner in control
of the economics.

### 2.4 Property Manager (outside/adjacent — lowest-trust operational access)

**Who.** A PM company forced to use LeaseRight during lease-up even though it runs its own stack
internally (model A3, "common but less ideal").

**Needs to see/do.** Operational execution on the assigned property — Pipeline, Inbox,
Applications, unit/turn readiness — enough that the owner gets **live visibility instead of vague
weekly updates.** Critically *not* the Model, *not* full Reports, and *not* the money/deposits
relationship, because the whole point is that the owner "preserves the data and payments
relationship" (PRODUCT_DIRECTION §3).

**Trust/accountability dynamic.** Compliance-driven, not empowerment-driven. The owner is
essentially auditing the PM through the product. The PM gets just enough to do the leasing work
and no leverage over the owner's data or economics. If SCOPE_AUDIT's demoted PM modules
(Maintenance/turns as "unit readiness", Vendors as "leasing launch vendors") ever surface, the PM
is their natural user — but they stay out of the primary wedge.

### 2.5 Lender / Capital-Partner Observer (external — read-only output audience)

**Who.** The lender or LP the owner must keep comfortable. **Not a primary user** — an *output
audience* (PRODUCT_BIBLE §3). Could be a literal read-only login, but more realistically consumes
the **exported lender package / weekly report** rather than logging in daily. **[extrapolation on
whether they get a login at all — see Open Questions.]**

**Needs to see/do.** The lender-ready model pre-funding (absorption scenarios, rent confidence,
staffing/broker plan, carry) and, post-funding, plan-vs-actual proof that lease-up is on track
(`LP_REPORT`, `LENDER_PACKAGE`). Strictly **read-only, curated** — they see what the owner chooses
to publish, never the raw pipeline, never other assets, never the owner's costs beyond what the
package discloses.

**Trust/accountability dynamic.** The inverse of the broker: here the *owner* is the one being
held accountable, and LeaseRight's job is to make the owner look credible and reduce lender
uncertainty *before* asking the owner to change how leasing is run (PRODUCT_DIRECTION Pre-Funding
Entry Point). The lender's confidence is the currency that gets the deal funded — which is what
unlocks the whole rest of the product.

---

## 3. Role × Permission × Surface matrix

Surfaces are the primary journey plus Deposits/Payments (the monetization surface, notional in v6
per Bible gap #5). Cell values:
- **none** — surface not visible.
- **view** — read-only.
- **act** — can take the surface's core actions (move leads, log tours, edit rents, accept
  decisions, approve apps, etc.).
- **admin** — full control including configuration, publishing, and money movement.

Scope qualifiers: **(scoped)** = limited to that collaborator's assigned leads/units/property;
**(curated)** = sees only what the owner explicitly publishes.

| Role | Model | Today | Pipeline | Inbox | Rents | Applications | Reports | Deposits / Payments |
|------|-------|-------|----------|-------|-------|--------------|---------|---------------------|
| **Owner / Sponsor** | admin | admin | admin | admin | admin | admin | admin | admin |
| **Asset Manager** | act | act | act | act | act | act | act | view |
| **In-house Leasing Agent** | none | act (scoped) | act | act | view | act | none | view (status only) |
| **External Broker** | none | act (scoped) | act (scoped) | act (scoped) | view (scoped) | act (scoped) | view (own scorecard) | none |
| **Property Manager** | none | act (scoped) | act (scoped) | act (scoped) | view | act (scoped) | view (curated) | none |
| **Lender / Observer** | view (curated) | none | none | none | none | none | view (curated) | none |

**Opinionated calls baked into this matrix:**
- **Only Owner and Asset Manager ever see the Model.** The Model is the owner's strategic and
  financial thinking; brokers/PMs never see it. The lender sees a *curated read* (the package),
  not the working model.
- **Only Owner (admin) and AM (view) touch Deposits/Payments.** Winning the payment relationship
  is the economic engine (PRODUCT_DIRECTION Business Model), and keeping it owner-controlled is
  the whole point of the PM/broker containment. The leasing agent sees deposit *status* on an
  application (paid/pending) because they need it to close, but cannot move money.
- **Rents is view-only for everyone but Owner/AM.** Pricing is a strategy decision; agents/
  brokers/PMs quote from it but don't set it. This is deliberately tighter than a generic CRM —
  it protects the owner's rent discipline.
- **Reports splits by audience.** The owner/AM get the full report suite; the broker gets *only
  their own scorecard*; the PM gets a *curated* operational report; the lender gets the *curated*
  lender/LP package. No collaborator sees another's numbers.
- **Everyone operational gets a scoped Today.** SCOPE_AUDIT explicitly calls for "role-specific
  Today views: sponsor, leasing agent, broker, PM." The owner's Today is portfolio decisions; a
  broker's Today is "your 3 leads past SLA."

---

## 4. Which persona each existing view serves (and what is noise for the buyer)

Mapping the ~17 views in `shell.jsx`'s `NAV` to the persona/role that actually needs them, and
tying the noise verdict to SCOPE_AUDIT's demote/excessive lists. "Primary buyer" throughout means
the owner/AM.

### Primary — serve the buyer directly, keep central (SCOPE_AUDIT "Keep As Core")
| View | Primary persona served | Also used by | Verdict |
|------|------------------------|--------------|---------|
| **Model** (F1) | Owner / AM (pre-funding wedge) | Lender (curated) | **Core.** The front door; the acquisition wedge. |
| **Today** (F2) | Owner / AM | Agent / Broker / PM (scoped) | **Core.** Daily command center; must become role-specific. |
| **Pipeline** (F3) | Leasing Agent / Broker / PM (execution) | Owner / AM (oversight) | **Core.** Heart of lease-up execution. |
| **Inbox** (F4) | Leasing Agent / Broker | Owner / AM (oversight) | **Core**, but scope to prospect/leasing comms first (SCOPE_AUDIT: pull vendor/resident threads out of the primary story). |
| **Rents** (F5) | Owner / AM (set) | Agent/Broker/PM (quote, read) | **Core.** Pricing + market-rent aggregation. |
| **Applications** (F6) | Leasing Agent / Broker + Owner/AM (approve) | — | **Core.** Where prospects become revenue. |
| **Reports** (F7, id `lp`) | Owner / AM + Lender (curated) | Broker (own scorecard) | **Core**, but audience-split (see §3). |

### Support — keep but demote; fold into a primary surface (SCOPE_AUDIT "Keep But Demote")
| View | Whom it really serves | Verdict |
|------|-----------------------|---------|
| **Market** (`COMPS`) | Owner / AM | **Demote to support for Model + Rents**, not a standalone module (SCOPE_AUDIT). |
| **Concessions** | Owner / AM | **Demote into Rents/Model/Today** (SCOPE_AUDIT). |
| **Listings** | Leasing Agent / marketing | **Demote to a lease-up support module** feeding Pipeline (SCOPE_AUDIT). |

### Noise for the primary buyer right now — demote hard, stop investing (SCOPE_AUDIT "Excessive For Now" + "Recommended Near-Term Cuts")
| View | Whom it *would* serve later | Why it's noise for the buyer now |
|------|------------------------------|----------------------------------|
| **Residents** | PM / long-term holder post-signing | Full renewal/delinquency machinery is post-stabilization; keep only as "converted applicant + move-in readiness" (SCOPE_AUDIT). Weakest for merchant-builders. |
| **Maintenance** | PM | Full PM feature; doesn't serve the pre-funding wedge or lease-up velocity. Keep only if reframed as unit-readiness/turn punch-list (SCOPE_AUDIT). |
| **Vendors** | PM / ops | Not central to lease-up; keep only as leasing-launch vendors (signage, photography, staging) (SCOPE_AUDIT). |
| **Collection** | Owner (post-stabilization) | Premature; keep only deposit + first-month + failed-payment follow-up (SCOPE_AUDIT). Ties to the *future* payments engine, not the current wedge. |
| **Ledger** | Owner / accounting (later) | Too accounting-heavy; full operating ledger can wait — keep only deposits/app-fees/first-rent (SCOPE_AUDIT). |
| **Documents** | All (supporting) | Not a standalone module; tie files to leases/apps/deposits/lender package (SCOPE_AUDIT). |
| **Settings** | Owner (admin) | Generic admin; recommended near-term cut from primary attention (SCOPE_AUDIT). Note: the role model in this spec *lives* here (invites, permissions), so it can't be deleted — just not featured. |

**Net:** of 17 views, **7 are core to the buyer**, **3 are support to fold in**, and **7 are
noise for the primary buyer today** — closely matching SCOPE_AUDIT. The prototype's own nav
already hints at this hierarchy: only Model/Today/Pipeline/Inbox/Rents/Applications/Reports get
F-keys in `PRIMARY` (`shell.jsx`); everything else is buried in the `⌘\` sidebar. The role model
sharpens *why*: the demoted views mostly serve the **PM persona**, who is the lowest-trust
collaborator and not the buyer.

---

## 5. Role-model implications for the first-time experience

The prototype assumes The Meridian already exists and drops the user straight into a live portfolio
(Bible gap #2: "no first-time / create-project path"). The role model dictates the correct
sign-up sequence.

**Who signs up first: always the Owner/Sponsor.** There is no scenario where a broker, PM, or
leasing agent creates the account — they are all *invited*. The first-run must therefore be built
for the **first-time single-asset sponsor** (§1.3), pre-funding, with no team yet. The very first
thing they do is **create a project and pick its stage** (pre-funding / funded-pre-launch /
active lease-up / stabilized — SCOPE_AUDIT First-Time Project Creation), which also sets which
surfaces are even relevant.

**The invite order follows the operating model, and it should be a deliberate step, not an
afterthought:**
1. **Owner creates the project and builds the Model *solo*.** No collaborators needed for the
   wedge — the lender package can be produced by one person. This is critical: the product must
   deliver its first value (a lender-ready plan) with a team size of **one**, before asking the
   owner to change any staffing behavior (PRODUCT_DIRECTION Strategic Risk).
2. **At funding/launch, the owner chooses the operating model** (in-house / broker-assisted /
   PM-managed). *This choice is the fork that drives who gets invited next* — it should be an
   explicit product moment, ideally emerging from the broker-vs-in-house decision the owner just
   made in the Model (`BROKER_ECONOMICS`).
   - Chose **in-house** → invite the **Leasing Agent** (act on Pipeline/Inbox/Applications).
   - Chose **broker-assisted** → invite **Broker(s)** into scoped guest workspaces.
   - Chose **PM-managed** → invite the **PM** into scoped operational access.
   - Any multi-asset owner → optionally invite an **Asset Manager** as near-owner.
3. **The lender/observer is invited (or sent a package) last and separately**, as a curated
   read-only audience, if at all (see Open Questions).

**Empty-state consequence.** Each invited role needs its *own* first-run empty state framed around
its job, not the owner's: the leasing agent's first screen is "here are your assigned leads," the
broker's is "here are your leads and your SLA clock," the lender's is "here is the package to
review." SCOPE_AUDIT calls for "more guided empty/first-time states" (Pass 4) — the role model
says there must be **one per role**, not one global one.

**A note on the demo/golden path.** The 20 Journeys spec will own the end-to-end narrative, but
the role model constrains it: the golden-path demo should be told from the **owner's** seat
(create project → Model → lender package → launch → one lead-to-lease → deposit → report), with
collaborator roles appearing as *hand-offs the owner delegates and then watches*, reinforcing
"visibility flows up, not out."

---

## Open Questions / Conflicts

**For the lead / Justin to decide:**
1. **Owner vs Asset Manager — one role or two?** I've modeled AM as a near-owner permission tier
   (act everywhere, no money/org-admin). But the prototype's single "owner" identity already
   *acts* like an AM. Decision needed: is AM a real invited role at launch, or a post-launch
   permission we stub now? (Leans: stub the split, don't build two products.)
2. **Does the Lender/Observer get a login at all, or only exports?** The Bible says lenders are an
   *output* audience, which argues for **no interactive login — just the exported package + weekly
   report.** But a read-only observer login is a plausible trust-builder. This materially changes
   whether "Reports/Model (curated)" is a live surface or a PDF. Needs a call.
3. **How granular is broker scoping at launch?** True per-broker lead/unit scoping with commission
   attribution is real engineering. For the *conceptual prototype* we can show it; for a first
   build, is broker access "your assigned leads only" (hard) or "the whole pipeline, read-mostly"
   (soft)? The anti-fragmentation + expose-underperformers goals argue for hard scoping, but it's
   the heaviest role to build.
4. **Multi-asset roles vs single-asset MVP.** The property switcher implies a portfolio, but the
   first-run is built for a single-asset first-timer. Do collaborator permissions need to be
   *per-property* from day one (a broker on Meridian but not Brix), or is org-wide scoping
   acceptable for the MVP? Per-property is more correct; org-wide is simpler.
5. **Merchant-builder vs long-term-holder default.** I recommend defaulting to the long-term/
   in-house framing (exercises the full thesis) but not requiring it. If the actual go-to-market
   targets merchant-builders first, the resident/payments-permanence story weakens and the role
   model should de-emphasize Residents/Collection even further.

**Possible conflicts with the parallel specs (flag for the lead to reconcile):**
- **With 30 Data Model:** My permission matrix assumes the entities carry an **owner/assignee and
  a property scope** (a Lead has an assigned agent/broker; a Report has an audience; a Deposit is
  owner-controlled). If the 30 spec models `User`/roles differently — e.g., a flat user list
  without per-entity assignment or per-property scoping — the "scoped" cells in §3 won't be
  expressible. The role model *requires* assignment + scope on Lead, Unit, Application, Report,
  and Deposit. This should be reconciled early.
- **With 20 Journeys:** I've asserted the golden path is told from the **owner's seat** with
  collaborators as delegated hand-offs, and that first value must be deliverable by a **team of
  one** pre-funding. If the Journeys spec centers a multi-role demo (e.g., a broker-driven story)
  or assumes a team is present at project creation, that conflicts with the "owner signs up first,
  alone" position here.
- **On "Reports" naming:** the prototype's nav id is `lp` (LP reporting) but the label is
  "Reports," and SCOPE_AUDIT wants lender/owner/broker reports, not just LP letters. I've treated
  it as the **audience-split Reports surface**, which is broader than "LP." If another spec treats
  `lp` as strictly LP/investor reporting, that's a scope collision to settle — and note it leans
  toward the *investor* framing the Bible explicitly de-prioritized.
