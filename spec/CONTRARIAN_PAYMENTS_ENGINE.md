# Contrarian brief — Rent-processing fees as the economic engine

> M4D Contrarian package. 2026-09-02. Parallel workstream. Self-contained
> pressure-test of Justin's correction that long-term monetization is a
> **share of rent-processing fees on rents collected through LeaseRight**, not
> `$1 per unit`. Does not edit the prototype. Does not consult other packages;
> the needed expertise is in this repository plus labeled market/legal
> hypotheses. Handoff is to the Overseer.

**One recommendation.** Treat processing-fee share as the *intended* engine,
then stop talking as if naming it created a P&L. On The Meridian's own mix
and rents, a realistic net is **about $11K–$16K per stabilized year**, not
the prior ~$63K "1% of rent" figure, and the demo schedule (74% free ACH)
makes the engine a **cost**. That does not fund the lease-up job, does not
appear during the job, and dies if the sponsor sells or hires a PM. Do
**not** replace the first paid SKU with a payments build. Do **change** who
the first building can be, and add a cheap engine screen before anyone calls
the Model pilot a path to a company.

---

## 0. Mission answers (plain)

| Question | Answer |
|----------|--------|
| Does this engine work as the core P&L? | **Not at the scale or customer the prototype is built for.** It can be a real residual *after* tens of thousands of occupied units on a renter-paid schedule, with a licensed partner, on assets the sponsor keeps and collects without a PM. That is a different company than a 260-unit lease-up OS. |
| Required payment volume | See §2. Rough bars: **~$27k occupied units** to cover a two-person team at a conservative ~$15/unit-year net; **~$22k units / ~90 Meridian-equivalents** for $1M ARR at the optimistic ~$46/unit-year renter-pays case; **~$63 Meridian-equivalents** at 25 bps of GPV. One building is a rounding error. |
| Realistic take rate | **Not 1% of rent.** That was my 2026-09-01 gift to the thesis and I withdraw it. Processing-fee share is **$0–$60 per occupied unit per year** in plausible cases; **25 bps of GPV is already aggressive** for a new software layer on someone else's rails. The demo implies **~25 bps of GPV as a processor *cost***. |
| Regulatory / operational constraints | If LeaseRight ever holds rent, it is in money-transmitter / MSB territory **[legal — counsel]**. The viable near path is a partner residual (Stripe Connect, rent-specialist processor), which caps the take. CRE lockbox / DACA can forbid the flow **[lending practice]**. Security deposits are a harder trust-accounting problem than rent. |
| Adoption incentives | Owner wants free ACH and no extra portal. Resident will bill-pay the landlord's bank and bypass the processor. PM will not donate their payments margin. Merchant-builder exits at the moment volume appears. Lender often wants the bank, not a startup. |
| Does this change the recommended pilot? | **Yes, the target and the readout. No, the first SKU.** Keep paid Model reconstruction as the first check. Kill "payments stay later, ignore them." Add an engine screen (holder? self-collect? lockbox? fee schedule? PM?) as a go/no-go on whether this customer can ever feed the engine. Do not put originators, a 60-day OS, or a live payment rail into pilot one. |

Repository arithmetic below is from current literals (`data.jsx`,
`model-data.jsx`, `shell.jsx`). Market processor list prices, residual
splits, lockbox frequency, and licensing are **[market hypothesis]** or
**[legal — counsel]**. Official processor and AppFolio filings were not
re-fetched this session (web tools blocked); do not treat those rates as
audited.

---

## 1. Independent position

Justin's correction is a clarification of `PRODUCT_DIRECTION.md`, not a new
idea. That file already says the lease-up workflow is the wedge and
"payments are the economic engine." What changed is the *party consensus*.
On 2026-09-01 the Overseer, Implementer, and this package all filed
payments under "later hypothesis" so a five-figure Model/OS pilot could
be authorized without a P&L. Justin is right to refuse that dodge.

He is not right that this engine, on this product, at this customer,
is "the meaningful revenue opportunity" in any sense that changes what
to sell next.

Four claims:

1. **The fee pool is the processing fee, not the rent.** A share of
   *processing fees* on $6.33M of stabilized Meridian rent is a four- or
   five-figure line. A share of *rent* would be a property-management
   fee. Those are different businesses. The prototype already chose the
   small pool: 74% ACH is `fee: "free"`.
2. **The wedge customer and the engine customer are in conflict.** The
   demo is a 260-unit ground-up lease-up with a lender package. That
   buyer is the one most likely to sell, hire a PM, or sit behind a
   lockbox — all of which zero the engine. The engine wants a long-term
   holder who collects rent themselves. `10_PERSONAS` §1.4 already knows
   this and then designs for both.
3. **Adoption incentives run against the take.** Free ACH maximizes
   resident use and destroys residual. Renter-paid ACH/card maximizes
   residual and invites bank bill-pay, cash, and "why am I paying to pay
   rent?" The demo currently encodes the first schedule and still paints
   Stripe fees as an operating *cost* (`LEDGER_TAPE` `−$620`).
4. **A payments pilot is the wrong next commercial act, for a new
   reason.** Yesterday: too much product, no customer. Today: the engine
   is real only at portfolio scale, on a licensed rail, after occupancy.
   Building that rail in a static HTML prototype is how a studio
   collects a compliance event instead of a learning event. Qualify the
   engine with questions and one partner residual quote. Do not "add
   payments" to the 60-day OS to honor Justin's correction.

If those four are right, the 2026-09-01 consensus ("`$1/unit` + payments
is not the next milestone") was right about *engineering* and wrong about
*honesty*. The milestone still is not a processor. It is a named building
that can, or cannot, ever produce processing volume — and a first invoice
that does not pretend otherwise.

---

## 2. Volume, take rate, and what "meaningful" would require

### 2.1 What the seed actually contains

From current literals:

| Input | Source | Value |
|-------|--------|--------|
| Units | `BROKER_ECONOMICS` / Meridian | **260** |
| Avg rent | `BROKER_ECONOMICS.avgRent` | **$2,180** |
| Stabilization occupancy | intake / Today "121/242" | **93% → 242 occupied** |
| Stabilized monthly GPV | 242 × $2,180 | **$527,560** |
| Stabilized annual GPV | × 12 | **$6,330,720** |
| Mid-lease-up leased | seed | **121** |
| Demo collections | `COLLECTION_KPIS.collected` | **$248,400** on 118 current |
| Method mix | `PAY_METHODS` | **ACH 74% / card 22% / check 4%** |
| ACH fee in demo | `PAY_METHODS` | **`free`** (note also says "renter-paid" — unresolved) |
| Card fee in demo | `PAY_METHODS` | **`2.9% + $0.30`** (Stripe retail, not a rent convenience markup) |
| Autopay provider | intake bank step | **Stripe** |
| Stripe in the ledger | `LEDGER_TAPE` / Today peek | **−$620 on 118 charges** |
| Payments objects in seed | `model-data.jsx` `payments[]` | **6 mock rows** (3 failed rents, 2 deposits, 1 app fee) |
| Chrome price | `shell.jsx` | **`owner · $1/unit · forever`** |

The product's own money tape treats processing as a cost, not a share.
$620 / $248,400 = **25 bps of GPV outbound**. $620 / 118 = **$5.25 per
charge**. There is no LeaseRight revenue line on rent movement.

`$1/unit forever` remains undefined as a period. At `/month` it is
**$3,120/year** on 260 units. Monthly carry is **$227,000**. One
carry day is **~$7,567**.

### 2.2 Two interpretations — do not mix them

Justin said "share of rent-processing fees on rents collected through
LeaseRight." That can be read two ways.

**Interpretation A — share of the fee line (plain English).** LeaseRight
keeps a cut of ACH convenience fees and card convenience fees. This is
what "processing fees" means. The pool is small.

**Interpretation B — basis points of gross payment volume.** LeaseRight
sits in the money flow and takes 10–100 bps of rent. This is how people
talk about "payments businesses," and it is how I previously smuggled in
a 1% take. 1% of Meridian rent is **$63,307/year** — a PM-like skim,
not a processing residual. I used that number on 2026-09-01. **Withdraw
it as a processing-fee case.**

If Justin means B, he should say so. That is a different fight with
owners, lenders, and (in many structures) a different license.

### 2.3 Cases on Meridian, stabilized (242 units, $6.33M GPV, 2,904 tx/year)

Mix held at the demo 74 / 22 / 4. Card GPV ≈ **$1.39M**.

| Case | What it assumes | Net to LeaseRight / year | Per occupied unit |
|------|-----------------|--------------------------|-------------------|
| **D0. Demo schedule** | ACH free; card is Stripe pass-through `2.9%+$0.30`; check $0 | **~$0 revenue; ~$51K cost** if the landlord/platform eats Stripe retail ACH-at-cap + card | Cost, not engine |
| **D1. Partner residual** **[market hypothesis]** | Renter-paid ACH $2.95, card 2.99%; LeaseRight keeps **30%** of posted fees, partner does the transmitting | **~$14K** (`$2.95×74%×2,904` + `2.99%×$1.39M`, × 0.30) | **~$59** |
| **D2. Optimistic renter-pays, specialized ACH** **[market hypothesis]** | ACH $1.95 fee vs ~$0.50 cost; card convenience 3.49% vs Stripe-like cost | **~$11.1K** (ACH net ~$3.1K + card net ~$8.0K) | **~$46** |
| **D3. 25 bps of GPV** | Aggressive for a new software layer; coincidentally the demo's *cost* rate | **~$15.8K** | **~$65** |
| **D4. 50 bps of GPV** | Would require controlling the fee schedule and mix, i.e. closer to PayFac | **~$31.7K** | **~$131** |
| **D5. 100 bps of GPV** | Yesterday's "generous 1%." Not a processing fee. Owner-visible rent skim. | **~$63.3K** | **~$262** |
| Software as written `/month` | `$1/unit/month` | **$3,120** | $12 |

Read D0 vs D2 out loud: the prototype Justin would show a sponsor already
chose the schedule that **zeroes** the engine. You cannot keep "ACH free"
as the resident experience and also keep processing-fee share as the
P&L. Those are opposite products.

### 2.4 Timing: the engine is off during the job you sell

Lease-up is a ramp. A linear 9-month climb to 242 occupied, then 3 months
full, is **~1,936 unit-months** vs **2,904** at stabilization (~67% of a
stabilized year). Year-1 GPV ≈ **$4.22M**. D2 net in that year ≈ **$7.4K**.

The 79-week absorption clock still living in the intake stepper makes
year-1 even thinner. Payments require occupied units. Occupied units are
the *output* of the lease-up. The high-touch, high-carry period is when
processing revenue is smallest. Carry is **$227K/month**. D2's *full-year*
net is **~1.5 carry days**. Staffing "hybrid savings" of $84,540 was
11.3 carry days — and that was already too small to pick an operating
model. The engine is smaller still.

### 2.5 Required volume (what "core economic engine" implies)

Pick a bar, then count buildings. All figures are occupied units paying
*through LeaseRight*, not units in a CRM.

| Net take | Units for ~$400K (small team) | Units for $1M ARR | Meridian-equivalents for $1M (÷242) |
|----------|-------------------------------|-------------------|-------------------------------------|
| $8 / unit-year (cheap ACH residual, little card) | 50,000 | 125,000 | **~517** |
| $15 / unit-year (conservative blended) | 26,700 | 66,700 | **~276** |
| $46 / unit-year (D2 optimistic) | 8,700 | 21,700 | **~90** |
| $65 / unit-year (25 bps) | 6,200 | 15,400 | **~64** |
| $262 / unit-year (1% of this rent) | 1,500 | 3,800 | **~16** |

A company that needs **~90 successful Meridians** at an optimistic
renter-pays take, or **~276** at a conservative residual, is not "the
lease-up OS that becomes infrastructure." It is a **rent-payments
portfolio** that happens to have a lease-up front door. AppFolio-class
PM suites get there with millions of units and a bundle (software +
payments + insurance + screening). LeaseRight has six mock payment rows
and no partner term sheet.

**Failure mode if we hand-wave scale:** one paid 260-unit pilot is cited
as evidence the engine works because "rents will flow through us later."
That is the same category error as citing `$1/unit` as a business.

### 2.6 Adjacent money that is not this engine

People inflate "payments" with other lines. Keep them separate:

- **Deposits.** Seed has an Escrow account and `security_deposit` rows.
  Float/interest and deposit handling are trust-accounting plus state
  property-code rules, not a processing residual. Higher compliance, not
  a shortcut.
- **Card mix expansion.** The only fast way to make D2 look like D5 is
  to push residents onto cards. That is politically and, in some
  places, legally a junk-fee story **[legal — counsel]**. It also
  raises owner and resident refusal.
- **Late fees / NSF.** Real, small, and often regulated (Texas late-fee
  rules exist). Do not underwrite the company on them.
- **Commission take-rate.** Already shown (Strategist table; I agreed)
  to be **$6K–$14K per building** at 10% of locator commissions. Same
  order of magnitude as D2, and it still requires a network. It is not
  a substitute for processing volume.
- **Banking / accounts.** "Banking" in `PRODUCT_DIRECTION` is a
  charter-partner fantasy at this stage. Ignore it for pilot design.

---

## 3. Regulatory and operational constraints

High-level only. Not an implementation path. Real money movement needs
counsel and a partner, not a Babel script.

### 3.1 Principal vs partner (the fork that sets the take)

| Path | What LeaseRight is | Effect on take | Effect on time/risk |
|------|--------------------|----------------|---------------------|
| **Partner residual** | Software; processor is merchant / transmitter | Small (D1-shaped) | Months, not years; partner can change pricing or go direct |
| **Principal / PayFac** | Takes in rent, pays owner; likely money-transmitter + MSB + NACHA originator + OFAC | Can approach D3–D4 if mix and fees are controlled | Capital, licensing across states, exams, residuals, PCI. Not a prototype decision |

If the company is not prepared to become a licensed money business, the
engine **is** D0–D1. Saying "share of processing fees" while remaining a
static site on Stripe-as-prop is D0.

Texas first market (Meridian is East Austin): a principal path is a
Texas money-services question plus FinCEN if it is a transmitter
**[legal — counsel]**. A partner path is a contract question. Neither is
solved by Collection view mockups.

### 3.2 Deposits are not "the same rail as rent"

Texas Property Code Chapter 92 (security deposits, accounting, return)
sits next to any Austin pilot **[legal — counsel]**. The seed already
splits Operating vs Escrow vs Reserves, which is the right *shape*. A
processor that commingles deposits with rent or ops is a different
failure than a missed ACH retry. Do not use deposit float to juice the
processing thesis.

### 3.3 Lender cash management can veto the engine

**[lending practice, not repo evidence]:** CRE construction-to-perm and
agency loans commonly use lockbox, deposit-account control, and a
waterfall. Tenant payments go to a bank-controlled account. A third-party
"autopay provider: Stripe" is not automatically an approved lockbox
agent.

This constraint is missing from `PRODUCT_DIRECTION`, the Overseer memo,
and the prototype. It is first-order for interpretation B and still
material for A: if residents are instructed to pay the lockbox, LeaseRight
GPV is zero regardless of take rate.

### 3.4 Operational reality the seed already hints at

- Failed payments are the Collection view's personality (NSF, expired
  card, stop payment). Returns and retries eat ACH margin; they are not
  a side quest.
- 4% check/cash is the bypass. Bank bill-pay is a larger bypass the
  seed does not model: the resident pays the owner's Chase operating
  account and LeaseRight never sees the transaction.
- Winning "rents collected through LeaseRight" means **mandating** the
  portal or losing GPV. Mandate fights the `$1/unit` / no-bloat brand.

---

## 4. Adoption incentives (who wants this, who kills it)

| Actor | Incentive to put rent through LeaseRight | Incentive to refuse |
|-------|------------------------------------------|---------------------|
| **Long-term holder, no PM** | One system; deposits already in the story; cheap software bait | Their bank already ACHs for cents; residents hate paying to pay; they can use Baselane / a PM suite / bill-pay |
| **Merchant-builder** | Almost none for *permanence*; maybe a clean lease-up file for the buyer | Sale transfers the relationship. Engine dies at stabilization — `10_PERSONAS` §1.4 |
| **PM (User Mode 3)** | None. Payments **are** their margin (Buildium, AppFolio, RealPage, in-house ACH) | "Make the PM use LeaseRight" and "preserve the developer's payments relationship" is asking them to donate the P&L. This user mode is an **engine-killer dressed as a GTM concession** |
| **Resident** | Autopay if ACH is free and the portal is the only way | Convenience fees; second login; bank bill-pay; cash |
| **Lender / servicer** | Reporting, if they do not already get lockbox data | They already have cash control. A startup processor is operational risk |
| **Exclusive broker / locator** | Irrelevant. They do not collect rent | Do not recruit them to validate *this* engine |

The 2026-09-01 agent debate is almost orthogonal to this mission.
Originators can add leases; they do not add a processing residual until
those leases pay *through LeaseRight* and stay. Putting originators in
Phase B does not test Justin's correction.

**The ugly GTM loop:**

1. To win the sponsor, promise `$1/unit` and free ACH (current chrome +
   `PAY_METHODS`).
2. To win the engine, charge for ACH/cards and keep the money after
   stab.
3. To keep the money after stab, the sponsor must not sell and must not
   hire a PM who brings AppFolio.
4. The prototype's ICP (100–400u ground-up, lender-ready, three
   operating modes including PM-managed) maximizes (3)'s failure.

This is not a sequencing nit. It is two products sharing a name.

---

## 5. Does this change the recommended pilot?

### 5.1 What does *not* change

- Do **not** authorize a 60-day seven-surface OS + originator bundle as
  the first paid thing. That still cannot falsify a software thesis, and
  it still cannot create a processor.
- Do **not** implement N3–N17, a live ACH rail, or simulated "real"
  Stripe charges to honor this correction.
- Do **not** price pilot one as a share of processing fees. There is
  almost no volume until occupancy, and the Model still cannot add.
- First invoice remains a **fixed fee for Model reconstruction + weekly
  variance**, from the sponsor's records, if the wedge is still the
  door. That tests willingness to pay for the *job*. It does not test
  the engine — and must not be reported as if it did.

### 5.2 What does change

**A. The first named building is now an engine screen, not just a
lease-up sample.**

A Meridian-shaped merchant-builder who will sell, or a sponsor who will
hand the asset to a PM with an existing payments stack, can still be a
*wedge* customer. They are a **failed engine customer on day one**. If
that is the only building available, the Overseer should say so in the
pilot readout: "we can learn the Model; we cannot learn payments." Do
not let a successful memo on a doomed-engine asset become "the thesis
is working."

Minimum screen before naming the target (yes/no, written):

1. Will this owner **hold** the asset at least 24 months after
   stabilization (not a contracted sale)?
2. Who collects rent today, and through what (bank, lockbox, PM suite,
   nothing yet)?
3. Does the **loan** require lockbox / DACA / an exclusive cash manager?
4. After lease-up, will a **PM** be hired, and if so, is that PM
   contractually required to keep LeaseRight as the payment path? (If
   the answer is "we'll make them," treat as **no**.)
5. Will residents be **required** to pay through LeaseRight, and on
   what fee schedule (free ACH vs renter-paid)?

If (1), (4), or (5) fail, this building does not test Justin's engine.
Pick another building or stop calling payments the P&L.

**B. Add two cheap engine tests to Phase A. Do not add a payments
surface.**

1. **Five-question screen above**, on the named sponsor and, if they
   will take the call, their lender/servicer.
2. **One processor-partner conversation** (not a build): what residual
   exists for a software layer on their rails, at this mix, in Texas, if
   LeaseRight never holds funds. Write the $/txn or bps number into the
   file. Until that number exists, "share of processing fees" is still
   a slogan.

Do **not** recruit five originators as part of *this* mission's test.
They are the wrong expert.

**C. `$1/unit forever` is now in conflict with the engine, not merely
too small.**

Yesterday the attack was magnitude. Today it is also **fee-schedule
poison**: it trains the buyer that money is not the product, and it
pairs naturally with free ACH. If Justin wants processing-fee share as
the engine, the chrome should stop advertising a property-management
seat price as the company. Leave the number out of the first sales
artifact, or restore a period and call it a wedge, not the story.

**D. User Mode 3 (PM-managed) is incompatible with the engine.**

Keep it only as a wedge concession that *explicitly forfeits* long-term
payments. Do not list "preserve the developer's payments relationship"
as a PM-mode goal. That sentence is how the docs paper over the fight.

**E. Hybrid / originator sequencing is unchanged, and even less
relevant.**

Still: originators out of the first commercial test; conversations
optional; no registration prototype. This mission does not revive
Lead Broker.

### 5.3 What would a payments-true first commercial test look like?

Not recommended as *the* first check, because the wedge still has no
customer. If Justin insists the engine is the company, the honest
minimum test is **not** "collect rent in the prototype." It is:

- Name a **holder-operator** with units already collecting, or a
  lease-up that passes the screen in §5.2.A.
- Written resident mandate + fee schedule.
- Written lender/lockbox position.
- A partner residual quote.
- Then, much later, a small live volume on the partner's rails.

That is still not N3–N17. It is also not the current Overseer Phase B.

---

## 6. What would change my mind

I am wrong, or partly wrong, if:

1. **Justin means a rent skim (interpretation B)** and a named sponsor
   will pay 50–100 bps of collected rent to LeaseRight *instead of* a
   PM, in writing. Then the engine is large enough that volume bars
   collapse toward ~16–64 buildings. That is a harder sale, a different
   license question, and still not a reason to start with Meridian-as-
   merchant-builder.
2. **A processor term sheet** shows a residual at or above ~$80–$100
   per occupied unit-year at a mix owners will actually mandate. Then
   D2 is too pessimistic and ~$1M is ~10–13k units, not 22k.
3. **The ICP flips in writing** to small-portfolio long-term holders
   who never hire a PM and never sit in a lockbox. Then the engine and
   the customer align — and the 260-unit lender-package demo is the
   wrong artifact.
4. **A perm lender** confirms Stripe-or-equivalent as an approved
   receipt path on the first target. Then constraint 3.3 is not binding
   *on that deal* (it remains binding as a market pattern).
5. **A PM** agrees in writing to collect rent on LeaseRight's rail and
   forgo their payments margin. I do not expect this. If it happens, User
   Mode 3 stops being an engine-killer.

Until 1 or 2, do not use processing-fee share to claim the company has
an economic engine. Until 3, do not use Meridian as the proof asset for
that engine. Until 4, do not assume GPV is allowed. Until 5, do not
treat PM-managed as a path to the engine.

---

## 7. Opposing views

**"PRODUCT_DIRECTION already said this; the party overcorrected."**
True as history. False as arithmetic. The docs named the engine and
then specified a free-ACH, `$1/unit`, three-mode GTM that starves it.
Honoring Justin means measuring the engine, not restoring the slogan.

**"Payments companies are huge; therefore this is the right bet."**
The huge ones own the operating system the PM already lives in, at
millions of units, with insurance and screening stacked on the same
file. LeaseRight would be entering that fight from a lease-up memo.
Scale is the product.

**"Win the lease-up, stay for payments — land and expand."**
Land-and-expand needs the lander to still be the customer at expand.
Merchant-builder and PM-handoff are expand-killers. The first target
has to be a holder-operator or this sentence is fan fiction.

**"Use Stripe and take a share; it's just software."**
Stripe retail on $2,180 ACH is capped near $5 **[market hypothesis,
verify]**. A $1.95–$2.95 convenience fee cannot beat that without a
rent-specialist cost basis. The ledger already shows fees as a cost.
A Connect residual may exist; it is the thing to *quote*, not to assume.

**"Then charge 1% and stop fussing."**
That is not a processing fee. It is competing with PM fees and lender
cash management. Say it plainly if that is the company.

---

## 8. Handoff to Overseer

Peer, not instruction. What I think you should change in the synthesis
if you agree:

1. Stop filing "payment processing" next to `$1/unit` as a later
   expansion hypothesis **of the same kind**. `$1/unit` is a GTM tactic
   that fights the engine. Processing-fee share is the intended P&L and
   is **unproven, small on one building, and ICP-fragile**.
2. Keep the first invoice as a fixed-fee Model reconstruction. Add the
   §5.2.A engine screen as a condition of *naming* the building, and
   the partner residual quote as a Phase A artifact. Do not add a
   payments rail or originator recruit to satisfy this correction.
3. If the only available target fails the engine screen, say the pilot
   validates the wedge only. Do not let that success re-authorize N3–N17
   as "the OS that becomes the processor."
4. Reclassify User Mode 3 as engine-forfeit. Recommend Justin pick
   holder-operator vs merchant-builder in writing; this mission makes
   that pick load-bearing for the P&L, not just for persona tone.
5. Do not ask Justin for a take-rate percentage yet. Ask him which pool
   he means (fee line vs bps of rent) and whether free ACH survives.

I did not need Builder, Implementer, or Strategist on this pass.
Strategist already priced commission take-rate as a network bet; the
same shape applies harder here. Their carry-share pricing is still the
wrong pilot-one instrument (Model still does not add). I still reject
two-building geometry as a way to skip the first invoice.

---

## 9. Decisions that require Justin

1. **Which pool is the engine?** Share of *processing fees* (A) or bps
   of *rent* (B). Recommended: admit A, and therefore admit the volume
   bars in §2.5. If he means B, that is a PM-fee company and should be
   said in those words.
2. **ICP for the engine, not the vibe.** First target = long-term
   holder who will collect without a PM payments stack, or explicitly
   a wedge-only building that cannot prove the engine. Recommended:
   do not name a merchant-builder Meridian analogue as the proof of
   this correction.
3. **Fee schedule.** Free ACH (current demo; engine ≈ 0) vs renter-paid
   (engine can exist; adoption harder). Cannot have both as the story.
4. **Principal vs partner.** Recommended: **partner only** until a
   residual quote exists; no principal/PayFac ambition in the pilot.
5. **First paid SKU.** Recommended: **unchanged** — paid Model
   reconstruction + memo — **plus** the engine screen and one partner
   quote. Refuse a payments feature in the 60-day OS.

He does **not** need to authorize a take-rate, a Stripe integration,
deposit float, N3–N17, or originator registration to honor his own
correction.

---

## What this mission did

Inspected `PRODUCT_DIRECTION.md` Business Model, `10_PERSONAS` §1.4,
Overseer / Implementer / prior Contrarian / Strategist memos, and live
literals: `PAY_METHODS`, `COLLECTION_KPIS`, `LEDGER_TAPE` −$620,
`payments[]` (6 rows), `BROKER_ECONOMICS` 260 × $2,180, 93%/242
occupancy, `shell.jsx` `$1/unit · forever`, intake Stripe autopay.

Recomputed Meridian GPV ($6.33M stabilized year), withdrew the 2026-09-01
1%-of-rent ~$63K figure as a processing-fee case, and replaced it with
D0–D5. Compared engine net to carry (~1.5 days at D2). Did not consult
other packages. Did not change prototype code.

Web search/fetch for current AppFolio filings and processor price sheets
were blocked; market rates are labeled hypotheses.

No secrets in this file. No money-movement implementation.

---

*End of brief.*
