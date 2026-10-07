# Overseer synthesis — LeaseRight model viability, payment engine, and agent role

**Project:** LeaseRight  
**Prepared for:** Justin  
**As of:** 2026-09-02  
**Confidence:** Decision-ready for a validation pilot; payment economics and retention are
shareable only as underwriting sensitivities until a processor proposal, sponsor statements, and
contract-continuity evidence exist

## The answer

**LeaseRight should be underwritten as a rent-payment-volume business with a paid lease-up wedge.**
Justin's correction is economically coherent: `$1/unit` is secondary positioning, not the P&L.
But the engine is portfolio-scale, not building-scale, and it is not yet evidenced. The repository
contains no customer payment, live operating usage, agent registration, payment margin, processor
agreement, or repeatable acquisition evidence.

The commercial screen that should control is **5–10 basis points of net LeaseRight revenue on
processed rent volume**. That is a partner-residual underwriting range, not proof of a core engine.
A **25-bps net take is a stretch contract case** that likely requires a separate owner-funded
application/platform fee or unusually favorable wholesale economics. **Do not use 50 bps in the
plan:** no source or proposal supports it, and it would exceed the per-unit revenue of AppFolio's
entire bundled value-added-services line on these rent assumptions.

At the current Meridian assumptions, one 260-unit stabilized asset generates about `$5.17M` of
annual processed payment volume (PPV) and only `$2.6K–$5.2K` at 5–10 bps. At 10 bps that is
`$1.66` per total unit per month, versus `$1.00` under the prior monthly interpretation of the line
Justin demoted. Payments are a
better mechanism—rent-indexed and harder to displace once adopted—but not a different order of
magnitude. Reaching `$1M` of annual net payment revenue requires about `$1B–$2B` of PPV, or roughly
`50K–101K` comparable total units. Retention through stabilization and a low-CAC way to acquire
stabilized units matter more than squeezing a few additional basis points from one processor.

The strongest viable version is a **paid, owner-controlled plan-to-actual lease-up command center
with hybrid execution**:

- The owner/sponsor buys it, controls the data, and uses one frozen lease-up baseline against
  weekly actuals.
- The building's operator—an in-house team, PM, or exclusive lease-up broker—works the owner's
  leads in the authenticated command center.
- Outside locators, tenant representatives, and Realtors bring incremental demand through a thin
  inventory → client registration → tour/application → attribution → commission-status rail.
  They do not maintain the owner's CRM or submit to an owner scorecard.
- The first commercial product is one **fixed, upfront five-figure, stage-gated project pilot**.
  Phase A is paid Model reconstruction, a frozen baseline, and payment diligence. Phase B is the
  60-day operating test, activated only after the Model reconciles and the real workflow,
  commission policy, and brokerage/payee path are known. Live rent processing is not Phase B; it
  is a separate beta after partner, legal, and shadow-reconciliation gates clear.
- Price the first pilot from its scoped deliverables and project band, not from the current demo's
  carry delta. Use the sponsor-agreed carry at risk as the value case after Phase A; do not make
  payment a contingent percentage of claimed savings that pilot one cannot causally attribute.
- `$1/unit` is secondary positioning. Net rent-processing economics are the intended long-term
  engine, while the achievable take rate and compliant funds flow remain unvalidated sensitivity
  inputs until sponsor data, a processor proposal, and legal review exist.

This is a **provisional go for a paid validation pilot**, targeted first at a long-term holder with
payment-stack authority and, preferably, an existing stabilized asset whose payment history can be
tested without waiting for the new building to fill. Until continuity and realized economics are
observed, underwrite the near-term company on a profitable project fee and treat payments as a
retention annuity with core-engine potential. This is not a go for N3–N17, a generic
property-management rebuild, an agent marketplace, a live payment rail, or public launch.

## Payment-engine underwriting

### Definitions that control

**Processed payment volume (PPV)** is collectible rent actually routed through LeaseRight's
contracted payment partner, net of reversals and excluding checks, cash, and security deposits.

**Net LeaseRight take rate** is platform/application fees plus contracted processor revenue share,
less payment costs borne by LeaseRight, verification, returns, disputes, fraud loss, and variable
payment support, divided by PPV. Gross resident fees, processor revenue, and rent principal are not
LeaseRight revenue.

Base planning inputs are `260` total units and `$2,180` monthly rent from the repository, plus
explicit underwriting assumptions of `95%` occupied/collectible rent and `80%` payment adoption:

```text
Annual billed rent = 260 × $2,180 × 12 = $6,801,600
Base PPV           = $6,801,600 × 95% × 80% = $5,169,216
PPV / total unit   = $19,881 per year
```

| Net LeaseRight take | Revenue / total unit / month | Revenue / 260-unit asset | PPV for `$1M` revenue | Units for `$1M` | 260-unit assets for `$1M` |
|---:|---:|---:|---:|---:|---:|
| 5 bps — residual downside | `$0.83` | `$2,585` | `$2.0B` | `100,596` | `387` |
| **10 bps — underwriting screen** | **`$1.66`** | **`$5,169`** | **`$1.0B`** | **`50,298`** | **`194`** |
| 25 bps — stretch contract case | `$4.14` | `$12,923` | `$400M` | `20,119` | `78` |

For `$5M` of annual net payment revenue, multiply every PPV, unit, and asset requirement by five.
The result is not a verdict that payments cannot work. It is a verdict that **distribution and
retention of the payment relationship are as important as the take rate**.

### What is realistic

The public evidence supports a range, not a quoted LeaseRight margin:

- Stripe's current standard price is 0.8% for ACH Direct Debit, capped at `$5`; at `$2,180`, the
  full processor fee is 22.9 bps before any LeaseRight share. An illustrative 20%–40% share of that
  gross fee is only 4.6–9.2 bps on ACH volume before LeaseRight-borne costs. Stripe confirms that
  eligible SaaS platforms can receive revenue share but does not publish the share or its basis.
- Public rent-payment prices span free ACH to the resident at Zillow, `$1` at RentRedi, `$2` at
  TurboTenant, and `$0.60–$2.35` incoming EFT pricing across Buildium plans. These are customer
  prices, not platform margins, but they show that the visible ACH fee pool is usually measured in
  dollars per payment rather than a large percentage of rent.
- Card pricing offers no dependable thesis. Stripe's public domestic-card price is 2.9% + `$0.30`,
  while public rent platforms commonly charge roughly 2.95%–3.49%. The apparent spread must absorb
  card type, network, dispute, fraud, refund, and support costs, and U.S. card-brand surcharge rules
  prohibit surcharging debit/prepaid cards. Do not underwrite card margin until the processor
  approves the exact fee design.
- AppFolio's 2025 filing shows why the category can be valuable at scale: 9.4 million ending units
  and `$721.5M` of value-added-services revenue versus `$211.5M` of subscription revenue. The VAS
  line is `$76.76` per ending unit, or roughly 38.6 bps-equivalent on LeaseRight's PPV-per-unit
  assumption. But AppFolio records payment fees gross of processing costs, the bucket combines
  payments, screening, risk, maintenance, and business-optimization services, and ending units are
  not an average-year denominator. It is a scale-and-bundle check, not a net take-rate comparable.

Therefore: **screen at 10 bps, test 5 bps as downside, require a written contract before using
25 bps, and omit 50 bps.** If a proposal yields below 5 bps with no recurring minimum, payments are
a product benefit, not the core P&L. Clearing 10 bps is enough to justify a tightly gated beta; it
is not enough to classify payments as the business without evidence that LeaseRight can retain or
acquire roughly 50K comparable units.

### Retention and acquisition economics

The 50K-unit requirement is a **stock**. LeaseRight's current lease-up wedge produces a **flow** of
projects that can terminate at stabilization—exactly when rent volume begins. Let `r` be the share
of won buildings whose payment relationship survives sale, PM handoff, lender cash-management, and
contract rollover; let `d` be annual attrition on the surviving payment base. The table below is a
stress test, not a market forecast; the survival and attrition inputs are unvalidated judgments.

| Illustrative `r` / `d` | Undiscounted lifetime payment revenue / won asset at 10 bps | Annual 260-unit lease-up wins needed to sustain ~50K retained units | Take rate where lifetime payments equal one `$25K` project fee |
|---:|---:|---:|---:|
| 35% / 15% | `$12.1K` | `~83` | `20.7 bps` |
| 60% / 12% | `$25.8K` | `~39` | `9.7 bps` |
| 100% / 15% | `$34.5K` | `~29` | `7.3 bps` |

This changes the interpretation, not the arithmetic. In the low-survival illustration, 10 bps
produces only 0.48× one `$25K` project fee over the asset's payment life and needs about 83 new
lease-up wins every year to maintain the 50K-unit stock. In the stronger-continuity illustration,
the same 10 bps roughly matches the project fee and needs fewer than half as many annual wins.
**Contract survival and the ability to onboard stabilized portfolios without a bespoke lease-up
engagement are therefore the decisive engine variables.**

The controlling KPIs are now:

- **realized dollars per retained unit per year**, after all variable payment costs;
- **engine survival at stabilization**, measured as eligible PPV contractually retained through
  sale, PM handoff, lender requirements, and renewal; and
- **retained PPV acquired per dollar of sales and implementation cost**, split between the lease-up
  wedge and any direct stabilized-portfolio channel.

Net bps remains an important unit-economics input. It is not the outcome metric by itself.

### Adoption design

The recommended fee incidence is **free ACH to the resident, optional card at fully disclosed cost,
and processor-funded residual economics where available**. Free resident ACH does not inherently
zero the engine: in a SaaS/direct-charge structure, the landlord's connected account can pay Stripe
while LeaseRight qualifies for revenue share. A separate owner-funded application/platform fee can
support the economics, but classify it as owner software/platform revenue—not evidence that a share
of processing fees works. Either source requires the owner to value automated posting, settlement
reconciliation, failure recovery, and one lease-to-ledger identity chain.

- **Owner:** credit part of the paid pilot against future payment minimums after an adoption gate;
  show reconciliation labor saved and payment exceptions resolved, not only portal usage.
- **Resident:** free ACH, clear opt-in autopay, advance amount notice, receipts, easy revocation,
  understandable retry handling, and a traceable non-digital fallback.
- **Operator/PM:** zero duplicate posting, clear exception ownership, and a commercial share or
  statement credit where the PM currently controls payment economics. PM-managed mode is not
  automatically engine-forfeit, but it is engine-ineligible unless the contract preserves
  LeaseRight's payment rail and economics.
- **Lender:** the processor payout account and settlement timing must comply with the actual loan
  documents. Sponsor authority alone does not override a lockbox or deposit-account control
  agreement.

When a live beta is authorized, `Rents` should become the stabilization-handoff surface: resident
payment enrollment, contract-continuity state, successor-owner/PM responsibility, the transition
checklist, and realized `$/retained unit/year`. Do not build that surface before the commercial,
legal, and shadow-ledger gates; it outranks originator polish once payments are authorized because it
tests whether the engine survives the lease-up.

### Regulatory and operating boundary

The near-term architecture is a processor-hosted **SaaS/direct-charge** model:

```text
resident → processor-connected landlord merchant account → approved landlord/lockbox account
                         └─ contracted application fee or revenue share → LeaseRight
```

The landlord/property entity is merchant of record; the processor handles onboarding, regulated
payment rails, credential tokenization, settlement, and contractually assigned loss risk.
LeaseRight should not hold rent, pool balances, delay settlement, or manually route funds.

This structure reduces risk but does not remove legal work. FinCEN's payment-processor exemption is
facts-and-circumstances based and lists four conditions. Texas Finance Code §152.004 separately
provides an agent-of-payee exemption only when a written agreement, public holding-out, and
extinguishment/no-payor-loss conditions are met. Counsel must approve the contracts and flow.
Recurring ACH also requires Regulation E authorization/copy and varying-amount controls; Nacha WEB
debits require account validation on first use or account change. ACH is delayed, can fail after
initiation, and personal-account debits can generally be disputed for up to 60 days.

Security deposits and third-party payouts are excluded from the first beta. Production also
requires a backend, secret management, idempotency, immutable processor events, authorization
artifacts, fee allocation, settlement/payout/return/refund/dispute state, daily ledger
reconciliation, exception ownership, RBAC/audit logs, retention and incident procedures, and
support escalation—none of which exists in the static prototype.

## Evidence behind the recommendation

| Evidence | Implication |
|---|---|
| The canonical product direction centers the owner's real problem: hit stabilization on schedule while protecting rent, concessions, carry, and visibility. `SCOPE_AUDIT.md` narrows the coherent journey to Model → Today → Pipeline → Inbox → Rents → Applications → Reports. | The plan-to-actual owner command center is the product core. |
| The app is a static React/Babel prototype with mock data and no backend, auth, durable store, or production payment rail. The Model directly calls the corrected `brokerEconomics` helper, but no view consumes the shared `Selectors.` spine; active operating screens still use legacy literals and local state. | The repository proves workflow language, visual shape, and one corrected calculator—not a connected operating system or adoption. |
| At `$1/unit/month`, the 260-unit Meridian produces only `$3,120/year`; the current copy does not even define the billing period. The same seed assumes `$227,000/month` of carry. | The current software price cannot be the near-term economic engine. |
| The corrected staffing calculator now shows Exclusive `$283,400`, In-house `$166,500`, and Hybrid `$198,860` (`$85,500` payroll + `$113,360` commissions at 40% outside origination). Hybrid's apparent `$84,540` savings equal only 11.3 modeled carry days. | Small velocity differences can reverse the staffing ranking. Hybrid is a test default, not a proven winner. |
| The underlying Model is still internally inconsistent: staffing assumes 9 months/~39 weeks; base carry implies 7.53 months/~32.7 weeks; the absorption plan has 79 points/~78 weeks. Scenario date deltas do not reconcile to `$227,000/month` carry (about `+$148K` base→downside and `−$278K` base→aggressive). Actuals average 8.07 leases/week through week 15 versus a 5.1 aggressive case, while the 3BR tail implies 55 more weeks at 0.4/week. | The Model must be rebuilt from one sponsor's source assumptions before it can support a carry-based value case or lender report. This is the pilot instrument, not demo polish. |
| `SEED` has 24 leads, one owner, one in-house agent, no outside-agent source, no registration, no brokerage, and no commission entity. | Agent participation is completely untested. Build only the smallest behavior surface needed for real registrations. |
| Generic property management and leasing features are already bundled by established products; for example, Buildium starts at `$62/month` with leasing, communications, reporting, and payments, while AppFolio markets end-to-end leasing and an integrated leasing CRM. | LeaseRight should not compete on low-cost PM feature parity. Its differentiation must be the lease-up baseline-to-actual loop and the originator trust rail. |
| In Texas, compensated apartment locators must generally be licensed, and a sales agent generally receives transaction compensation through the sponsoring broker. | An Austin pilot must record license and brokerage affiliation and make the brokerage the default payee/confirmation recipient, subject to counsel review. |

Current official product, regulatory, and market references are listed in the primary-source
receipt below. Time-sensitive references were rechecked on 2026-09-02; legal implementation still
requires payments and Texas counsel rather than relying on this product-design synthesis.

## Debate reconciliation

| Disagreement | Reconciled decision |
|---|---|
| 242 occupied units at 100% routing vs. 260 units at 95% collectability and 80% adoption | Use a transparent funnel: total units × rent × occupied/collectible share × LeaseRight adoption. The current underwriting case is `$5.17M` PPV; the Contrarian's `$6.33M` is a useful full-routing ceiling, not the base. |
| 5–10 bps vs. 25–50 bps | Screen at 10 bps with 5 bps downside. Treat 25 bps as a stretch contract case. Strike 50 bps from the plan; none of the remaining cases is a market quote. |
| Take rate vs. retention as the core variable | Keep 10 bps as the minimum commercial screen for a beta, not as proof of the engine. Classify the engine on realized `$/retained unit/year`, survival at stabilization, and a credible path to retained portfolio scale. The illustrative 35%-survival/15%-attrition case needs ~21 bps for lifetime payment revenue to equal one `$25K` project fee. |
| Free ACH kills the engine vs. free ACH maximizes adoption | Free ACH to the resident can coexist with a SaaS-platform processor share. It only kills the processing-fee thesis if nobody funds a fee pool or share. Default to resident-free ACH and validate the processor residual in writing; track any separate owner-paid application/platform fee as a different revenue line. |
| Long-term holder only vs. any paid lease-up | Prefer a long-term holder with payment authority. A merchant-builder can still validate the paid wedge, but the readout must say it did not validate the payment engine unless the post-sale payment contract is assignable and retained. |
| PM-managed mode is engine-forfeit vs. supported operating mode | PM-managed mode remains supported for the wedge but is engine-ineligible unless the PM contract preserves LeaseRight's rail and economics. Do not assume a PM will surrender incumbent margin. |
| Partner residual vs. LeaseRight-controlled funds | Partner/direct-charge only for the initial architecture. The landlord is merchant of record; LeaseRight does not custody or manually route rent. A principal/PayFac path is outside the current plan. |
| Does the correction require payments in pilot one? | It changes target selection, diligence, and evidence gates—not the first SKU. Keep the fixed-fee Model/operations pilot and make live ACH a separately authorized beta after commercial, legal, and shadow-ledger gates. |
| In-house vs. broker vs. hybrid | Default the pilot to hybrid because it matches the authored operating plan and covers owner leads plus hard-unit overflow. Calculate all routes from the same actual costs and observed velocity; do not hardcode a winner. |
| Five-figure project fee vs. share of avoided carry | Charge a fixed upfront pilot fee based on scoped deliverables and project band. The current Model cannot support a carry-based quote. After Phase A reconciles the sponsor's carry, use it as the value case; after three real pricing conversations, test whether a published carry-based schedule improves repeatability. Do not make pilot-one payment contingent on realized savings. |
| Productized service vs. two-sided network | The near-term business is a productized lease-up engagement. The originator rail is an unproven network option. Let cross-building repeat behavior determine whether that option deserves investment; Justin does not need to choose the future company before evidence exists. |
| One-building vs. two-building pilot | Start with one paid building so validation and revenue are not delayed. Reserve or identify a second building in the same submarket if practical. The first building tests sponsor willingness to pay, workflow, and agent participation; only cross-building reuse can support a network claim. The separate payment beta tests live rent movement. |
| Model memo first vs. OS + originators immediately | Sell one staged engagement. Collect payment before Phase A Model reconstruction. Activate the operator workflow and originator rail only after the sponsor baseline reconciles and real operating/compliance inputs exist. This preserves the faster first invoice without pretending the empty agent surface is ready to validate. |
| Agent workspace vs. no agent product | Split the actor. A contracted operator can use the owner workbench; an outside originator gets a no-/low-login demand rail. |
| Timestamp equals agent trust | A landlord-held timestamp is insufficient by itself. Send the registration and frozen terms immediately to both the agent and sponsoring brokerage, and expose dispute outcomes. |
| Agent payout rail now vs. later | Track commission owed, approved, paid date, and days-to-pay; make payment outside LeaseRight in pilot one. Add money movement only after workflow and compliance are validated. |
| Lender account vs. export | Test a PDF/spreadsheet or read-only report link. Do not build lender accounts until repeated in-product use appears. |

## Exact agent-role design

### Owner / sponsor — buyer and data controller

Owns the Model, frozen launch baseline, pricing and concession approvals, reports, source economics,
commission liability, and data access. Sees aggregate conversion and cost per signed lease, not
private agent-client activity beyond what is necessary to operate and attribute the lease.

### Building operator — authenticated workbench user

The party working the building's own leads: in-house leasing staff, PM team, or exclusive lease-up
broker. Uses Today, Pipeline, Inbox, Rents, Applications, and Reports. An external operator is
project-scoped and does not see owner banking, cross-project underwriting, or other firms' data.

### Outside originator — lightweight demand partner

A locator, tenant representative, or Realtor bringing a client. The minimum loop is:

1. View current availability, effective rent, concessions, eligibility, protection window, and
   commission terms before registration.
2. Provide agent identity, license, sponsoring brokerage, client identity, and consent to the
   published rules.
3. Receive an immediate, timestamped confirmation—copied to the sponsoring brokerage—with the
   client, unit/type, protection period, and terms in force. Those terms are frozen for the claim.
4. Receive one trackable tour/application link; do not require duplicate CRM entry.
5. See only that client's milestones: registered → toured → applied → leased → commission approved
   → paid, plus any dispute outcome and reason.
6. Submit the brokerage invoice or required support record and see days from lease execution to
   payment.

The originator cannot see the owner's Model, Pipeline, other clients, SLA clock, or source
scorecard. A full account is optional only after repeat use proves it removes friction. In a Texas
pilot, the sponsoring brokerage is the default confirmation recipient and commission payee unless
counsel confirms another compliant path.

### Lender / capital partner — output recipient

Receives an export or read-only report link. No account is required for the pilot.

### How the role creates value

- **Trust:** evidence the originator and brokerage hold, frozen terms, visible milestones, explicit
  dispute resolution, and broker-correct payment status.
- **Distribution:** trustworthy live inventory plus one shareable client link, especially for
  stalled unit types.
- **Revenue:** attributed incremental leases increase the sponsor command center's value. Do not
  charge originators or take a commission share in pilot one.
- **Low friction:** no owner dashboard, lead assignment, daily updates, scorecard, duplicate CRM,
  or required full login.

## What to test next

### Commercial gate — collect money before reconstruction

Sell one stage-gated engagement for a real 100–400-unit lease-up in one launch market,
recommended Austin/Texas if a qualified sponsor is available. Prefer a sponsor that will hold the
asset at least 24 months after stabilization, controls payment-provider selection, can produce its
processor and loan cash-management documents, and already owns a stabilized property whose payment
history can be examined. Existing stabilized units are a tiebreaker, not a hard gate.

The commercial conversation must also test continuity before Phase A. Subject to counsel, seek a
short term sheet covering assignment or commercially reasonable assignment efforts on sale,
payment-path continuity or a right to bid when a successor PM is engaged, a right of first refusal
on payment processing at stabilization, and disclosure of lender cash-management provisions. A
sponsor's refusal does not bar a profitable wedge pilot; it classifies the engagement as
**wedge-only** and prevents its future rent from entering the payment-engine case.

The fixed fee covers the Model calibration, frozen launch baseline, weekly variance output, payment
diligence, and the conditional operating test. Success is a signed scope and collected upfront
payment, not praise, an LOI, a carry-savings claim derived from Meridian, or promised future rent
volume.

### Phase A — make the Model a trustworthy instrument

After payment and before live operations, rebuild the pilot Model from the sponsor's source
underwriting and operating records. Use one delivery schedule, stabilization definition, lease
count, velocity convention, carry rate, concession method, and scenario formula. Every displayed
date and cost must derive from those inputs. Freeze the agreed baseline before live operations.

In the same phase, obtain the payment evidence that can falsify the engine cheaply: 12 months of
rent rolls and processor statements where available; method mix; fee payer; returns, disputes, and
failed payments; settlement timing; reconciliation labor; current PM/PMS/processor contracts and
termination rights; lender lockbox/DACA requirements; expected post-stabilization owner/manager;
and a written processor proposal translating any residual into **net bps of PPV**. The proposal
must state the fee base, payment-method scope, activation threshold, pricing control, reserves,
loss liability, clawbacks, settlement, data access, and portability. If the sponsor has an existing
stabilized asset, use it for the statements and shadow-ledger work so LeaseRight does not wait
9–18 months for the lease-up asset to generate meaningful rent volume.

During Phase A, interview five active local originators and two exclusive lease-up brokers about
inventory freshness, registration protection, payee rules, payout timing, and whether an outside
broker is a buyer/operator or only a demand source. Do not build or invite them into a landlord
surface yet. If the Model cannot reconcile or the sponsor will not provide a usable operating data
path, deliver the paid baseline/variance memo and stop the pilot at the reporting product.

If the asset will be sold, transferred to a PM that controls payments, or placed behind an
incompatible lender cash-management arrangement, continue only as a wedge validation and record
that this pilot cannot validate the payment engine. Do not use future rent from that asset in the
payments case.

### Phase B — conditional 60-day operating test

Activate Phase B only when Phase A produces a frozen baseline, the operator accepts one data path,
and the sponsor supplies written commission terms, attribution rules, a dispute owner, and a
brokerage/payee path for outside agents.

1. **Operator adoption:** for four consecutive weeks, process at least 80% of eligible new leads
   through the LeaseRight flow and generate the report from the same records. Measure duplicate
   entry; a spreadsheet cannot remain the real operating system.
2. **Mechanism/effect proxies:** compare median lead-arrival→human-contact time, inquiry→tour
   conversion by source, and days-on-market for the stalled unit type against the operator's
   pre-pilot baseline. These do not prove causality, but they test the mechanism more honestly than
   willingness-to-pay alone.
3. **Originator behavior:** invite five active local originators; require at least three unique
   client registrations, one downstream tour/application, and no unresolved attribution dispute.
   Where the asset supports it, route originator activity at the slowest unit type first—the seed's
   3BR problem is the current testable example.
4. **Lender value:** show one lender the reconciled baseline and weekly variance output. Record a
   changed diligence request, reserve assumption, reporting requirement, or credit conversation;
   otherwise position it as an owner report.

### Separate payment-readiness and live beta gate

Do not move money in Phase B. First run two shadow-reconciliation cycles using the incumbent
processor's exports: obligation → payment → fee → settlement/payout → ledger. Advance only if:

1. the sponsor controls the payment stack and the loan documents permit the payout path;
2. the written processor proposal produces at least **10 bps expected net take** after modeled
   variable payment costs, or a contractual minimum with equivalent economics;
3. Texas payments counsel approves the exact direct-charge, fee-incidence, ACH-authorization,
   fallback, privacy, and deposit-exclusion design; and
4. every shadow cycle balances, exception ownership is named, and data can be exported portably.

Then authorize a separate ACH-first beta capped at 25–50 ordinary rent payments, preferably on an
already stabilized sponsor asset if that allows the gate to clear sooner. Keep ACH free to
the resident, maintain a traceable non-digital fallback, exclude deposits and third-party payouts,
and expose cards only if the processor and counsel approve the fee treatment. Measure routed PPV,
eligible-resident adoption, payment success, returns/disputes, reconciliation breaks and labor,
support contacts, settlement timeliness, and realized net bps. Continue only if at least 75% of the
eligible cohort routes payment through LeaseRight by the second rent cycle, both cycles reconcile,
and no unresolved authorization, settlement, or resident-harm issue remains. Two clean cycles are
the minimum evidence for a continue decision; they are not proof of portfolio economics.

### Stage 2 — test whether the rail compounds

If Phase B clears operator use and originator behavior, repeat the originator
rail at a second building in the same submarket without re-recruiting the first cohort. Treat
`2 of 5` originators registering at both buildings as an early continue signal, not proof of a
network. If reuse does not appear, keep the rail as a project feature and run LeaseRight as a
productized per-project business.

### Investment gate

- **Build a connected MVP** only if sponsor payment, operator use, and agent registration all
  clear Phase B.
- **Narrow to paid modeling/reporting** if the sponsor pays but the workbench is not adopted.
- **Keep the command center and ingest agent activity externally** if operators adopt but
  originators reject a LeaseRight surface.
- **Explore the originator-network take-rate thesis** only after cross-building repeat behavior
  appears. Test the separate rent-processing thesis through its own partner/legal/shadow-ledger
  gates; it does not depend on originator reuse.
- **Advance the payment beta** at 10 bps expected net economics, but **treat payments as the core
  economic engine** only when realized `$/retained unit/year`, contract survival at stabilization,
  and an acquisition path can plausibly retain about 50K comparable units. A written proposal near
  20 bps would clear the illustrative low-survival crossover; a lower take can still work with
  stronger continuity or a cheaper stabilized-portfolio acquisition channel. Below 5 bps without
  a minimum, classify payments as a product benefit and keep the business underwritten on project
  fees until economics improve.
- **Stop** if sponsor payment and operator adoption both fail; do not retreat into generic PM
  features.

These are next-investment gates, not claims of product-market fit.

## Primary-source receipt for the payment reassessment

Sources were rechecked on 2026-09-02. Commercial pricing and rules are time-sensitive; exact
contracts and current law control at implementation.

- [Stripe U.S. pricing](https://stripe.com/pricing) and
  [local payment-method pricing](https://stripe.com/pricing/local-payment-methods) — 0.8% ACH capped
  at `$5`, current verification/failure/dispute fees, 2.9% + `$0.30` domestic cards, and custom
  volume pricing.
- [Stripe SaaS platform model](https://docs.stripe.com/connect/saas-platforms-and-marketplaces) and
  [Connect charge types](https://docs.stripe.com/connect/charges) — connected-account merchant of
  record, direct charges, application fees, unpublished eligible revenue share, fee payer, and loss
  responsibility.
- [Zillow online rent payments](https://www.zillow.com/rental-manager/online-payments-faq/),
  [RentRedi convenience fees](https://help.rentredi.com/en/articles/4474091-convenience-fees-for-rent-payments),
  [TurboTenant payment FAQs](https://support.turbotenant.com/en/articles/9787222-rent-payments-faqs-for-landlords),
  and [Buildium pricing](https://www.buildium.com/pricing/) — current public fee-incidence and
  customer-price benchmarks; none discloses LeaseRight-achievable margin.
- [Buildium ePay rewards](https://www.buildium.com/buildium-rewards/epay/) — category evidence for
  an owner/operator statement-credit incentive beginning at 75% resident ePay adoption.
- [AppFolio 2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/1433195/000143319526000011/appf-20251231.htm)
  — 9.4 million units and value-added-services scale; payments are combined with screening and risk
  services, so the filing does not disclose a payment take rate.
- [FinCEN payment-processor ruling](https://www.fincen.gov/resources/statutes-regulations/administrative-rulings/application-money-services-business)
  and [Texas Finance Code Chapter 152](https://statutes.capitol.texas.gov/?artSec=&chapter=FI.152&code=FI&tab=1)
  — federal payment-processor conditions and the Texas agent-of-payee exemption.
- [CFPB Regulation E §1005.10](https://www.consumerfinance.gov/rules-policy/regulations/1005/10/),
  [Nacha WEB debit account validation](https://www.nacha.org/rules/supplementing-fraud-detection-standards-web-debits),
  and [Stripe ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit) — recurring
  authorization, varying amounts, first-use account validation, settlement timing, and dispute risk.
- [Visa surcharge guidance](https://usa.visa.com/dam/VCOM/global/support-legal/documents/merchant-surcharging-considerations-and-requirements.pdf)
  — credit-card surcharge requirements and debit/prepaid prohibition.
- [Filed multifamily loan example](https://www.sec.gov/Archives/edgar/data/1277998/000121390022072325/f10q0922ex10-62_manufactur.htm)
  — an example of rents directed to a lender-controlled lockbox under a DACA; the pilot's actual
  loan documents, not this example, decide compatibility.

## Completed in this mission

- Inspected the canonical project direction, source-of-truth files, foundation/rebuild specs,
  current prototype, normalized seed, selectors, and Builder, Implementer, Contrarian, and
  Strategist briefs.
- Re-ran the repository checks: zero dangling seed references, selector self-test passed, all 24
  leads partition exactly once, and `git diff --check` passed.
- Recomputed and verified the corrected staffing economics and the 11.3 carry-day warning.
- Independently confirmed the remaining duration, scenario-carry, actual-velocity, and 3BR-tail
  inconsistencies; made Model reconciliation the paid Phase A instrument.
- Reconciled the pricing and pilot-geometry disagreements into a fixed-fee first building plus a
  conditional same-submarket repeat test.
- Reconciled the Model-memo-versus-OS disagreement into one paid, stage-gated engagement: payment
  first, Model reconstruction second, operating and originator tests only after explicit readiness
  gates.
- Strengthened the agent design so the protection evidence exists outside the landlord-controlled
  database.
- Recomputed the payment-volume funnel and standardized the 242-occupied/100%-routing peer case as
  a ceiling and the 260 × 95% × 80% case as the auditable underwriting base.
- Reconciled take-rate claims into 5-bps downside, a 10-bps beta screen, and a 25-bps stretch
  contract case; removed 50 bps from the plan because no source or proposal supports it.
- Converted the take rate into `$/unit/month`, added the retained-unit and stabilization-survival
  KPIs, and stress-tested lifetime payment revenue and the annual lease-up flow required to sustain
  a 50K-unit payment base. The survival inputs are visibly labeled as illustrative judgments; the
  calculations are preserved in `spec/PAYMENT_ENGINE_ECONOMICS_VALIDATION.ipynb`.
- Rechecked current primary sources for processor pricing/architecture, competitor fee incidence,
  AppFolio category scale, federal/Texas money-transmission boundaries, ACH rules, card surcharge
  constraints, and lender cash-management risk.
- Integrated the payment-engine screen, a pre-Phase-A contract-continuity test, sponsor/processor
  diligence, stabilized-asset preference, legal posture, shadow ledger, and separately gated
  25–50-payment beta into this canonical Overseer memo.

The prior Builder implementation remains intact: the fee-basis label is corrected, the hybrid
cost is explicit, and the hardcoded staffing-route velocity ranking is removed. The originator
mock remains intentionally unbuilt until the pilot target and commercial authorization exist.
The Collection payment-method mock now consistently labels ACH as free/resident-free; the ledger
continues to show processor fees only and does not fabricate LeaseRight payment revenue.

## Remaining risks

- There is still no real sponsor payment, operating adoption, originator registration, lender
  reliance, or repeat use.
- There is no processor term sheet, sponsor payment statement, actual method mix, return/dispute
  history, reconciliation cost, lender consent, or legal opinion. The net take is therefore an
  underwriting range, not evidence of realizable margin.
- The payment engine needs portfolio-scale distribution: about 50K units for `$1M` of annual net
  revenue at 10 bps under current adoption assumptions. One paid asset cannot prove that path.
- Stabilization survival and annual attrition have not been measured. The 35%/15%, 60%/12%, and
  100%/15% cases are stress tests, not market estimates; real contracts and portfolio cohorts must
  replace them before a lifetime-value claim is used externally.
- The wedge and engine can separate at sale or PM handoff. Contract portability and payment-stack
  retention are unresolved GTM dependencies.
- The recommended 100–400-unit ICP and Austin starting market are hypotheses.
- The Model cannot yet support a carry-based value claim or lender claim without source-data
  reconciliation; the first fixed fee must therefore be scoped from deliverables and project band.
- LeaseRight may remain a project-based productized service; the originator rail may never
  compound into a network.
- Integration and double-entry risk is high across ILS, CRM, PM, screening, e-sign, accounting,
  and payment systems.
- Inventory freshness, attribution disputes, privacy, licensing, commission handling, record
  retention, and money movement require jurisdiction-specific legal and payments review before
  production.
- One paid pilot can justify the next build; it cannot prove margins or repeatability.

## Only decisions Justin must make now

1. **Name the first validation target.** Recommended default: one 100–400-unit ground-up
   lease-up in Austin/Texas with an accountable long-term holder, an operator willing to use the
   workflow, payment-provider authority, access to processor and loan cash-management records, and
   meaningful locator/Realtor activity. Prefer a sponsor with an existing stabilized asset so the
   payment-history and shadow-ledger tests can start without waiting for lease-up. If only a
   merchant-builder is available, the engagement
   can validate the wedge but must not be reported as payment-engine evidence unless the payment
   contract survives the sale. If possible, identify a second eligible building in the same
   submarket, but do not delay the first paid pilot to secure it.
2. **Authorize the commercial and resource gate.** Approve a fixed, upfront five-figure pilot,
   scoped by project band and deliverables, with validation before further rebuild. Phase A is paid
   Model reconstruction plus payment diligence. Include counsel-drafted continuity terms in the
   commercial package; refusal makes the engagement wedge-only rather than blocking a profitable
   pilot. Phase B is conditional operating/originator validation. Live payments require a later,
   separate authorization after the processor, legal, and shadow-reconciliation gates. This treats
   `$1/unit forever` as secondary positioning and rent-processing economics as the intended
   long-term engine without claiming an unquoted take rate or unmeasured retention.

Justin does **not** need to choose services versus network, a fee percentage, resident fee schedule,
principal/PayFac status, agent screen details, broker row-scoping, framework/store architecture,
lender login, or a payments partner now. The recommendation already resolves those choices for
the pilot: price the wedge to stand alone, use resident-free ACH, keep partner/direct-charge
architecture, separate processor residual from owner platform fees, and move no live money until
the gates clear. The staged evidence should decide the remaining choices.
