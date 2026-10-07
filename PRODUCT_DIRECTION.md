# LeaseRight Product Direction

**As of:** 2026-09-28

**Controlling business source:** [`spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`](spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md)

## Core Thesis

LeaseRight should be underwritten as a rent-payment-volume business with a paid lease-up wedge. Its
strongest viable form is a paid, owner-controlled plan-to-actual lease-up command center with hybrid
execution for developers and small-to-mid portfolio owners who need to get units rented on time
without absorbing the cost and bloat of traditional property management software or full-service
brokerage.

The promise:

- Developer-first, not property-manager-first.
- Built around lease-up velocity, not generic property administration.
- Give the owner one frozen lease-up baseline against weekly actuals, with the owner controlling the
  data and the building operator working the owner's leads in the command center.
- Make it possible to run leasing in-house or through a hybrid operator model with better visibility
  and less coordination drag.
- Lead commercially with one fixed, upfront five-figure, stage-gated project pilot: paid Model
  reconstruction, a frozen baseline, and payment diligence first; a conditional 60-day operating
  test second.
- Treat `$1/unit` as secondary positioning, not the core promise or the P&L.
- Screen the intended long-term rent-processing engine at 5–10 basis points of net LeaseRight
  revenue on processed rent volume; this is an underwriting range, not evidence of realized margin.
- Keep live rent processing out of the operating pilot. It is a separately authorized beta only
  after payment-partner economics, legal architecture, shadow reconciliation, production security
  controls, and operating validation clear their gates.

## Market Wedge

The target moment is earlier than traditional property management adoption: before the sponsor/developer is funded and before they commit to AppFolio, Buildium, Yardi, a broker-led process, or a property management company stack.

LeaseRight should first help the sponsor model and explain the lease-up stage for lenders and capital partners. Once the project is funded and the sponsor is already using LeaseRight to understand lease-up risk, the same system becomes the building's lease-up operating layer.

The product should become the first system of record during lease-up:

1. Model lease-up assumptions before funding.
2. Produce lender-ready lease-up plans, absorption curves, rent/concession scenarios, and staffing assumptions.
3. Import property/unit data when the building moves toward launch.
4. Launch listings and leasing workflows.
5. Capture leads, tours, applications, approvals, leases, deposits, and rent payments.
6. Keep the developer, leasing team, brokers, and property manager aligned.
7. Stay in place after stabilization because payments, resident records, leases, and ledger history already live there.

The strategic wedge is not "property management software, cheaper." It is "lender-ready lease-up planning that becomes the control center, then the permanent payments and resident infrastructure."

## Primary Customer

Developer / owner / asset manager with upcoming units to lease.

Typical profile:

- Cost-sensitive but not unsophisticated.
- Wants units rented on schedule.
- Does not want brokerage and PM overhead if avoidable.
- May have someone on-site or in-house who can handle leasing if given the right system.
- May still use a broker or PM company, but wants visibility and control.

## Pre-Funding Entry Point

LeaseRight should be useful before there is a live building to operate.

This is the acquisition wedge:

- Sponsor creates a project.
- Enters unit mix, expected rents, concessions, delivery schedule, budget, and target stabilization date.
- Models lease-up velocity by week/month.
- Tests scenarios: base case, slow case, aggressive case, broker-led case, in-house case.
- Generates lender-facing outputs showing lease-up assumptions, risk, staffing, and cash timing.
- Keeps the model alive after funding instead of letting it die in a spreadsheet.

This creates a natural path from underwriting to operations:

1. Model the lease-up.
2. Get the lender comfortable.
3. Fund the project.
4. Turn the model into the live lease-up board.
5. Collect deposits and rent through LeaseRight.

The product should make the developer feel like LeaseRight reduces lender uncertainty before it asks them to change how leasing is run.

## Sponsor Intake

The intake process is one of the highest-value product surfaces. It should not feel like a generic setup wizard. It should feel like LeaseRight is helping the sponsor turn a rough project into a lender-ready lease-up plan.

The intake should collect:

- Sponsor and project profile.
- Address, submarket, delivery date, and construction schedule.
- Unit mix, unit premiums, parking/storage assumptions, and target rents.
- Pro forma rents, concessions, vacancy, and stabilization assumptions.
- Comparable properties, current concessions, listing rents, and occupancy signals.
- Broker plan, in-house staffing plan, or hybrid leasing strategy.
- Marketing budget, listing channels, and expected lead volume.
- Lender/capital partner reporting needs.

The intake should produce:

- Absorption curve.
- Base/downside/upside lease-up scenarios.
- Rent confidence score.
- Concession budget and sensitivity.
- Broker vs in-house vs hybrid cost comparison.
- Staffing recommendation.
- Lender-ready PDF and spreadsheet export.
- Live operating board once the building launches.

The intake should make savings tangible:

- What a traditional broker-led lease-up is expected to cost.
- What an in-house leasing hire or hybrid model would cost.
- How much commission leakage can be avoided.
- Which unit types may still justify broker help.
- How much delay costs in monthly carry and lost rent.

This is where LeaseRight can become a de facto market-rent aggregation layer. Every project intake, comp set, listing scrape, broker opinion, signed lease, and concession result should improve future rent assumptions.

## User Modes

LeaseRight should support three realistic operating models.

### 1. Owner-Led / In-House Leasing

Best-case model.

The developer hires or assigns an internal leasing person, often on-site. LeaseRight gives that person the workflow to run tours, follow-ups, applications, lease signing, deposits, and move-ins.

Product goal:

- Make a non-enterprise leasing operator feel competent.
- Replace expensive brokerage dependency for straightforward lease-ups.
- Give the owner visibility without daily status calls.

### 2. Broker-Assisted Leasing

Realistic transitional model.

The developer still uses brokers, but LeaseRight becomes the command center. Brokers can receive leads, update status, log tours, upload notes, and push applications through the same system.

Product goal:

- Empower productive brokers.
- Expose underperforming brokers.
- Prevent lead/status fragmentation.
- Keep all lease-up data owned by the developer.

### 3. PM-Managed Leasing

Common but less ideal.

The developer makes the property manager use LeaseRight during lease-up, even if the PM uses another system internally.

Product goal:

- Give the developer live visibility.
- Prevent the PM from hiding behind vague weekly updates.
- Preserve the developer's data and payments relationship.

## Broker Strategy

LeaseRight should not frame itself as anti-broker in the UI.

The stronger position:

- "Use brokers when they help. Stop paying for opacity when they don't."
- Make broker performance measurable.
- Let owners route leads to internal staff, external brokers, or both.
- Treat brokers as external collaborators, not the system owner.

Potential broker features:

- Broker guest access.
- Lead assignment and SLA tracking.
- Tour logging.
- Commission attribution.
- Broker performance scorecard.
- Broker export/report package.

## Product Purpose

The core job is to answer:

"Are we going to get this building leased on time, at the rents we expected, with the fewest unnecessary people and fees involved?"

Every major feature should support one of these outcomes:

- More qualified leads.
- Faster follow-up.
- More tours.
- Better pricing decisions.
- Faster applications.
- Faster lease execution.
- Cleaner deposits and rent payments.
- Clearer accountability.
- Lower operating overhead.
- More credible lender/capital partner communication before lease-up begins.

## MVP Functional Scope

The first sellable product should focus on lease-up execution, not full property management parity.

### Must Have

- Pre-funding project setup.
- Unit mix and rent assumption model.
- Lease-up absorption schedule.
- Concession and pricing scenarios.
- Lender-ready lease-up report.
- Property and unit setup.
- Unit availability and pricing table.
- Lead inbox from forms, email, and manual entry.
- Prospect pipeline.
- Tour scheduling and follow-up tasks.
- Application tracking.
- Lease status tracking.
- Deposit/payment collection path.
- Developer-facing lease-up dashboard.
- Broker / leasing-agent assignment.
- Basic resident record after conversion.

### Should Have

- Listing links and syndication status.
- Concession tracking.
- Rent recommendation notes.
- Traffic source tracking.
- Application approval checklist.
- Move-in checklist.
- Weekly owner report.
- Simple document vault.

### Later

- Full accounting.
- Maintenance operations.
- Full resident portal.
- Deep PM replacement workflows.
- Listing syndication integrations.
- Screening integrations.
- AI leasing assistant.
- Broker marketplace.

## UX Principle

The app should feel like a lease-up command center, not generic accounting software. The current Bloomberg-terminal style is useful because it communicates control and velocity, but it should be toned down into a calmer sponsor-grade operating console.

The interface should preserve:

- Dense information.
- Strong status visibility.
- Fast scanning.
- Clear accountability.

The interface should reduce:

- Visual noise.
- Too many simultaneous accents.
- Overly loud market-tape energy where the user needs confidence and clarity.

Default views should prioritize:

- Model: lender-ready lease-up assumptions before funding.
- Today: what needs action now.
- Pipeline: every prospect and bottleneck.
- Units/Rents: what is available, priced wrong, or stuck.
- Inbox: all leasing communication in one place.
- Applications: who can become a lease today.
- Reporting: what the developer needs to know this week.

The product should make inaction visible.

## Business Model

### Near-Term Commercial Wedge

The first commercial product is one fixed, upfront five-figure, stage-gated project pilot priced
from scoped deliverables and project band:

1. Phase A is paid Model reconstruction, a frozen baseline, and payment diligence.
2. Phase B is a conditional 60-day operating test, activated only after the Model reconciles and
   the real workflow, commission policy, and brokerage/payee path are known.
3. Live rent processing is not Phase B. Until continuity and realized economics are observed,
   underwrite the near-term company on a profitable project fee.

`$1/unit` is secondary positioning, not the core promise or the P&L. Do not lead the first sales
artifact with it. The current materials do not define its billing period.

### Intended Long-Term Economic Engine

The intended long-term engine is net LeaseRight revenue on processed rent volume. Processed payment
volume is collectible rent actually routed through LeaseRight's contracted payment partner, net of
reversals and excluding checks, cash, and security deposits. Gross resident fees, processor revenue,
and rent principal are not LeaseRight revenue.

- Use 5–10 net bps of processed rent volume as the commercial underwriting range: 5 bps is the
  downside and 10 bps is the screen for a tightly gated beta, not proof of the core P&L.
- Treat 25 bps only as a stretch contract case supported by a written contract. Do not use 50 bps.
- Default to resident-free ACH and validate any processor residual in writing. Track a separate
  owner-paid application/platform fee as a different revenue line, not processing-fee-share evidence.
- Exclude security deposits and third-party payouts from the first beta. Cards are not the margin
  thesis and require processor and counsel approval of the fee treatment.
- Potential insurance, screening, and service-marketplace revenue remains later optionality, not
  part of payment-engine underwriting.

The payment engine is portfolio-scale, not building-scale, and is not yet evidenced. It becomes the
core economic engine only when realized dollars per retained unit per year, contract survival at
stabilization, and a credible acquisition path can retain roughly 50,000 comparable units.

### Live Rent-Processing Gate

Do not move money in Phase B. Live rent processing requires a later, separate authorization after:

1. **Payment-partner validation:** the sponsor controls the payment stack, loan documents permit the
   payout path, and a written processor proposal produces at least 10 bps expected net take after
   modeled variable payment costs or a contractual minimum with equivalent economics.
2. **Legal validation:** payments counsel approves the exact direct-charge, fee-incidence,
   ACH-authorization, fallback, privacy, and deposit-exclusion design.
3. **Reconciliation validation:** two shadow-reconciliation cycles balance from obligation through
   payment, fee, settlement/payout, and ledger; exception ownership is named and data is portable.
4. **Security and operating validation:** the production controls the synthesis identifies—including
   a backend, secret management, idempotency, immutable processor events, authorization artifacts,
   daily ledger reconciliation, RBAC/audit logs, retention and incident procedures, and support
   escalation—exist before production money movement.

Only then may LeaseRight authorize the synthesis's separate, capped ACH-first beta and measure
routed volume, adoption, payment success, returns and disputes, reconciliation breaks and labor,
support contacts, settlement timeliness, and realized net bps.

At the current 260-unit / `$2,180` repository assumptions, 95% occupied/collectible rent and 80%
LeaseRight adoption produce about `$5.17M` annual processed payment volume. That yields only about
`$5.2K` per asset at a 10-bps net take and requires roughly 50K comparable units for `$1M` of annual
net payment revenue. The business therefore needs both payment economics and a credible path to
retain portfolio-scale volume after stabilization, sale, lender cash-management, and PM handoff.
At 10 bps the payment line is only `$1.66` per total unit per month, so the mechanism is better than
the prior `$1/unit/month` interpretation mainly because it is rent-indexed and can persist—not
because it is a different order of magnitude. Measure realized `$/retained unit/year`,
payment-engine survival at stabilization, and
retained PPV acquired per sales/implementation dollar; net bps alone does not establish the engine.

## Strategic Risk

The `$1/unit` secondary positioning may be compelling, but the software still needs enough real
utility that developers trust it before payment monetization can be validated.

The biggest product risk is building too much generic property management—or a live payment rail—
before nailing the lease-up workflow and validating partner economics.

The biggest business-model risk is that a pure processor share nets below 5–10 bps while the wedge
customer sells the asset or hands payments to a PM at stabilization. LeaseRight must earn and retain
the payment relationship across that transition; one lease-up building cannot prove this.
The first commercial contract should therefore test assignment/continuity, successor-PM treatment,
the right to bid on processing at stabilization, and lender cash-management disclosure. Refusal
classifies the engagement as wedge-only; it does not prevent a profitable project-fee pilot.

The biggest adoption risk is asking developers to change staffing or resident payment behavior too
early. LeaseRight should support in-house leasing, broker-assisted leasing, and PM-managed leasing,
while treating PM-managed assets as payment-engine ineligible unless the contract preserves
LeaseRight's payment rail and economics.

## Near-Term Build Direction

The current prototype should be refined around the lease-up workflow first:

1. Make the pre-funding Model the primary front door.
2. Make Today, Pipeline, Inbox, Rents, Applications, and Reports feel real.
3. Calm the visual system while keeping the dense command-center advantage.
4. Reduce or defer generic PM modules that distract from lease-up.
5. Add explicit owner / leasing agent / broker roles.
6. Make every lead, unit, tour, application, and lease status connected.
7. Build a realistic demo flow from lender-ready model to active lease-up to signed lease to a
   payment-ready rent obligation. Do not simulate custody, settlement, or platform revenue.
8. After the processor, legal, and shadow-ledger gates clear, make Rents the stabilization-handoff
   surface for payment enrollment, contract continuity, successor ownership/management, and
   realized dollars per retained unit. Do not build this before live-payment authorization.
