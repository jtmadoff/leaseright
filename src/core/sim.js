// The simulated backend. Every service the real product needs (lead intake from the listing sites,
// the leasing agent that answers and books tours, screening, e-signature, listing sync) has a
// stand-in here that reads and writes the project record exactly as the real service will.
// A clock drives it one day at a time, so a lease-up can be lived in minutes.
//
// Demand responds to price: leads per open unit fall as effective rent rises above what the market
// pays for a building like this (the town's listing median plus the project's premium), and fewer
// toured prospects apply. Everything is seeded, so the same choices replay the same way.
//
// Pure functions. See docs/BACKEND.md for how each stand-in is built for real.

import { normalizeMix, parseDate, isoDate, DAY_MS, num } from "./model.js";
import { bedMarket } from "./market.js";
import { unitStatuses, moveProspect, generateUnits } from "./leasing.js";
import { activeConcession, applicationCheck } from "./ops.js";

// ---------- seeded randomness ----------

function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A random stream for one decision. Same seed and key, same numbers. */
const stream = (seed, key) => mulberry(hash(`${seed}|${key}`));
function poisson(lambda, r) {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= r();
  } while (p > L && k < 200);
  return k - 1;
}
const pick = (list, r) => list[Math.floor(r() * list.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const normal = (r) => {
  const u = Math.max(1e-9, r());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};

// ---------- assumptions (shown in the app and in docs/BACKEND.md) ----------

export const SIM = {
  leadsPerOpenUnitWeek: 1.1, // inquiries per open unit per week at a fair price, every platform live, mid-season
  priceElasticity: 8, // lead volume multiplier is exp(-8 x (effective / fair - 1))
  applyElasticity: 4,
  tourIfAnsweredFast: 0.45, // answered inside an hour
  tourIfAnsweredSameDay: 0.33,
  tourIfAnsweredLater: 0.18,
  showRate: 0.84,
  showRateReminded: 0.9,
  applyAfterTour: 0.5,
  signPerDay: 0.5,
  season: [0.7, 0.75, 0.9, 1, 1.1, 1.2, 1.2, 1.15, 1, 0.9, 0.8, 0.65],
};

/** Each platform's share of inquiries for a typical Rhode Island mid-size building. Walk-ins and referrals always run. */
export const REACH = {
  Zillow: 0.32,
  "Apartments.com": 0.26,
  Zumper: 0.07,
  "Realtor.com": 0.06,
  "Facebook Marketplace": 0.1,
  Website: 0.1,
};
const ORGANIC = [["Walk-in", 0.04], ["Referral", 0.05]];

export const DEFAULT_AGENT = { reply: true, book: true, approve: false, sync: true };
export const DEFAULT_HOURS = { weekday: ["16:00", "17:00", "18:00"], saturday: ["10:00", "11:00", "12:00", "13:00"], sunday: [] };

const FIRST = ["Maya", "Jordan", "Priya", "Marcus", "Elena", "Sam", "Olivia", "Diego", "Hannah", "Kwame", "Grace", "Leo", "Nina", "Owen", "Sofia", "Andre", "Claire", "Mateo", "Ivy", "Theo", "Rosa", "Ben", "Lena", "Felix", "Amara", "Jonah", "Tess", "Ravi", "Zoe", "Caleb", "Nadia", "Luis", "Erin", "Malik", "June", "Omar", "Keira", "Hugo", "Sara", "Devin"];
const LAST = "ABCDFGHJKLMNPRSTVWY".split("");

// What people write first, and whether the agent can answer it alone.
const INTENTS = [
  { key: "available", w: 30, text: ["Is this still available?", "Hi, is the {type} still open?", "Interested in the {type}. Still available?"] },
  { key: "tour", w: 22, text: ["Can I see it this weekend?", "I'd like to schedule a tour.", "When can I come see the {type}?"] },
  { key: "pets", w: 10, text: ["Do you allow pets? I have a small dog.", "Are cats allowed?"] },
  { key: "parking", w: 8, text: ["Is parking included?", "Is there off-street parking?"] },
  { key: "utilities", w: 8, text: ["What utilities are included?", "Is heat included in the rent?"] },
  { key: "laundry", w: 6, text: ["Is there in-unit laundry?"] },
  { key: "negotiate", w: 9, escalate: true, text: ["Is the rent negotiable? Other places nearby are cheaper.", "Would you take less on a 15-month lease?", "Any flexibility on price for the {type}?"] },
  { key: "special", w: 7, escalate: true, text: ["I'm relocating for work and can't visit. Can I lease sight unseen?", "My credit took a hit last year. Would a cosigner work?", "Could I move in mid-month and prorate?"] },
];
const ESCALATE_REASON = { negotiate: "Asked to negotiate rent", special: "Special request" };

// ---------- helpers over the project ----------

const day = (iso) => String(iso || "").slice(0, 10);
const addDays = (iso, n) => isoDate(parseDate(iso) + n * DAY_MS);
const stamp = (iso, minutes) => `${iso}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(Math.floor(minutes % 60)).padStart(2, "0")}`;
const minutesOf = (at) => {
  const m = /T(\d\d):(\d\d)/.exec(at || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : 9 * 60;
};
const hoursBetween = (a, b) => (parseDate(day(b)) - parseDate(day(a))) / 3600000 + (minutesOf(b) - minutesOf(a)) / 60;
const firstName = (p) => (p.name || "").split(" ")[0] || "there";
const bedWord = (beds) => (Number(beds) === 0 ? "studio" : `${beds}-bedroom`);

/** What a building like this rents for: the town's listing median for the bedroom count plus the project's premium. */
export function fairRent(project, data, beds, planRent) {
  const mk = data ? bedMarket(data, project.town, beds).listings : null;
  const premium = (num(project.premium) || 0) / 100;
  if (mk?.median) return mk.median * (1 + premium);
  return planRent || null;
}

/** Live platforms and their share of reach, with stale prices (listing not updated after a change) costing a third of a platform's leads. */
export function reach(project) {
  const changed = parseDate(project.priceChangedAt);
  const rows = [];
  for (const pf of project.platforms || []) {
    if (!pf.active) continue;
    const base = REACH[pf.name] ?? 0.04;
    const synced = parseDate(pf.syncedAt);
    const stale = changed !== null && (synced === null || synced < changed);
    rows.push([pf.name, base * (stale ? 0.67 : 1)]);
  }
  return [...rows, ...ORGANIC];
}

/** Expected inquiries per day for each unit type, with the factors that produce them. */
export function demand(project, data, todayIso) {
  const rows = normalizeMix(project.unitMix);
  const statuses = unitStatuses(project.units || [], project.prospects || [], todayIso);
  const term = num(project.plan?.leaseTerm) || 12;
  const month = new Date(parseDate(todayIso)).getUTCMonth();
  const season = SIM.season[month];
  const reachTotal = reach(project).reduce((s, [, w]) => s + w, 0);
  return rows.map((r) => {
    const open = statuses.filter((u) => u.typeId === r.id && u.status === "available");
    const asking = open.length ? open.reduce((s, u) => s + (u.rent || r.rent), 0) / open.length : r.rent;
    const conc = activeConcession(project, r.beds, todayIso);
    const effective = asking * (1 - (conc ? num(conc.months) : 0) / term);
    const fair = fairRent(project, data, r.beds, r.rent);
    const ratio = fair ? effective / fair : 1;
    const price = clamp(Math.exp(-SIM.priceElasticity * (ratio - 1)), 0.12, 3);
    const perDay = (SIM.leadsPerOpenUnitWeek / 7) * open.length * price * season * reachTotal;
    return { id: r.id, label: r.label, beds: r.beds, open: open.length, asking, effective, fair, ratio, price, season, reach: reachTotal, perDay };
  });
}

function weighted(pairs, r) {
  const total = pairs.reduce((n, [, w]) => n + w, 0);
  let x = r() * total;
  for (const [v, w] of pairs) if ((x -= w) <= 0) return v;
  return pairs[pairs.length - 1][0];
}

function slotsFor(iso, hours) {
  const dow = new Date(parseDate(iso)).getUTCDay();
  const h = hours || DEFAULT_HOURS;
  return dow === 0 ? h.sunday || [] : dow === 6 ? h.saturday || [] : h.weekday || [];
}
/** The first open tour slot at least `minDays` out, skipping slots already booked. */
function nextSlot(project, fromIso, minDays, r) {
  const booked = new Set((project.prospects || []).filter((p) => p.stage === "tour" && p.tourAt).map((p) => p.tourAt));
  for (let k = minDays; k < minDays + 14; k++) {
    const d = addDays(fromIso, k);
    const slots = slotsFor(d, project.tourHours).map((t) => `${d}T${t}`).filter((t) => !booked.has(t));
    // Prospects take the first or second day that suits them, at any open time.
    if (slots.length && (k > minDays || r() < 0.6)) return slots[Math.floor(r() * slots.length)];
  }
  return `${addDays(fromIso, minDays)}T17:00`;
}
const slotWords = (at) => {
  const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(parseDate(day(at)));
  const [h, m] = at.slice(11, 16).split(":").map(Number);
  return `${DOW[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${d.getUTCDate()} at ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

// ---------- the agent's words (the real product drafts these with a language model) ----------

function agentAnswer(p, project, intent, unit, slot) {
  const n = firstName(p);
  const bld = (project.name || "the building").replace(/\s*\((sample|practice)\)$/, "");
  const rent = unit?.rent ? `$${Math.round(unit.rent).toLocaleString("en-US")}` : "";
  const facts = project.facts || {};
  const lead = {
    available: `Hi ${n}, yes, the ${bedWord(p.beds)} at ${bld} is available${rent ? ` at ${rent} a month` : ""}.`,
    tour: `Hi ${n}, happy to show you the ${bedWord(p.beds)}.`,
    pets: `Hi ${n}, ${facts.pets || "cats and dogs under 50 lbs are welcome with a $300 pet deposit"}.`,
    parking: `Hi ${n}, ${facts.parking || "there is off-street parking at $75 a month, first come"}.`,
    utilities: `Hi ${n}, ${facts.utilities || "heat and hot water are included; electric is separate"}.`,
    laundry: `Hi ${n}, ${facts.laundry || "every unit has a washer and dryer"}.`,
  }[intent] || `Hi ${n}, thanks for reaching out about ${bld}.`;
  return slot ? `${lead} I can show it to you ${slotWords(slot)}. Does that work?` : lead;
}

// ---------- one day ----------

const msg = (id, at, dir, text, extra = {}) => ({ id, at, dir, channel: extra.channel || "sms", text, ...(extra.by ? { by: extra.by } : {}) });
const lastMsg = (p, dir) => (p.messages || []).filter((m) => !dir || m.dir === dir).sort((a, b) => a.at.localeCompare(b.at)).pop() || null;

/**
 * Run one day. `project.sim.now` is the morning of that day; the result is the next morning,
 * with every lead, reply, tour, application and signature the day produced, plus a digest.
 */
export function advanceDay(project, data) {
  const sim = project.sim || {};
  const D = sim.now;
  if (!D) return { project, digest: null };
  const seed = sim.seed || 1;
  const agent = { ...DEFAULT_AGENT, ...(project.agent || {}) };
  const policy = project.policy;
  let units = project.units?.length ? project.units : generateUnits(project.unitMix, { perFloor: 12 });
  const rows = normalizeMix(project.unitMix);
  const dg = { day: D, leads: 0, auto: 0, responseMins: [], escalated: 0, toursBooked: 0, toursHeld: 0, noShows: 0, applications: 0, approved: 0, autoApproved: 0, leases: 0, lost: 0, synced: 0, bySource: {} };
  const work = { ...project, units };
  let prospects = [...(project.prospects || [])];
  let n = 0;
  const nid = () => `s${D.replace(/-/g, "")}${String(n++).padStart(3, "0")}`;

  // 0. Listing sync: the feed pushes price changes to every live platform overnight.
  let platforms = project.platforms || [];
  if (agent.sync) {
    const changed = parseDate(project.priceChangedAt);
    platforms = platforms.map((pf) => {
      const synced = parseDate(pf.syncedAt);
      if (pf.active && changed !== null && (synced === null || synced < changed)) {
        dg.synced++;
        return { ...pf, syncedAt: D };
      }
      return pf;
    });
    work.platforms = platforms;
  }

  // 1. New inquiries.
  const dem = demand(work, data, D);
  const reachRows = reach(work);
  for (const t of dem) {
    const r = stream(seed, `leads:${D}:${t.id}`);
    const count = poisson(t.perDay, r);
    for (let k = 0; k < count; k++) {
      const id = nid();
      const rr = stream(seed, `lead:${id}`);
      const source = weighted(reachRows, rr);
      const intentDef = weighted(INTENTS.map((i) => [i, i.w]), rr);
      const at = stamp(D, 7 * 60 + Math.floor(rr() * 15 * 60));
      const budget = Math.round(((t.fair || t.asking) * (1 + 0.12 * normal(rr))) / 25) * 25;
      const text = pick(intentDef.text, rr).replace("{type}", bedWord(t.beds));
      prospects.unshift({
        id,
        name: `${pick(FIRST, rr)} ${pick(LAST, rr)}.`,
        phone: `(401) 555-${String(1000 + Math.floor(rr() * 9000))}`,
        email: "",
        source,
        beds: String(t.beds),
        moveIn: addDays(D, 14 + Math.floor(rr() * 40)),
        budget: String(budget),
        stage: "lead",
        createdAt: D,
        tourAt: "",
        touredAt: "",
        appliedAt: "",
        approvedAt: "",
        leasedAt: "",
        lostAt: "",
        lostReason: "",
        cancelledAt: "",
        unitId: "",
        leaseRent: "",
        freeMonths: "",
        nextAt: "",
        nextNote: "",
        notes: [],
        history: [{ at: D, text: `New lead from ${source}` }],
        messages: [msg(`${id}-0`, at, "in", text, { channel: source === "Walk-in" ? "note" : rr() < 0.6 ? "email" : "sms" })],
        app: {},
        sim: { intent: intentDef.key, typeId: t.id },
      });
      dg.leads++;
      dg.bySource[source] = (dg.bySource[source] || 0) + 1;
    }
  }

  // 2. Every open prospect moves through the day.
  // Units free this morning; an application during the day claims one so no two applicants share it.
  const morning = unitStatuses(units, prospects, D);
  const claimed = new Set();
  const unitFor = (p) => {
    const tid = p.sim?.typeId || rows.find((r) => String(r.beds) === String(p.beds))?.id;
    return morning.find((u) => u.typeId === tid && u.status === "available" && !claimed.has(u.id)) || null;
  };
  const typeRatio = (p) => dem.find((t) => t.id === (p.sim?.typeId || rows.find((r) => String(r.beds) === String(p.beds))?.id))?.ratio ?? 1;

  prospects = prospects.map((p0) => {
    let p = { ...p0 };
    if (!["lead", "tour", "toured", "applied", "approved"].includes(p.stage)) return p;
    const r = stream(seed, `step:${p.id}:${D}`);
    const s = { ...(p.sim || {}) };
    const say = (minutes, dir, text, extra) => {
      p = { ...p, messages: [...(p.messages || []), msg(`${p.id}-${(p.messages || []).length}`, stamp(D, clamp(minutes, 0, 23 * 60 + 59)), dir, text, extra)] };
    };
    const lose = (reason) => {
      p = moveProspect(p, "lost", D, { lostReason: reason });
      p.needsYou = null;
      dg.lost++;
    };
    const lastIn = lastMsg(p, "in");
    const lastOut = lastMsg(p, "out");
    // A person answered from the Inbox after the item was raised.
    if (p.needsYou && ["lead", "tour"].includes(p.stage) && lastOut && lastOut.at > p.needsYou.at && !(p.stage === "lead" && !s.answeredAt)) p = { ...p, needsYou: null };
    const waiting = lastIn && (!lastOut || lastOut.at < lastIn.at) && day(lastIn.at) <= D;

    if (p.stage === "lead") {
      const intent = INTENTS.find((i) => i.key === s.intent);
      // The agent answers anything it can within minutes; a negotiation or special request goes to a person.
      if (waiting && !p.needsYou) {
        const escalate = intent?.escalate && !s.escalationHandled;
        if (escalate) {
          p.needsYou = { reason: ESCALATE_REASON[intent.key] || "Needs a person", at: lastIn.at };
          dg.escalated++;
        } else if (agent.reply) {
          const mins = minutesOf(lastIn.at) + 1 + Math.floor(r() * 3);
          const slot = agent.book ? nextSlot({ ...work, prospects }, D, 1 + Math.floor(r() * 3), r) : null;
          say(mins, "out", agentAnswer(p, work, s.intent, unitFor(p), slot), { by: "agent" });
          s.offered = slot;
          s.answeredAt = stamp(D, mins);
          dg.auto++;
          dg.responseMins.push(Math.max(1, mins - minutesOf(lastIn.at)));
        }
      }
      // A person replied (from the Inbox): the prospect answers on the agent's terms or not at all.
      if (!s.answeredAt && lastOut && lastIn && lastOut.at > lastIn.at) {
        s.answeredAt = lastOut.at;
        s.escalationHandled = true;
        p.needsYou = null;
        dg.responseMins.push(Math.max(1, Math.round(hoursBetween(lastIn.at, lastOut.at) * 60)));
      }
      if (s.answeredAt && !s.decided) {
        const hrs = hoursBetween(p.messages[0].at, s.answeredAt);
        const base = hrs <= 1 ? SIM.tourIfAnsweredFast : hrs <= 12 ? SIM.tourIfAnsweredSameDay : SIM.tourIfAnsweredLater;
        const pTour = clamp(base * clamp(Math.exp(-SIM.applyElasticity * 0.5 * (typeRatio(p) - 1)), 0.4, 1.4), 0.02, 0.8);
        s.decided = true;
        if (r() < pTour) {
          const slot = s.offered || nextSlot({ ...work, prospects }, D, 1 + Math.floor(r() * 3), r);
          const mins = minutesOf(s.answeredAt) + 20 + Math.floor(r() * 180);
          say(mins, "in", pick(["That works, thanks!", "Perfect, see you then.", "Yes, that time works.", "Great. What's the address for parking?"], r));
          if (agent.book) say(mins + 2, "out", `You're booked for ${slotWords(slot)}. I'll text a reminder that morning.`, { by: "agent" });
          else p.needsYou = { reason: "Confirm the tour time", at: stamp(D, mins) };
          p = moveProspect(p, "tour", D, { tourAt: slot });
          dg.toursBooked++;
        } else {
          s.goneAfter = addDays(D, 5 + Math.floor(r() * 5));
        }
      }
      if (p.stage === "lead") {
        const age = (parseDate(D) - parseDate(p.createdAt)) / DAY_MS;
        if (s.goneAfter && D >= s.goneAfter) lose(typeRatio(p) > 1.08 && r() < 0.5 ? "Price" : pick(["No response", "Chose another building", "Timing"], r));
        else if (!s.answeredAt && age >= (p.needsYou ? 3 : 2) && r() < 0.35) lose("No response");
      }
    } else if (p.stage === "tour") {
      if (day(p.tourAt) === D) {
        if (agent.reply) say(8 * 60 + 5, "out", `Good morning ${firstName(p)}, see you at ${slotWords(p.tourAt).split(" at ")[1]} today. Text this number when you arrive.`, { by: "agent" });
        if (r() < (agent.reply ? SIM.showRateReminded : SIM.showRate)) {
          p = moveProspect(p, "toured", D);
          dg.toursHeld++;
          s.tourDay = D;
          if (agent.reply) say(minutesOf(p.tourAt) + 90, "out", `Thanks for coming by, ${firstName(p)}. Here is the application link whenever you're ready. Holding a unit takes the application and a $500 deposit.`, { by: "agent" });
        } else {
          dg.noShows++;
          if (r() < 0.45 && agent.book) {
            const slot = nextSlot({ ...work, prospects }, D, 2, r);
            say(minutesOf(p.tourAt) + 30, "out", `Sorry we missed you today. I can do ${slotWords(slot)} instead.`, { by: "agent" });
            p = { ...p, tourAt: slot };
          } else lose("No-show");
        }
      }
    } else if (p.stage === "toured") {
      if (s.applyRoll === undefined) {
        const budgetOk = num(p.budget) && unitFor(p)?.rent ? (num(p.budget) >= unitFor(p).rent * 0.95 ? 1 : 0.6) : 1;
        const g = clamp(Math.exp(-SIM.applyElasticity * (typeRatio(p) - 1)), 0.2, 1.6);
        s.applyRoll = r() < SIM.applyAfterTour * g * budgetOk ? addDays(D, Math.floor(r() * 3)) : "";
        s.goneAfter = s.applyRoll ? "" : addDays(D, 4 + Math.floor(r() * 6));
      }
      if (s.applyRoll && D >= s.applyRoll) {
        const unit = unitFor(p);
        if (!unit) lose("Unit or layout");
        else {
          const rr = stream(seed, `app:${p.id}`);
          const credit = Math.round(clamp(705 + 55 * normal(rr), 520, 830));
          const mult = clamp(3.6 + 0.6 * normal(rr), 1.8, 6);
          claimed.add(unit.id);
          p = moveProspect(p, "applied", D, { unitId: unit.id, nextAt: "", nextNote: "" });
          p.app = { credit: "", background: "", income: String(Math.round((unit.rent * mult) / 100) * 100), incomeVerified: false, deposit: "paid", cosigner: false, note: "Screening ordered" };
          s.screen = { credit: String(credit), background: rr() < 0.9 ? "clear" : "minor", due: addDays(D, 1) };
          const appAt = 10 * 60 + Math.floor(r() * 600);
          say(appAt, "in", pick(["Just submitted the application.", "Application is in!", "Sent the application and deposit."], r));
          if (agent.reply) say(appAt + 2, "out", `Got it, thanks ${firstName(p)}. Unit ${unit.number} is held while screening runs; you'll hear back within a day.`, { by: "agent" });
          dg.applications++;
        }
      } else if (!s.applyRoll && s.goneAfter) {
        if (D === addDays(s.tourDay || D, 2) && agent.reply) say(11 * 60, "out", `Hi ${firstName(p)}, any questions after the tour? Happy to hold a unit for 48 hours once the application is in.`, { by: "agent" });
        if (D >= s.goneAfter) lose(typeRatio(p) > 1.05 && r() < 0.6 ? "Price" : pick(["Chose another building", "Timing", "Unit or layout"], r));
      }
    } else if (p.stage === "applied") {
      if (s.screen && D >= s.screen.due) {
        p.app = { ...p.app, credit: s.screen.credit, background: s.screen.background, incomeVerified: true, note: "Screening returned" };
        delete s.screen;
        s.screenedAt = D;
      }
      if (s.screenedAt) {
        const unit = units.find((u) => u.id === p.unitId);
        const check = applicationCheck(p, policy, unit?.rent);
        if (check.status === "ready" && agent.approve) {
          p = moveProspect(p, "approved", D);
          p.needsYou = null;
          s.leaseSent = D;
          dg.approved++;
          dg.autoApproved++;
          say(15 * 60, "out", `Good news, ${firstName(p)}: you're approved. The lease is in your email to sign.`, { by: "agent" });
        } else if (!p.needsYou) {
          p.needsYou = { reason: check.status === "review" ? "Application below policy" : check.status === "ready" ? "Application ready to decide" : "Application needs a look", at: stamp(D, 15 * 60) };
        }
        const waited = (parseDate(D) - parseDate(s.screenedAt)) / DAY_MS;
        if (p.stage === "applied" && waited >= 2 && r() < 0.12 * (waited - 1)) lose("Chose another building");
      }
    } else if (p.stage === "approved") {
      if (!s.leaseSent) s.leaseSent = D; // approved by a person from the Applications screen; the e-sign request goes out
      p.needsYou = null;
      const age = (parseDate(D) - parseDate(s.leaseSent)) / DAY_MS;
      if (age >= 1 && r() < SIM.signPerDay) {
        const unit = units.find((u) => u.id === p.unitId);
        const conc = activeConcession(work, p.beds, D);
        p = moveProspect(p, "leased", D, { leaseRent: String(unit?.rent || ""), freeMonths: conc ? String(conc.months) : "" });
        dg.leases++;
        say(19 * 60 + Math.floor(r() * 120), "in", "Signed! Excited to move in.");
      } else if (age >= 5 && r() < 0.3) lose("Chose another building");
    }
    return { ...p, sim: s };
  });

  // Approvals count whoever made them: the agent overnight or a person that morning.
  dg.approved = prospects.filter((p) => p.approvedAt === D).length;
  const responseMedian = dg.responseMins.length ? [...dg.responseMins].sort((a, b) => a - b)[Math.floor(dg.responseMins.length / 2)] : null;
  const digest = { ...dg, responseMins: undefined, responseMedian };
  delete digest.responseMins;
  const log = [...(sim.log || []), digest].slice(-200);
  return {
    project: { ...project, units, platforms, prospects, sim: { ...sim, now: addDays(D, 1), log } },
    digest,
  };
}

/** Run several days. `respond` plays the person's part between days (used by the sample's history). */
export function advance(project, data, days, respond = null) {
  let p = project;
  for (let k = 0; k < days; k++) {
    if (respond) p = respond(p);
    p = advanceDay(p, data).project;
  }
  return p;
}

/** Totals over the last `days` of the log. */
export function digestSince(project, days = 1) {
  const log = (project.sim?.log || []).slice(-days);
  const sum = (k) => log.reduce((s, d) => s + (d[k] || 0), 0);
  const mins = log.map((d) => d.responseMedian).filter((v) => v !== null && v !== undefined).sort((a, b) => a - b);
  return {
    days: log.length,
    from: log[0]?.day || null,
    to: log[log.length - 1]?.day || null,
    leads: sum("leads"),
    auto: sum("auto"),
    escalated: sum("escalated"),
    toursBooked: sum("toursBooked"),
    toursHeld: sum("toursHeld"),
    noShows: sum("noShows"),
    applications: sum("applications"),
    approved: sum("approved"),
    autoApproved: sum("autoApproved"),
    leases: sum("leases"),
    lost: sum("lost"),
    synced: sum("synced"),
    responseMedian: mins.length ? mins[Math.floor(mins.length / 2)] : null,
  };
}

/** The log rolled into weeks, latest first, each ending on the last simulated day. */
export function weeklyLog(project) {
  const log = project.sim?.log || [];
  const weeks = [];
  for (let end = log.length; end > 0; end -= 7) {
    const slice = log.slice(Math.max(0, end - 7), end);
    const sum = (k) => slice.reduce((n, d) => n + (d[k] || 0), 0);
    const mins = slice.map((d) => d.responseMedian).filter((v) => v !== null && v !== undefined).sort((a, b) => a - b);
    weeks.push({
      from: slice[0].day,
      to: slice[slice.length - 1].day,
      leads: sum("leads"),
      auto: sum("auto"),
      escalated: sum("escalated"),
      toursHeld: sum("toursHeld"),
      applications: sum("applications"),
      leases: sum("leases"),
      lost: sum("lost"),
      responseMedian: mins.length ? mins[Math.floor(mins.length / 2)] : null,
    });
  }
  return weeks;
}

/** What still needs a person: escalations, decisions the agent may not make, tours it could not book. */
export function needsYou(project) {
  return (project.prospects || []).filter((p) => p.needsYou && ["lead", "tour", "toured", "applied"].includes(p.stage));
}

/** Start a simulation on a project: units built from the mix, the clock at the plan's start or today. */
export function startSim(project, todayIso, seed = 1) {
  const units = project.units?.length ? project.units : generateUnits(project.unitMix, { perFloor: 12 });
  const start = project.plan?.startDate && project.plan.startDate > todayIso ? project.plan.startDate : todayIso;
  return { ...project, units, agent: { ...DEFAULT_AGENT, ...(project.agent || {}) }, sim: { on: true, seed, now: start, startedAt: start, log: [] } };
}

export { hash, stream };
