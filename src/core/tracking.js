// Plan to actual. Weekly leasing logs measured against the frozen baseline.
// Pure functions: the baseline is re-simulated from its own frozen inputs, never from current edits.

import { simulate, planInputs, parseDate, isoDate, num, DAY_MS } from "./model.js";
import { dateLong } from "./format.js";

export const TRAILING_WEEKS = 4;
const WEEK_MS = 7 * DAY_MS;

const count = (v) => {
  const n = num(v);
  return n === null || n < 0 ? 0 : n;
};

/** Valid weekly log rows, oldest first, with net leases (signed less cancelled). */
export function normalizeActuals(actuals = []) {
  return actuals
    .map((r) => ({ ...r, ms: parseDate(r.weekEnding) }))
    .filter((r) => r.ms !== null)
    .map((r) => {
      const leases = count(r.leases);
      const cancellations = count(r.cancellations);
      return {
        id: r.id,
        weekEnding: r.weekEnding,
        ms: r.ms,
        leads: count(r.leads),
        tours: count(r.tours),
        applications: count(r.applications),
        leases,
        cancellations,
        net: leases - cancellations,
        note: r.note || "",
      };
    })
    .sort((a, b) => a.ms - b.ms);
}

/** The project as it stood when the baseline was saved. */
export function baselineProject(project, baseline) {
  return { ...project, unitMix: baseline.inputs.unitMix, plan: baseline.inputs.plan, totalUnits: baseline.inputs.totalUnits };
}

/** Leases the baseline expected to be signed by the end of a given day. */
export function plannedAt(inputs, run, ms) {
  if (ms < inputs.start) return inputs.existingLeased;
  const day = Math.floor((ms - inputs.start) / DAY_MS);
  const path = run.leasedPath;
  if (!path.length) return inputs.targetLeased;
  return day >= path.length ? path[path.length - 1] : path[day];
}

/** First day the baseline reaches a lease count, as an index from its start. */
function planDayFor(run, leased) {
  const i = run.leasedPath.findIndex((v) => v >= leased - 1e-9);
  return i === -1 ? null : i;
}

/**
 * Where leasing stands against the baseline.
 * Pace is the net leases of the last four weeks (fewer if leasing started more recently).
 * The re-forecast runs the remaining leases at that pace from the latest week, using the
 * baseline's unit mix and availability dates.
 */
export function trackLeasing(project, baseline) {
  const inputs = planInputs(baselineProject(project, baseline));
  const base = simulate(inputs, inputs.pace);
  const rows = normalizeActuals(project.actuals);
  let cum = inputs.existingLeased;
  const weeks = rows.map((r) => {
    cum += r.net;
    const planned = plannedAt(inputs, base, r.ms);
    return { ...r, actual: cum, planned, variance: cum - planned };
  });
  const latest = weeks[weeks.length - 1] || null;
  const target = inputs.targetLeased;
  const result = {
    inputs,
    base,
    weeks,
    target,
    totalUnits: inputs.totalUnits,
    planPace: inputs.pace,
    asOf: latest ? latest.weekEnding : null,
    actualLeased: latest ? latest.actual : inputs.existingLeased,
    planned: latest ? latest.planned : null,
    variance: latest ? latest.variance : null,
    daysAhead: null,
    trailingPace: null,
    weeksInWindow: 0,
    funnel: null,
    reforecast: null,
    paceToHold: null,
    stabilized: false,
  };
  if (!latest) return result;

  // Trailing pace over the last four weeks, or the weeks since leasing began if fewer.
  const sinceStart = Math.ceil((latest.ms - inputs.start) / WEEK_MS - 1e-9);
  const span = Math.max(1, Math.min(TRAILING_WEEKS, sinceStart));
  const window = weeks.filter((w) => w.ms > latest.ms - span * WEEK_MS);
  const sum = (k) => window.reduce((n, w) => n + w[k], 0);
  result.weeksInWindow = span;
  result.trailingPace = sum("net") / span;
  result.funnel = {
    leads: sum("leads"),
    tours: sum("tours"),
    applications: sum("applications"),
    leases: sum("leases"),
    tourRate: sum("leads") > 0 ? sum("tours") / sum("leads") : null,
    closeRate: sum("tours") > 0 ? sum("leases") / sum("tours") : null,
  };

  // Ahead or behind, in days: when the baseline expected today's lease count.
  const planDay = planDayFor(base, Math.min(result.actualLeased, target));
  const actualDay = Math.floor((latest.ms - inputs.start) / DAY_MS);
  if (planDay !== null) result.daysAhead = planDay - actualDay;

  if (result.actualLeased >= target - 1e-9) {
    result.stabilized = true;
    const hit = weeks.find((w) => w.actual >= target - 1e-9);
    result.reforecast = { reached: true, stabilizeDate: hit.weekEnding, pace: result.trailingPace };
    return result;
  }

  // Re-forecast: spread today's leases across unit types by count and run the rest at the trailing pace.
  const share = result.actualLeased / inputs.totalUnits;
  const rest = {
    ...inputs,
    start: latest.ms,
    rows: inputs.rows.map((r) => ({ ...r, leased: Math.min(r.count, r.count * share) })),
  };
  if (result.trailingPace > 0) {
    const run = simulate(rest, result.trailingPace);
    result.reforecast = { reached: run.reached, stabilizeDate: run.stabilizeDate, pace: result.trailingPace };
  } else {
    result.reforecast = { reached: false, stabilizeDate: null, pace: result.trailingPace };
  }

  // Pace needed from here to still stabilize on the baseline date.
  const due = base.reached ? parseDate(base.stabilizeDate) : null;
  if (due !== null && due > latest.ms) {
    result.paceToHold = (target - result.actualLeased) / ((due - latest.ms) / WEEK_MS);
  }
  return result;
}

function weeksPhrase(days) {
  const w = Math.round(Math.abs(days) / 7);
  if (w === 0) return "on schedule";
  return `${w} week${w === 1 ? "" : "s"} ${days > 0 ? "ahead of" : "behind"} plan`;
}

/** One paragraph for the owner or lender, written from the numbers. */
export function weeklySummary(t) {
  if (!t.weeks.length) return "";
  const last = t.weeks[t.weeks.length - 1];
  const parts = [];
  const signed = `${last.leases} lease${last.leases === 1 ? "" : "s"} signed`;
  const cancelled = last.cancellations ? `, ${last.cancellations} cancelled` : "";
  parts.push(`Week ending ${dateLong(last.weekEnding)}: ${signed}${cancelled}.`);
  const units = Math.round(t.actualLeased);
  const occ = Math.round((t.actualLeased / t.totalUnits) * 100);
  if (t.stabilized) {
    parts.push(`${units} of ${t.totalUnits} units are leased (${occ}%), which reaches the ${t.target}-unit target. The lease-up is stabilized.`);
    return parts.join(" ");
  }
  const vs = t.daysAhead === null ? "" : `, ${weeksPhrase(t.daysAhead)}`;
  parts.push(`${units} of ${t.totalUnits} units are leased (${occ}%) against ${Math.round(t.planned)} in the baseline${vs}.`);
  const pace = `${t.trailingPace.toFixed(1)} a week over the last ${t.weeksInWindow === 1 ? "week" : `${t.weeksInWindow} weeks`}`;
  if (t.reforecast?.reached) {
    const baseDate = t.base.stabilizeDate;
    const shift = baseDate ? Math.round((parseDate(t.reforecast.stabilizeDate) - parseDate(baseDate)) / DAY_MS) : null;
    const rel = shift === null ? "" : shift === 0 ? ", the same as the baseline" : `, ${weeksPhrase(-shift).replace("plan", "the baseline")}`;
    parts.push(`At ${pace}, stabilization lands ${dateLong(t.reforecast.stabilizeDate)}${rel}.`);
  } else {
    parts.push(`At ${pace}, the building does not reach its target.`);
  }
  if (t.paceToHold !== null && t.trailingPace < t.paceToHold) {
    parts.push(`Holding the baseline date of ${dateLong(t.base.stabilizeDate)} takes ${t.paceToHold.toFixed(1)} a week from here.`);
  }
  return parts.join(" ");
}

/** Sunday on or before a date, as YYYY-MM-DD: the default week ending for a new log row. */
export function weekEndingFor(ms) {
  const d = new Date(ms);
  const back = d.getUTCDay(); // 0 is Sunday
  return isoDate(ms - back * DAY_MS);
}
