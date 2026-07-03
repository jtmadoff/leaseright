# LeaseRight Scope Audit

## Current Product Read

LeaseRight is strongest when it is framed as:

1. A pre-funding lease-up model for sponsors and lenders.
2. A live lease-up execution system once the project is funded.
3. A payments and resident infrastructure layer after stabilization.

The current prototype has the right raw material, but it still carries too much generic property-management surface area. The next build pass should sharpen the product around the sponsor journey:

`Model -> Today -> Pipeline -> Inbox -> Rents -> Applications -> Reports`

Everything else should either support that journey or move into the background.

## Keep As Core

### Model

Why it matters:

- This is the acquisition wedge before AppFolio/Buildium/Yardi are even being considered.
- It makes LeaseRight useful before funding.
- It creates the bridge from underwriting to live operations.

Keep building:

- Sponsor intake.
- Unit mix and rent assumptions.
- Absorption scenarios.
- Broker vs in-house economics.
- Market rent confidence.
- Lender PDF and model workbook.
- Convert model into live lease-up board.

Missing:

- Actual editable intake fields.
- Scenario toggles: base, downside, aggressive.
- Delivery schedule and phased unit availability.
- Carry cost of delay.
- Lender-facing output preview.
- Clear "create project" path for a first-time user.

### Today

Why it matters:

- This should be the daily command center after launch.
- It makes inaction visible.

Keep building:

- Only true decisions.
- Pricing, lead SLA, concession, application, and lease-signature blockers.
- Owner/leasing-agent/broker accountability.

Reduce:

- Generic ops noise.
- Live-tape energy that distracts from executive clarity.

Missing:

- Role-specific Today views: sponsor, leasing agent, broker, PM.
- A clear action history: accepted, deferred, assigned.
- Connection between Today decisions and Model assumptions.

### Pipeline

Why it matters:

- This is the heart of lease-up execution.
- It proves LeaseRight can replace spreadsheets, texts, broker updates, and weekly calls.

Keep building:

- Lead stages.
- SLA timers.
- Source tracking.
- Unit matching.
- Assignments.
- Drag/drop status changes.

Missing:

- Tour scheduling.
- Lead capture forms.
- Broker assignment.
- Lost-lead reasons.
- Unit-specific availability tie-in.
- Follow-up automation.

### Inbox

Why it matters:

- Leasing breaks when communication is scattered.
- This can unify leads, residents, brokers, vendors, and PMs.

Keep building:

- Prospect conversations.
- Resident handoff after signing.
- Suggested replies.
- SLA flags.

Reduce:

- Vendor/resident/service threads in the primary story until lease-up flow is stronger.

Missing:

- Channel setup: email, SMS, listing portals.
- Broker messages.
- Tour confirmation templates.
- Application chase templates.
- Lead-source attribution.

### Rents

Why it matters:

- Rent and concession decisions are core to leasing velocity.
- This can become the market-rent aggregation product.

Keep building:

- Unit matrix.
- Effective rent.
- Comp rents.
- Concession-normalized rents.
- Recommended adjustments.

Missing:

- Editable assumptions.
- Rent confidence scoring by unit type.
- Market rent history.
- Concession sensitivity.
- Integration with Model assumptions.
- Explanation of why a rent is recommended.

### Applications

Why it matters:

- The lead-to-lease path is incomplete without applications.
- This is where prospects become revenue.

Keep building:

- Application status.
- Deposit status.
- Approval recommendations.
- Lease sent/signed status.

Missing:

- Application intake link.
- Screening/checklist workflow.
- Lease package generation.
- Deposit collection.
- Move-in checklist.
- Decline/conditional approval path.

### Reports

Why it matters:

- Sponsors, lenders, LPs, and owners need confidence without asking for a weekly update call.

Keep building:

- Weekly sponsor report.
- Lender package.
- Broker performance report.
- Velocity vs plan.
- Rent/concession variance.

Missing:

- First-class lender report preview.
- Broker scorecard.
- Export states.
- Narrative summary that a sponsor would actually send.

## Keep But Demote

### Market

Keep as support for Model and Rents, not as a primary module.

Good:

- Comp set.
- Occupancy.
- Concessions.
- Unit-type rents.

Needs:

- Source confidence.
- Last updated.
- Normalized effective rent.
- "Used in model" toggle.

### Concessions

Keep as part of Rents/Model/Today.

Good:

- Cost, conversion, expiration.

Needs:

- Sensitivity impact on absorption.
- Whether a concession is lender-approved.
- Which unit types it applies to.

### Listings

Keep as a lease-up support module.

Good:

- Feed health.
- Leads/views/cost per lead.

Needs:

- Clearer connection to lead pipeline.
- Launch checklist.
- Listing quality score.

## Excessive For Now

### Maintenance

This is a full PM feature. It can stay hidden as future expansion, but it should not consume product attention now.

Why excessive:

- Does not help the pre-funding wedge.
- Does not materially help lease-up unless tied to turns/punch lists.

Keep only if reframed as:

- Unit readiness.
- Punch list before tour/move-in.
- Turn blockers.

### Vendors

Useful later, but not central now.

Keep only if reframed as:

- Leasing launch vendors.
- Cleaning, signage, photography, staging, access control.
- COI/W9 can wait.

### Ledger

Important for monetization later, but too accounting-heavy for the current wedge.

Keep only if focused on:

- Deposits.
- Application fees.
- First rent.
- Payment processing revenue.

Full operating ledger can wait.

### Collection

Useful after stabilization, but premature for the first product story.

Keep only if focused on:

- Deposit collection.
- First month rent.
- Failed deposit/payment follow-up.

### Residents

Needed after lease signing, but not a primary feature yet.

Keep as:

- Converted applicant record.
- Move-in readiness.
- Basic resident handoff.

Full renewal/delinquency workflows can wait.

### Documents

Useful as supporting infrastructure, but not a standalone module yet.

Keep documents tied to:

- Lender package.
- Applications.
- Leases.
- Deposits.
- Unit documents.

## Missing Critical Features

### First-Time Project Creation

The app still assumes an existing property. It needs an obvious first-time path:

- Create project.
- Choose stage: pre-funding, funded/pre-launch, active lease-up, stabilized.
- Enter unit count and expected delivery.
- Invite sponsor team.

### Intake Wizard

The Model page needs an editable intake:

- Project profile.
- Unit mix.
- Rent assumptions.
- Concessions.
- Delivery schedule.
- Lease-up velocity.
- Staffing model.
- Broker model.
- Marketing budget.
- Lender report preferences.

### Scenario Modeling

Needed for the lender wedge:

- Base case.
- Downside case.
- Aggressive case.
- Broker-led case.
- In-house case.
- Hybrid case.

Each should show:

- Stabilization date.
- Carry cost.
- Concession cost.
- Staffing/broker cost.
- Expected rent roll.
- Risk notes.

### Broker/In-House Decision Tool

This is a differentiator and should be explicit.

It should calculate:

- Broker commission cost.
- In-house payroll cost.
- Hybrid support cost.
- Savings.
- Delay risk.
- Unit types that may still need broker help.
- Recommended operating model.

### Market Rent Aggregation

This can become a data moat.

Needed:

- Comp input.
- Listing scrape/import.
- Broker opinion input.
- Signed-lease feedback.
- Concession normalization.
- Confidence score by unit type.
- Rent recommendation rationale.

### Lead-to-Lease Demo Flow

The current prototype has many pages, but not one clean story. Build one complete flow:

1. Sponsor finishes Model.
2. Lender package exported.
3. Project launches.
4. Lead enters Inbox/Pipeline.
5. Unit match suggested.
6. Tour scheduled.
7. Application submitted.
8. Lease approved/sent/signed.
9. Deposit collected.
10. Report updates automatically.

### Role Model

Need explicit roles:

- Sponsor/owner.
- Asset manager.
- Leasing agent.
- Broker.
- Property manager.
- Lender/observer.

Each role should see different permissions and priorities.

## Recommended Near-Term Cuts

Do not delete these yet, but visually demote and stop investing in them for the next pass:

- Maintenance.
- Vendors.
- Full ledger.
- Collections.
- Full residents.
- Standalone documents.
- Generic settings.

## Recommended Next Build Pass

### Pass 1: Make Model Real

- Add a left-side intake checklist.
- Add editable-looking fields for unit mix, rents, delivery, concessions, staffing.
- Add scenario cards.
- Add broker vs in-house calculator.
- Add lender package preview.

### Pass 2: Connect Model to Launch

- Add a "Launch lease-up board" action.
- Push assumptions into Rents, Pipeline, Applications, and Reports.
- Show what changed from model to actual.

### Pass 3: Build One Lead-to-Lease Story

- Pick one sample lead.
- Move them from lead to tour to application to lease to deposit.
- Make every primary tab reflect the progression.

### Pass 4: Calm the UI

- Reduce live tape dominance.
- Fewer badges and colors at once.
- More guided empty/first-time states.
- Keep density for power users, but lead with clarity.

## Product Rule

If a feature does not help a sponsor get funded, lease units faster, reduce broker/PM bloat, or win the payment relationship, it should not be primary in the MVP.

