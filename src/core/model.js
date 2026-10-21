// Lease-up planning model. Pure functions, no DOM, no dependencies.
// Every number shown in the app comes from here so it can be unit tested.

export const DAY_MS = 86400000;
export const DAYS_PER_MONTH = 30.4375; // 365.25 / 12
export const MAX_DAYS = 3650; // ten-year planning horizon

export const PLAN_DEFAULTS = {
  targetOccupancy: 93,
  leaseTerm: 12,
  freeMonths: 0,
  moveInLag: 30,
};

export const SCENARIOS = [
  { key: "slower", name: "Slower", factor: 0.8 },
  { key: "base", name: "Base", factor: 1 },
  { key: "faster", name: "Faster", factor: 1.2 },
];

/** Number or null. Blank strings, null and non-finite values are null. */
export function num(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** 'YYYY-MM-DD' to UTC milliseconds, or null when it is not a real calendar date. */
export function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(value + "T00:00:00Z");
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

export function isoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Bedroom count from a free-text unit label. Studio is 0. Null when unknown. */
export function bedsFromLabel(label) {
  const s = String(label || "").trim().toLowerCase();
  if (!s) return null;
  if (/\bstudio\b|\befficiency\b/.test(s)) return 0;
  const m = s.match(/(\d)\s*(?:br\b|bd\b|bed)/) || s.match(/^(one|two|three|four)\b/);
  if (!m) return null;
  const words = { one: 1, two: 2, three: 3, four: 4 };
  return words[m[1]] ?? Number(m[1]);
}

/** Unit mix rows with numeric fields. Rows without a positive count are dropped. */
export function normalizeMix(unitMix = []) {
  return unitMix
    .map((r) => ({
      id: r.id,
      label: String(r.label || "").trim(),
      beds: r.beds === "" || r.beds === null || r.beds === undefined ? bedsFromLabel(r.label) : Number(r.beds),
      count: num(r.count),
      sqft: num(r.sqft),
      rent: num(r.rent),
      leased: num(r.leased) ?? 0,
      availableDate: r.availableDate || "",
    }))
    .filter((r) => r.count !== null && r.count > 0);
}

/**
 * Everything the calculation needs, with defaults applied.
 * `defaulted` lists the plan fields that are using a default rather than an entry.
 */
export function planInputs(project) {
  const p = project.plan || {};
  const defaulted = [];
  const withDefault = (key) => {
    const v = num(p[key]);
    if (v === null) {
      defaulted.push(key);
      return PLAN_DEFAULTS[key];
    }
    return v;
  };
  const rows = normalizeMix(project.unitMix);
  const start = parseDate(p.startDate);
  const targetDate = parseDate(p.targetDate);
  const targetOccupancy = withDefault("targetOccupancy");
  const leaseTerm = withDefault("leaseTerm");
  const freeMonths = withDefault("freeMonths");
  const moveInLag = withDefault("moveInLag");
  const totalUnits = rows.reduce((n, r) => n + r.count, 0);
  const existingLeased = rows.reduce((n, r) => n + Math.min(r.leased, r.count), 0);
  const targetLeased = Math.ceil((totalUnits * targetOccupancy) / 100 - 1e-9);
  let pace = num(p.leasesPerWeek);
  let paceSource = "entered";
  let requiredPace = null;
  if (start !== null && targetDate !== null && targetDate > start) {
    requiredPace = Math.max(0, targetLeased - existingLeased) / ((targetDate - start) / (7 * DAY_MS));
  }
  const atTarget = totalUnits > 0 && existingLeased >= targetLeased;
  if (pace === null && requiredPace !== null && requiredPace > 0) {
    pace = requiredPace;
    paceSource = "required";
  } else if (pace === null && atTarget) {
    pace = 0;
    paceSource = "stabilized";
  }
  return {
    rows,
    start,
    targetDate,
    targetOccupancy,
    leaseTerm,
    freeMonths,
    moveInLag,
    pace,
    paceSource,
    requiredPace,
    monthlyCarry: num(p.monthlyCarry) ?? 0,
    marketing: num(p.marketing) ?? 0,
    staffing: num(p.staffing) ?? 0,
    totalUnits,
    existingLeased,
    targetLeased,
    atTarget,
    defaulted,
  };
}

/**
 * What is missing or inconsistent, by step: 0 property, 1 units and rents, 2 plan.
 * `blocking` issues stop the model; the rest are warnings shown next to the result.
 */
export function planIssues(project, { townIncluded = () => true } = {}) {
  const issues = [];
  const add = (step, message, blocking = true, field = null) => issues.push({ step, message, blocking, field });
  if (!String(project.name || "").trim()) add(0, "Name the project.", false, "name");
  if (!String(project.address || "").trim()) add(0, "Add the property address.", false, "address");
  if (!project.town) add(0, "Choose the Rhode Island city or town.", false, "town");
  else if (!townIncluded(project.town)) add(0, `${project.town} is outside current coverage.`, false, "town");

  const raw = project.unitMix || [];
  const rows = normalizeMix(raw);
  if (!rows.length) add(1, "Add at least one unit type with a unit count.", true, "unitMix");
  raw.forEach((r, i) => {
    const count = num(r.count);
    const rent = num(r.rent);
    const leased = num(r.leased) ?? 0;
    const label = String(r.label || "").trim() || `Row ${i + 1}`;
    if (count === null || count <= 0) return;
    if (!Number.isInteger(count) || count > 10000) add(1, `${label}: unit count must be a whole number.`, true, "unitMix");
    if (rent === null || rent <= 0) add(1, `${label}: add a monthly rent.`, true, "unitMix");
    if (leased < 0 || leased > count) add(1, `${label}: leased units must be between 0 and ${count}.`, true, "unitMix");
    if (r.availableDate && parseDate(r.availableDate) === null) add(1, `${label}: fix the availability date.`, true, "unitMix");
  });
  const total = num(project.totalUnits);
  const sum = rows.reduce((n, r) => n + r.count, 0);
  if (rows.length && total !== null && total > 0 && sum !== total) {
    add(1, `Unit mix adds up to ${sum}; the building total is ${total}.`, false, "totalUnits");
  }

  const p = project.plan || {};
  const start = parseDate(p.startDate);
  const end = parseDate(p.targetDate);
  if (start === null) add(2, "Set the leasing start date.", true, "startDate");
  if (p.targetDate && end === null) add(2, "Fix the target stabilization date.", true, "targetDate");
  if (start !== null && end !== null && end <= start) add(2, "Target stabilization must be after leasing starts.", true, "targetDate");
  const pace = num(p.leasesPerWeek);
  if (pace !== null && pace <= 0) add(2, "Leasing pace must be greater than zero.", true, "leasesPerWeek");
  const occ = num(p.targetOccupancy);
  const occUsed = occ !== null && occ > 0 && occ <= 100 ? occ : PLAN_DEFAULTS.targetOccupancy;
  const atTarget = sum > 0 && rows.reduce((n, r) => n + Math.min(r.leased, r.count), 0) >= Math.ceil((sum * occUsed) / 100 - 1e-9);
  // A building already at its target has nothing left to pace.
  if (pace === null && end === null && !atTarget) add(2, "Enter a weekly leasing pace or a target stabilization date.", true, "leasesPerWeek");
  if (occ !== null && (occ <= 0 || occ > 100)) add(2, "Target occupancy must be between 1% and 100%.", true, "targetOccupancy");
  const term = num(p.leaseTerm) ?? PLAN_DEFAULTS.leaseTerm;
  const free = num(p.freeMonths) ?? PLAN_DEFAULTS.freeMonths;
  if (term <= 0 || term > 120) add(2, "Lease term must be between 1 and 120 months.", true, "leaseTerm");
  if (free < 0 || free > term) add(2, "Free rent cannot be negative or exceed the lease term.", true, "freeMonths");
  for (const [key, label] of [
    ["monthlyCarry", "Monthly carrying cost"],
    ["marketing", "Marketing budget"],
    ["staffing", "Staffing budget"],
    ["moveInLag", "Move-in lag"],
  ]) {
    const v = num(p[key]);
    if (v !== null && v < 0) add(2, `${label} cannot be negative.`, true, key);
  }
  if ((num(p.moveInLag) ?? 0) > 365) add(2, "Move-in lag cannot be more than 365 days.", true, "moveInLag");
  if (start !== null && end !== null && end - start > MAX_DAYS * DAY_MS) add(2, "Keep the plan within ten years.", true, "targetDate");
  return issues;
}

/**
 * Day-by-day lease-up at a given weekly pace.
 *
 * Leasing: each day's capacity (pace / 7) is spread across the unit types that are
 * available that day, in proportion to how many units each still has to lease.
 * Rent: a lease starts paying `moveInLag` days after signing and pays nothing for
 * the first `freeMonths`. Units already leased at the start pay from day one.
 * Cash: collected rent, less monthly carry, less the marketing and staffing budgets
 * spread evenly across the lease-up. The reserve is the deepest cumulative shortfall.
 */
export function simulate(inputs, pace, { through = 0 } = {}) {
  const { rows, start, targetLeased, freeMonths, moveInLag, monthlyCarry, marketing, staffing } = inputs;
  const n = rows.length;
  const avail = rows.map((r) => {
    const a = parseDate(r.availableDate);
    return a === null ? 0 : Math.max(0, Math.round((a - start) / DAY_MS));
  });
  const occupied = rows.map((r) => Math.min(r.leased, r.count));
  let leased = occupied.reduce((a, b) => a + b, 0);
  const dailyRent = rows.map((r) => r.rent / DAYS_PER_MONTH);
  // A month of free rent is 30.4375 days. Whole days are skipped outright and the leftover
  // fraction is taken off the first paying day, so cash foregone equals rent x free months.
  const freeExact = freeMonths * DAYS_PER_MONTH;
  const freeDays = Math.floor(freeExact + 1e-9);
  const freeFrac = freeExact - freeDays < 1e-9 ? 0 : freeExact - freeDays;
  const lag = Math.round(moveInLag);
  const perDay = pace / 7;

  // rateAdd[d] is the rent per day that starts being collected on day d.
  const rateAdd = new Float64Array(MAX_DAYS + lag + freeDays + 3);
  // partial[d] is rent collected on day d only: the paid part of a lease's first paying day.
  const partial = new Float64Array(rateAdd.length);
  const leasedByDay = [];
  let concession = 0;
  let stabDay = leased >= targetLeased - 1e-9 ? 0 : null;

  for (let d = 0; d < MAX_DAYS && stabDay === null; d++) {
    let remaining = 0;
    const open = [];
    for (let i = 0; i < n; i++) {
      const rem = rows[i].count - occupied[i];
      if (avail[i] <= d && rem > 1e-9) {
        open.push(i);
        remaining += rem;
      }
    }
    const signed = Math.min(perDay, remaining, targetLeased - leased);
    if (signed > 0) {
      for (const i of open) {
        const share = (signed * (rows[i].count - occupied[i])) / remaining;
        occupied[i] += share;
        const first = d + lag + freeDays;
        if (freeFrac === 0) rateAdd[first] += share * dailyRent[i];
        else {
          partial[first] += share * dailyRent[i] * (1 - freeFrac);
          rateAdd[first + 1] += share * dailyRent[i];
        }
        concession += share * rows[i].rent * freeMonths;
      }
      leased += signed;
    }
    leasedByDay.push(leased);
    if (leased >= targetLeased - 1e-9) stabDay = d + 1;
  }

  const reached = stabDay !== null;
  const leaseUpDays = reached ? stabDay : MAX_DAYS;
  // Run until every signed lease is paying, or to a later common date so cases can be compared.
  const settledDays = leaseUpDays + lag + freeDays + (freeFrac ? 2 : 1);
  const horizon = Math.min(rateAdd.length - 1, Math.max(settledDays, through));
  const carryPerDay = monthlyCarry / DAYS_PER_MONTH;
  const budgetPerDay = leaseUpDays > 0 ? (marketing + staffing) / leaseUpDays : 0;
  const upfrontBudget = leaseUpDays > 0 ? 0 : marketing + staffing;

  let rate = rows.reduce((sum, r, i) => sum + Math.min(r.leased, r.count) * dailyRent[i], 0);
  let cum = -upfrontBudget;
  let trough = Math.min(0, cum);
  let troughDay = 0;
  let breakevenDay = null;
  let rentToStab = 0;
  const months = [];
  let m = { rent: 0, carry: 0, budget: upfrontBudget };
  let monthStart = 0;
  for (let d = 0; d < horizon; d++) {
    rate += rateAdd[d];
    const collected = rate + partial[d];
    // Run rate including leases in their first, part-paid day.
    const runRate = freeFrac ? rate + partial[d] / (1 - freeFrac) : rate;
    if (breakevenDay === null && carryPerDay > 0 && runRate >= carryPerDay - 1e-9) breakevenDay = d;
    const budget = d < leaseUpDays ? budgetPerDay : 0;
    if (d < leaseUpDays) rentToStab += collected;
    cum += collected - carryPerDay - budget;
    // The reserve is measured through this case's own settling point. Days added only to line
    // cases up on a common date never deepen it.
    if (d < settledDays && cum < trough - 1e-9) {
      trough = cum;
      troughDay = d + 1;
    }
    m.rent += collected;
    m.carry += carryPerDay;
    m.budget += budget;
    const monthIndex = Math.floor((d + 1) / DAYS_PER_MONTH);
    const lastDay = d === horizon - 1;
    if (monthIndex > months.length || lastDay) {
      const leasedNow = d < leasedByDay.length ? leasedByDay[d] : leased;
      months.push({
        month: months.length + 1,
        date: isoDate(start + monthStart * DAY_MS), // first day of the period
        days: d + 1 - monthStart,
        leased: leasedNow,
        rent: m.rent,
        carry: m.carry,
        budget: m.budget,
        net: m.rent - m.carry - m.budget,
        cumulative: cum,
      });
      m = { rent: 0, carry: 0, budget: 0 };
      monthStart = d + 1;
    }
  }

  const grossCarry = carryPerDay * leaseUpDays;
  return {
    leasesPerWeek: pace,
    reached,
    leaseUpDays,
    stabilizeDate: reached ? isoDate(start + stabDay * DAY_MS) : null,
    meetsTarget: reached && inputs.targetDate !== null ? start + stabDay * DAY_MS <= inputs.targetDate : null,
    concessionCost: concession,
    grossCarry,
    rentCollected: rentToStab,
    netCarry: grossCarry - rentToStab,
    marketingCost: marketing,
    staffingCost: staffing,
    totalCost: concession + grossCarry + marketing + staffing,
    reserveNeed: -trough,
    reserveTroughDate: isoDate(start + troughDay * DAY_MS),
    breakevenDate: breakevenDay === null ? null : isoDate(start + breakevenDay * DAY_MS),
    stabilizedMonthlyRent: rate * DAYS_PER_MONTH,
    leasedPath: leasedByDay, // leases signed by the end of each day, through stabilization
    settledDays,
    horizonDays: horizon,
    finalCumulative: cum,
    months,
  };
}

/**
 * How much faster the building has to lease for one more month of free rent to pay for itself.
 * Compares cash once both plans are fully leased and every concession has burned off, so the
 * answer does not depend on where the comparison is cut. Null pace: no pace up to 5x does it.
 */
export function extraFreeMonthBreakeven(inputs) {
  if (inputs.freeMonths + 1 > inputs.leaseTerm) return null;
  const more = { ...inputs, freeMonths: inputs.freeMonths + 1 };
  const through = simulate(more, inputs.pace).settledDays;
  const hurdle = simulate(inputs, inputs.pace, { through }).finalCumulative;
  const cashAt = (pace) => simulate(more, pace, { through }).finalCumulative;
  let lo = inputs.pace;
  let hi = inputs.pace * 5;
  if (cashAt(hi) < hurdle) return { pace: null, upliftPct: null, stabilizeDate: null };
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (cashAt(mid) >= hurdle) hi = mid;
    else lo = mid;
  }
  return { pace: hi, upliftPct: (hi / inputs.pace - 1) * 100, stabilizeDate: simulate(more, hi).stabilizeDate };
}

/** Full result for a project: summary numbers plus the three pace scenarios. */
export function calculate(project, options) {
  const issues = planIssues(project, options);
  const blocking = issues.filter((i) => i.blocking);
  const inputs = planInputs(project);
  if (blocking.length || inputs.pace === null || (inputs.pace <= 0 && !inputs.atTarget) || inputs.start === null) {
    return { ready: false, issues, inputs, scenarios: [] };
  }
  const { rows, totalUnits, leaseTerm, freeMonths } = inputs;
  const gross = rows.reduce((sum, r) => sum + r.count * r.rent, 0);
  const averageRent = gross / totalUnits;
  const sqftRows = rows.filter((r) => r.sqft);
  const sqftTotal = sqftRows.reduce((sum, r) => sum + r.count * r.sqft, 0);
  // First pass finds where each case settles; the second runs all three to the same date.
  const settle = Math.max(...SCENARIOS.map((s) => simulate(inputs, inputs.pace * s.factor).settledDays));
  const scenarios = SCENARIOS.map((s) => ({ ...s, ...simulate(inputs, inputs.pace * s.factor, { through: settle }) }));
  const base = scenarios[1];
  const newLeases = Math.max(0, inputs.targetLeased - inputs.existingLeased);
  // Value of one month of free rent across the leases still to sign, at the mix the base case signs.
  const oneFreeMonthCost =
    freeMonths > 0 ? base.concessionCost / freeMonths : simulate({ ...inputs, freeMonths: 1 }, inputs.pace).concessionCost;
  return {
    ready: true,
    issues,
    inputs,
    totalUnits,
    existingLeased: inputs.existingLeased,
    targetLeased: inputs.targetLeased,
    newLeases,
    averageRent,
    effectiveRent: averageRent * (1 - freeMonths / leaseTerm),
    rentPerSqft: sqftTotal > 0 ? sqftRows.reduce((sum, r) => sum + r.count * r.rent, 0) / sqftTotal : null,
    grossMonthlyRent: gross,
    requiredPace: inputs.requiredPace,
    carryCoverage: inputs.monthlyCarry > 0 ? base.stabilizedMonthlyRent / inputs.monthlyCarry : null,
    oneFreeMonthCost,
    extraFreeMonth: newLeases > 0 ? extraFreeMonthBreakeven(inputs) : null,
    compareDate: isoDate(inputs.start + base.horizonDays * DAY_MS),
    scenarios,
    base,
  };
}
