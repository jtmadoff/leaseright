// The leasing workspace: units, prospects and the day's work. Pure functions over the project record.

import { normalizeMix, parseDate, isoDate, DAY_MS, num } from "./model.js";
import { trackLeasing } from "./tracking.js";
import { localToday } from "./format.js";

/** The project's today: the simulation clock when one is running, otherwise the calendar. */
export const projectToday = (project) => (project?.sim?.on && project.sim.now ? project.sim.now : localToday());

/** Prospect stages in the order a lease moves through them. `lost` can be reached from any. */
export const PSTAGES = [
  { key: "lead", label: "New lead", stamp: "createdAt" },
  { key: "tour", label: "Tour booked", stamp: null },
  { key: "toured", label: "Toured", stamp: "touredAt" },
  { key: "applied", label: "Applied", stamp: "appliedAt" },
  { key: "approved", label: "Approved", stamp: "approvedAt" },
  { key: "leased", label: "Leased", stamp: "leasedAt" },
  { key: "lost", label: "Lost", stamp: "lostAt" },
];
export const STAGE_LABEL = Object.fromEntries(PSTAGES.map((s) => [s.key, s.label]));
export const OPEN_STAGES = ["lead", "tour", "toured", "applied", "approved"];
export const SOURCES = ["Zillow", "Apartments.com", "Website", "Walk-in", "Referral", "Broker", "Social", "Other"];
export const LOST_REASONS = ["Price", "Unit or layout", "Timing", "Chose another building", "No response", "Did not qualify", "Other"];

const order = (key) => PSTAGES.findIndex((s) => s.key === key);

/**
 * Move a prospect to a stage on a date. Stamps the stage's date the first time it is reached,
 * clears the stamps of later stages when moving back, and records a cancelled lease.
 */
export function moveProspect(p, stage, at, extra = {}) {
  const next = { ...p, ...extra, stage };
  const s = PSTAGES.find((x) => x.key === stage);
  if (stage === "lost") {
    next.lostAt = at;
    if (p.stage === "leased") next.cancelledAt = at; // the lease stays counted; the cancellation nets it out
  } else {
    if (s.stamp && !next[s.stamp]) next[s.stamp] = at;
    for (const later of PSTAGES) if (later.key !== "lost" && order(later.key) > order(stage) && later.stamp) next[later.stamp] = "";
    next.lostAt = "";
    next.lostReason = "";
    if (stage === "leased" && p.cancelledAt) {
      // Re-leased after a cancellation: count one lease, on the new date.
      next.cancelledAt = "";
      next.leasedAt = at;
    }
  }
  next.history = [...(p.history || []), { at, text: `${STAGE_LABEL[p.stage] || "New"} to ${s.label}${extra.lostReason ? `: ${extra.lostReason}` : ""}` }];
  return next;
}

/** One unit per apartment in the mix, numbered by floor: 101, 102 ... 201. */
export function generateUnits(unitMix, { perFloor = 12 } = {}) {
  const rows = normalizeMix(unitMix);
  const per = Math.max(1, Math.round(perFloor));
  const out = [];
  let n = 0;
  for (const r of rows) {
    for (let k = 0; k < r.count; k++) {
      const floor = Math.floor(n / per) + 1;
      const pos = (n % per) + 1;
      out.push({
        id: `u${floor}${String(pos).padStart(2, "0")}`,
        number: `${floor}${String(pos).padStart(2, "0")}`,
        floor,
        typeId: r.id,
        label: r.label,
        beds: r.beds,
        sqft: r.sqft || null,
        rent: r.rent || null,
        availableDate: r.availableDate || "",
        hold: false,
        note: "",
      });
      n++;
    }
  }
  return out;
}

/** Status of each unit from the prospects attached to it. Leased wins, then an application, then a hold. */
export function unitStatuses(units, prospects, todayIso) {
  const today = parseDate(todayIso);
  const byUnit = new Map();
  for (const p of prospects) {
    if (!p.unitId) continue;
    const rank = p.stage === "leased" ? 3 : p.stage === "approved" || p.stage === "applied" ? 2 : 0;
    if (!rank) continue;
    const cur = byUnit.get(p.unitId);
    if (!cur || rank > cur.rank) byUnit.set(p.unitId, { rank, p });
  }
  return units.map((u) => {
    const hit = byUnit.get(u.id);
    const avail = parseDate(u.availableDate);
    let status = "available";
    if (hit?.rank === 3) status = "leased";
    else if (hit?.rank === 2) status = "applied";
    else if (u.hold) status = "hold";
    else if (avail !== null && today !== null && avail > today) status = "coming";
    return { ...u, status, prospect: hit?.p || null };
  });
}

export const UNIT_STATUS = {
  available: "Available",
  coming: "Not yet delivered",
  hold: "On hold",
  applied: "Application",
  leased: "Leased",
};

/**
 * Weekly activity built from the prospect pipeline, in the same shape as the hand-entered log.
 * Weeks run back from `todayIso`, so the latest week is the seven days ending today.
 */
export function derivedActuals(prospects, todayIso) {
  const end = parseDate(todayIso);
  const weeks = new Map();
  const bump = (iso, key) => {
    const ms = parseDate(String(iso || "").slice(0, 10));
    if (ms === null || end === null || ms > end) return;
    const we = isoDate(end - Math.floor((end - ms) / (7 * DAY_MS)) * 7 * DAY_MS);
    const row = weeks.get(we) || { id: `auto-${we}`, weekEnding: we, leads: 0, tours: 0, applications: 0, leases: 0, cancellations: 0, note: "" };
    row[key] += 1;
    weeks.set(we, row);
  };
  for (const p of prospects) {
    bump(p.createdAt, "leads");
    bump(p.touredAt, "tours");
    bump(p.appliedAt, "applications");
    bump(p.leasedAt, "leases");
    bump(p.cancelledAt, "cancellations");
  }
  return [...weeks.values()].sort((a, b) => a.weekEnding.localeCompare(b.weekEnding));
}

const day = (iso) => String(iso || "").slice(0, 10);
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / DAY_MS);

/** The day's work, most urgent first. */
export function todayTasks(project, todayIso) {
  const tasks = [];
  const prospects = project.prospects || [];
  for (const p of prospects) {
    if (!OPEN_STAGES.includes(p.stage)) continue;
    const tourDay = day(p.tourAt);
    if (p.stage === "tour" && tourDay === todayIso) tasks.push({ rank: 1, kind: "tour", p, title: `Tour ${p.tourAt.slice(11, 16) ? `at ${time12(p.tourAt)}` : "today"}`, detail: want(p) });
    else if (p.stage === "tour" && tourDay && tourDay < todayIso) tasks.push({ rank: 0, kind: "outcome", p, title: "Record how the tour went", detail: `Toured ${shortDay(tourDay)}?` });
    if (p.stage === "applied" && daysBetween(day(p.appliedAt), todayIso) >= 2) tasks.push({ rank: 2, kind: "decide", p, title: "Decide the application", detail: `Waiting ${daysBetween(day(p.appliedAt), todayIso)} days` });
    if (p.stage === "approved" && daysBetween(day(p.approvedAt), todayIso) >= 2) tasks.push({ rank: 2, kind: "sign", p, title: "Get the lease signed", detail: `Approved ${daysBetween(day(p.approvedAt), todayIso)} days ago` });
    const msgs = p.messages || [];
    const lastIn = msgs.filter((m) => m.dir === "in").map((m) => m.at).sort().pop();
    const lastOut = msgs.filter((m) => m.dir === "out").map((m) => m.at).sort().pop();
    if (lastIn && day(lastIn) === todayIso && (!lastOut || lastOut < lastIn)) {
      tasks.push({ rank: 2, kind: "reply", p, title: "Reply", detail: `"${msgs.filter((m) => m.dir === "in").pop().text.slice(0, 60)}"` });
      continue;
    }
    if (p.nextAt && day(p.nextAt) <= todayIso && p.stage !== "tour") tasks.push({ rank: 3, kind: "follow", p, title: day(p.nextAt) < todayIso ? "Follow-up overdue" : "Follow up today", detail: p.nextNote || want(p) });
    else if (p.stage === "lead" && !p.nextAt && !p.tourAt) {
      const age = daysBetween(day(p.createdAt), todayIso);
      tasks.push({ rank: 4, kind: "contact", p, title: "First contact", detail: `New ${age <= 0 ? "today" : age === 1 ? "yesterday" : `${age} days ago`} from ${p.source || "an unknown source"}` });
    }
  }
  tasks.sort((a, b) => a.rank - b.rank || String(a.p.tourAt || a.p.nextAt || "").localeCompare(String(b.p.tourAt || b.p.nextAt || "")));
  return tasks;
}

function time12(dt) {
  const [h, m] = dt.slice(11, 16).split(":").map(Number);
  if (!Number.isFinite(h)) return "";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDay(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${MON[m - 1]} ${d}`;
}
export { time12, shortDay };

/** What the prospect is looking for, in a few words. */
export function want(p) {
  const bits = [];
  if (p.beds !== "" && p.beds !== null && p.beds !== undefined) bits.push(Number(p.beds) === 0 ? "Studio" : `${p.beds} BR`);
  if (num(p.budget)) bits.push(`up to $${Number(p.budget).toLocaleString("en-US")}`);
  if (p.moveIn) bits.push(`move in ${shortDay(p.moveIn)}`);
  return bits.join(" · ") || "No preferences noted";
}

/** Counts by stage, for filters and the funnel. */
export function stageCounts(prospects) {
  const c = Object.fromEntries(PSTAGES.map((s) => [s.key, 0]));
  for (const p of prospects) c[p.stage] = (c[p.stage] || 0) + 1;
  return c;
}

/** Where the week's numbers come from: the prospect pipeline when there is one, unless the user chose the hand log. */
export function leasingSource(project) {
  if (project.leasingSource === "manual" || project.leasingSource === "pipeline") return project.leasingSource;
  return (project.prospects || []).length ? "pipeline" : "manual";
}

/** Plan against actual for a project, from whichever source it uses. */
export function trackProject(project, baseline, todayIso) {
  const source = leasingSource(project);
  const effective = source === "pipeline" ? { ...project, actuals: derivedActuals(project.prospects || [], todayIso) } : project;
  return { ...trackLeasing(effective, baseline), source };
}
