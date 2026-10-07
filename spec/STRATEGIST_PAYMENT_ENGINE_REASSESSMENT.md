# Strategist brief — the rent-processing engine, reassessed

> M4D Strategist package. 2026-09-02. Parallel workstream, self-contained.
> Owns product strategy, operating design, tradeoffs, and challenge to the proposed direction.
> Formed from repository literals and their arithmetic, then checked against the Overseer,
> Builder, and Contrarian payment memos. No prototype code changed.
> Handoff is to the Overseer; this is a peer contribution, not a canonical revision.

---

## 0. One recommendation

**Justin's correction is right about mechanism and wrong about magnitude. At the take rate the
party itself underwrites, "a share of rent-processing fees" and "$1 per unit per month" are
approximately the same amount of money.**

10 bps of processed payment volume on Meridian's own literals is **$1.66 per unit per month**.
`$1/unit/month` is $1.00. The correction is worth a 66% uplift, not a category change.

That is not an argument to abandon it. Payments is a *better mechanism* for the same money —
it bills without a repeat purchase decision, indexes to rent growth, and is harder to churn out
of. Those are all retention properties. **So underwrite it as a retention engine, not an
acquisition engine, and spend the pilot buying evidence about retention rather than about the
take rate.**

The consequential findings, in order:

1. At 10 bps and realistic survival, **lifetime payment revenue per building is roughly half of
   one $25K project fee** (§2.3). The wedge is ~2× the engine at any scale reachable through the
   lease-up door.
2. **Retention dominates take rate.** Moving survival from 35% to 100% is worth more than moving
   the take from 10 bps to 20 bps (§2.4). The Overseer's 10-bps gate is therefore measuring the
   wrong variable strictly.
3. The AppFolio benchmark everyone cites resolves to **$76.76/unit/yr ≈ 38.6 bps-equivalent — for
   the entire bundle** (payments + screening + risk) at 9.4M units (§2.2). A payments-only 50 bps
   is arithmetically above the mature comparable's whole value-added line. It should be struck,
   not held as a sensitivity.
4. Three cheap changes to the recommended pilot follow, and one of them is a **falsifier available
   in the first sales meeting at zero engineering cost** (§5).

---

## 1. The correction restated in the units that decide it

### 1.1 Base arithmetic

From `components/data.jsx:474-481` (`BROKER_ECONOMICS`: 260 units, `$2,180` avg rent) and the
party's agreed underwriting assumptions of 95% collectible and 80% adoption:

```text
Annual billed rent   260 × $2,180 × 12   = $6,801,600
Processed volume     × 95% × 80%         = $5,169,216
PPV per total unit / year                = $19,881.60
```

This reconciles exactly to the Overseer memo. I am not disputing the inputs. I am converting
their output into the unit the decision is actually made in.

### 1.2 The conversion nobody performed

| Net take | $/unit/yr | **$/unit/month** | Per 260-unit asset/yr | vs `$1/unit/mo` |
|---:|---:|---:|---:|---:|
| 5 bps — downside | `$9.94` | **`$0.83`** | `$2,585` | 0.83× |
| **10 bps — underwriting case** | **`$19.88`** | **`$1.66`** | **`$5,169`** | **1.66×** |
| 25 bps — stretch | `$49.70` | **`$4.14`** | `$12,923` | 4.14× |
| 50 bps — "sensitivity" | `$99.41` | **`$8.28`** | `$25,846` | 8.28× |

**Read the 5-bps row.** The Overseer's own downside case for the new economic engine is
**$0.83/unit/month — less than the `$1/unit` price Justin just demoted to "secondary
positioning."** The engine's floor is below the thing it replaced.

**Read the 10-bps row.** The planning case is `$1.66/unit/month`. A full stabilized year of it,
`$5,169`, is **0.69 days of the building's own `$227,000/month` carry** (`model-data.jsx:127`;
carry/day `$7,463`). The Contrarian reached a similar conclusion by a different route and was
right to.

This is the strategic point. Everyone in this debate — including me on 2026-09-01 — has been
arguing about whether `$1/unit` is too small while treating "payments" as a different order of
magnitude. **It is the same order of magnitude.** The debate about pool size was resolved by the
arithmetic before it started; what is genuinely different about payments is *how* the money
arrives, not how much.

### 1.3 What is actually better about the payments mechanism

Stated plainly, because the magnitude case cannot carry it:

- **No repurchase decision.** A per-unit software fee gets re-litigated at every budget cycle and
  every PM handoff. A payment rail in production is the default until someone does work to change it.
- **Rent-indexed.** `$1/unit` is nominal forever — the word "forever" in `shell.jsx` guarantees
  real-terms decay. Basis points on rent grow with rent.
- **Switching cost is real.** Migrating a resident payment base means re-authorizing every ACH
  mandate under Reg E. That is genuine friction working in LeaseRight's favor, unlike a SaaS export.
- **It is the rail a bundle rides on.** Screening, deposit alternatives, and insurance attach to
  the payment relationship, not to the lease-up tool. This is the only path by which the per-unit
  number ever gets materially larger (§2.2).

All four are retention properties. None is an acquisition property. That distinction drives
everything below.

---

## 2. Required volume — and why the volume question is the wrong one

### 2.1 The peer answer is right and incomplete

The Overseer computes ~50,298 units / ~194 Meridian-equivalents for `$1M` of annual net payment
revenue at 10 bps. I confirm that independently: `$1,000,000 ÷ $19.8816 = 50,297` units.

But "50K units" is a *stock*, and nobody has asked what *flow* through LeaseRight's actual front
door produces that stock. The lease-up wedge does not deliver a stock. It delivers a stream of
projects that terminate — and terminate at stabilization, which is the exact moment payment
revenue is supposed to begin.

### 2.2 The AppFolio benchmark, converted

The party cites AppFolio's 2025 10-K (`$721.5M` value-added services, 9.4M units) as evidence the
category is valuable. Converted into this memo's units:

```text
$721,500,000 ÷ 9,400,000 units = $76.76 / unit / year = $6.40 / unit / month
$76.76 ÷ $19,881.60 PPV per unit = 38.6 bps-equivalent on Meridian rents
```

Two conclusions the party has not drawn:

1. **A mature, 9.4M-unit incumbent extracts ~38.6 bps-equivalent from payments *plus* screening
   *plus* risk services, bundled.** A payments-only 50 bps for a pre-revenue prototype is above
   that. It is not a conservative sensitivity; it is not a number. **Strike it.** 25 bps as a
   stretch case survives — but note it is ~65% of AppFolio's entire per-unit VAS take, from one
   line, which is the right level of skepticism to bring to a processor conversation.
2. **The benchmark is a bundle, so the honest target metric is `$/retained unit/year`, not bps of
   PPV.** LeaseRight at 10 bps captures 26% of the incumbent's per-unit VAS. The remaining 74% is
   the actual expansion thesis, and it is only reachable on units LeaseRight still holds. Again:
   retention.

**Recommended KPI change:** track `$ per retained unit per year` and `engine survival rate at the
stabilization event`. Bps of PPV is an input to the first and says nothing about the second.

### 2.3 Lifetime value per building — the finding that reorders the business

Let `r` = the share of won lease-ups whose payment relationship survives the stabilization event
(sale, PM handoff, lender cash-management veto, contract lapse), and `d` = annual attrition on the
surviving base thereafter. Expected lifetime payment revenue per won building is
`annual revenue × r ÷ d`, compared against one `$25K` fixed project fee.

| Survival `r` | Attrition `d` | Mean life | Lifetime @ 10 bps | Lifetime @ 25 bps |
|---:|---:|---:|---:|---:|
| 0.35 | 0.15 | 6.7 yr | **`$12,062` — 0.48× the fee** | `$30,154` — 1.21× |
| 0.60 | 0.12 | 8.3 yr | `$25,846` — 1.03× | `$64,615` — 2.58× |
| 1.00 (perfect) | 0.15 | 6.7 yr | `$34,462` — 1.38× | `$86,154` — 3.45× |

`r = 0.35` is my base case, and it is generous: it requires the sponsor not to sell, not to hand
payments to a PM, and the loan not to mandate an incompatible lockbox — three independent
conditions the peer memos all flag as common. `d = 0.15` reflects that multifamily assets
typically trade or refinance on a 5–7 year cycle.

**At the underwriting case with realistic survival, a building's entire payment lifetime is worth
less than half of the single fee charged to acquire it.** Even with *perfect* retention, 10 bps
returns 1.38× one project fee spread across seven years, undiscounted. Discount it and it is
roughly one fee.

This does not kill the thesis. It relocates it: payments is a **second, smaller, slower project
fee collected in installments**, whose value is that it arrives without a sale.

### 2.4 Retention dominates take rate — with the crossover

The take rate at which lifetime payments equals one `$25K` fee:

| Survival `r` | Attrition `d` | Crossover |
|---:|---:|---:|
| 0.35 | 0.15 | **20.7 bps** |
| 0.60 | 0.12 | 9.7 bps |
| 1.00 | 0.15 | 7.3 bps |

Read across the rows. Improving retention from `r=0.35` to `r=1.00` cuts the required take rate
from 20.7 to 7.3 bps — a **65% reduction**. Nothing in the processor negotiation is likely to move
the take by that much. **Retention is the higher-leverage variable by a wide margin, and it is the
one variable the currently proposed pilot does not test.**

Consequence for the Overseer's gate: the memo advances the live beta only if the processor proposal
yields *"at least 10 bps expected net take."* Under my base survival case the decision-relevant
threshold is ~21 bps. So **passing the 10-bps gate does not establish payments as the core engine
— it establishes a modest annuity worth about half a project fee.** The gate is not wrong; the
inference drawn from clearing it would be. Either raise the bar to ~20 bps *or* explicitly
reclassify payments as retention/expansion value at 10 bps. I recommend the second.

### 2.5 The distribution arithmetic — flow required to hold the stock

Steady-state retained units per unit of annual win rate is `260 × r ÷ d`. At `r=0.35, d=0.15` that
is 607 units, worth `$12,062/yr` at 10 bps. So:

| Annual lease-up wins `W` | Retained units (steady state) | Payment revenue @ 10 bps | Project-fee line @ `$25K` |
|---:|---:|---:|---:|
| 10 | 6,067 | `$120,619` | `$250,000` |
| 25 | 15,167 | `$301,548` | `$625,000` |
| **83** | **50,353** | **`$1,000,000`** | **`$2,072,500`** |

Three things fall out:

1. **`$1M` of net payment revenue requires ~83 new lease-up engagements won *every year, forever*
   — about 21,600 new lease-up units annually** — merely to hold the stock against attrition. That
   is not a milestone; it is a steady state.
2. **The fee line is 2.07× the payment line at every value of `W`.** The ratio is fixed by the
   assumptions, not by scale. Growth does not flip it. Only a higher take rate (>20.7 bps) or a
   non-lease-up unit source does.
3. **[Market hypothesis — verify]** U.S. multifamily deliveries have run in the low-to-mid hundreds
   of thousands of units annually. 21,600 units/yr of *won, retained* lease-ups is therefore a
   mid-single-digit percentage share of all new U.S. multifamily lease-ups, sustained indefinitely,
   in exchange for `$1M`. I flag this as unverified market context, not repository evidence — but
   the direction is not close enough for the uncertainty to matter.

**The structural conclusion: the lease-up wedge is a poor acquisition channel for a payments
engine.** It has the highest CAC (a bespoke paid engagement), the longest time-to-first-dollar
(revenue starts only at stabilization, 9–18 months in), and the maximum churn hazard precisely at
the moment revenue begins. Every one of those is the opposite of what a volume business wants.

---

## 3. Where I agree with, and where I depart from, my peers

**Agreed, not re-derived:** the owner is the buyer; hybrid execution is the pilot default; the
originator gets a thin rail rather than broker RBAC; partner/direct-charge architecture with the
landlord as merchant of record; resident-free ACH as the default fee incidence; no live money in
Phase B; do not proceed to N3–N17 before a paid validation. The Overseer's regulatory boundary
(FinCEN facts-and-circumstances, Texas Finance Code §152.004, Reg E, Nacha WEB validation, card
surcharge limits, lender DACA risk) is sound and I have nothing to add to it. Counsel, not this
memo, decides it.

**Departures:**

| Peer position | My position |
|---|---|
| Overseer: 50 bps is a "sensitivity" | Strike it. It exceeds AppFolio's entire bundled VAS per-unit take (§2.2). Keeping it in the table lends the range false width. |
| Overseer: advance the beta at ≥10 bps expected net | Correct as a *floor for continuing*, wrong as evidence of an engine. Decision-relevant threshold is ~21 bps at base survival (§2.4). Clearing 10 bps should reclassify payments as retention value, not confirm it as the P&L. |
| Overseer/Contrarian: "prefer a long-term holder" | Right instinct, wrong binding constraint. Holder status is a *proxy* for contract continuity. Test the contract directly — it is cheaper, earlier, and dispositive (§5.1). |
| Contrarian: free resident ACH zeroes the engine | Overseer's reconciliation is right that owner-funded economics can coexist with free ACH. But note the consequence nobody stated: **owner-funded payment economics is a per-unit software subscription wearing a payments invoice.** At 10 bps it is literally `$1.66/unit/month` billed to the owner. If the owner funds it, the "payments engine" framing buys you nothing the `$1/unit` line did not already buy — the mechanism advantages in §1.3 only accrue when the fee rides the resident transaction or a processor share. **This is the sharpest open question in the fee-incidence design and it should be put to the processor in writing.** |
| My own 2026-09-01 brief: price as a share of avoided carry | Withdrawn as the pilot-one instrument. The Model still does not reconcile (three incompatible durations, `+$148K`/`−$277K` scenario carry gaps — findings I stand behind and which the Overseer adopted). A fixed fee scoped from deliverables is correct for pilot one. Carry-share remains a candidate *after* Phase A reconciles the sponsor's own carry. |
| My own 2026-09-01 brief: two-building geometry | Downgraded from a hard requirement to a preference. Under the payment correction, cross-building *originator reuse* is no longer the variable that decides which company this is — **retention across the stabilization event is.** One building can test that; two cannot test it any better. The Contrarian's objection to delaying the first invoice now outweighs my network-falsification argument. |

---

## 4. Operating design: the surface that does not exist

The agreed scope is Model → Today → Pipeline → Inbox → Rents → Applications → Reports
(`SCOPE_AUDIT.md`, confirmed by the Overseer). Every one of those surfaces serves the lease-up.
**There is no surface for the stabilization event — which is the single moment that decides whether
the engine exists at all.**

This is the operating-design gap the payment correction creates, and it is unowned. If retention
is the dominant variable (§2.4), then the handoff is the product.

**`Rents` must be re-scoped from a lease-up collections view into the retention surface.** Concretely
it needs to carry, and to be measured on:

- **Resident payment enrollment** — share of occupied units on autopay through LeaseRight, tracked
  weekly. This is the leading indicator of `r`. The Overseer's beta gate (75% of the eligible cohort
  by the second cycle) is the right target; it belongs on this surface permanently, not just in the beta.
- **Contract continuity state** — term end, assignment status, successor-manager status, renewal
  owner. Today this lives in nobody's product and nobody's dashboard.
- **The stabilization countdown** — an explicit transition from "project" to "standing
  infrastructure," with the handoff checklist as a first-class object.
- **Realized `$/retained unit/year`**, replacing any bps display. Bps of PPV flatters; per-unit is
  comparable to AppFolio's `$76.76` and to `$1/unit`, and is therefore honest.

**Resequencing recommendation:** under the payment correction, the originator rail drops below
handoff design in strategic priority. The originator rail contributes zero to the engine (the
Contrarian is right that originators do not collect rent) and tests the *wedge's* differentiation.
Handoff design tests the engine. Keep the originator rail in Phase B — it is cheap and the wedge
still has to be differentiated — but if resources force a choice, handoff wins. This is a change
from the current Phase B priority ordering.

**One prototype inconsistency, flagged not fixed** (Builder's territory; I did not guess at intent):
`components/data.jsx:373-377` sets ACH `fee: "free"` with `note: "renter-paid"` in the same row.
Those contradict. Whichever is intended, the demo currently shows a fee schedule that the
`LEDGER_TAPE` treats as a pure cost with no LeaseRight revenue line — meaning the artifact Justin
would put in front of a sponsor still depicts the engine as an expense.

---

## 5. Does this change the recommended pilot? Yes — three changes

I adopt the Overseer's structure: a fixed, upfront five-figure, stage-gated engagement; Phase A
paid Model reconstruction plus payment diligence; Phase B conditional operating test; live payments
separately gated. That structure is right and I am not reopening it. Three additions.

### 5.1 Add a contract-continuity term sheet to the *commercial* gate — before Phase A

This is the highest-value change in this memo and it costs nothing to run.

The engine dies from retention failure, not from take-rate failure (§2.4). The cheapest possible
test of retention is not a processor quote, not shadow reconciliation, and not a 60-day operating
test. **It is asking the sponsor to sign continuity language in the pilot contract, in the first
commercial conversation.** Four terms, subject to counsel:

1. **Assignment on sale** — the payment-services agreement binds a successor owner, or the sponsor
   uses commercially reasonable efforts to assign it.
2. **PM-successor obligation** — if a property manager is engaged post-stabilization, LeaseRight
   remains the payment path, or the sponsor gives notice and a right to bid.
3. **Right of first refusal on payment processing** at stabilization, at market terms.
4. **Lender disclosure** — the sponsor represents the loan documents' cash-management requirements
   and shares the relevant provisions.

**The signature is the datum.** A sponsor who happily pays a five-figure fee for the lease-up job
and strikes all four clauses has told you, for free and in month zero, that the acquisition path to
the payments engine does not run through this door. That is the fastest available falsifier of
Justin's correction, and it arrives before any engineering, any legal spend on funds flow, and any
processor negotiation.

It also has an option value the Overseer's design lacks: if the clauses *are* signed, LeaseRight
has converted a terminating project engagement into a durable claim on the asset — which is the
only mechanism by which `r` rises toward the values that make the engine work.

### 5.2 Prefer a sponsor with existing stabilized units — and test the engine on those, in parallel

The Overseer's payment beta is gated behind the pilot building having residents who pay rent. On a
ground-up lease-up that is 9–18 months away. **The pilot as designed cannot produce payment evidence
inside the pilot's own timeframe.**

Change the target profile: prefer a sponsor who is doing a qualifying lease-up **and already owns
stabilized units elsewhere**. Then the shadow-reconciliation cycles and the capped 25–50-payment ACH
beta can run on the *existing* stabilized asset, in parallel with Phase A, on units that already
exist and already pay — while the lease-up building runs the wedge test.

This is strictly better on three axes: payment evidence arrives roughly a year earlier; it tests the
engine on the asset class the engine actually serves (stabilized, occupied) rather than on a
lease-up that has no rent roll yet; and it directly probes the second-door question in §2.5 — can
LeaseRight acquire *stabilized* units without selling a lease-up? If a sponsor will route an existing
building's rent through LeaseRight, the engine has an acquisition channel that does not carry a
bespoke engagement's CAC. That is the single most valuable thing the pilot could discover.

Do not make it a hard gate. Under the ICP funnel in §5.3 it would make the target unfindable. Make
it the primary tiebreaker among qualified sponsors.

### 5.3 Budget for the search — the engine-eligible ICP is narrow

The engine-eligible target must satisfy, simultaneously: (a) a 100–400 unit lease-up now; (b)
develop-and-hold ≥24 months post-stabilization; (c) control of the PM contract's payment terms;
(d) loan documents permitting the payout path; (e) willingness to sign §5.1 continuity terms; and
now (f) existing stabilized units.

**[Judgment, not data — illustrative priors, not a measurement]** at 50% / 40% / 40% / 60% / 50% /
50% respectively and rough independence, the joint hit rate is ~1%. Even at generous priors it is
low single digits.

The point is not the number; it is the **resourcing implication nobody has stated**: finding this
sponsor is a sourcing project of dozens of qualified conversations, not a phone call. Two
consequences for Justin:

- **Do not let target search block the first invoice.** If a sponsor satisfies (a) and (e) but fails
  (b) or (f), take the engagement, price it to be profitable standalone, and record in the readout
  that it validated the wedge and not the engine — as the Contrarian correctly insisted.
- **Price the wedge to stand alone.** If the fixed fee is set as a loss-leading CAC against payment
  LTV, §2.3 says you are paying `$25K` to acquire an asset worth `$12K`. The fee must be profitable
  on its own terms. It is the business until proven otherwise — and at 2.07× the payment line
  (§2.5), it may simply be the business.

---

## 6. The strategic question this forces

The party has been treating "services versus network" as the open identity question. Under the
payment correction it is superseded. The real question is:

> **Is LeaseRight a high-margin productized lease-up practice that happens to earn a payments
> annuity on the buildings it retains — or is it a rent-payments business that needs a second,
> cheaper door to acquire stabilized units?**

The arithmetic says it is currently the first and can only become the second by finding a
non-lease-up acquisition channel. It cannot become the second by executing the current plan harder:
§2.5 shows the fee line stays 2× the payment line at every scale the lease-up door can reach.

Both are real businesses. The first is bounded, cash-positive early, and reachable from where the
repository actually is. The second is larger and requires a channel that does not exist yet.
**Justin should choose knowingly rather than discover it at scale**, and §5.1–5.2 are designed to
produce the evidence for that choice inside pilot one, cheaply.

---

## 7. What would change my mind

1. **A written processor proposal at ≥20 bps net**, with a stated fee base and no offsetting
   reserves or clawbacks. Then §2.4's crossover is cleared at base survival, payments beats the fee
   line per building, and I withdraw §2.3's relocation of the thesis.
2. **A sponsor signs the §5.1 continuity clauses without material amendment.** Then `r` is plausibly
   well above 0.35, the crossover falls under 10 bps, and the Overseer's existing gate becomes the
   right gate. This is the cheapest and most likely of the five.
3. **A stabilized-portfolio owner routes rent through LeaseRight without buying a lease-up
   engagement.** Then the second door exists, CAC collapses, and the volume bars in §2.5 stop being
   governed by lease-up win rate. This is the highest-value falsifier and §5.2 is designed to expose it.
4. **The bundle attaches early** — screening or deposit alternatives on the same rail push realized
   revenue toward the `$76.76/unit/yr` benchmark. Then per-unit economics, not bps, carry the
   business and my §2.2 caution about 25 bps becomes irrelevant because payments was never the whole line.
5. **Meridian's `$2,180` is unrepresentative on the low side.** Every figure here scales linearly
   with rent. A `$4,000`-rent ICP roughly doubles `$/unit/month` at constant bps. It does not change
   any ratio in §2.3–2.5, but it does change whether `$3.32/unit/month` feels like an engine.

---

## 8. Decisions this brief puts to Justin

Two, and neither is a re-ask of the Overseer's existing pair (name the target; authorize the pilot).

1. **Accept or reject the reclassification.** Payments at 10 bps is a **retention engine worth about
   `$1.66/unit/month`**, not an acquisition engine — and until a written proposal clears ~20 bps, the
   project fee is the business. Accepting this changes what pilot one reports, not what it sells.
2. **Authorize the continuity term sheet (§5.1) as part of the pilot contract.** This is the only
   item here that needs authorization before the first commercial conversation, it costs nothing,
   and it is the fastest test of the correction Justin just made. It requires counsel review of four
   clauses, not a payments legal architecture.

**Not needed from Justin:** a take-rate percentage, a resident fee schedule, a processor selection,
principal/PayFac posture, handoff-surface design detail, or any change to the agreed pilot structure.

---

## 9. What this mission did

- Inspected `PROJECT.md`, `PRODUCT_DIRECTION.md` (incl. the revised Business Model section),
  `SCOPE_AUDIT.md`, `SOURCE_OF_TRUTH.md`, the Overseer synthesis, the Contrarian payments brief, the
  Builder payment reassessment section map, and live literals in `components/data.jsx` and
  `components/model-data.jsx`. Confirmed repository state at `3ac29fb` with the working tree
  carrying the peer memos as untracked files.
- Verified from repo literals: 260 units × `$2,180` (`data.jsx:474-481`); carry `$227,000/month`
  (`model-data.jsx:127`); `PAY_METHODS` ACH `free`/`renter-paid` contradiction (`data.jsx:373-377`);
  `COLLECTION_KPIS.collected` `$248,400` on 118 units (`data.jsx:361`).
- Recomputed by hand (interpreters were sandbox-blocked; every figure reconciles to the Overseer's
  published table): PPV `$5,169,216`; PPV/unit `$19,881.60`; the full bps → `$/unit/month` conversion;
  AppFolio VAS `$76.76`/unit/yr = 38.6 bps-equivalent; lifetime-per-building at three survival cases;
  crossover take rates of 20.7 / 9.7 / 7.3 bps; steady-state win rate of ~83 lease-ups/year for `$1M`;
  the fixed 2.07× fee-to-payments ratio.
- Position: adopt the Overseer's pilot structure and regulatory posture; reclassify payments from
  acquisition engine to retention engine; strike 50 bps; identify retention rather than take rate as
  the dominant variable; add the contract-continuity falsifier, the stabilized-units target
  preference, and the parallel payment beta to the pilot; name the missing stabilization-handoff
  surface as the operating-design consequence of the correction.

**Files changed:** this file only. No prototype code, no canonical document, and no peer memo was
modified. **Blockers:** none. Market-size context in §2.5 and the ICP priors in §5.3 are explicitly
labeled as unverified judgment; web verification was not performed this session.

---

*End of brief.*
