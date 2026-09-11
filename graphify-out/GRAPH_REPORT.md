# Graph Report - LeaseRight  (2026-09-10)

## Corpus Check
- 40 files · ~206,049 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 787 nodes · 770 edges · 38 communities (33 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b961b36a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.jsx
- LeaseUp-New/LeaseUp_Prototype_V5.jsx
- LeaseUp_Prototype.jsx
- LeaseUp_Prototype_V2.jsx
- LeaseUp_Prototype_V3.jsx
- LeaseUp_prototypes/LeaseUp_Prototype_V5.jsx
- 1. Core entities
- LeaseRight Scope Audit
- 80 — Implementer plan: product, agent role, and the next build
- Builder reassessment — rent processing as the economic engine
- Overseer synthesis — LeaseRight model viability, payment engine, and agent role
- Contrarian brief — Rent-processing fees as the economic engine
- 1. The end-to-end lifecycle journey (developer POV)
- Contrarian brief — Does the model work, and will agents play?
- Strategist brief — the rent-processing engine, reassessed
- model-data.jsx
- LeaseRight Product Direction
- 10 — Personas & Roles
- Strategist brief — architecture, tradeoffs, and critique
- today-view.jsx
- selectors.jsx
- shell.jsx
- 70 — Rebuild Plan (sequencing the spine rebuild)
- inbox-view.jsx
- pipeline-view.jsx
- LeaseRight — Product Bible (v0 seed)
- Builder handoff — implementation evidence and validation boundary
- LeaseRight — Foundation Synthesis (Phase 1 integration)
- LeaseUp — Design Brief
- store.jsx
- LeaseRight — Lease-up operating system
- LeaseRight project guidance
- LeaseRight Prototype
- app.jsx
- other-views.jsx
- SOURCE_OF_TRUTH.md

## God Nodes (most connected - your core abstractions)
1. `1. Core entities` - 25 edges
2. `LeaseRight Product Direction` - 14 edges
3. `1. The end-to-end lifecycle journey (developer POV)` - 12 edges
4. `Contrarian brief — Rent-processing fees as the economic engine` - 12 edges
5. `Builder reassessment — rent processing as the economic engine` - 11 edges
6. `Contrarian brief — Does the model work, and will agents play?` - 11 edges
7. `Overseer synthesis — LeaseRight model viability, payment engine, and agent role` - 11 edges
8. `Strategist brief — architecture, tradeoffs, and critique` - 11 edges
9. `Strategist brief — the rent-processing engine, reassessed` - 11 edges
10. `80 — Implementer plan: product, agent role, and the next build` - 10 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (38 total, 3 thin omitted)

### Community 0 - "data.jsx"
Cohesion: 0.04
Nodes (42): ACCOUNTS, ACTUAL_CURVE, APP_KPIS, APPLICATIONS, AR_AGING, BROKER_ECONOMICS, COLLECTION_KPIS, COMPS (+34 more)

### Community 1 - "LeaseUp-New/LeaseUp_Prototype_V5.jsx"
Cohesion: 0.05
Nodes (25): activeConcessions, allLeads, allNavItems, applications, C, competitorIntel, contractors, currentTenants (+17 more)

### Community 2 - "LeaseUp_Prototype.jsx"
Cohesion: 0.05
Nodes (25): activeConcessions, allLeads, allNavItems, applications, C, competitorIntel, contractors, currentTenants (+17 more)

### Community 3 - "LeaseUp_Prototype_V2.jsx"
Cohesion: 0.05
Nodes (25): activeConcessions, allLeads, allNavItems, applications, C, competitorIntel, contractors, currentTenants (+17 more)

### Community 4 - "LeaseUp_Prototype_V3.jsx"
Cohesion: 0.05
Nodes (25): activeConcessions, allLeads, allNavItems, applications, C, competitorIntel, contractors, currentTenants (+17 more)

### Community 5 - "LeaseUp_prototypes/LeaseUp_Prototype_V5.jsx"
Cohesion: 0.05
Nodes (25): activeConcessions, allLeads, allNavItems, applications, C, competitorIntel, contractors, currentTenants (+17 more)

### Community 6 - "1. Core entities"
Cohesion: 0.05
Nodes (40): 0. Design stance (opinionated), 1. Core entities, 2. Relationship map, 30 — Data Model & Systems, 3. State machines, 4. THE SPINE — Model ⇄ Live actuals, 5. View → Entity map, 6. Reconciliation with v6 mock data (data.jsx) (+32 more)

### Community 7 - "LeaseRight Scope Audit"
Cohesion: 0.05
Nodes (36): Applications, Broker/In-House Decision Tool, Collection, Concessions, Current Product Read, Documents, Excessive For Now, First-Time Project Creation (+28 more)

### Community 8 - "80 — Implementer plan: product, agent role, and the next build"
Cohesion: 0.06
Nodes (33): 1. Independent position, 2. One recommendation, 3.1 What is already built, 3.2 What is missing (ranked by whether it blocks the test), 3.3 Dangerous leftover in the rebuild plan, 3. Evidence from the actual repository (as of this inspection), 4.1 Operator — already the Pipeline user, 4.2 Originator — new, thin, mostly not an app (+25 more)

### Community 9 - "Builder reassessment — rent processing as the economic engine"
Cohesion: 0.06
Nodes (31): 1. What the repository proves—and does not, 2. Economics: volume and take rate, 3. Adoption incentives and fee incidence, 4. Regulatory and operational boundary, 5. How this changes the recommended pilot, 6. Smallest credible implementation sequence, 7. Validation assessment, 8. Primary-source receipt (+23 more)

### Community 10 - "Overseer synthesis — LeaseRight model viability, payment engine, and agent role"
Cohesion: 0.07
Nodes (27): Adoption design, Building operator — authenticated workbench user, Commercial gate — collect money before reconstruction, Completed in this mission, Debate reconciliation, Definitions that control, Evidence behind the recommendation, Exact agent-role design (+19 more)

### Community 11 - "Contrarian brief — Rent-processing fees as the economic engine"
Cohesion: 0.08
Nodes (25): 0. Mission answers (plain), 1. Independent position, 2.1 What the seed actually contains, 2.2 Two interpretations — do not mix them, 2.3 Cases on Meridian, stabilized (242 units, $6.33M GPV, 2,904 tx/year), 2.4 Timing: the engine is off during the job you sell, 2.5 Required volume (what "core economic engine" implies), 2.6 Adjacent money that is not this engine (+17 more)

### Community 12 - "1. The end-to-end lifecycle journey (developer POV)"
Cohesion: 0.08
Nodes (24): 0. Framing: the one question LeaseRight answers, 1. The end-to-end lifecycle journey (developer POV), 20 — Journeys & Narrative, 2. THE GOLDEN PATH — the single connected demo story, 3.1 Zero state — no projects, 3.2 Create-project flow, 3.3 Guided progression: nothing → lender-ready → live, 3.4 Per-tab empty states (post-launch, pre-data) (+16 more)

### Community 13 - "Contrarian brief — Does the model work, and will agents play?"
Cohesion: 0.08
Nodes (24): 0. Mission answers (plain), 1. Independent position, 2.1 What "the model" is, as written, 2.2 The `$1/unit` layer cannot carry the wedge, 2.3 What the Builder actually fixed — and what it did not, 2.4 The seed does not contain the collaborator — or the traffic source, 2.5 Two ICPs are being treated as one product, 2.6 The 60-day OS pilot cannot falsify the software thesis (+16 more)

### Community 14 - "Strategist brief — the rent-processing engine, reassessed"
Cohesion: 0.09
Nodes (22): 0. One recommendation, 1.1 Base arithmetic, 1.2 The conversion nobody performed, 1.3 What is actually better about the payments mechanism, 1. The correction restated in the units that decide it, 2.1 The peer answer is right and incomplete, 2.2 The AppFolio benchmark, converted, 2.3 Lifetime value per building — the finding that reorders the business (+14 more)

### Community 15 - "model-data.jsx"
Cohesion: 0.09
Nodes (20): applications, comps, concessions, decisions, leads, leases, listings, model (+12 more)

### Community 16 - "LeaseRight Product Direction"
Cohesion: 0.10
Nodes (20): 1. Owner-Led / In-House Leasing, 2. Broker-Assisted Leasing, 3. PM-Managed Leasing, Broker Strategy, Business Model, Core Thesis, Later, LeaseRight Product Direction (+12 more)

### Community 17 - "10 — Personas & Roles"
Cohesion: 0.10
Nodes (20): 0. Summary of the position, 10 — Personas & Roles, 1.1 The core persona — "The Sponsor on the hook", 1.2 Segmentation axis A — operating model (determines who else logs in), 1.3 Segmentation axis B — portfolio shape [partly extrapolation], 1.4 Segmentation axis C — hold intent [extrapolation, grounded in CRE reality], 1. Primary persona(s): the developer / owner / asset manager, 2.1 Asset Manager (inside the owner's org — highest delegated trust) (+12 more)

### Community 18 - "Strategist brief — architecture, tradeoffs, and critique"
Cohesion: 0.11
Nodes (18): 10. What this mission did, 1. One recommendation, 2.1 "Charge a five-figure project fee" quietly converts the company into a consultancy, 2.2 The commission pool is not the big pool — I checked, 2.3 The retaining side is being built last, 2. Where I break from the peer consensus, 3. New evidence: the Model's quantity layer is internally incoherent, 4. The pricing architecture (+10 more)

### Community 19 - "today-view.jsx"
Cohesion: 0.12
Nodes (3): KPI_ITEMS, LIVE_FEED, VELOCITY_12W

### Community 22 - "selectors.jsx"
Cohesion: 0.32
Nodes (11): brokerEconomics(), _byId(), deriveLeadStage(), _round(), _seed(), Selectors, __selfTest(), sharedQuantities() (+3 more)

### Community 23 - "shell.jsx"
Cohesion: 0.17
Nodes (5): NAV, NAV_BADGES, PEEK_DATA, PRIMARY, TAPE_ITEMS

### Community 24 - "70 — Rebuild Plan (sequencing the spine rebuild)"
Cohesion: 0.17
Nodes (11): 0. What we are rebuilding around, 1. The stack reality every task must respect, 2. Ordered phases (mapped to SCOPE_AUDIT's four build passes), 3. Night-shift task table (paste-ready), 4. Daytime-reserved tasks (need a rendered browser or product judgment), 5. Open questions for Justin, 70 — Rebuild Plan (sequencing the spine rebuild), Phase 0 — The Spine (+3 more)

### Community 25 - "inbox-view.jsx"
Cohesion: 0.28
Nodes (6): avatarColorFor(), Bubble(), channelGlyph, INBOX_AVATAR_COLORS, inboxInitials(), kindGlyph

### Community 26 - "pipeline-view.jsx"
Cohesion: 0.31
Nodes (5): DetailDrawer(), initials(), PipelineView(), PROSPECT_AVATAR_COLORS, stageToneColor()

### Community 27 - "LeaseRight — Product Bible (v0 seed)"
Cohesion: 0.22
Nodes (8): 1. What we are doing (and not doing), 2. The product in one paragraph, 3. Primary audience for the "perfect prototype" — LOCKED, 4. Current state of the prototype (v6 — corrected read, 2026-07-01), 5. The biggest known gaps (from SCOPE_AUDIT + current read), 6. Foundation workstreams (Phase 1), 7. Working agreements, LeaseRight — Product Bible (v0 seed)

### Community 28 - "Builder handoff — implementation evidence and validation boundary"
Cohesion: 0.22
Nodes (8): Builder handoff — implementation evidence and validation boundary, Decisions that require Justin, Exact agent-role design, Independent Builder case, Recommendation, Repository evidence, Test next: one paid validation pilot, Verification and correction completed

### Community 29 - "LeaseRight — Foundation Synthesis (Phase 1 integration)"
Cohesion: 0.25
Nodes (7): Decisions confirmed (2026-07-08, Justin), Decisions — CONFIRMED by Justin, 2026-07-03, Headline, LeaseRight — Foundation Synthesis (Phase 1 integration), Reconciled decisions (recommended — flagged where Justin should confirm), The golden path (the one story the prototype must tell), What Phase 2 would cover (if we proceed)

### Community 30 - "LeaseUp — Design Brief"
Cohesion: 0.29
Nodes (6): How it should feel, LeaseUp — Design Brief, The bar, What it must not be, What this is, Who uses it

### Community 31 - "store.jsx"
Cohesion: 0.43
Nodes (6): cloneSeed(), reducer(), StoreContext, StoreProvider(), useSelector(), useStore()

### Community 32 - "LeaseRight — Lease-up operating system"
Cohesion: 0.29
Nodes (6): Current State, Key Files, LeaseRight — Lease-up operating system, Metadata, Open Items, Reference

### Community 33 - "LeaseRight project guidance"
Cohesion: 0.40
Nodes (4): Knowledge graph, LeaseRight project guidance, Source of truth, Static prototype conventions

### Community 34 - "LeaseRight Prototype"
Cohesion: 0.40
Nodes (4): Deployment, LeaseRight Prototype, Local preview, Source of truth

## Knowledge Gaps
- **516 isolated node(s):** `C`, `properties`, `weeklyFunnel`, `allLeads`, `maintenanceRequests` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 687 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `C`, `properties`, `weeklyFunnel` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `LeaseUp-New/LeaseUp_Prototype_V5.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `LeaseUp_Prototype.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `LeaseUp_Prototype_V2.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `LeaseUp_Prototype_V3.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `LeaseUp_prototypes/LeaseUp_Prototype_V5.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._