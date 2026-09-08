/*
 * selectors.jsx — N2: the pure selector library (Phase 0, The Spine)
 * ---------------------------------------------------------------------------
 * Dependency-free, pure-function derivations over the SEED graph defined in
 * model-data.jsx (N1). This file imports NO React. Every export is a plain
 * function of its inputs (SEED is read through an optional `seed` argument that
 * defaults to `window.SEED`, so callers may pass the graph explicitly for a
 * fully pure call). Nothing here mutates state; the store (N3) will consume
 * these to compute derived values.
 *
 * What this fixes (30_DATA §6 items 3 & 4, 40_FOUNDATION D2 & D4):
 *   - Stage counts are DERIVED from the leads, never the hardcoded `STAGES[].count`
 *     that disagreed with the actual distribution in v6.
 *   - Pipeline stage is DERIVED from the furthest-progressed child (a lead with a
 *     resident/lease is SIGNED; an approved application is APPROVED; a submitted
 *     one is APPLIED; a completed tour is TOURED). So Pipeline and Applications
 *     can never disagree — the v6 disconnect is structurally impossible (D2).
 *   - Plan-vs-actual is structural: `sharedQuantities(project)` returns the D4 set
 *     (absorption, velocity, rent-by-type, concession spend, occupancy,
 *     carry/days-to-goal, staffing), each carrying a PLAN value (from Model) and an
 *     ACTUAL value (from live entities), and `variance(quantity)` diffs any of them.
 *
 * Note on NEW vs CONTACTED: no child entity distinguishes them in the seed
 * (contact is "first outbound logged", which has no first-class record here, and
 * a thread can exist on a still-NEW lead — e.g. Alex Rivera). So for those two
 * stages the authored `pipelineStage` is used as a FLOOR, and the derived child
 * stage always wins when it is further along. This keeps derivation honest
 * (a child overrides a stale authored stage) without inventing data.
 *
 * Stack: static React-UMD + Babel, no build step, no backend, no new deps.
 * SOURCE_OF_TRUTH: product is LeaseRight, dense dark ops console — unchanged here.
 */

/* global window */

// Canonical, ordered pipeline stages (LOST is terminal / off-ladder).
const STAGE_ORDER = ["new", "contacted", "toured", "applied", "approved", "signed"];

// ── small pure helpers ─────────────────────────────────────────────────────────
function _seed(seed) {
  return seed || (typeof window !== "undefined" ? window.SEED : null);
}
function _byId(arr, id) {
  if (!id || !arr) return null;
  for (let i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
  return null;
}
function _sum(arr, f) {
  return (arr || []).reduce((n, x) => n + (Number(f(x)) || 0), 0);
}
function _round(n, dp) {
  if (n == null || isNaN(n)) return null;
  const m = Math.pow(10, dp == null ? 0 : dp);
  return Math.round(n * m) / m;
}

// Staffing/commission comparison only. Velocity is deliberately absent: it
// must be observed or entered from a real project, not authored to pick a winner.
function brokerEconomics(inputs) {
  const x = inputs || {};
  const units = Number(x.units) || 0;
  const avgRent = Number(x.avgRent) || 0;
  const feePct = Number(x.feePct) || 0;
  const feePeriod = x.feePeriod === "year" ? "year" : "month";
  const months = Number(x.months) || 0;
  const locatorShare = Math.max(0, Math.min(1, Number(x.locatorShareOfLeases) || 0));
  const periodMonths = feePeriod === "year" ? 12 : 1;
  const exclusiveCost = units * avgRent * periodMonths * feePct;
  const inHouseCost = (Number(x.inHouseMonthly) || 0) * months;
  const hybridPayroll = (Number(x.hybridMonthly) || 0) * months;
  const hybridCommission = exclusiveCost * locatorShare;
  const hybridCost = hybridPayroll + hybridCommission;
  const savingsInHouse = exclusiveCost - inHouseCost;
  const savingsHybrid = exclusiveCost - hybridCost;
  const carryPerDay = (Number(x.carryPerMonth) || 0) / (365 / 12);

  return {
    exclusiveCost: _round(exclusiveCost, 0),
    inHouseCost: _round(inHouseCost, 0),
    hybridPayroll: _round(hybridPayroll, 0),
    hybridCommission: _round(hybridCommission, 0),
    hybridCost: _round(hybridCost, 0),
    savingsInHouse: _round(savingsInHouse, 0),
    savingsHybrid: _round(savingsHybrid, 0),
    carryDaysEquivalentInHouse: carryPerDay ? _round(savingsInHouse / carryPerDay, 1) : null,
    carryDaysEquivalentHybrid: carryPerDay ? _round(savingsHybrid / carryPerDay, 1) : null,
    feePeriod: feePeriod,
    locatorShareOfLeases: locatorShare,
  };
}

// ── deriveLeadStage(lead, seed) ─────────────────────────────────────────────────
// Derives a lead's pipeline stage from its furthest-progressed child, falling
// back to the authored `pipelineStage` as a floor for NEW/CONTACTED (see header).
// Returns one of STAGE_ORDER or "lost".
function deriveLeadStage(lead, seed) {
  if (!lead) return "new";
  if (lead.lostReason) return "lost";
  const S = _seed(seed);

  // Furthest-progressed child → a stage index, or -1 if no child signal.
  let childIdx = -1;

  // Resident or a signed/active/ended lease ⇒ SIGNED.
  const lease = S ? _byId(S.leases, lead.leaseId) : (lead.leaseId ? { status: "signed" } : null);
  if (lead.residentId || (lease && ["signed", "active", "ended"].indexOf(lease.status) !== -1)) {
    childIdx = STAGE_ORDER.indexOf("signed");
  } else {
    const app = S ? _byId(S.applications, lead.applicationId) : (lead.applicationId ? {} : null);
    if (lease || (app && ["approved", "conditional", "lease_sent"].indexOf(app.status) !== -1)) {
      // A draft/sent lease or an approved application ⇒ APPROVED.
      childIdx = STAGE_ORDER.indexOf("approved");
    } else if (app) {
      // Any earlier application state (started/submitted/screening/review) ⇒ APPLIED.
      childIdx = STAGE_ORDER.indexOf("applied");
    } else {
      // A completed tour ⇒ TOURED (unresolvable tour refs count as present).
      const toured = (lead.tourIds || []).some(function (tid) {
        const t = S ? _byId(S.tours, tid) : null;
        return t ? t.status === "completed" : true;
      });
      if (toured) childIdx = STAGE_ORDER.indexOf("toured");
    }
  }

  // Authored floor (NEW/CONTACTED have no distinguishing child entity).
  const authoredIdx = STAGE_ORDER.indexOf(String(lead.pipelineStage || "new").toLowerCase());
  const idx = Math.max(childIdx, authoredIdx, 0);
  return STAGE_ORDER[idx];
}

// ── stageCounts(leads, seed) ────────────────────────────────────────────────────
// Counts leads by DERIVED stage. Every lead maps to exactly one bucket, so the
// values always sum to leads.length. No count is ever hardcoded.
function stageCounts(leads, seed) {
  const counts = {};
  STAGE_ORDER.forEach(function (s) { counts[s] = 0; });
  counts.lost = 0;
  (leads || []).forEach(function (lead) {
    const stage = deriveLeadStage(lead, seed);
    counts[stage] = (counts[stage] || 0) + 1;
  });
  return counts;
}

// ── sharedQuantities(project, seed) ─────────────────────────────────────────────
// The D4 set of shared quantities for one project. Each quantity carries a PLAN
// value (from the Model / baseline scenario) and an ACTUAL value (from live
// entities), computed the same way so `variance()` works everywhere for free.
// Projects with no Model (Luminary, Brix in the seed) return null-ish plan sides
// but still resolve any live actuals they have.
function sharedQuantities(project, seed) {
  const S = _seed(seed);
  if (!project || !S) return null;
  const pid = project.id;

  const model = (S.model || []).find(function (m) { return m.projectId === pid; }) || null;
  const scen = function (id) { return (S.scenarios || []).find(function (s) { return s.id === id; }) || null; };
  const activeScenario = model
    ? (scen(model.activeScenarioId) || (S.scenarios || []).find(function (s) { return s.active; }) || null)
    : null;
  const baselineScenario = model ? scen(model.baselineScenarioId) : null;
  const budget = model ? model.budget : null;
  const staffingPlan = model ? model.staffingPlan : null;

  const uts = (S.unitTypes || []).filter(function (ut) { return ut.projectId === pid; });
  const leads = (S.leads || []).filter(function (l) { return l.projectId === pid; });
  const concessions = (S.concessions || []).filter(function (c) { return c.projectId === pid; });
  const mixOf = function (utId) {
    if (!model) return null;
    return (model.unitMixPlan || []).find(function (m) { return m.unitTypeId === utId; }) || null;
  };

  // Occupancy — leased Units / total Units (the live aggregate). Ratios 0..1.
  const leasedUnits = _sum(uts, function (ut) { return ut.leasedCount; });
  const totalUnits = _sum(uts, function (ut) { return ut.totalUnits; });
  const occActual = totalUnits > 0 ? leasedUnits / totalUnits : null;
  const occPlan = project.targetOccupancyPct != null ? project.targetOccupancyPct / 100 : null;

  // Absorption — cumulative count of Leads reaching SIGNED (actual) vs the
  // planned final leased count at the occupancy goal (plan). The full weekly
  // S-curve is N5 (absorptionCurve); here it is the scalar the curve integrates to.
  const signedCount = leads.filter(function (l) { return deriveLeadStage(l, S) === "signed"; }).length;
  const absorptionPlan = (occPlan != null && totalUnits > 0) ? Math.round(occPlan * totalUnits) : null;

  // Velocity (leases/wk) — plan from the active scenario headline rate; actual
  // from the sum of per-unit-type live velocities.
  const velocityPlan = activeScenario ? activeScenario.leasesPerWeek : null;
  const velocityActual = uts.length ? _round(_sum(uts, function (ut) { return ut.velocityActual; }), 1) : null;

  // Rent by unit type — plan = UnitTypePlan.targetRent, actual = UnitType.effectiveRent.
  const rentByType = uts.map(function (ut) {
    const mix = mixOf(ut.id);
    return { unitTypeId: ut.id, type: ut.type, plan: mix ? mix.targetRent : null, actual: ut.effectiveRent };
  });

  // Concession spend — plan = reserve budget; actual = Σ costPerLease × unitsApplied
  // over active (non-archived) programs.
  const concessionPlan = budget ? budget.concessionReserve : null;
  const concessionActual = _sum(
    concessions.filter(function (c) { return c.status !== "archived"; }),
    function (c) { return (c.costPerLease || 0) * (c.unitsApplied || 0); }
  );

  // Carry / days-to-goal — plan = baseline scenario carry; actual = projected
  // remaining carry from actual velocity; daysToGoal from remaining vacant ÷ velocity.
  const goalUnits = absorptionPlan;
  const remainingToGoal = goalUnits != null ? Math.max(0, goalUnits - leasedUnits) : null;
  const weeksToGoal = (remainingToGoal != null && velocityActual > 0) ? remainingToGoal / velocityActual : null;
  const daysToGoal = weeksToGoal != null ? Math.round(weeksToGoal * 7) : null;
  const monthsToGoal = weeksToGoal != null ? weeksToGoal / (52 / 12) : null;
  const carryPlan = baselineScenario ? baselineScenario.carryCost : null;
  const carryActual = (monthsToGoal != null && budget) ? Math.round(monthsToGoal * budget.carryCostPerMonth) : null;

  // Staffing cost — plan = baseline scenario staffing; actual = current staffing
  // plan cost (live payroll/commission is not yet a first-class entity).
  const staffingPlan_ = baselineScenario ? baselineScenario.staffingCost : (staffingPlan ? staffingPlan.cost : null);
  const staffingActual = staffingPlan ? staffingPlan.cost : null;

  return {
    project: pid,
    absorption:      { plan: absorptionPlan, actual: signedCount, unit: "leases" },
    velocity:        { plan: velocityPlan, actual: velocityActual, unit: "leases/wk" },
    rentByType:      rentByType,
    concessionSpend: { plan: concessionPlan, actual: concessionActual, unit: "$" },
    occupancy:       { plan: occPlan, actual: occActual, leasedUnits: leasedUnits, totalUnits: totalUnits, unit: "ratio" },
    carry:           { plan: carryPlan, actual: carryActual, daysToGoal: daysToGoal, carryCostPerMonth: budget ? budget.carryCostPerMonth : null, unit: "$" },
    staffing:        { plan: staffingPlan_, actual: staffingActual, unit: "$" },
  };
}

// ── variance(quantity) ──────────────────────────────────────────────────────────
// Generic plan-vs-actual diff over any { plan, actual } scalar quantity (one of
// the sharedQuantities members, or a single rentByType row). Returns null when
// either side is missing. Direction/favorability is left to the caller — occupancy
// up is good, carry up is bad, and only the caller knows which.
function variance(quantity) {
  if (!quantity || quantity.plan == null || quantity.actual == null) return null;
  const delta = quantity.actual - quantity.plan;
  const pct = quantity.plan !== 0 ? delta / quantity.plan : null;
  return { plan: quantity.plan, actual: quantity.actual, delta: delta, pct: pct };
}

// ── __selfTest() — console.assert only, dependency-free ──────────────────────────
// Asserts the two invariants from the N2 done-when:
//   1) stageCounts(SEED.leads) sums to SEED.leads.length (every lead counted once).
//   2) Meridian occupancy.actual equals leasedUnits / totalUnits.
function __selfTest() {
  const S = _seed();
  if (!S) { console.assert(false, "selectors.__selfTest: SEED not loaded"); return false; }

  // 1) stage counts partition the leads exactly.
  const counts = stageCounts(S.leads);
  const total = Object.keys(counts).reduce(function (n, k) { return n + counts[k]; }, 0);
  console.assert(
    total === S.leads.length,
    "stageCounts must sum to leads.length: got " + total + " vs " + S.leads.length
  );

  // 2) Meridian occupancy = leasedUnits / totalUnits.
  const meridian = (S.projects || []).find(function (p) { return p.id === "meridian"; });
  console.assert(!!meridian, "Meridian project must exist in SEED");
  const sq = sharedQuantities(meridian);
  const uts = (S.unitTypes || []).filter(function (ut) { return ut.projectId === "meridian"; });
  const leasedUnits = _sum(uts, function (ut) { return ut.leasedCount; });
  const totalUnits = _sum(uts, function (ut) { return ut.totalUnits; });
  console.assert(
    sq && sq.occupancy.actual === leasedUnits / totalUnits,
    "Meridian occupancy.actual must equal leasedUnits/totalUnits: got " +
      (sq && sq.occupancy.actual) + " vs " + (leasedUnits / totalUnits)
  );
  console.assert(
    sq && sq.occupancy.leasedUnits === leasedUnits && sq.occupancy.totalUnits === totalUnits,
    "occupancy must expose the leasedUnits/totalUnits it derived from"
  );

  // 3) Fee period and hybrid outside-originator share remain explicit.
  const monthCase = brokerEconomics({
    units: 260, avgRent: 2180, feePct: 0.5, feePeriod: "month",
    inHouseMonthly: 18500, hybridMonthly: 9500, months: 9,
    locatorShareOfLeases: 0.4, carryPerMonth: 227000,
  });
  const yearCase = brokerEconomics({
    units: 260, avgRent: 2180, feePct: 0.5, feePeriod: "year",
  });
  console.assert(monthCase.exclusiveCost === 283400, "month fee basis must equal $283,400");
  console.assert(yearCase.exclusiveCost === 3400800, "year fee basis must equal $3,400,800");
  console.assert(
    monthCase.hybridCost === monthCase.hybridPayroll + monthCase.hybridCommission,
    "hybrid cost must equal payroll plus outside-originator commissions"
  );

  return true;
}

// ── window export (same pattern as data.jsx / model-data.jsx) ────────────────────
const Selectors = { STAGE_ORDER, deriveLeadStage, stageCounts, sharedQuantities, variance, brokerEconomics, __selfTest };
Object.assign(window, { deriveLeadStage, stageCounts, sharedQuantities, variance, brokerEconomics, Selectors, __selfTest });
