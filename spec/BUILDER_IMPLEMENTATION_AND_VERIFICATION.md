# Builder handoff — superseded implementation snapshot

**As of:** 2026-09-10
**Original package date:** 2026-09-01
**Status:** Superseded for implementation status

This Builder package described the repository before the September 1–8 first-user, property-intake,
Model status, launch, and resident-handoff work. Its implementation inventory and “test next”
sequence are retired because they no longer describe the shipped component set.

Use:

- `spec/80_IMPLEMENTER_PLAN.md` for the current component-by-component implementation state,
  done-when ledger, and gated build sequence.
- `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` for the current business recommendation, pilot
  design, payment-engine conclusions, and decisions for Justin.

This supersession changes no business conclusion.

## What changed after the original handoff

The following statements are verified against the current `components/` tree:

- `components/store.jsx` now exists and is loaded by `LeaseRight.html` before the view files.
- `StoreProvider` wraps `App`, and active-project selection is store-backed.
- The reducer contains the documented N3 action cases, plus project-stage, project-update, and
  model-update actions.
- A first-run welcome flow now asks for a starting project stage and routes into property intake.
- Model now has five editable intake steps and Plan/Scenarios/Review/Launch status states.
- Saving intake data, selecting a scenario, and launching dispatch to the shared store.
- Launch sets the project to `active_leaseup` and stores a frozen scenario copy as a baseline.
- Residents derives its handoff/payment status from normalized store records.
- The shell’s primary header is calmer and no longer renders the live tape, clock, visible function
  keys, hover peeks, or primary-nav badges.

The following boundaries from the old handoff still hold:

- Pipeline, Inbox, Rents, Applications, Reports, and Today are not connected to the shared store.
- Reports still uses authored values; the export controls are not functional exports.
- The launch reducer does not generate units or prove a deep, durable baseline freeze.
- There is no originator route, registration record, commission record, production auth, backend,
  processor integration, or live payment rail.

## Historical verification claims

The original document reported browser and selector checks performed on the September 1 state.
Those claims are historical only and must not be read as verification of the September 8 code.
Current verification results belong with the current change or in `spec/80_IMPLEMENTER_PLAN.md`.
