# Builder reassessment — rent processing as the economic engine

**Project:** LeaseRight  
**Prepared for:** M4D Overseer / Justin  
**As of:** 2026-09-02  
**Decision posture:** Directionally decision-ready; partner pricing and legal structure remain unvalidated  
**Supersedes:** Any prior statement that payments are merely a remote expansion hypothesis

## Executive answer

Justin's correction matters. LeaseRight should be underwritten as a **rent-payment-volume business
with a paid lease-up operating wedge**, not as `$1/unit` SaaS with incidental payment upside.

That makes the long-term target more attractive than `$1/unit`, but it does not make the current
prototype or first pilot a payments product:

- A **pure processor residual should initially be screened at 5–10 basis points of net LeaseRight
  revenue on processed rent volume**. **25 bps is the commercial target**, likely requiring an
  owner-paid application/platform fee or strong negotiated economics; **50 bps is an upside case**.
  These are planning cases, not market quotes. Stripe says eligible SaaS platforms can earn revenue
  share but does not publish the share or its basis.
- At the repo's `$2,180` average monthly rent, 260 units, 95% occupied/collected, and 80% routed
  through LeaseRight, one stabilized building produces about **$5.17M annual processed volume** and
  only **$2.6K / $5.2K / $12.9K / $25.8K** of LeaseRight revenue at 5 / 10 / 25 / 50 bps.
- To reach **$1M annual net payment revenue**, LeaseRight needs about **$2.0B / $1.0B / $400M /
  $200M** of annual processed rent at those take rates—roughly **101K / 50K / 20K / 10K units** on
  the same utilization assumptions. A 260-unit property alone is a validation cell, not an economic
  base.
- Public retail pricing shows why take rate must mean **net revenue after processing, returns,
  verification, disputes, partner fees, and payment support**. Stripe's standard ACH price is 0.8%
  capped at `$5`; on a `$2,180` rent payment the cap is about 23 bps before any LeaseRight margin.
  Its domestic-card price is 2.9% + `$0.30`, leaving essentially no safe card spread under common
  surcharge constraints.
- The recommended first pilot should remain **fixed-fee and stage-gated** because a ramping lease-up
  cannot fund the work from payment margin. But target selection and gates should change: prefer a
  long-term holder with authority over collections, collect real processor statements in Phase A,
  run a shadow reconciliation before money movement, and reserve a separate, counsel-cleared,
  partner-led ACH beta after the operating pilot.

**Recommendation:** keep the five-figure Model/operations pilot as the paid trust wedge; add a
payments diligence and migration-readiness workstream now. Do not build live payments until a
processor proposal proves at least the base economics and fixes the regulated funds-flow boundary.

---

## 1. What the repository proves—and does not

The correction restores the original thesis in `PRODUCT_DIRECTION.md`: payments are the economic
engine. The prior Overseer and Implementer memos had demoted payment margin to a later hypothesis
because it was unmodeled. That demotion should be read as an **evidence warning**, not as the intended
business model.

The actual repository cannot yet validate payment economics:

- `README.md` confirms the product is a static React UMD/Babel prototype with no backend.
- `components/model-data.jsx` contains six mock `Payment` rows with amount, method, status, attempt,
  and retry data, but no processor account, processor transaction, fee allocation, platform revenue,
  authorization, settlement, payout, return, refund, dispute, or reconciliation fields.
- The visible Collection view still reads legacy literals in `components/data.jsx`, not the normalized
  payment records.
- The mock says ACH is free, card costs 2.9% + `$0.30`, April collections are `$248,400`, and Stripe
  fees are `$620`. Those claims do not reconcile: the asserted 22% card mix would by itself imply more
  than `$1,580` of percentage fees at 2.9%, before per-transaction charges.
- There is no processor agreement, revenue-share schedule, production merchant, real payment volume,
  or historical return/dispute data anywhere in the repo.

Therefore, the existing UI demonstrates the desired collection workflow only. It is not evidence of
a viable take rate, compliant funds flow, or payments implementation.

---

## 2. Economics: volume and take rate

### Definition that must control every future model

**Processed payment volume (PPV)** is rent actually routed through LeaseRight's contracted payment
partner. It excludes rent paid outside the rail, reversals, and non-rent deposits unless stated.

**Net LeaseRight take rate** is:

```text
(platform/application fees + contracted processor revenue share
 - processor/acquirer/network costs borne by LeaseRight
 - verification, return, dispute, fraud, and variable payment-support losses)
÷ processed payment volume
```

Gross tenant or landlord fees are not LeaseRight revenue. Card interchange is not LeaseRight
revenue. Funds collected for rent are not revenue. The model must distinguish all three.

### Meridian-sized building sensitivity

Planning assumptions:

| Input | Base assumption | Basis |
|---|---:|---|
| Total units | 260 | Repository seed |
| Average monthly rent | `$2,180` | Repository seed |
| Occupied/collected share | 95% | Explicit planning assumption; replace with sponsor actuals |
| LeaseRight payment adoption | 80% | Explicit planning assumption; consistent with a strong but not universal digital shift |
| Annual billed rent at 100% | `$6,801,600` | `260 × $2,180 × 12` |
| Base annual PPV | `$5,169,216` | billed rent × 95% × 80% |

| Net LeaseRight take | Annual revenue / 260-unit building | Revenue / total unit-year | PPV for `$1M` revenue | Approx. units for `$1M` |
|---:|---:|---:|---:|---:|
| 5 bps — pure residual downside | `$2,585` | `$9.94` | `$2.0B` | `100,596` |
| **10 bps — pure residual base** | **`$5,169`** | **`$19.88`** | **`$1.0B`** | **`50,298`** |
| **25 bps — commercial target** | **`$12,923`** | **`$49.70`** | **`$400M`** | **`20,119`** |
| 50 bps — upside | `$25,846` | `$99.41` | `$200M` | `10,060` |

The `$1/unit/month` interpretation would produce `$3,120` per building-year and is equivalent to
about 4.6 bps on a fully paying unit's `$26,160` annual rent. A 25-bps net payments model is roughly
5.5× that revenue per actively paying unit, but it still requires portfolio-scale distribution.

### Translate “share of processing fees” before using a take rate

The processor deal may quote a percentage of **gross fees**, **processor net revenue**, or
**contribution margin**. Those are not interchangeable. For an illustrative `$5` ACH fee on a
`$2,180` payment, the gross fee pool is 22.9 bps. A 20% or 40% share of that gross pool translates
to only 4.6 or 9.2 bps of rent volume before LeaseRight-borne costs. If the share applies to the
processor's net revenue after bank/network expense, LeaseRight's bps are lower. Conversely, a
separate owner-paid application fee can make them higher.

The partner proposal must therefore state the fee base, payment-method scope, activation threshold,
pricing control, reserves, returns, clawbacks, and termination economics. Do not enter “30% revenue
share” into a model until it has been converted to realized net bps of rent volume.

### Why the cases are defensible for screening

No public source establishes LeaseRight's achievable partner share, so the range is deliberately an
underwriting assumption:

- **5–10 bps pure residual:** a sober starting screen when the processor retains pricing and risk.
  It requires roughly 50K–101K units for `$1M` annual revenue and is too thin to support high-touch
  operations alone.
- **25 bps commercial target:** a meaningful net target. On a `$2,180` ACH rent payment it
  is `$5.45` of net LeaseRight revenue. At Stripe's public `$5` capped ACH price, the owner-facing
  gross fee would need to exceed roughly 48 bps (`$10.45`) before verification, returns, Connect, or
  support costs if LeaseRight paid retail processing prices.
- **50 bps upside:** `$10.90` net per rent payment. This likely needs negotiated wholesale economics,
  a landlord-funded platform fee, substantial bundled value, or a favorable processor share. Do not
  put it in a plan without a term sheet and live cohort evidence.

Stripe's public price is a useful ceiling check, not the selected architecture. At rent-sized ACH
transactions, its `$5` cap equals about 23 bps. Stripe also recommends a SaaS/direct-charge structure
in which the connected landlord is merchant of record, pays Stripe directly, and the platform can
collect an application fee or become eligible for revenue share. Because the revenue-share rate is
not public, **one processor quote is a hard commercial gate**.

Cards should be an optional payment method, not the margin thesis. Stripe's public domestic-card
price is 2.9% + `$0.30`. Visa's U.S. rules prohibit surcharging debit/prepaid cards and limit credit
card surcharges to the lower of the merchant's acceptance cost or 3%, with notice and disclosure
requirements. Even a 3% credit surcharge on a `$2,180` rent payment leaves only `$1.88` over Stripe's
public price before Connect, disputes, refunds, fraud, and support. RentRedi's current public tenant
fees—`$1` for ACH and 3.1% + `$0.30` for cards—show that renters will encounter fees in the category;
they do not prove LeaseRight can retain them or use the same legal characterization.

### Decision thresholds

Treat payments as the scalable core only when a partner proposal and sponsor data show one of these:

1. **Preferred:** at least **25 bps contracted net** to LeaseRight after all variable payment costs;
   or
2. A lower take rate paired with a recurring platform minimum that produces at least **`$50` of
   payment-related annual revenue per total unit** at mature adoption.

Below 10 bps with no recurring minimum, the model needs more than 50K comparable units for `$1M`
annual revenue and should be treated as an acquisition/retention benefit, not the core engine.

---

## 3. Adoption incentives and fee incidence

The economically safest launch is **free ACH for the renter, optional card at clearly disclosed
cost, and landlord-funded LeaseRight economics**. Charging the renter for the default method creates
avoidable adoption friction and can collide with state/local payment-option rules as LeaseRight
expands.

### Owner / sponsor

The owner needs value beyond “another portal”:

- automatic rent-to-lease-to-ledger matching and daily settlement reconciliation;
- fewer manual checks, posting errors, and collection follow-ups;
- visible failed-payment recovery and payout timing;
- one lease-up-to-resident identity chain, so the payment relationship does not reset at move-in;
- contract portability through sale or management transitions; and
- a transparent share of savings or statement credit for achieving adoption.

Buildium's public ePay rewards program is useful category evidence: it begins rewarding property
managers when at least 75% of residents use ePay and says automated payments eliminate manual
posting. It does not disclose the underlying processor share. A LeaseRight incentive can credit part
of the paid pilot fee against future payment minimums after an adoption threshold, without making
pilot-one payment contingent on uncertain future volume.

### Resident

Adoption is most likely when LeaseRight offers:

- one free bank-payment path plus a non-digital fallback;
- autopay that is opt-in, easy to revoke, and accompanied by a retained authorization copy;
- receipts, upcoming-amount notices, failure explanations, and non-punitive retry controls;
- optional card payment with the total fee shown before authorization; and
- no requirement to re-enter credentials merely because property management changes.

Buildium's 2025 renter study reports 80% preference for electronic/card methods but also 21% for
check, cash, or other non-digital methods. This supports digital-first, not digital-only.

### Operator / property manager

The operator needs zero duplicate posting, clear exception queues, configurable permissions, and a
commercial reason not to defend its incumbent processor. The pilot must identify who currently
retains payment economics—the owner, PM, PMS vendor, or processor—because LeaseRight may be asking
an intermediary to surrender revenue or workflow control.

---

## 4. Regulatory and operational boundary

This section is product-design guidance, not legal advice. Payments counsel must approve the actual
funds flow and launch-market fee treatment.

### Recommended funds-flow posture

Use a regulated platform processor's **SaaS/direct-charge** model:

```text
resident → processor-connected landlord merchant account → landlord bank account
                         └─ contracted application fee/revenue share → LeaseRight
```

The landlord/property entity should be the merchant/payee. The processor should own merchant
onboarding, KYB/KYC, tokenized payment credentials, settlement, and—where contracted—loss liability.
LeaseRight should not take custody of rent, pool balances, delay settlement, or manually redirect
funds.

Stripe's Connect documentation says direct charges are suited to SaaS platforms, keep the connected
account as merchant of record, and can place application fees in the platform balance. Destination
charges instead put refunds, chargebacks, processing fees, and negative-balance exposure on the
platform. For LeaseRight, that extra control is not worth the initial regulatory and operating risk.

### Money transmission

FinCEN's payment-processor exemption is facts-and-circumstances based. Its published ruling lists four
conditions: facilitate payment for goods/services or bills, use a clearing/settlement system limited
to regulated financial institutions, act under a formal agreement, and contract at least with the
seller/creditor receiving funds. Texas Finance Code Chapter 152 separately requires a license for
money transmission but includes an agent-of-payee exemption with written-agreement and payment-
discharge conditions.

Implications:

- Processor contracts and landlord agreements must expressly match the intended structure.
- LeaseRight must not assume that “Stripe handles compliance” settles federal or every state issue.
- Expansion beyond Texas requires a state-by-state agent-of-payee/money-transmission review.
- Any design that holds balances, splits security deposits, or pays third parties changes the
  analysis and must return to counsel before build.

### ACH, recurring authorization, and returns

- Regulation E requires a clear, identifiable authorization for preauthorized consumer EFTs and a
  copy for the consumer. Varying recurring amounts generally require advance written notice.
- Nacha requires validation of a consumer account before its first WEB debit or after an account
  change as part of a commercially reasonable fraud-detection system.
- Stripe describes ACH Direct Debit as delayed and not guaranteed; consumers can generally dispute
  personal-account debits for up to 60 calendar days, and in-window ACH disputes are final through
  the network.
- Nacha's published risk levels are 0.5% unauthorized returns, 3% administrative returns, and 15%
  overall returns. Those are enforcement/inquiry limits, not product success targets; LeaseRight
  should target materially below them and monitor by merchant and cohort.

### Card fees

- Card surcharging is not a generic “convenience fee” switch. Visa permits U.S. credit-card
  surcharges only within its notice/disclosure and amount rules, and prohibits them on debit and
  prepaid cards. Mastercard also prohibits surcharges on debit/prepaid products.
- The pilot needs processor/card-brand review of the exact fee design and state-law review before
  displaying a renter fee.
- Hosted/tokenized collection should keep raw card and bank credentials out of LeaseRight's static
  client and databases.

### Operational minimums before live money

Production payments require capabilities absent from the repo today:

- backend secrets and server-side webhooks;
- merchant onboarding and capability state;
- idempotent payment creation and immutable processor event storage;
- mandates/authorization artifacts and change history;
- fee allocation by payer, processor, landlord, and LeaseRight;
- settlement/payout/return/refund/dispute lifecycles;
- ledger-grade daily reconciliation and exception ownership;
- role-based access, audit logs, retention policy, and incident response;
- tax-reporting responsibilities and support escalation paths; and
- separate handling for security deposits/escrow based on jurisdiction.

The sponsor's loan documents are also a commercial gate. Multifamily cash-management arrangements
can require rents to reach a lender-selected or controlled deposit account and sweep on a specified
schedule. LeaseRight must confirm that the processor payout account and timing are lender-approved;
payment-provider authority at the sponsor level is insufficient if a lockbox or deposit-account
control agreement governs the rents.

---

## 5. How this changes the recommended pilot

### What stays

Keep the **fixed, upfront, five-figure, stage-gated Model/operations engagement**. It creates near-term
cash, earns sponsor trust, and validates the lease-up wedge before LeaseRight asks to replace a
critical financial system. Do not switch pilot-one compensation to a payment take rate; payment
volume ramps too slowly during lease-up to fund delivery.

### What changes

1. **Target:** prefer a long-term holder—or a sponsor with a clearly assignable post-sale payments
   contract—not a merchant-builder expected to transfer the property and payment relationship at
   stabilization. The target must control payment-provider selection.
2. **Phase A payment diligence:** obtain 12 months of rent rolls, processor statements, method mix,
   fee incidence, returns/disputes, settlement timing, reconciliation labor, current contract term,
   termination rights, PM/PMS dependencies, and lender lockbox/cash-management requirements.
   Calculate eligible PPV from actuals.
3. **Commercial gate:** obtain at least one written processor/platform proposal showing payment
   costs, Connect/platform fees, revenue share or buy rate, loss liability, reserves, settlement,
   onboarding, data access, and termination/portability.
4. **Legal gate:** counsel approves the Texas funds flow, agent-of-payee/payment-processor posture,
   ACH authorization, resident fee/fallback design, lease language, privacy, and deposit exclusions.
5. **Shadow phase:** before initiating a payment, ingest the incumbent processor's settlement export
   and reconcile obligation → payment → fee → payout → ledger for at least two cycles.
6. **Separate Phase C live beta:** only after the Model/operations pilot and payment gates clear, run
   ACH-first direct charges for a capped cohort of 25–50 ordinary rent payments. Exclude security
   deposits and third-party payouts. Keep free ACH, a non-digital fallback, and optional cards only
   if the fee design is approved.

### Payment-specific continue gates

- Sponsor has payment-stack authority and signs commercial terms.
- Actual eligible annual PPV and method mix are documented, not inferred from Meridian.
- Partner proposal supports at least 25 bps contracted net or the `$50/unit-year` hybrid minimum.
- Shadow ledger reconciles 100% of imported transactions, fees, returns, and payouts, with no
  unresolved variance older than one business day.
- At least 75% of eligible beta residents enroll/use electronic payment after two rent cycles,
  measured separately for free ACH and paid card.
- Every ACH debit has a retained authorization/mandate and processor event trail.
- No unauthorized-return-rate breach; all returns, refunds, disputes, and resident complaints have a
  named owner and resolution record.

Failure of payments diligence does **not** invalidate the paid lease-up command-center pilot. It means
LeaseRight is a project-fee operating product until better payment economics or distribution appear.

---

## 6. Smallest credible implementation sequence

### P0 — economics instrument; feasible in the current static prototype

Build a pure, tested calculator with adjustable inputs:

- occupied/collectible units, average rent, collection rate, and LeaseRight adoption;
- ACH/credit/debit/check mix;
- payer-visible fee and who pays it;
- processor cost, Connect/platform costs, verification, return/dispute loss, support cost;
- partner revenue share or application fee; and
- contracted minimums or credits.

Outputs: annual PPV, gross fee pool, processor/partner cost, LeaseRight net revenue and bps, revenue
per unit/building, and PPV/units required for `$1M` and `$5M` revenue. Assumptions must be visibly
labeled and deterministic tests must cover denominator and fee-incidence changes.

### P1 — payment data contract and partner architecture; after sponsor/partner inputs

Add separate entities rather than inflating the current mock `Payment` row:

- `ProcessorAccount` / merchant capability state;
- `RentObligation` / amount due;
- token reference and `PaymentMandate`—never raw credentials;
- `PaymentAttempt` plus immutable `PaymentEvent`;
- `FeeAllocation` with processor, platform, landlord, and resident incidence;
- `Settlement` / `Payout` / `Reconciliation`; and
- `Return`, `Refund`, and `Dispute`.

### P2 — shadow ledger; backend required

Implement server-side ingestion, webhook signature verification, idempotency, immutable event
storage, derived payment status, and daily reconciliation. The prototype's local UI state and global
script graph cannot safely perform these jobs.

### P3 — capped ACH beta; only after all gates

Use processor-hosted onboarding and tokenization, direct charges, and processor-owned settlement.
Do not add cards, deposits, commission payouts, wallet balances, or multi-party splits until ordinary
ACH rent is reliable and the economics are observed.

---

## 7. Validation assessment

**Overall: share with caveats.** The volume arithmetic is verified, current public processor/card
rules support the cost and architecture constraints, and repo limitations are directly inspected.
The central uncertainty—LeaseRight's achievable net take—is intentionally not presented as a fact.

Calculation spot-checks:

- Annual billed rent: `260 × $2,180 × 12 = $6,801,600` — verified.
- Base annual PPV: `$6,801,600 × 95% × 80% = $5,169,216` — verified.
- Revenue at 25 bps: `$5,169,216 × 0.0025 = $12,923` — verified, rounded.
- PPV for `$1M` at 25 bps: `$1,000,000 ÷ 0.0025 = $400,000,000` — verified.
- Units for `$1M` at 25 bps: `$400M ÷ ($2,180 × 12 × 95% × 80%) = 20,119` — verified, rounded.
- Stripe ACH cap as bps of `$2,180`: `$5 ÷ $2,180 = 22.9 bps` — verified.
- Visa 3% fee less Stripe public domestic-card cost on `$2,180`: `$65.40 - $63.52 = $1.88`
  before other costs — verified; legal classification and negotiated pricing remain unverified.

Required caveats:

- 5/10/25/50 bps are sensitivity cases, not processor quotes or comparable-company margins.
- Meridian inputs are mock data and must not become a sponsor forecast.
- Public list pricing is not the expected scaled buy rate.
- Rules and state law depend on the exact contracts, funds flow, fee label, and launch jurisdiction.
- This memo is product and commercial analysis, not legal advice.

---

## 8. Primary-source receipt

Sources were checked 2026-09-02. Commercial pricing and rules are time-sensitive and must be
rechecked before contracting or launch.

- [Stripe U.S. pricing](https://stripe.com/pricing) — 2.9% + `$0.30` domestic cards; 0.8% ACH with
  `$5` cap; custom volume pricing available.
- [Stripe local payment-method pricing](https://stripe.com/pricing/local-payment-methods) — ACH
  settlement, verification, failure, and dispute pricing.
- [Stripe SaaS platforms and marketplaces](https://docs.stripe.com/connect/saas-platforms-and-marketplaces)
  — direct-charge merchant-of-record, application-fee, revenue-share, Connect-fee, and loss-liability
  choices.
- [Stripe Connect charge types](https://docs.stripe.com/connect/charges) — direct versus destination
  charge funds flow and refund/chargeback responsibility.
- [Stripe ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit) — delayed settlement,
  non-guaranteed payments, and dispute windows.
- [RentRedi convenience fees](https://help.rentredi.com/en/articles/4474091-convenience-fees-for-rent-payments)
  — current public renter ACH/card fee benchmark.
- [Buildium Rewards for ePay](https://www.buildium.com/buildium-rewards/epay/) — property-manager
  credits beginning at 75% ePay adoption and stated reconciliation value.
- [Buildium 2025 renter report](https://www.buildium.com/wp-content/uploads/2025/08/BLDM-What-Renters-Expect-from-Property-Managers-in-2025.pdf)
  — payment-method preferences and continued non-digital demand.
- [FinCEN payment-processor ruling](https://www.fincen.gov/resources/statutes-regulations/administrative-rulings/application-money-services-business)
  — federal payment-processor exemption conditions.
- [Texas Finance Code Chapter 152](https://statutes.capitol.texas.gov/Docs/FI/pdf/FI.152.pdf) — Texas
  money-transmission definition, licensing requirement, and exemptions including agent of payee.
- [Fannie Mae multifamily cash-management example](https://www.fanniemae.com/syndicated/documents/mbs/remicsupp/2017-T01.pdf)
  — primary-source example of rents deposited into lender-selected/controlled accounts and swept on
  a required schedule; actual pilot loan documents control.
- [CFPB Regulation E §1005.10](https://www.consumerfinance.gov/rules-policy/regulations/1005/10/)
  and [authorization bulletin](https://www.consumerfinance.gov/compliance/supervisory-guidance/bulletin-consumer-authorizations-preauthorized-eft/)
  — recurring EFT authorization, copy, and varying-amount notice requirements.
- [Nacha WEB debit account validation](https://www.nacha.org/rules/supplementing-fraud-detection-standards-web-debits)
  and [risk/return-rate levels](https://www.nacha.org/rules/ach-network-risk-and-enforcement-topics)
  — account validation and published return-rate thresholds/levels.
- [Visa U.S. merchant surcharge requirements](https://usa.visa.com/dam/VCOM/global/support-legal/documents/merchant-surcharging-considerations-and-requirements.pdf)
  and [Mastercard merchant surcharge rules](https://www.mastercard.us/en-us/business/overview/support/merchant-surcharge-rules.html)
  — credit-card surcharge limits/disclosures and debit/prepaid prohibitions.

## Handoff to the Overseer

Reconcile the canonical direction this way:

> LeaseRight's long-term economic engine is net revenue from rent-payment volume. The paid Model and
> lease-up command-center engagement is the trust, data, and distribution wedge that gets LeaseRight
> permission to earn that payment relationship. `$1/unit` is secondary positioning, not the P&L.
> The first pilot remains fixed-fee, but it must select a long-term holder with payment authority and
> include payment diligence, partner pricing, legal architecture, and shadow reconciliation. Live
> payments are a separate gated beta, not part of the static prototype or a condition of Phase B.
