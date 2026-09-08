# Builder handoff — implementation evidence and validation boundary

**Project:** LeaseRight  
**Package:** Builder  
**As of:** 2026-09-01  
**Scope:** repository inspection, implementation reality, verification, and the smallest useful correction

## Recommendation

LeaseRight is a coherent product hypothesis, but the repository does not establish that the
business model works. The strongest viable version to test is a **paid, owner-controlled
plan-to-actual lease-up command center with hybrid execution as the default**:

- The developer, owner, or asset manager buys the project and owns its data.
- Whoever operates the building's leads—an in-house team, PM, or exclusive lease-up broker—uses
  the same execution workbench.
- Outside locators, tenant representatives, and Realtors do not maintain the owner's Pipeline.
  They use a thin client-registration, live-inventory, tour/application, attribution, and
  commission-status path.
- The Model → frozen launch baseline → actuals → weekly report loop is the product's best
  differentiator. Payments are a later expansion path, not evidence that the current economics
  work.
- Test an upfront project/model fee now. Treat `$1 per unit forever` and payment revenue as
  hypotheses until a paid pilot demonstrates acquisition, operating adoption, and unit economics.

This version creates owner trust and distribution without making an external agent perform unpaid
double entry for an owner-facing scorecard.

## Independent Builder case

The strongest case for LeaseRight is operational continuity. The product documents consistently
identify a real break in today's process: a lease-up plan is authored before funding, then dies in
a spreadsheet while leads, rents, applications, and weekly reports fragment across other systems.
The confirmed data design—one person chain, one frozen baseline, derived plan-versus-actual
quantities—is a credible answer to that break.

The strongest case against the current business model is timing. For the 260-unit Meridian demo,
even if `$1/unit` means monthly, software revenue is only `$3,120/year`; if annual, it is `$260`.
The seed's modeled carry is `$227,000/month`. The proposed payments engine starts only after the
lease-up wedge has already acquired the project and produced occupied units. The repository has no
customer payment, pilot commitment, processor agreement, billing period, or unit-economic model.
The business therefore needs a paid product between underwriting and stabilized payments.

The opposing canonical view's likely weakness is that it converts an owner's dislike of broker
cost and opacity into an assumed ability to eliminate brokerage. The prototype hardcodes in-house
as both cheaper and faster, so it cannot discover the opposite result. The contrarian view's
likely weakness is the mirror image: locator-heavy behavior may be market-specific, and building
a payout rail too early would import compliance, disputes, reconciliation, and marketplace risk.
That is why the next step is a bounded real-project test, not a broader build in either direction.

What would change this position:

1. Real lease-up records show owner-led execution consistently reaches plan without paid external
   demand channels.
2. Sponsors pay for the Model → Launch → weekly-report loop and operators use it without a parallel
   spreadsheet or CRM becoming the real system of record.
3. External agents complete registrations and attributed applications because the flow protects
   their client or speeds payment.
4. A contracted payments partner and credible margins make delayed payment revenue sufficient to
   support acquisition and operations.

## Exact agent-role design

Do not use one `broker` role for three different jobs.

| Actor | Product role | Access | Incentive | Owner value |
|---|---|---|---|---|
| In-house leasing agent | Building operator | Assigned leads, Inbox, tours, applications, current rents, deposit status | Finish daily work in one place | Response time, conversion, and accountability |
| PM or exclusive lease-up broker controlling owner leads | Building operator under external-org scope | Same workbench, scoped to the contracted project; no owner banking or underwriting internals | Run its actual workflow, not duplicate it | Shared operating truth and weekly reporting |
| Locator / tenant-rep / Realtor bringing a client | Demand partner and attributed payee, not Pipeline user | Live published inventory/terms; client registration; co-branded tour/app link; milestone and commission status only | Protect attribution and get a client leased/paid faster | Distribution, source economics, and hard-unit velocity |
| Owner / asset manager | Buyer and data controller | Full model, pricing, approvals, actuals, reports, and payment administration | Reduce carry and coordination risk | One plan-to-actual record |

Minimum outside-agent loop:

1. Publish trustworthy unit availability, effective rent, concession, and commission terms.
2. Let the agent register a client with timestamped terms and an explicit protection window.
3. Issue a co-branded or trackable tour/application link; do not require CRM re-entry.
4. Show only milestones: registered → toured → applied → leased → commission approved → paid.
5. Attribute the lease and commission cost in the owner's source and velocity reporting.
6. Add payout only after registration behavior and the compliant payment path are validated.

The implementation should eventually distinguish `operator user` from `demand partner`. The latter
needs first-class attribution/commission records, not a role-specific Today dashboard.

## Repository evidence

- `README.md` and the entry file confirm a static React-UMD/Babel prototype with no backend,
  authentication, durable shared state, or production payment rail.
- `components/model-data.jsx` contains a useful normalized graph, and
  `components/selectors.jsx` derives pipeline and plan-versus-actual quantities, but the app has no
  `StoreProvider`/reducer. The active views still read legacy globals and keep isolated local state.
- Pipeline initializes from `PROSPECTS`; Inbox initializes from `INBOX_THREADS`; Applications reads
  `APPLICATIONS`; Rents initializes from `UNIT_MATRIX`; Today keeps its own `rent3b`. The seven
  surfaces therefore do not yet prove the connected workflow.
- The seed has only an owner and one in-house leasing agent. It has no brokerage org, external
  agent, client-registration record, commission object, or agent-payment flow. Every tour is
  assigned to the in-house agent.
- The authored strategy recommends Hybrid. The Builder replaced the prior hardcoded velocity
  ranking with `test actual` and made the illustrative cost identities explicit: Hybrid equals
  nine months of internal payroll plus commissions on a stated 40% outside-originator share.
- The displayed `$283,400` commission equals `260 × $2,180 × 50%`: half of one month's rent. The
  former “first-year” label would imply `$3,400,800`. The Builder correction aligns the label with
  the existing arithmetic; it does not validate the assumption.

## Test next: one paid validation pilot

Use one real or recently completed 100–400 unit lease-up in one launch market. Before building a
production spine, run these tests against actual records:

1. **Economics replay.** Import weekly planned/actual absorption, asking and effective rent,
   concessions, carry, payroll, exclusive fees, external-agent commissions, lead sources, and
   conversions. Compare in-house, external, and hybrid outcomes without preloaded velocity ranks.
2. **Sponsor willingness to pay.** Quote an upfront project/model pilot fee alongside the `$1/unit`
   option. Require money or a signed paid commitment, not favorable demo feedback.
3. **Operator workflow.** Run the lead-to-lease loop with the person who actually owns the
   building's leads. Measure manual re-entry and whether their old sheet/CRM remains the real source.
4. **Agent behavior.** Test a zero-/low-login registration → trackable application → commission
   status prototype with actual outside agents. Measure completed registrations and attributed
   applications.
5. **Lender value.** Put the generated package in front of a lender and record whether it changes
   diligence, reserves, reporting, or a credit decision.

Proceed to a connected MVP only when one project supplies all three core signals: sponsor money or
operational data, operator adoption without primary-system double entry, and external-agent
registrations that produce attribution because the agent receives protection or speed in return.

If only the report sells, narrow to paid underwriting/reporting. If the workbench sells but the
agent path does not, integrate external-agent activity as a source and do not build an agent
product. If neither sells, stop before expanding into generic property management.

## Verification and correction completed

- `resolveRefs(SEED)` returns zero dangling references.
- The selector self-test passes; derived stage counts partition all 24 leads.
- Recalculated the commission example: `$283,400` for 50% of one month's rent and `$3,400,800` for
  50% of first-year rent.
- Corrected the fee-basis label in the legacy data, normalized seed, and rendered Model view.
- Added a pure `brokerEconomics(inputs)` selector with month/year fee-period checks. The Model now
  derives exclusive, in-house, and hybrid totals from explicit inputs; the $198,860 hybrid
  illustration reconciles to $85,500 payroll plus $113,360 outside-agent commissions.
- Removed the authored in-house/hybrid/broker velocity ranking from the strategy comparison and
  exposed that the $84,540 hybrid savings equals only 11.3 modeled carry days.
- Loaded the browser prototype, opened Model → Scenarios, verified the corrected breakdown and
  carry warning render, and found no application errors (only the expected Babel dev warning).

## Decisions that require Justin

1. **First validation ICP.** Recommended default: one 100–400 unit ground-up lease-up, in one
   launch market, using hybrid on-site plus external-agent execution. A sub-50-unit ICP requires a
   different staffing and agent thesis.
2. **Permission to test monetization beyond `$1/unit forever`.** Recommended: quote a paid
   per-project/model pilot now; leave payments and commission take rates as later options.
3. **Validation before rebuild.** Recommended: make the next milestone the paid pilot and its
   evidence gates, and defer broker guest dashboards, scorecards, payment rails, and the broader
   connected MVP until the pilot clears them.

No decision is currently needed on framework, store shape, broker row-scoping, or a simulated
deposit flow. Those are downstream implementation choices.
