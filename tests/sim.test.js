import { describe, it, expect } from "vitest";
import { advanceDay, advance, demand, digestSince, needsYou, startSim, fairRent, reach, weeklyLog } from "../src/core/sim.js";
import { generateUnits, unitStatuses } from "../src/core/leasing.js";

const mix = [
  { id: "one", label: "1 bedroom", beds: 1, count: "30", rent: "1800", leased: "0", sqft: "", availableDate: "" },
  { id: "two", label: "2 bedroom", beds: 2, count: "20", rent: "2300", leased: "0", sqft: "", availableDate: "" },
];
const data = { rents: { listings: { town: { Pawtucket: { byBed: { 1: { median: 1600, n: 25 }, 2: { median: 1900, n: 20 } } } } } }, observations: null };
const platforms = ["Zillow", "Apartments.com", "Zumper", "Facebook Marketplace", "Website"].map((name) => ({ id: name, name, active: true, cost: "", url: "x", syncedAt: "" }));
const project = (over = {}) =>
  startSim(
    { name: "Test", town: "Pawtucket", premium: "12", unitMix: mix, units: generateUnits(mix, { perFloor: 10 }), plan: { startDate: "2026-04-06", leaseTerm: "12" }, prospects: [], platforms, policy: { minCredit: 620, incomeMultiple: 3 }, ...over },
    "2026-04-06",
    7,
  );
// The person's part: answer anything waiting and decide applications that meet policy.
const person = (p) => ({
  ...p,
  prospects: p.prospects.map((x) => {
    if (!x.needsYou) return x;
    if (x.stage === "applied") return { ...x, stage: "approved", approvedAt: p.sim.now, needsYou: null };
    return { ...x, messages: [...x.messages, { id: `${x.id}-h`, at: `${p.sim.now}T09:30`, dir: "out", channel: "sms", text: "Happy to help." }] };
  }),
});
const leasedCount = (p) => p.prospects.filter((x) => x.stage === "leased").length;

describe("simulated backend", () => {
  it("prices demand against the town median plus the building's premium", () => {
    const p = project();
    expect(fairRent(p, data, 1, 1800)).toBeCloseTo(1792, 6);
    const [one, two] = demand(p, data, "2026-04-06");
    expect(one.ratio).toBeCloseTo(1800 / 1792, 6);
    expect(two.ratio).toBeGreaterThan(1.07);
    expect(two.price).toBeLessThan(one.price); // the overpriced type draws fewer leads per open unit
    expect(reach(p).reduce((s, [, w]) => s + w, 0)).toBeCloseTo(0.94, 6);
  });

  it("replays the same way from the same seed and never changes its input", () => {
    const p = project();
    const before = JSON.stringify(p);
    const a = advance(p, data, 21, person);
    const b = advance(p, data, 21, person);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(p)).toBe(before);
    expect(a.sim.now).toBe("2026-04-27");
    expect(a.sim.log).toHaveLength(21);
    const weeks = weeklyLog(a);
    expect(weeks.map((w) => [w.from, w.to])).toEqual([["2026-04-20", "2026-04-26"], ["2026-04-13", "2026-04-19"], ["2026-04-06", "2026-04-12"]]);
    expect(weeks.reduce((n, w) => n + w.leads, 0)).toBe(digestSince(a, 21).leads);
  });

  it("answers leads in minutes, books tours, screens and gets leases signed", () => {
    const p = advance(project(), data, 42, person);
    const d = digestSince(p, 42);
    expect(d.leads).toBeGreaterThan(80);
    expect(d.auto).toBeGreaterThan(d.leads * 0.7);
    expect(d.responseMedian).toBeLessThanOrEqual(5);
    expect(d.toursHeld).toBeGreaterThan(10);
    expect(leasedCount(p)).toBeGreaterThan(5);
    // Every lease sits on its own unit.
    const units = p.prospects.filter((x) => x.stage === "leased").map((x) => x.unitId);
    expect(new Set(units).size).toBe(units.length);
    const st = unitStatuses(p.units, p.prospects, p.sim.now);
    expect(st.filter((u) => u.status === "leased")).toHaveLength(leasedCount(p));
  });

  it("leases more when the price comes down", () => {
    const high = advance(project(), data, 56, person);
    const lowMix = mix.map((r) => ({ ...r, rent: String(Math.round(Number(r.rent) * 0.9)) }));
    const low = advance(project({ unitMix: lowMix, units: generateUnits(lowMix, { perFloor: 10 }) }), data, 56, person);
    const early = (p) => p.sim.log.slice(0, 14).reduce((n, d) => n + d.leads, 0);
    expect(early(low)).toBeGreaterThan(early(high) * 1.3);
    expect(leasedCount(low)).toBeGreaterThan(leasedCount(high));
  });

  it("without the agent, leads wait on a person and fewer of them tour", () => {
    const on = advance(project(), data, 28, person);
    const off = advance(project({ agent: { reply: false, book: false, approve: false, sync: false } }), data, 28, person);
    expect(digestSince(off, 28).auto).toBe(0);
    expect(digestSince(off, 28).responseMedian).toBeGreaterThan(60);
    expect(digestSince(off, 28).toursBooked).toBeLessThan(digestSince(on, 28).toursBooked);
  });

  it("hands negotiations and applications to a person and clears them once answered", () => {
    let p = project();
    for (let k = 0; k < 14 && !needsYou(p).length; k++) p = advanceDay(p, data).project;
    const items = needsYou(p);
    expect(items.length).toBeGreaterThan(0);
    const answered = advanceDay(person(p), data).project;
    for (const x of items) {
      const after = answered.prospects.find((y) => y.id === x.id);
      expect(after.needsYou && after.needsYou.at === x.needsYou.at).toBeFalsy();
    }
  });

  it("pushes a price change to every live listing overnight when sync is on", () => {
    const p = { ...project(), priceChangedAt: "2026-04-06" };
    const next = advanceDay(p, data);
    expect(next.digest.synced).toBe(platforms.length);
    expect(next.project.platforms.every((f) => f.syncedAt === "2026-04-06")).toBe(true);
    const manual = advanceDay({ ...p, agent: { ...p.agent, sync: false } }, data);
    expect(manual.digest.synced).toBe(0);
  });
});
