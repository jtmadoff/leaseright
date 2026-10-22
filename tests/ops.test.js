import { describe, it, expect } from "vitest";
import { typeMetrics, activeConcession, concessionStats, platformMetrics, applicationCheck, decisions, repriceType } from "../src/core/ops.js";
import { generateUnits, unitStatuses } from "../src/core/leasing.js";

const mix = [
  { id: "one", label: "1 bedroom", beds: 1, count: "10", rent: "2000", leased: "0", sqft: "", availableDate: "" },
  { id: "three", label: "3 bedroom", beds: 3, count: "4", rent: "3400", leased: "0", sqft: "", availableDate: "" },
];
const data = { rents: { listings: { town: { Providence: { byBed: { 1: { median: 1950, n: 40 }, 3: { median: 3100, n: 12 } } } } } }, observations: null };
const units = generateUnits(mix, { perFloor: 10 });
const base = (over = {}) => ({ town: "Providence", unitMix: mix, units, plan: { startDate: "2026-09-01", leaseTerm: "12" }, prospects: [], ...over });
const leased = (id, unitId, at, extra = {}) => ({ id, name: id, stage: "leased", unitId, leasedAt: at, createdAt: at, beds: "1", source: "Zillow", ...extra });

describe("rents by unit type", () => {
  it("counts leases, open units, the gap to the listing median and recent pace", () => {
    const p = base({ prospects: [leased("a", units[0].id, "2026-10-15"), leased("b", units[1].id, "2026-10-01")] });
    const [one, three] = typeMetrics(p, data, "2026-10-21", { planPace: 3 });
    expect(one).toMatchObject({ count: 10, leased: 2, available: 8, asking: 2000, gap: 50 });
    expect(one.velocity).toBeCloseTo(0.5, 9); // two leases in the last four weeks
    expect(three).toMatchObject({ leased: 0, available: 4, gap: 300 });
    expect(Math.round(three.dom)).toBe(50);
  });
  it("suggests a lower asking rent only for a stalled type priced above market", () => {
    const p = base({ prospects: [leased("a", units[0].id, "2026-10-15"), leased("b", units[1].id, "2026-10-10"), leased("c", units[2].id, "2026-10-05")] });
    const [one, three] = typeMetrics(p, data, "2026-10-21", { planPace: 3 });
    expect(one.suggestion).toBeNull(); // 1BR asking is within 2.6% of market and leasing near its share
    expect(three.suggestion).toEqual({ rent: 3225, aboveMarket: 125, cut: 175 });
    // A cut inside the last two weeks waits for tours to respond before suggesting another.
    const recent = { ...p, priceLog: [{ at: "2026-10-14", typeId: three.id, from: 3500, to: 3400 }] };
    expect(typeMetrics(recent, data, "2026-10-21", { planPace: 3 })[1].suggestion).toBeNull();
    const older = { ...p, priceLog: [{ at: "2026-10-01", typeId: three.id, from: 3500, to: 3400 }] };
    expect(typeMetrics(older, data, "2026-10-21", { planPace: 3 })[1].suggestion).not.toBeNull();
  });
  it("reprices only the open units of a type", () => {
    const p = base({ prospects: [leased("a", units[10].id, "2026-10-15", { beds: "3" })] });
    const st = unitStatuses(p.units, p.prospects, "2026-10-21");
    const next = repriceType(units, "three", 3225, st);
    expect(next.filter((u) => u.typeId === "three").map((u) => u.rent)).toEqual([3400, 3225, 3225, 3225]);
  });
  it("applies an active concession to the effective rent", () => {
    const p = base({ concessions: [{ id: "c", name: "Half month free", months: "0.5", beds: [3], startsAt: "2026-10-01", endsAt: "2026-11-01" }] });
    expect(activeConcession(p, 3, "2026-10-21").name).toBe("Half month free");
    expect(activeConcession(p, 1, "2026-10-21")).toBeNull();
    expect(activeConcession(p, 3, "2026-11-02")).toBeNull();
    const three = typeMetrics(p, data, "2026-10-21")[1];
    expect(three.effective).toBeCloseTo(3400 * (1 - 0.5 / 12), 9);
  });
});

describe("concessions", () => {
  it("counts leases signed under a program and the rent given away", () => {
    const p = base({
      concessions: [{ id: "c", name: "Half month free", months: "0.5", beds: [], startsAt: "2026-10-01", endsAt: "2026-10-30" }],
      prospects: [leased("a", "", "2026-10-05", { leaseRent: "2000", freeMonths: "0.5" }), leased("b", "", "2026-09-20", { leaseRent: "2000", freeMonths: "0.5" }), leased("c", "", "2026-10-06", { leaseRent: "2000", freeMonths: "" })],
    });
    const [c] = concessionStats(p, "2026-10-21");
    expect(c).toMatchObject({ leases: 1, cost: 1000, status: "active", daysLeft: 9 });
  });
});

describe("listing platforms", () => {
  it("reports leads, cost per lead and issues per platform from prospect sources", () => {
    const p = base({
      priceChangedAt: "2026-10-18",
      platforms: [
        { id: "z", name: "Zillow", active: true, cost: "300", url: "https://example.com/z", syncedAt: "2026-10-19" },
        { id: "a", name: "Apartments.com", active: true, cost: "", url: "", syncedAt: "2026-10-01" },
        { id: "f", name: "Facebook Marketplace", active: false },
      ],
      prospects: [
        { id: "1", stage: "lead", source: "Zillow", createdAt: "2026-10-20" },
        { id: "2", stage: "lead", source: "Zillow", createdAt: "2026-10-01" },
        { id: "3", stage: "lead", source: "Walk-in", createdAt: "2026-10-19" },
      ],
    });
    const { platforms, others, open } = platformMetrics(p, "2026-10-21");
    expect(open).toBe(14);
    expect(platforms[0]).toMatchObject({ name: "Zillow", leads7: 1, leads30: 2, cpl: 150, health: "ok", unitsLive: 14 });
    expect(platforms[1].health).toBe("bad");
    expect(platforms[1].issues).toEqual(["No leads in the last 14 days", "No link to the live listing", "Prices changed Oct 18, 2026; listing not updated since"]);
    expect(platforms[2]).toMatchObject({ health: "paused", unitsLive: 0 });
    expect(others.map((o) => o.name)).toEqual(["Walk-in"]);
  });
});

describe("applications", () => {
  it("screens against the project policy and keeps missing items pending", () => {
    const p = { stage: "applied", app: { credit: "742", background: "clear", income: "7000", incomeVerified: true, deposit: "paid" } };
    expect(applicationCheck(p, null, 2000)).toMatchObject({ status: "ready", ratio: 3.5 });
    expect(applicationCheck({ ...p, app: { ...p.app, credit: "600" } }, null, 2000).status).toBe("review");
    expect(applicationCheck({ ...p, app: { ...p.app, incomeVerified: false } }, null, 2000).checks.income).toBe("unverified");
    expect(applicationCheck({ stage: "applied", app: {} }, null, 2000).status).toBe("pending");
    expect(applicationCheck({ ...p, app: { ...p.app, income: "5000" } }, { incomeMultiple: 3 }, 2000).checks.income).toBe("below");
  });
});

describe("decisions", () => {
  it("raises a stalled type, an uncontacted lead, a waiting reply and a closing concession, costliest first", () => {
    const p = base({
      prospects: [
        leased("a", units[0].id, "2026-10-15"),
        leased("b", units[1].id, "2026-10-10"),
        leased("c", units[2].id, "2026-10-05"),
        { id: "n", name: "New Lead", stage: "lead", source: "Zillow", createdAt: "2026-10-18", messages: [] },
        { id: "w", name: "Waiting", stage: "toured", createdAt: "2026-10-10", messages: [{ at: "2026-10-20T09:00", dir: "out", text: "Hi" }, { at: "2026-10-20T15:00", dir: "in", text: "Is parking included?" }] },
      ],
      concessions: [{ id: "c", name: "Half month free", months: "0.5", beds: [], startsAt: "2026-10-01", endsAt: "2026-10-28" }],
    });
    const d = decisions(p, data, "2026-10-21", { planPace: 3 });
    expect(d.map((x) => x.kind)).toEqual(["pricing", "lead", "lead", "concession"]);
    expect(d[0].title).toBe("3 bedrooms have stalled.");
    expect(d[0].actions[0].act).toEqual({ type: "price", typeId: "three", rent: 3225 });
    expect(d[2].title).toBe("Waiting is waiting on a reply.");
  });
  it("leaves held decisions off until their date", () => {
    const p = base({ prospects: [{ id: "n", name: "N", stage: "lead", createdAt: "2026-10-18", messages: [] }], dismissed: [{ key: "contact:n", until: "2026-10-25" }] });
    expect(decisions(p, data, "2026-10-21", null)).toHaveLength(0);
    expect(decisions(p, data, "2026-10-26", null)).toHaveLength(1);
  });
});
