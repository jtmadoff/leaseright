// Operating views over a project in lease-up: rents by unit type, concessions, listing platforms,
// applications and the decision list. Pure functions; every number traces to the project record
// or the published market data.

import { normalizeMix, parseDate, isoDate, DAY_MS, num } from "./model.js";
import { bedMarket } from "./market.js";
import { unitStatuses, OPEN_STAGES } from "./leasing.js";
import { dateLong, money } from "./format.js";

const WEEK = 7 * DAY_MS;
const round25 = (v) => Math.round(v / 25) * 25;
const dayOf = (iso) => parseDate(String(iso || "").slice(0, 10));
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const DEFAULT_POLICY = { minCredit: 620, incomeMultiple: 3 };
export const DEFAULT_PLATFORMS = ["Zillow", "Apartments.com", "Zumper", "Realtor.com", "Facebook Marketplace", "Website"];

/** Unit type for a prospect: their unit's type, else the first type with their bedroom count. */
function typeOf(p, units, rows) {
  const u = p.unitId ? units.find((x) => x.id === p.unitId) : null;
  if (u) return u.typeId;
  const r = rows.find((x) => String(x.beds) === String(p.beds));
  return r ? r.id : null;
}

/** The concession program in force for a bedroom count on a date, if any. */
export function activeConcession(project, beds, todayIso) {
  const t = parseDate(todayIso);
  return (project.concessions || []).find((c) => {
    const s = parseDate(c.startsAt);
    const e = parseDate(c.endsAt);
    const appliesTo = !c.beds?.length || c.beds.map(String).includes(String(beds));
    return appliesTo && (s === null || s <= t) && (e === null || t <= e) && num(c.months) > 0;
  }) || null;
}

/**
 * Per unit type: leased, in application, available, asking against the listing median,
 * days on market, recent pace, and a price suggestion when a type is stalling above market.
 */
export function typeMetrics(project, data, todayIso, { planPace = null } = {}) {
  const rows = normalizeMix(project.unitMix);
  const units = unitStatuses(project.units || [], project.prospects || [], todayIso);
  const today = parseDate(todayIso);
  const start = parseDate(project.plan?.startDate) ?? today;
  const total = rows.reduce((n, r) => n + r.count, 0) || 1;
  const term = num(project.plan?.leaseTerm) || 12;
  const sinceStartWeeks = Math.max(0, (today - start) / WEEK);
  const prospects = project.prospects || [];
  return rows.map((r) => {
    const us = units.filter((u) => u.typeId === r.id);
    const has = us.length > 0;
    const leasedProspects = prospects.filter((p) => p.stage === "leased" && typeOf(p, units, rows) === r.id);
    const leased = has ? us.filter((u) => u.status === "leased").length + Math.min(r.leased, r.count) : leasedProspects.length + Math.min(r.leased, r.count);
    const applied = has ? us.filter((u) => u.status === "applied").length : prospects.filter((p) => (p.stage === "applied" || p.stage === "approved") && typeOf(p, units, rows) === r.id).length;
    const count = has ? us.length : r.count;
    const available = Math.max(0, count - leased - applied - (has ? us.filter((u) => u.status === "hold" || u.status === "coming").length : 0));
    const openUnits = us.filter((u) => u.status === "available");
    const asking = openUnits.length ? openUnits.reduce((s, u) => s + (u.rent || r.rent), 0) / openUnits.length : has ? us.reduce((s, u) => s + (u.rent || r.rent), 0) / us.length : r.rent;
    const conc = activeConcession(project, r.beds, todayIso);
    const effective = asking * (1 - (conc ? num(conc.months) : 0) / term);
    const mk = r.beds === null || Number.isNaN(r.beds) ? null : bedMarket(data, project.town, r.beds).listings;
    const dom = openUnits.length
      ? openUnits.reduce((s, u) => s + Math.max(0, (today - Math.max(start, parseDate(u.availableDate) ?? start)) / DAY_MS), 0) / openUnits.length
      : null;
    const recent = prospects.filter((p) => typeOf(p, units, rows) === r.id && p.leasedAt && today - dayOf(p.leasedAt) < 4 * WEEK && dayOf(p.leasedAt) <= today).length;
    const windowWeeks = Math.max(1, Math.min(4, sinceStartWeeks));
    const velocity = recent / windowWeeks;
    const share = r.count / total;
    const typePlanPace = planPace ? planPace * share : null;
    // Stalling: at least three weeks in, leasing under 60% of this type's share of the plan pace,
    // units still open, and asking above the town's listing median for the bedroom count.
    // A type repriced in the last two weeks gets time for tours to respond before another cut.
    const lastChange = (project.priceLog || []).filter((l) => l.typeId === r.id).map((l) => l.at).sort().pop();
    const cooling = lastChange && parseDate(lastChange) !== null && (today - parseDate(lastChange)) / DAY_MS < 14;
    let suggestion = null;
    // The floor is what the market pays for a building like this: the median plus the project's premium.
    const fair = mk ? mk.median * (1 + (num(project.premium) || 0) / 100) : null;
    if (!cooling && typePlanPace && sinceStartWeeks >= 3 && available > 0 && velocity < typePlanPace * 0.6 && fair && asking > fair * 1.02) {
      const price = Math.max(round25(fair * 1.02), round25(asking * 0.95));
      if (price < asking) suggestion = { rent: price, aboveMarket: price - mk.median, cut: asking - price };
    }
    return {
      id: r.id,
      label: r.label,
      beds: r.beds,
      count,
      leased,
      applied,
      available,
      planRent: r.rent,
      asking,
      effective,
      concession: conc,
      market: mk,
      gap: mk ? asking - mk.median : null,
      fair,
      dom,
      velocity,
      typePlanPace,
      suggestion,
      vacancyCost: available * asking,
    };
  });
}

/** Every unit of a type that is still open, repriced. Leased and applied units keep their rent. */
export function repriceType(units, typeId, rent, statuses) {
  const open = new Set(statuses.filter((u) => u.typeId === typeId && (u.status === "available" || u.status === "coming" || u.status === "hold")).map((u) => u.id));
  return units.map((u) => (open.has(u.id) ? { ...u, rent } : u));
}

/** Leases signed under each concession program and what they gave away. */
export function concessionStats(project, todayIso) {
  const today = parseDate(todayIso);
  return (project.concessions || []).map((c) => {
    const s = parseDate(c.startsAt);
    const e = parseDate(c.endsAt);
    const leases = (project.prospects || []).filter((p) => {
      const at = dayOf(p.leasedAt);
      if (at === null || p.stage !== "leased" || !(num(p.freeMonths) > 0)) return false;
      const inWindow = (s === null || at >= s) && (e === null || at <= e);
      const appliesTo = !c.beds?.length || c.beds.map(String).includes(String(p.beds));
      return inWindow && appliesTo;
    });
    const cost = leases.reduce((sum, p) => sum + (num(p.leaseRent) || 0) * (num(p.freeMonths) || 0), 0);
    const status = s !== null && s > today ? "scheduled" : e !== null && e < today ? "ended" : "active";
    return { ...c, leases: leases.length, cost, status, daysLeft: e === null ? null : Math.round((e - today) / DAY_MS) };
  });
}

/** Lead source performance per listing platform, from the prospects that name it as their source. */
export function platformMetrics(project, todayIso) {
  const today = parseDate(todayIso);
  const units = unitStatuses(project.units || [], project.prospects || [], todayIso);
  const open = units.filter((u) => u.status === "available").length;
  const prospects = project.prospects || [];
  const within = (iso, days) => {
    const t = dayOf(iso);
    return t !== null && t <= today && today - t < days * DAY_MS;
  };
  const priceChanged = parseDate(project.priceChangedAt);
  const row = (name, pf) => {
    const mine = prospects.filter((p) => p.source === name);
    const leads7 = mine.filter((p) => within(p.createdAt, 7)).length;
    const leads30 = mine.filter((p) => within(p.createdAt, 30)).length;
    const leads14 = mine.filter((p) => within(p.createdAt, 14)).length;
    const tours30 = mine.filter((p) => within(p.touredAt, 30)).length;
    const leases30 = mine.filter((p) => within(p.leasedAt, 30)).length;
    const leasesAll = mine.filter((p) => p.leasedAt && p.stage === "leased").length;
    const cost = pf ? num(pf.cost) || 0 : 0;
    const issues = [];
    if (pf?.active) {
      if (leads14 === 0) issues.push("No leads in the last 14 days");
      if (!pf.url) issues.push("No link to the live listing");
      const synced = parseDate(pf.syncedAt);
      if (priceChanged !== null && (synced === null || synced < priceChanged)) issues.push(`Prices changed ${dateLong(isoDate(priceChanged))}; listing not updated since`);
    }
    return {
      id: pf?.id || name,
      name,
      platform: pf || null,
      active: pf ? !!pf.active : null,
      unitsLive: pf?.active ? open : 0,
      leads7,
      leads30,
      tours30,
      leases30,
      leasesAll,
      total: mine.length,
      cost,
      cpl: cost && leads30 ? cost / leads30 : null,
      cpLease: cost && leases30 ? cost / leases30 : null,
      issues,
      health: !pf ? "other" : !pf.active ? "paused" : issues.length === 0 ? "ok" : issues.length === 1 ? "warn" : "bad",
    };
  };
  const platforms = (project.platforms || []).map((pf) => row(pf.name, pf));
  const named = new Set(platforms.map((p) => p.name));
  const others = [...new Set(prospects.map((p) => p.source).filter((s) => s && !named.has(s)))].map((s) => row(s, null));
  return { platforms, others, open };
}

/** Screening against the project's policy. Missing items keep an application pending, never failed. */
export function applicationCheck(p, policy, rent) {
  const pol = { ...DEFAULT_POLICY, ...(policy || {}) };
  const a = p.app || {};
  const credit = num(a.credit);
  const income = num(a.income);
  const ratio = income && rent ? income / rent : null;
  const checks = {
    credit: credit === null ? "pending" : credit >= pol.minCredit ? "ok" : "below",
    background: !a.background ? "pending" : a.background === "clear" ? "ok" : a.background === "minor" ? "review" : "below",
    income: income === null ? "pending" : !a.incomeVerified ? "unverified" : ratio !== null && ratio >= pol.incomeMultiple ? "ok" : "below",
    deposit: a.deposit === "paid" ? "ok" : "pending",
  };
  const values = Object.values(checks);
  const status = p.stage === "approved" ? "approved" : values.includes("below") ? "review" : values.some((v) => v === "pending" || v === "unverified" || v === "review") ? "pending" : "ready";
  return { credit, income, ratio, checks, status, policy: pol };
}

const held = (project, key, todayIso) => (project.dismissed || []).some((d) => d.key === key && d.until >= todayIso);

/**
 * What needs a decision today, most costly first. Each item names the evidence and offers actions;
 * the screen carries them out. Held items stay off the list until their date.
 */
export function decisions(project, data, todayIso, track) {
  const out = [];
  const today = parseDate(todayIso);
  const types = typeMetrics(project, data, todayIso, { planPace: track?.planPace });
  for (const t of types) {
    if (!t.suggestion) continue;
    const key = `price:${t.id}:${t.suggestion.rent}`;
    if (held(project, key, todayIso)) continue;
    out.push({
      key,
      kind: "pricing",
      tone: "bad",
      title: `${t.label.replace(/^\w/, (c) => c.toUpperCase())}s have stalled.`,
      sub: `${t.leased} of ${t.count} leased. ${t.dom !== null ? `${Math.round(t.dom)} days on market. ` : ""}${t.velocity.toFixed(1)} a week against ${t.typePlanPace.toFixed(1)} planned.`,
      impact: `${money(t.vacancyCost)}/mo vacant · ${plural(t.available, "unit")} open`,
      body: num(project.premium)
        ? `Drop asking to ${money(t.suggestion.rent)}, a ${Math.round((t.suggestion.cut / (t.suggestion.rent + t.suggestion.cut)) * 100)}% step. A building like this earns about ${money(t.fair)} in ${project.town}: the listing median of ${money(t.market.median)} (${t.market.n} listings) plus your ${num(project.premium)}% premium. Give tours two weeks to respond before cutting again.`
        : t.suggestion.aboveMarket > t.market.median * 0.1
          ? `Drop asking to ${money(t.suggestion.rent)}, a 5% step. It is still ${money(t.suggestion.aboveMarket)} above the ${project.town} listing median of ${money(t.market.median)} (${t.market.n} listings), so watch two weeks of tours before cutting again.`
          : `Drop asking to ${money(t.suggestion.rent)}, still ${money(t.suggestion.aboveMarket)} above the ${project.town} listing median of ${money(t.market.median)} (${t.market.n} listings).`,
      actions: [
        { label: `Accept · ${money(t.suggestion.rent)}`, act: { type: "price", typeId: t.id, rent: t.suggestion.rent }, primary: true },
        { label: "Add a concession instead", act: { type: "go", to: "concessions" } },
        { label: "Hold a week", act: { type: "hold", key, days: 7 } },
      ],
      weight: 3 + t.vacancyCost / 10000,
      typeId: t.id,
    });
  }
  if (track && !track.stabilized && track.daysAhead !== null && track.daysAhead <= -14 && track.paceToHold) {
    const key = `pace:${track.asOf}`;
    if (!held(project, key, todayIso))
      out.push({
        key,
        kind: "pace",
        tone: "warn",
        title: `Leasing is ${plural(Math.round(-track.daysAhead / 7), "week")} behind the baseline.`,
        sub: `${Math.round(track.actualLeased)} of ${track.target} leased. ${track.trailingPace.toFixed(1)} a week over the last ${plural(track.weeksInWindow, "week")}.`,
        impact: track.reforecast?.reached ? `stabilizes ${dateLong(track.reforecast.stabilizeDate)}` : "not at this pace",
        body: `Holding the baseline date of ${dateLong(track.base.stabilizeDate)} takes ${track.paceToHold.toFixed(1)} leases a week from here.`,
        actions: [
          { label: "Open rents", act: { type: "go", to: "rents" }, primary: true },
          { label: "Open the report", act: { type: "go", to: "reports" } },
          { label: "Hold a week", act: { type: "hold", key, days: 7 } },
        ],
        weight: 2.5,
      });
  }
  for (const p of project.prospects || []) {
    if (!OPEN_STAGES.includes(p.stage)) continue;
    const msgs = p.messages || [];
    const lastIn = msgs.filter((m) => m.dir === "in").map((m) => m.at).sort().pop();
    const lastOut = msgs.filter((m) => m.dir === "out").map((m) => m.at).sort().pop();
    const created = dayOf(p.createdAt);
    if (p.needsYou) {
      // Handed over by the leasing agent: one item, with the reason it could not act alone.
      const key = `handoff:${p.id}:${p.needsYou.at}`;
      if (held(project, key, todayIso)) continue;
      const app = p.stage === "applied";
      const lastText = msgs.filter((m) => m.dir === "in").pop()?.text || "";
      const waitedH = Math.max(0, Math.round((today - (dayOf(p.needsYou.at) ?? today)) / 3600000));
      out.push({
        key,
        kind: "handoff",
        tone: app && p.needsYou.reason.includes("below") ? "bad" : "warn",
        title: `${p.name}: ${p.needsYou.reason.toLowerCase()}.`,
        sub: app ? `Screening is back on unit ${p.unitId?.replace(/^u/, "") || ""}.` : lastText ? `"${lastText.slice(0, 90)}"` : "",
        impact: waitedH >= 24 ? `waiting ${plural(Math.round(waitedH / 24), "day")}` : "new",
        body: app ? "Approve and the agent sends the lease for signature. Decline and it tells the applicant." : "The agent answers routine questions on its own. This one needs your judgment; your reply goes out from the Inbox.",
        actions: app
          ? [{ label: "Open application", act: { type: "application", prospectId: p.id }, primary: true }]
          : [
              { label: "Reply in Inbox", act: { type: "inbox", prospectId: p.id }, primary: true },
              { label: "Open prospect", act: { type: "open", prospectId: p.id } },
            ],
        weight: 2.2 + waitedH / 240,
      });
      continue;
    }
    if (p.stage === "lead" && !lastOut && !p.tourAt && created !== null && today - created >= DAY_MS) {
      const key = `contact:${p.id}`;
      if (!held(project, key, todayIso))
        out.push({
          key,
          kind: "lead",
          tone: "bad",
          title: `${p.name} has not been contacted.`,
          sub: `Inquired ${dateLong(p.createdAt)} from ${p.source || "an unknown source"}.`,
          impact: `${plural(Math.round((today - created) / DAY_MS), "day")} without a reply`,
          body: "Leads answered the same day tour far more often. Reply, then book a tour.",
          actions: [
            { label: "Reply in Inbox", act: { type: "inbox", prospectId: p.id }, primary: true },
            { label: "Open prospect", act: { type: "open", prospectId: p.id } },
          ],
          weight: 2 + (today - created) / DAY_MS / 10,
        });
    } else if (lastIn && (!lastOut || lastOut < lastIn) && lastIn.slice(0, 10) < todayIso) {
      const key = `reply:${p.id}:${lastIn}`;
      if (!held(project, key, todayIso))
        out.push({
          key,
          kind: "lead",
          tone: "warn",
          title: `${p.name} is waiting on a reply.`,
          sub: `Last message ${dateLong(lastIn.slice(0, 10))}${lastIn.length > 10 ? ` at ${lastIn.slice(11, 16)}` : ""}: "${msgs.filter((m) => m.dir === "in").pop().text.slice(0, 70)}"`,
          impact: STAGE_HINT[p.stage] || "",
          body: "Answer from the Inbox so the conversation stays with the prospect's record.",
          actions: [{ label: "Reply in Inbox", act: { type: "inbox", prospectId: p.id }, primary: true }],
          weight: 1.8,
        });
    }
    if (p.stage === "applied" && dayOf(p.appliedAt) !== null && today - dayOf(p.appliedAt) >= 2 * DAY_MS) {
      out.push({
        key: `app:${p.id}`,
        kind: "application",
        tone: "warn",
        title: `${p.name}'s application has waited ${Math.round((today - dayOf(p.appliedAt)) / DAY_MS)} days.`,
        sub: "A decision inside two days keeps approved applicants from signing elsewhere.",
        impact: "",
        body: "",
        actions: [{ label: "Open application", act: { type: "application", prospectId: p.id }, primary: true }],
        weight: 1.6,
      });
    }
    if (p.stage === "approved" && dayOf(p.approvedAt) !== null && today - dayOf(p.approvedAt) >= 2 * DAY_MS) {
      out.push({
        key: `sign:${p.id}`,
        kind: "lease",
        tone: "warn",
        title: `${p.name} is approved but has not signed.`,
        sub: `Approved ${dateLong(p.approvedAt)}.`,
        impact: "",
        body: "",
        actions: [{ label: "Open prospect", act: { type: "open", prospectId: p.id }, primary: true }],
        weight: 1.5,
      });
    }
  }
  for (const c of concessionStats(project, todayIso)) {
    if (c.status !== "active" || c.daysLeft === null || c.daysLeft > 14) continue;
    const key = `conc:${c.id}:${c.endsAt}`;
    if (held(project, key, todayIso)) continue;
    out.push({
      key,
      kind: "concession",
      tone: "warn",
      title: `"${c.name}" ends ${dateLong(c.endsAt)}.`,
      sub: `${plural(c.leases, "lease")} signed under it · ${money(c.cost)} of free rent given.`,
      impact: c.daysLeft <= 0 ? "ends today" : `${plural(c.daysLeft, "day")} left`,
      body: "Extend it, or let it end and watch the next two weeks of pace.",
      actions: [
        { label: "Extend 30 days", act: { type: "extend", concessionId: c.id, days: 30 }, primary: true },
        { label: "Let it end", act: { type: "hold", key, days: 30 } },
      ],
      weight: 1.2,
    });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

const STAGE_HINT = { lead: "new lead", tour: "tour booked", toured: "toured", applied: "applicant", approved: "approved" };
