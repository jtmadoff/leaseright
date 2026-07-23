/*
 * model-data.jsx — N1: the normalized seed graph (Phase 0, The Spine)
 * ---------------------------------------------------------------------------
 * Re-expresses the v6 Meridian mock (data.jsx) as ONE connected object graph.
 *
 * The v6 defect this fixes (30_DATA §6, 40_FOUNDATION D1): the same person
 * lived as up to four unlinked copies — a PROSPECT, an INBOX_THREAD, an
 * APPLICATION, and a RESIDENT — and units were bare strings under three clashing
 * conventions ("2BR-1204" / "U-312" / "2BR-0914"). Here:
 *
 *   - Every person exists EXACTLY ONCE as a `Lead`. A lead carries its
 *     Application / Lease / Resident / Thread / Tour by REFERENCE (id), never by
 *     a duplicated object. `Lead → Application → Lease → Resident` is one chain,
 *     all bound to one `Unit` (30_DATA §2 "the identity chain that must never fork").
 *   - Units are first-class rows under ONE id convention: `unit-####` (the door
 *     number). Type-only interest ("a 1BR", "a Studio") points at a `unitType`,
 *     not a phantom unit, so it is a real reference, not a dangling one.
 *   - Pipeline stage is stored here as the authored seed value but is meant to be
 *     *derived* from the furthest-progressed child (N2 selectors, D2). The seed is
 *     internally consistent with that derivation (a lead with a resident is SIGNED).
 *
 * Reconciliations made where v6's diorama data collided (all required by 30_DATA §6):
 *   - Ethan Park: prospect said 2BR-0710, resident said U-915 → unified to unit-0915
 *     (the resident record wins — it is the lived-in unit).
 *   - Sarah Chen / Maya Holloway: prospect + resident copies collapsed to one SIGNED
 *     lead with a resident record (units 0706 / 0204 agreed across both copies).
 *   - Priya Shankar: a contacted-prospect copy AND a resident copy → unified to the
 *     resident (unit-0504). ("Priya S.", the leasing agent, is a separate User.)
 *   - Marcus Webb: prospect said 3BR-0812, but 0812 is Rachel Ortiz's occupied unit →
 *     his interest is re-pointed at an available 3BR, unit-0820.
 *   - Applicants (Kira/Miguel/Andre/Jordan/Luka) each get one Application, and their
 *     lead stage is derived from it, resolving v6's Pipeline↔Applications disagreement.
 *
 * Stack: static React-UMD + Babel, no build step, no backend, no new deps. This file
 * is pure data + one dependency-free `resolveRefs` self-check; it imports no React.
 * `SOURCE_OF_TRUTH`: product is LeaseRight, dense dark ops console — unchanged here.
 *
 * NOTE: `users` and `orgs` are included beyond the 16 required arrays because
 * `assignedTo` / `ownerId` / `agentId` / sponsor / vendor-thread references must
 * resolve to a real row for the referential-integrity self-check to pass.
 */

/* global window */

// ── Orgs (sponsor + a vendor org so the vendor thread has a real subject) ──────
const orgs = [
  { id: "org-mori",    name: "Mori Development", type: "sponsor" },
  { id: "org-paragon", name: "Paragon Cleaning", type: "vendor" },
];

// ── Users (staff actors that leads/decisions/tours reference) ──────────────────
const users = [
  { id: "user-mori",  name: "Jordan Mori", orgId: "org-mori", role: "owner" },
  { id: "user-priya", name: "Priya S.",    orgId: "org-mori", role: "leasing_agent" },
];

// ── Projects (the spine anchor; only Meridian is fully modeled) ────────────────
const projects = [
  {
    id: "meridian", name: "The Meridian", sponsorOrgId: "org-mori",
    city: "Austin, TX", submarket: "East Austin", stage: "active_leaseup",
    unitCount: 260, deliveryDate: "Jan 15, 2025", targetStabilizationDate: "Jul 28, 2026",
    targetOccupancyPct: 93, modelId: "model-meridian", launchedAt: "Jan 20, 2025",
  },
  {
    id: "luminary", name: "Luminary Midtown", sponsorOrgId: null,
    city: "Nashville, TN", submarket: "Midtown", stage: "funded_prelaunch",
    unitCount: 188, deliveryDate: null, targetStabilizationDate: null,
    targetOccupancyPct: 92, modelId: null, launchedAt: null,
  },
  {
    id: "brix", name: "Brix on Sixth", sponsorOrgId: null,
    city: "Denver, CO", submarket: "LoDo", stage: "active_leaseup",
    unitCount: 142, deliveryDate: null, targetStabilizationDate: null,
    targetOccupancyPct: 93, modelId: null, launchedAt: null,
  },
];

// ── Unit types (the live/actual aggregate; v6 UNIT_MATRIX) ─────────────────────
const unitTypes = [
  { id: "ut-studio", projectId: "meridian", type: "Studio", label: "Studio", beds: 0, sqft: 520,  totalUnits: 60,  leasedCount: 38, appsCount: 4, askingRent: 1650, effectiveRent: 1580, compRent: 1590, suggestedRent: null, domAvg: 11, velocityActual: 2.3 },
  { id: "ut-1br",    projectId: "meridian", type: "1BR",    label: "1 Bed", beds: 1, sqft: 720,  totalUnits: 100, leasedCount: 52, appsCount: 6, askingRent: 2100, effectiveRent: 2010, compRent: 2050, suggestedRent: null, domAvg: 18, velocityActual: 2.9 },
  { id: "ut-2br",    projectId: "meridian", type: "2BR",    label: "2 Bed", beds: 2, sqft: 1120, totalUnits: 72,  leasedCount: 25, appsCount: 3, askingRent: 2800, effectiveRent: 2680, compRent: 2620, suggestedRent: null, domAvg: 34, velocityActual: 1.6 },
  { id: "ut-3br",    projectId: "meridian", type: "3BR",    label: "3 Bed", beds: 3, sqft: 1450, totalUnits: 28,  leasedCount: 6,  appsCount: 0, askingRent: 3400, effectiveRent: 3250, compRent: 3150, suggestedRent: 3200, domAvg: 52, velocityActual: 0.4 },
];

// ── Units (FIRST-CLASS rows, single id convention: `unit-####` = door number) ──
// currentLeaseId / currentResidentId point back at the chain that occupies them.
const units = [
  // Occupied — held by an active resident lease
  { id: "unit-0204", projectId: "meridian", unitTypeId: "ut-studio", number: "204",  floor: 2,  beds: 0, sqft: 520,  askingRent: 1650, effectiveRent: 1650, availabilityStatus: "occupied", currentLeaseId: "lease-maya",   currentResidentId: "res-maya" },
  { id: "unit-0211", projectId: "meridian", unitTypeId: "ut-1br",    number: "211",  floor: 2,  beds: 1, sqft: 720,  askingRent: 2100, effectiveRent: 2150, availabilityStatus: "occupied", currentLeaseId: "lease-nia",    currentResidentId: "res-nia" },
  { id: "unit-0312", projectId: "meridian", unitTypeId: "ut-2br",    number: "312",  floor: 3,  beds: 2, sqft: 1120, askingRent: 2800, effectiveRent: 2800, availabilityStatus: "occupied", currentLeaseId: "lease-jamie",  currentResidentId: "res-jamie" },
  { id: "unit-0404", projectId: "meridian", unitTypeId: "ut-1br",    number: "404",  floor: 4,  beds: 1, sqft: 720,  askingRent: 2100, effectiveRent: 2100, availabilityStatus: "occupied", currentLeaseId: "lease-evan",   currentResidentId: "res-evan" },
  { id: "unit-0504", projectId: "meridian", unitTypeId: "ut-1br",    number: "504",  floor: 5,  beds: 1, sqft: 720,  askingRent: 2100, effectiveRent: 2050, availabilityStatus: "occupied", currentLeaseId: "lease-priya",  currentResidentId: "res-priya" },
  { id: "unit-0607", projectId: "meridian", unitTypeId: "ut-2br",    number: "607",  floor: 6,  beds: 2, sqft: 1120, askingRent: 2800, effectiveRent: 2750, availabilityStatus: "occupied", currentLeaseId: "lease-derek",  currentResidentId: "res-derek" },
  { id: "unit-0706", projectId: "meridian", unitTypeId: "ut-1br",    number: "706",  floor: 7,  beds: 1, sqft: 720,  askingRent: 2100, effectiveRent: 2150, availabilityStatus: "occupied", currentLeaseId: "lease-sarah",  currentResidentId: "res-sarah" },
  { id: "unit-0805", projectId: "meridian", unitTypeId: "ut-1br",    number: "805",  floor: 8,  beds: 1, sqft: 720,  askingRent: 2100, effectiveRent: 2100, availabilityStatus: "occupied", currentLeaseId: "lease-tomas",  currentResidentId: "res-tomas" },
  { id: "unit-0812", projectId: "meridian", unitTypeId: "ut-3br",    number: "812",  floor: 8,  beds: 3, sqft: 1450, askingRent: 3400, effectiveRent: 3250, availabilityStatus: "occupied", currentLeaseId: "lease-rachel", currentResidentId: "res-rachel" },
  // Leased, move-in pending (Ethan Park — signed, not yet moved in)
  { id: "unit-0915", projectId: "meridian", unitTypeId: "ut-2br",    number: "915",  floor: 9,  beds: 2, sqft: 1120, askingRent: 2800, effectiveRent: 2800, availabilityStatus: "leased",   currentLeaseId: "lease-ethan",  currentResidentId: "res-ethan" },
  // Live lease-up inventory (open / held for an in-flight lead)
  { id: "unit-1204", projectId: "meridian", unitTypeId: "ut-2br",    number: "1204", floor: 12, beds: 2, sqft: 1120, askingRent: 2800, effectiveRent: 2680, availabilityStatus: "available", currentLeaseId: null, currentResidentId: null },
  { id: "unit-0914", projectId: "meridian", unitTypeId: "ut-2br",    number: "914",  floor: 9,  beds: 2, sqft: 1120, askingRent: 2800, effectiveRent: 2680, availabilityStatus: "held",      currentLeaseId: null, currentResidentId: null },
  { id: "unit-0820", projectId: "meridian", unitTypeId: "ut-3br",    number: "820",  floor: 8,  beds: 3, sqft: 1450, askingRent: 3400, effectiveRent: 3250, availabilityStatus: "available", currentLeaseId: null, currentResidentId: null },
];

// ── Scenarios (v6 MODEL_SCENARIOS; one active) ─────────────────────────────────
const scenarios = [
  { id: "sc-base",       modelId: "model-meridian", name: "Base",       active: true,  leasesPerWeek: 3.3, stabilizeDate: "Jul 28, 2026", concessionCost: 480000, carryCost: 1710000, staffingCost: 166500, note: "Lender underwriting case" },
  { id: "sc-downside",   modelId: "model-meridian", name: "Downside",   active: false, leasesPerWeek: 2.4, stabilizeDate: "Oct 6, 2026",  concessionCost: 690000, carryCost: 2380000, staffingCost: 166500, note: "Slow traffic + 3BR drag" },
  { id: "sc-aggressive", modelId: "model-meridian", name: "Aggressive", active: false, leasesPerWeek: 5.1, stabilizeDate: "Mar 31, 2026", concessionCost: 390000, carryCost: 1100000, staffingCost: 166500, note: "In-house team + fast response" },
];

// ── Model (one per project; carries the plan side of the spine, D4) ────────────
// baselineScenarioId is set because Meridian has already LAUNCHed (D3 freeze).
const model = [
  {
    id: "model-meridian", projectId: "meridian",
    activeScenarioId: "sc-base", baselineScenarioId: "sc-base",
    unitMixPlan: [
      { unitTypeId: "ut-studio", type: "Studio", count: 60,  targetRent: 1650, plannedConcession: "1mo", plannedVelocity: 2.3, confidenceScore: 88 },
      { unitTypeId: "ut-1br",    type: "1BR",    count: 100, targetRent: 2100, plannedConcession: "1mo", plannedVelocity: 2.9, confidenceScore: 91 },
      { unitTypeId: "ut-2br",    type: "2BR",    count: 72,  targetRent: 2800, plannedConcession: "1mo", plannedVelocity: 1.6, confidenceScore: 86 },
      { unitTypeId: "ut-3br",    type: "3BR",    count: 28,  targetRent: 3200, plannedConcession: "2mo", plannedVelocity: 0.4, confidenceScore: 68 },
    ],
    budget: { concessionReserve: 480000, marketingBudget: 180000, carryCostPerMonth: 227000, brokerFeeBasis: "50% first-year rent" },
    staffingPlan: { model: "hybrid", fteCount: 2, cost: 166500, note: "In-house lead + broker overflow for 3BR" },
    marketRentInputs: [
      { source: "Sponsor pro forma",     confidence: 62, oneBed: 2050, twoBed: 2650, threeBed: 3300, usedInModel: false, note: "Preliminary underwriting" },
      { source: "Live comp scrape",      confidence: 84, oneBed: 2080, twoBed: 2740, threeBed: 3195, usedInModel: true,  note: "6 comps · concessions normalized" },
      { source: "Broker opinion",        confidence: 71, oneBed: 2125, twoBed: 2800, threeBed: 3250, usedInModel: false, note: "Useful, but incentive-biased" },
      { source: "LeaseRight aggregate",  confidence: 89, oneBed: 2100, twoBed: 2785, threeBed: 3210, usedInModel: true,  note: "Weighted by signed leases + current listings" },
    ],
  },
];

// ── Leads (THE person, each EXACTLY ONCE; children carried by reference) ───────
// pipelineStage: NEW → CONTACTED → TOURED → APPLIED → APPROVED → SIGNED (+ LOST).
const leads = [
  // NEW
  { id: "lead-alex",   projectId: "meridian", name: "Alex Rivera",      contact: "alex.rivera@example.com",  source: "Zillow",   score: 92, budget: 2800, desiredMoveIn: "Jun 1",  pipelineStage: "new",       interestedUnitId: "unit-1204", interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: true,  lostReason: null, note: "Toured Vance + Ovation same day", applicationId: null, leaseId: null, residentId: null, threadId: "thread-alex", tourIds: [] },
  { id: "lead-devon",  projectId: "meridian", name: "Devon Carter",     contact: "devon.carter@example.com", source: "Apt.com",  score: 74, budget: 2100, desiredMoveIn: "Jul 1",  pipelineStage: "new",       interestedUnitId: null,        interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "First-time renter · W-2 verified", applicationId: null, leaseId: null, residentId: null, threadId: null, tourIds: [] },
  { id: "lead-nadia",  projectId: "meridian", name: "Nadia Rashid",     contact: "nadia.rashid@example.com", source: "Zumper",   score: 68, budget: 1700, desiredMoveIn: "Jun 15", pipelineStage: "new",       interestedUnitId: null,        interestedUnitTypeId: "ut-studio", assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Grad student · guarantor", applicationId: null, leaseId: null, residentId: null, threadId: null, tourIds: [] },
  { id: "lead-ben",    projectId: "meridian", name: "Ben Flores",       contact: "ben.flores@example.com",   source: "Direct",   score: 81, budget: 2900, desiredMoveIn: "Aug 1",  pipelineStage: "new",       interestedUnitId: null,        interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Relocating from SF", applicationId: null, leaseId: null, residentId: null, threadId: null, tourIds: [] },
  // CONTACTED
  { id: "lead-ryan",   projectId: "meridian", name: "Ryan Ng",          contact: "ryan.ng@example.com",      source: "Zillow",   score: 83, budget: 2800, desiredMoveIn: "Jun 5",  pipelineStage: "contacted", interestedUnitId: null,        interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Looking with partner", applicationId: null, leaseId: null, residentId: null, threadId: null, tourIds: [] },
  { id: "lead-zoe",    projectId: "meridian", name: "Zoe Abara",        contact: "zoe.abara@example.com",    source: "Referral", score: 77, budget: 1650, desiredMoveIn: "Jul 1",  pipelineStage: "contacted", interestedUnitId: null,        interestedUnitTypeId: "ut-studio", assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Referred by a current resident", applicationId: null, leaseId: null, residentId: null, threadId: null, tourIds: [] },
  // TOURED
  { id: "lead-tomliv", projectId: "meridian", name: "Tom & Liv Brooks", contact: "brooks.family@example.com", source: "Drive-by", score: 64, budget: 2700, desiredMoveIn: "Jul 15", pipelineStage: "toured",   interestedUnitId: null,        interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Comparing 3 properties", applicationId: null, leaseId: null, residentId: null, threadId: null, tourIds: ["tour-tomliv"] },
  { id: "lead-marcus", projectId: "meridian", name: "Marcus Webb",      contact: "marcus.webb@example.com",  source: "Direct",   score: 84, budget: 3300, desiredMoveIn: "Jun 1",  pipelineStage: "toured",   interestedUnitId: "unit-0820", interestedUnitTypeId: "ut-3br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Family of 4 · ready to apply", applicationId: null, leaseId: null, residentId: null, threadId: null, tourIds: ["tour-marcus"] },
  { id: "lead-hana",   projectId: "meridian", name: "Hana Ito",         contact: "hana.ito@example.com",     source: "Apt.com",  score: 79, budget: 2000, desiredMoveIn: "Aug 1",  pipelineStage: "toured",   interestedUnitId: null,        interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Toured Sat · silent since", applicationId: null, leaseId: null, residentId: null, threadId: "thread-hana", tourIds: ["tour-hana"] },
  // APPLIED (each carries a real Application; stage derives from it)
  { id: "lead-kira",   projectId: "meridian", name: "Kira Weston",      contact: "kira.weston@example.com",  source: "Zillow",   score: 86, budget: 2750, desiredMoveIn: "Jun 1",  pipelineStage: "applied",  interestedUnitId: "unit-0914", interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Clean credit · underwriting", applicationId: "app-kira", leaseId: null, residentId: null, threadId: null, tourIds: [] },
  { id: "lead-andre",  projectId: "meridian", name: "Andre Dumas",      contact: "andre.dumas@example.com",  source: "Direct",   score: 69, budget: 2100, desiredMoveIn: "Jul 1",  pipelineStage: "applied",  interestedUnitId: null,        interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Waiting on employer verify", applicationId: "app-andre", leaseId: null, residentId: null, threadId: null, tourIds: [] },
  { id: "lead-luka",   projectId: "meridian", name: "Luka Petrov",      contact: "luka.petrov@example.com",  source: "Apt.com",  score: 58, budget: 2500, desiredMoveIn: "Jul 1",  pipelineStage: "applied",  interestedUnitId: null,        interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Credit marginal · cosigner required", applicationId: "app-luka", leaseId: null, residentId: null, threadId: null, tourIds: ["tour-luka"] },
  // APPROVED
  { id: "lead-jordan", projectId: "meridian", name: "Jordan Kim",       contact: "jordan.kim@example.com",   source: "Referral", score: 71, budget: 1600, desiredMoveIn: "Jun 10", pipelineStage: "approved", interestedUnitId: null,        interestedUnitTypeId: "ut-studio", assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Approved · lease sent", applicationId: "app-jordan", leaseId: null, residentId: null, threadId: null, tourIds: [] },
  { id: "lead-miguel", projectId: "meridian", name: "Miguel Torres",    contact: "miguel.torres@example.com", source: "Apt.com", score: 91, budget: 2850, desiredMoveIn: "Jun 1",  pipelineStage: "approved", interestedUnitId: null,        interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Deposit received", applicationId: "app-miguel", leaseId: null, residentId: null, threadId: null, tourIds: [] },
  // SIGNED — carry a Lease + Resident (the identity chain, D1)
  { id: "lead-maya",   projectId: "meridian", name: "Maya Holloway",    contact: "maya.holloway@example.com", source: "Zillow",   score: 89, budget: 1650, desiredMoveIn: "May 28", pipelineStage: "signed", interestedUnitId: "unit-0204", interestedUnitTypeId: "ut-studio", assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "New lease · keys delivered", applicationId: "app-maya",  leaseId: "lease-maya",   residentId: "res-maya",   threadId: null, tourIds: [] },
  { id: "lead-sarah",  projectId: "meridian", name: "Sarah Chen",       contact: "sarah.chen@example.com",   source: "Zillow",   score: 88, budget: 2150, desiredMoveIn: "Mar 1",  pipelineStage: "signed", interestedUnitId: "unit-0706", interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Just signed · autopay set", applicationId: "app-sarah", leaseId: "lease-sarah",  residentId: "res-sarah",  threadId: null, tourIds: [] },
  { id: "lead-ethan",  projectId: "meridian", name: "Ethan Park",       contact: "ethan.park@example.com",   source: "Referral", score: 95, budget: 2800, desiredMoveIn: "Jun 1",  pipelineStage: "signed", interestedUnitId: "unit-0915", interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Move-in Jun 1 · lease signed", applicationId: "app-ethan", leaseId: "lease-ethan",  residentId: "res-ethan",  threadId: null, tourIds: [] },
  { id: "lead-priya",  projectId: "meridian", name: "Priya Shankar",    contact: "priya.shankar@example.com", source: "Apt.com", score: 78, budget: 2050, desiredMoveIn: "Nov 4",  pipelineStage: "signed", interestedUnitId: "unit-0504", interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "NTV filed · vacate May 31", applicationId: null, leaseId: "lease-priya",  residentId: "res-priya",  threadId: null, tourIds: [] },
  { id: "lead-nia",    projectId: "meridian", name: "Nia Blackwell",    contact: "nia.blackwell@example.com", source: "Direct",  score: null, budget: 2150, desiredMoveIn: "Aug 10", pipelineStage: "signed", interestedUnitId: "unit-0211", interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Rent payment failed · auto-retry Fri", applicationId: null, leaseId: "lease-nia",    residentId: "res-nia",    threadId: "thread-nia", tourIds: [] },
  { id: "lead-jamie",  projectId: "meridian", name: "Jamie Patel",      contact: "jamie.patel@example.com",  source: "Direct",   score: null, budget: 2800, desiredMoveIn: "Mar 15", pipelineStage: "signed", interestedUnitId: "unit-0312", interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "AC ticket open · MT-4821", applicationId: null, leaseId: "lease-jamie",  residentId: "res-jamie",  threadId: "thread-jamie", tourIds: [] },
  { id: "lead-evan",   projectId: "meridian", name: "Evan Moore",       contact: "evan.moore@example.com",   source: "Direct",   score: null, budget: 2100, desiredMoveIn: "Jun 1",  pipelineStage: "signed", interestedUnitId: "unit-0404", interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Lease ends 39 days · no touch yet", applicationId: null, leaseId: "lease-evan",   residentId: "res-evan",   threadId: null, tourIds: [] },
  { id: "lead-derek",  projectId: "meridian", name: "Derek Huang",      contact: "derek.huang@example.com",  source: "Direct",   score: null, budget: 2750, desiredMoveIn: "Jan 20", pipelineStage: "signed", interestedUnitId: "unit-0607", interestedUnitTypeId: "ut-2br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "On-time 100% · renewal-bump candidate", applicationId: null, leaseId: "lease-derek",  residentId: "res-derek",  threadId: null, tourIds: [] },
  { id: "lead-tomas",  projectId: "meridian", name: "Tomas Vargas",     contact: "tomas.vargas@example.com", source: "Direct",   score: null, budget: 2100, desiredMoveIn: "Sep 9",  pipelineStage: "signed", interestedUnitId: "unit-0805", interestedUnitTypeId: "ut-1br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Noise complaint re: 804 · NC-331", applicationId: null, leaseId: "lease-tomas",  residentId: "res-tomas",  threadId: "thread-tomas", tourIds: [] },
  { id: "lead-rachel", projectId: "meridian", name: "Rachel Ortiz",     contact: "rachel.ortiz@example.com", source: "Direct",   score: null, budget: 3250, desiredMoveIn: "Feb 11", pipelineStage: "signed", interestedUnitId: "unit-0812", interestedUnitTypeId: "ut-3br",    assignedTo: "user-priya", slaBreached: false, lostReason: null, note: "Partial · $1,800 of $3,250", applicationId: null, leaseId: "lease-rachel", residentId: "res-rachel", threadId: null, tourIds: [] },
];

// ── Tours (absent in v6; new entity per 30_DATA §1) ────────────────────────────
const tours = [
  { id: "tour-marcus", leadId: "lead-marcus", unitId: "unit-0820", scheduledAt: "Yesterday 4:00p", status: "completed", agentId: "user-priya" },
  { id: "tour-tomliv", leadId: "lead-tomliv", unitId: null,        scheduledAt: "3 days ago",       status: "completed", agentId: "user-priya" },
  { id: "tour-hana",   leadId: "lead-hana",   unitId: null,        scheduledAt: "Sat 1:00p",        status: "completed", agentId: "user-priya" },
  { id: "tour-luka",   leadId: "lead-luka",   unitId: null,        scheduledAt: "4 days ago",       status: "completed", agentId: "user-priya" },
];

// ── Applications (children of Leads; v6 APPLICATIONS + the signed chains) ───────
const applications = [
  { id: "app-kira",   leadId: "lead-kira",   unitId: "unit-0914", receivedAt: "6h ago", status: "screening", credit: 742, bgCheck: "clear", income: "verified", ratio: 2.9, deposit: "paid",    recommendation: "approve",  leaseId: null,          applicationFeePaymentId: "pay-kira-appfee" },
  { id: "app-miguel", leadId: "lead-miguel", unitId: null,        receivedAt: "1d ago", status: "approved",  credit: 704, bgCheck: "clear", income: "verified", ratio: 3.1, deposit: "paid",    recommendation: "approve",  leaseId: null,          applicationFeePaymentId: null },
  { id: "app-andre",  leadId: "lead-andre",  unitId: null,        receivedAt: "2d ago", status: "screening", credit: 681, bgCheck: "clear", income: "pending",  ratio: 2.8, deposit: "pending", recommendation: "hold",     leaseId: null,          applicationFeePaymentId: null },
  { id: "app-jordan", leadId: "lead-jordan", unitId: null,        receivedAt: "1d ago", status: "approved",  credit: 712, bgCheck: "clear", income: "verified", ratio: 3.4, deposit: "paid",    recommendation: "approve",  leaseId: null,          applicationFeePaymentId: null },
  { id: "app-luka",   leadId: "lead-luka",   unitId: null,        receivedAt: "3d ago", status: "review",    credit: 612, bgCheck: "minor", income: "verified", ratio: 3.6, deposit: "pending", recommendation: "cosigner", leaseId: null,          applicationFeePaymentId: null },
  { id: "app-maya",   leadId: "lead-maya",   unitId: "unit-0204", receivedAt: "May 20", status: "signed",    credit: 726, bgCheck: "clear", income: "verified", ratio: 3.0, deposit: "paid",    recommendation: "approve",  leaseId: "lease-maya",  applicationFeePaymentId: null },
  { id: "app-sarah",  leadId: "lead-sarah",  unitId: "unit-0706", receivedAt: "Feb 22", status: "signed",    credit: 738, bgCheck: "clear", income: "verified", ratio: 2.7, deposit: "paid",    recommendation: "approve",  leaseId: "lease-sarah", applicationFeePaymentId: null },
  { id: "app-ethan",  leadId: "lead-ethan",  unitId: "unit-0915", receivedAt: "May 24", status: "signed",    credit: 771, bgCheck: "clear", income: "verified", ratio: 2.6, deposit: "paid",    recommendation: "approve",  leaseId: "lease-ethan", applicationFeePaymentId: null },
];

// ── Leases (first-class; implied by RESIDENTS + RECENT_DOCS in v6) ─────────────
const leases = [
  { id: "lease-maya",   applicationId: "app-maya",  unitId: "unit-0204", leadId: "lead-maya",   residentId: "res-maya",   status: "active", startDate: "May 28, 2025", endDate: "May 27, 2026", rent: 1650, concessionId: "c1",  paymentIds: [],                  document: "Holloway, M · Lease May 28 2025.pdf" },
  { id: "lease-sarah",  applicationId: "app-sarah", unitId: "unit-0706", leadId: "lead-sarah",  residentId: "res-sarah",  status: "active", startDate: "Mar 1, 2025",  endDate: "Feb 28, 2026", rent: 2150, concessionId: "c1",  paymentIds: ["pay-sarah-deposit"], document: "Chen, S · Lease Mar 1 2025.pdf" },
  { id: "lease-ethan",  applicationId: "app-ethan", unitId: "unit-0915", leadId: "lead-ethan",  residentId: "res-ethan",  status: "signed", startDate: "Jun 1, 2025",  endDate: "May 31, 2026", rent: 2800, concessionId: "c1",  paymentIds: [],                  document: "Park, E · Lease Jun 1 2025.pdf" },
  { id: "lease-priya",  applicationId: null,        unitId: "unit-0504", leadId: "lead-priya",  residentId: "res-priya",  status: "active", startDate: "Nov 4, 2024",  endDate: "Nov 3, 2025",  rent: 2050, concessionId: null,  paymentIds: [],                  document: null },
  { id: "lease-nia",    applicationId: null,        unitId: "unit-0211", leadId: "lead-nia",    residentId: "res-nia",    status: "active", startDate: "Aug 10, 2024", endDate: "Aug 9, 2025",  rent: 2150, concessionId: null,  paymentIds: ["pay-nia-rent"],    document: null },
  { id: "lease-jamie",  applicationId: null,        unitId: "unit-0312", leadId: "lead-jamie",  residentId: "res-jamie",  status: "active", startDate: "Mar 15, 2024", endDate: "Mar 14, 2026", rent: 2800, concessionId: null,  paymentIds: ["pay-jamie-rent"],  document: null },
  { id: "lease-evan",   applicationId: null,        unitId: "unit-0404", leadId: "lead-evan",   residentId: "res-evan",   status: "active", startDate: "Jun 1, 2024",  endDate: "May 31, 2025", rent: 2100, concessionId: null,  paymentIds: [],                  document: null },
  { id: "lease-derek",  applicationId: null,        unitId: "unit-0607", leadId: "lead-derek",  residentId: "res-derek",  status: "active", startDate: "Jan 20, 2024", endDate: "Jan 19, 2026", rent: 2750, concessionId: null,  paymentIds: [],                  document: null },
  { id: "lease-tomas",  applicationId: null,        unitId: "unit-0805", leadId: "lead-tomas",  residentId: "res-tomas",  status: "active", startDate: "Sep 9, 2024",  endDate: "Sep 8, 2025",  rent: 2100, concessionId: null,  paymentIds: ["pay-tomas-rent"],  document: null },
  { id: "lease-rachel", applicationId: null,        unitId: "unit-0812", leadId: "lead-rachel", residentId: "res-rachel", status: "active", startDate: "Feb 11, 2024", endDate: "Feb 10, 2026", rent: 3250, concessionId: null,  paymentIds: [],                  document: null },
];

// ── Residents (the SAME person as the Lead, re-presented; not a new key) ───────
const residents = [
  { id: "res-maya",   leadId: "lead-maya",   unitId: "unit-0204", activeLeaseId: "lease-maya",   moveInStatus: "moved_in",       tenure: 0.0, onTimeRecord: "1/1",   renewalStatus: "—",        note: "New lease · keys Apr 1" },
  { id: "res-nia",    leadId: "lead-nia",    unitId: "unit-0211", activeLeaseId: "lease-nia",    moveInStatus: "moved_in",       tenure: 0.7, onTimeRecord: "11/12", renewalStatus: "pending",  note: "Auto-retry tonight · pushed to Fri" },
  { id: "res-jamie",  leadId: "lead-jamie",  unitId: "unit-0312", activeLeaseId: "lease-jamie",  moveInStatus: "moved_in",       tenure: 1.1, onTimeRecord: "13/13", renewalStatus: "eligible", note: "AC ticket open · MT-4821" },
  { id: "res-evan",   leadId: "lead-evan",   unitId: "unit-0404", activeLeaseId: "lease-evan",   moveInStatus: "moved_in",       tenure: 0.9, onTimeRecord: "10/10", renewalStatus: "eligible", note: "Lease ends 39 days · no touch yet" },
  { id: "res-priya",  leadId: "lead-priya",  unitId: "unit-0504", activeLeaseId: "lease-priya",  moveInStatus: "moved_in",       tenure: 0.4, onTimeRecord: "5/5",   renewalStatus: "ntv",      note: "NTV filed · vacate May 31" },
  { id: "res-derek",  leadId: "lead-derek",  unitId: "unit-0607", activeLeaseId: "lease-derek",  moveInStatus: "moved_in",       tenure: 1.3, onTimeRecord: "15/15", renewalStatus: "—",        note: "On-time 100% · candidate for renewal bump" },
  { id: "res-sarah",  leadId: "lead-sarah",  unitId: "unit-0706", activeLeaseId: "lease-sarah",  moveInStatus: "moved_in",       tenure: 0.1, onTimeRecord: "2/2",   renewalStatus: "—",        note: "Just signed · autopay set" },
  { id: "res-tomas",  leadId: "lead-tomas",  unitId: "unit-0805", activeLeaseId: "lease-tomas",  moveInStatus: "moved_in",       tenure: 0.6, onTimeRecord: "7/7",   renewalStatus: "eligible", note: "Noise complaint re: 804 · NC-331" },
  { id: "res-rachel", leadId: "lead-rachel", unitId: "unit-0812", activeLeaseId: "lease-rachel", moveInStatus: "moved_in",       tenure: 1.2, onTimeRecord: "12/14", renewalStatus: "—",        note: "Partial · $1,800 of $3,250" },
  { id: "res-ethan",  leadId: "lead-ethan",  unitId: "unit-0915", activeLeaseId: "lease-ethan",  moveInStatus: "pending_movein", tenure: 0.0, onTimeRecord: "—",     renewalStatus: "—",        note: "Move-in tomorrow" },
];

// ── Payments (deposit / fee / rent — the monetization spine, v6 FAILED_PAYMENTS)
const payments = [
  { id: "pay-nia-rent",     projectId: "meridian", leaseId: "lease-nia",   applicationId: null,        leadId: "lead-nia",    kind: "rent",             amount: 2150, method: "ACH",  status: "failed",    attempt: 1, nextRetry: "Fri 7:00p" },
  { id: "pay-jamie-rent",   projectId: "meridian", leaseId: "lease-jamie", applicationId: null,        leadId: "lead-jamie",  kind: "rent",             amount: 2800, method: "card", status: "retrying",  attempt: 2, nextRetry: "tonight 8:00p" },
  { id: "pay-tomas-rent",   projectId: "meridian", leaseId: "lease-tomas", applicationId: null,        leadId: "lead-tomas",  kind: "rent",             amount: 2100, method: "ACH",  status: "failed",    attempt: 1, nextRetry: "hold" },
  { id: "pay-sarah-deposit",projectId: "meridian", leaseId: "lease-sarah", applicationId: "app-sarah", leadId: "lead-sarah",  kind: "security_deposit", amount: 2150, method: "ACH",  status: "succeeded", attempt: 1, nextRetry: null },
  { id: "pay-kira-appfee",  projectId: "meridian", leaseId: null,          applicationId: "app-kira",  leadId: "lead-kira",   kind: "application_fee",  amount: 50,   method: "card", status: "succeeded", attempt: 1, nextRetry: null },
  { id: "pay-miguel-deposit",projectId: "meridian",leaseId: null,          applicationId: "app-miguel",leadId: "lead-miguel", kind: "security_deposit", amount: 2850, method: "ACH",  status: "succeeded", attempt: 1, nextRetry: null },
];

// ── Decisions (Today console; REFERENCE an entity, don't restate it — D6) ──────
const decisions = [
  {
    id: "dec-3br-pricing", projectId: "meridian", kind: "pricing", rank: 1, tone: "bad",
    headline: "3-bedrooms have stalled.",
    recommendation: "Drop asking to $3,200 — still $50 above both comps.",
    score: { total: 94, impact: 38, risk: 32, recency: 24 }, impactLabel: "−$5.6K/mo carry · unblocks 22 units",
    subjectType: "unitType", subjectId: "ut-3br", ownerId: "user-mori",
    options: [{ label: "Accept · $3,200", value: 3200, primary: true }, { label: "Add parking concession" }, { label: "Hold", ghost: true }],
    outcome: "open",
  },
  {
    id: "dec-alex-sla", projectId: "meridian", kind: "lead", rank: 2, tone: "bad",
    headline: "Hot lead is past SLA.",
    recommendation: "Call within 10 minutes — score 92, pre-check passed.",
    score: { total: 87, impact: 26, risk: 38, recency: 23 }, impactLabel: "$2,800/mo lease at risk · score 92",
    subjectType: "lead", subjectId: "lead-alex", ownerId: "user-priya",
    options: [{ label: "Call now", primary: true }, { label: "Assign to Priya" }, { label: "Text template", ghost: true }],
    outcome: "open",
  },
  {
    id: "dec-1mo-concession", projectId: "meridian", kind: "concession", rank: 3, tone: "warn",
    headline: "“1 month free” expires May 31.",
    recommendation: "Extend through Jul 31 to protect $380K ARR.",
    score: { total: 79, impact: 42, risk: 21, recency: 16 }, impactLabel: "+$380K ARR protected",
    subjectType: "concession", subjectId: "c1", ownerId: "user-mori",
    options: [{ label: "Extend to Jul 31", primary: true }, { label: "Narrow to 3BR only" }, { label: "Let expire", ghost: true }],
    outcome: "open",
  },
];

// ── Threads (unified comms; subject REFERENCES the Lead/Org — same person) ─────
const threads = [
  {
    id: "thread-jamie", projectId: "meridian", kind: "resident", subjectType: "lead", subjectId: "lead-jamie",
    channel: "SMS", tone: "bad", lastAt: "2h", unread: 2, slaFlagged: true, assignedTo: "user-priya", summary: "AC not cooling · urgent",
    messages: [
      { at: "Tue 8:12a",  from: "them", body: "Hi — AC has been blowing warm since yesterday afternoon. Pretty hot in the unit now." },
      { at: "Tue 8:14a",  from: "auto", body: "Thanks — maintenance ticket MT-4821 opened. ETA within 24h." },
      { at: "Tue 10:02a", from: "them", body: "Still nothing? It's 86° in here." },
      { at: "Tue 10:04a", from: "them", body: "Need help today please." },
    ],
    suggested: ["Dispatch Mike · ETA 45m", "Escalate to supervisor", "Offer 1-night hotel credit"],
  },
  {
    id: "thread-alex", projectId: "meridian", kind: "prospect", subjectType: "lead", subjectId: "lead-alex",
    channel: "Zillow", tone: "good", lastAt: "12m", unread: 1, slaFlagged: false, assignedTo: "user-priya", summary: "Can I tour Saturday?",
    messages: [
      { at: "Today 9:18a", from: "them", body: "Saw the 2BR on Zillow — is this still available? Looking for a Jun 1 move." },
      { at: "Today 9:20a", from: "auto", body: "Yes — unit 1204 is open. 2BR / 2BA / 1,120 sqft · $2,800/mo." },
      { at: "Today 9:22a", from: "them", body: "Can I tour Saturday afternoon? I can come by any time after 1." },
    ],
    suggested: ["Book Saturday 2pm", "Reply with 3 time slots", "Hand off to Priya"],
  },
  {
    id: "thread-paragon", projectId: "meridian", kind: "vendor", subjectType: "org", subjectId: "org-paragon",
    channel: "Email", tone: "neutral", lastAt: "5h", unread: 1, slaFlagged: false, assignedTo: "user-mori", summary: "Invoice #4412 · $1,840",
    messages: [
      { at: "Mon 2:40p",  from: "them", body: "April turn cleaning complete — 12 units. Invoice #4412 attached, $1,840." },
      { at: "Tue 5h ago", from: "them", body: "Following up — please let me know if you need anything else to process." },
    ],
    suggested: ["Approve · send to Ledger", "Hold for review", "Forward to accounting"],
  },
  {
    id: "thread-tomas", projectId: "meridian", kind: "resident", subjectType: "lead", subjectId: "lead-tomas",
    channel: "SMS", tone: "warn", lastAt: "5h", unread: 0, slaFlagged: false, assignedTo: "user-priya", summary: "Noise complaint · 804",
    messages: [
      { at: "Mon 11:40p", from: "them", body: "Sorry to bother — 804 has been loud most nights this week. Can someone follow up?" },
      { at: "Today 7:02a", from: "you",  body: "Thanks — logged NC-331. I'll speak to them today." },
    ],
    suggested: ["Send courtesy notice to 804", "Mark resolved", "Escalate"],
  },
  {
    id: "thread-hana", projectId: "meridian", kind: "prospect", subjectType: "lead", subjectId: "lead-hana",
    channel: "Apt.com", tone: "neutral", lastAt: "2d", unread: 0, slaFlagged: false, assignedTo: "user-priya", summary: "Silent since tour",
    messages: [
      { at: "Sat 2:02p", from: "them", body: "Thanks for the tour!" },
      { at: "Sat 2:04p", from: "you",  body: "Any time. Let me know if you have questions — application link if you want it: leaseright.app/apply" },
    ],
    suggested: ["Send follow-up template", "Try phone call", "Demote to watch"],
  },
  {
    id: "thread-nia", projectId: "meridian", kind: "resident", subjectType: "lead", subjectId: "lead-nia",
    channel: "SMS", tone: "bad", lastAt: "18h", unread: 1, slaFlagged: false, assignedTo: "user-priya", summary: "Payment failed overnight",
    messages: [
      { at: "Tue 2:14a", from: "auto", body: "Payment of $2,150 failed (insufficient funds). Auto-retry scheduled for tonight." },
      { at: "Tue 7:48a", from: "them", body: "Saw the text — can you push it to Friday? Just got paid yesterday, funds land Thu." },
    ],
    suggested: ["Push auto-retry to Friday", "Waive NSF fee (1x)", "Send payment-plan form"],
  },
];

// ── Comps (competitor set; feeds Rents + Model; v6 COMPS) ──────────────────────
const comps = [
  { id: "comp-self",    projectId: "meridian", name: "The Meridian",   units: 260, occupancy: 46.5, distance: 0.0, concession: "1mo",  studio: 1650, oneBed: 2100, twoBed: 2800, threeBed: 3400, trend: null,            self: true },
  { id: "comp-vance",   projectId: "meridian", name: "The Vance",      units: 310, occupancy: 61.0, distance: 0.4, concession: "2mo",  studio: 1580, oneBed: 2050, twoBed: 2720, threeBed: 3150, trend: "concession-up", self: false },
  { id: "comp-ovation", projectId: "meridian", name: "Ovation",        units: 240, occupancy: 58.0, distance: 0.8, concession: "1mo",  studio: 1610, oneBed: 2080, twoBed: 2750, threeBed: 3200, trend: null,            self: false },
  { id: "comp-halcyon", projectId: "meridian", name: "Halcyon",        units: 180, occupancy: 72.0, distance: 1.2, concession: "none", studio: 1650, oneBed: 2120, twoBed: 2820, threeBed: 3240, trend: "pricing-up",    self: false },
  { id: "comp-alcove",  projectId: "meridian", name: "Alcove Heights", units: 220, occupancy: 54.0, distance: 0.9, concession: "1mo",  studio: 1560, oneBed: 2000, twoBed: 2680, threeBed: 3100, trend: null,            self: false },
  { id: "comp-parker",  projectId: "meridian", name: "The Parker",     units: 148, occupancy: 68.0, distance: 1.5, concession: "none", studio: 1680, oneBed: 2150, twoBed: 2850, threeBed: 3250, trend: null,            self: false },
];

// ── Concessions (pricing programs; appliesToUnitTypeIds references unit types) ─
const concessions = [
  { id: "c1", projectId: "meridian", name: "1 month free",        expiresAt: "May 31",       appliesToUnitTypeIds: ["ut-studio", "ut-1br", "ut-2br", "ut-3br"], costPerLease: 2000, conversionRate: 62, unitsApplied: 14, status: "active",   lenderApproved: true,  note: "Best performer · all unit types" },
  { id: "c2", projectId: "meridian", name: "$500 move-in credit", expiresAt: "Jun 15",       appliesToUnitTypeIds: ["ut-1br", "ut-2br"],                        costPerLease: 500,  conversionRate: 38, unitsApplied: 11, status: "active",   lenderApproved: true,  note: "Mid-tier pull" },
  { id: "c3", projectId: "meridian", name: "Waived app fee",      expiresAt: "open",         appliesToUnitTypeIds: ["ut-studio", "ut-1br", "ut-2br", "ut-3br"], costPerLease: 75,   conversionRate: 9,  unitsApplied: 3,  status: "active",   lenderApproved: false, note: "Low uptake · consider sunset" },
  { id: "c4", projectId: "meridian", name: "1mo free · 3BR only", expiresAt: "ended Apr 14", appliesToUnitTypeIds: ["ut-3br"],                                  costPerLease: 3200, conversionRate: 14, unitsApplied: 2,  status: "archived", lenderApproved: true,  note: "Archived · 3BR stalled regardless" },
];

// ── Listings (syndication channels; origin of Lead.source, v6 LISTINGS) ────────
const listings = [
  { id: "list-zillow",   projectId: "meridian", channel: "Zillow",         syncStatus: "3m ago",  health: "ok",   views7: 4820, leads7: 31, cpLead: "$12", unitsLive: 4, issues: 0, note: null },
  { id: "list-aptscom",  projectId: "meridian", channel: "Apartments.com", syncStatus: "4m ago",  health: "ok",   views7: 3140, leads7: 22, cpLead: "$18", unitsLive: 4, issues: 0, note: null },
  { id: "list-realtor",  projectId: "meridian", channel: "Realtor.com",    syncStatus: "4m ago",  health: "ok",   views7: 890,  leads7: 6,  cpLead: "$22", unitsLive: 4, issues: 0, note: null },
  { id: "list-zumper",   projectId: "meridian", channel: "Zumper",         syncStatus: "12m ago", health: "ok",   views7: 1240, leads7: 9,  cpLead: "$14", unitsLive: 4, issues: 0, note: null },
  { id: "list-rent",     projectId: "meridian", channel: "Rent.com",       syncStatus: "2h ago",  health: "warn", views7: 520,  leads7: 3,  cpLead: "$28", unitsLive: 3, issues: 1, note: "3BR listing photos flagged · too few" },
  { id: "list-trulia",   projectId: "meridian", channel: "Trulia",         syncStatus: "5h ago",  health: "warn", views7: 210,  leads7: 1,  cpLead: "$40", unitsLive: 2, issues: 1, note: "Studio description truncated" },
  { id: "list-facebook", projectId: "meridian", channel: "Facebook Mktpl", syncStatus: "error",   health: "bad",  views7: 0,    leads7: 0,  cpLead: "—",   unitsLive: 0, issues: 1, note: "OAuth token expired · reconnect needed" },
];

// ══════════════════════════════════════════════════════════════════════════════
//  SEED — the one connected object graph
// ══════════════════════════════════════════════════════════════════════════════
const SEED = {
  orgs, users,
  projects, unitTypes, units, scenarios, model,
  leads, tours, applications, leases, residents, payments,
  decisions, threads, comps, concessions, listings,
};

// ── resolveRefs(SEED): dependency-free referential-integrity self-check ─────────
// Returns an array of dangling references ({from, id, field, value, target}).
// An EMPTY array means zero dangling references — every unitId / leadId /
// assignedTo (and every other id reference) resolves to an existing row.
function resolveRefs(seed) {
  const S = seed || SEED;
  const idSet = (arr) => new Set((arr || []).map((r) => r.id));
  const sets = {
    orgs: idSet(S.orgs), users: idSet(S.users), projects: idSet(S.projects),
    unitTypes: idSet(S.unitTypes), units: idSet(S.units), scenarios: idSet(S.scenarios),
    model: idSet(S.model), leads: idSet(S.leads), tours: idSet(S.tours),
    applications: idSet(S.applications), leases: idSet(S.leases), residents: idSet(S.residents),
    payments: idSet(S.payments), decisions: idSet(S.decisions), threads: idSet(S.threads),
    comps: idSet(S.comps), concessions: idSet(S.concessions), listings: idSet(S.listings),
  };
  const dangling = [];
  const one = (from, id, field, value, target) => {
    if (value == null) return;
    if (!sets[target] || !sets[target].has(value)) dangling.push({ from, id, field, value, target });
  };
  const many = (from, id, field, values, target) => (values || []).forEach((v) => one(from, id, field, v, target));

  (S.projects || []).forEach((p) => {
    one("projects", p.id, "sponsorOrgId", p.sponsorOrgId, "orgs");
    one("projects", p.id, "modelId", p.modelId, "model");
  });
  (S.users || []).forEach((u) => one("users", u.id, "orgId", u.orgId, "orgs"));
  (S.unitTypes || []).forEach((ut) => one("unitTypes", ut.id, "projectId", ut.projectId, "projects"));
  (S.units || []).forEach((u) => {
    one("units", u.id, "projectId", u.projectId, "projects");
    one("units", u.id, "unitTypeId", u.unitTypeId, "unitTypes");
    one("units", u.id, "currentLeaseId", u.currentLeaseId, "leases");
    one("units", u.id, "currentResidentId", u.currentResidentId, "residents");
  });
  (S.scenarios || []).forEach((sc) => one("scenarios", sc.id, "modelId", sc.modelId, "model"));
  (S.model || []).forEach((m) => {
    one("model", m.id, "projectId", m.projectId, "projects");
    one("model", m.id, "activeScenarioId", m.activeScenarioId, "scenarios");
    one("model", m.id, "baselineScenarioId", m.baselineScenarioId, "scenarios");
    (m.unitMixPlan || []).forEach((u, i) => one("model." + m.id + ".unitMixPlan[" + i + "]", u.unitTypeId, "unitTypeId", u.unitTypeId, "unitTypes"));
  });
  (S.leads || []).forEach((l) => {
    one("leads", l.id, "projectId", l.projectId, "projects");
    one("leads", l.id, "interestedUnitId", l.interestedUnitId, "units");
    one("leads", l.id, "interestedUnitTypeId", l.interestedUnitTypeId, "unitTypes");
    one("leads", l.id, "assignedTo", l.assignedTo, "users");
    one("leads", l.id, "applicationId", l.applicationId, "applications");
    one("leads", l.id, "leaseId", l.leaseId, "leases");
    one("leads", l.id, "residentId", l.residentId, "residents");
    one("leads", l.id, "threadId", l.threadId, "threads");
    many("leads", l.id, "tourIds", l.tourIds, "tours");
  });
  (S.tours || []).forEach((t) => {
    one("tours", t.id, "leadId", t.leadId, "leads");
    one("tours", t.id, "unitId", t.unitId, "units");
    one("tours", t.id, "agentId", t.agentId, "users");
  });
  (S.applications || []).forEach((a) => {
    one("applications", a.id, "leadId", a.leadId, "leads");
    one("applications", a.id, "unitId", a.unitId, "units");
    one("applications", a.id, "leaseId", a.leaseId, "leases");
    one("applications", a.id, "applicationFeePaymentId", a.applicationFeePaymentId, "payments");
  });
  (S.leases || []).forEach((ls) => {
    one("leases", ls.id, "applicationId", ls.applicationId, "applications");
    one("leases", ls.id, "unitId", ls.unitId, "units");
    one("leases", ls.id, "leadId", ls.leadId, "leads");
    one("leases", ls.id, "residentId", ls.residentId, "residents");
    one("leases", ls.id, "concessionId", ls.concessionId, "concessions");
    many("leases", ls.id, "paymentIds", ls.paymentIds, "payments");
  });
  (S.residents || []).forEach((r) => {
    one("residents", r.id, "leadId", r.leadId, "leads");
    one("residents", r.id, "unitId", r.unitId, "units");
    one("residents", r.id, "activeLeaseId", r.activeLeaseId, "leases");
  });
  (S.payments || []).forEach((p) => {
    one("payments", p.id, "projectId", p.projectId, "projects");
    one("payments", p.id, "leaseId", p.leaseId, "leases");
    one("payments", p.id, "applicationId", p.applicationId, "applications");
    one("payments", p.id, "leadId", p.leadId, "leads");
  });
  const subjectTarget = { unitType: "unitTypes", lead: "leads", concession: "concessions", application: "applications", lease: "leases", unit: "units" };
  (S.decisions || []).forEach((d) => {
    one("decisions", d.id, "projectId", d.projectId, "projects");
    one("decisions", d.id, "ownerId", d.ownerId, "users");
    const target = subjectTarget[d.subjectType];
    if (!target) dangling.push({ from: "decisions", id: d.id, field: "subjectType", value: d.subjectType, target: "(unknown)" });
    else one("decisions", d.id, "subjectId", d.subjectId, target);
  });
  const threadTarget = { lead: "leads", resident: "residents", org: "orgs" };
  (S.threads || []).forEach((t) => {
    one("threads", t.id, "projectId", t.projectId, "projects");
    one("threads", t.id, "assignedTo", t.assignedTo, "users");
    const target = threadTarget[t.subjectType];
    if (!target) dangling.push({ from: "threads", id: t.id, field: "subjectType", value: t.subjectType, target: "(unknown)" });
    else one("threads", t.id, "subjectId", t.subjectId, target);
  });
  (S.comps || []).forEach((c) => one("comps", c.id, "projectId", c.projectId, "projects"));
  (S.concessions || []).forEach((c) => {
    one("concessions", c.id, "projectId", c.projectId, "projects");
    many("concessions", c.id, "appliesToUnitTypeIds", c.appliesToUnitTypeIds, "unitTypes");
  });
  (S.listings || []).forEach((l) => one("listings", l.id, "projectId", l.projectId, "projects"));

  return dangling;
}

Object.assign(window, { SEED, resolveRefs });
