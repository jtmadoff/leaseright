import { describe, it, expect } from "vitest";
import { moveProspect, generateUnits, unitStatuses, derivedActuals, todayTasks, stageCounts } from "../src/core/leasing.js";
import { trackLeasing } from "../src/core/tracking.js";

const mix = [
  { id: "s", label: "Studio", beds: 0, count: "3", rent: "1650", leased: "0", sqft: "450", availableDate: "" },
  { id: "o", label: "1 bedroom", beds: 1, count: "10", rent: "1950", leased: "0", sqft: "", availableDate: "" },
  { id: "t", label: "2 bedroom", beds: 2, count: "2", rent: "2450", leased: "0", sqft: "", availableDate: "2027-03-01" },
];
const lead = (over = {}) => ({ id: "p1", name: "A", stage: "lead", createdAt: "2026-10-05", history: [], ...over });

describe("units", () => {
  it("numbers units by floor across the mix", () => {
    const u = generateUnits(mix, { perFloor: 6 });
    expect(u).toHaveLength(15);
    expect(u.map((x) => x.number).slice(0, 7)).toEqual(["101", "102", "103", "104", "105", "106", "201"]);
    expect(u[0]).toMatchObject({ typeId: "s", rent: 1650, sqft: 450 });
    expect(u[14]).toMatchObject({ number: "303", typeId: "t", availableDate: "2027-03-01" });
  });
  it("derives status from prospects, then holds and delivery dates", () => {
    const u = generateUnits(mix, { perFloor: 6 });
    u[1].hold = true;
    const ps = [lead({ id: "a", stage: "leased", unitId: u[0].id }), lead({ id: "b", stage: "applied", unitId: u[2].id }), lead({ id: "c", stage: "lost", unitId: u[3].id })];
    const st = unitStatuses(u, ps, "2026-10-21");
    expect(st.slice(0, 5).map((x) => x.status)).toEqual(["leased", "hold", "applied", "available", "available"]);
    expect(st[14].status).toBe("coming");
    expect(st[0].prospect.id).toBe("a");
  });
});

describe("prospect stages", () => {
  it("stamps each stage once and records the move", () => {
    let p = moveProspect(lead(), "tour", "2026-10-06", { tourAt: "2026-10-08T14:00" });
    p = moveProspect(p, "toured", "2026-10-08");
    p = moveProspect(p, "applied", "2026-10-09");
    expect(p).toMatchObject({ stage: "applied", touredAt: "2026-10-08", appliedAt: "2026-10-09", tourAt: "2026-10-08T14:00" });
    expect(p.history.map((h) => h.text)).toEqual(["New lead to Tour booked", "Tour booked to Toured", "Toured to Applied"]);
  });
  it("clears later stamps when moved back", () => {
    let p = moveProspect(moveProspect(lead(), "toured", "2026-10-08"), "applied", "2026-10-09");
    p = moveProspect(p, "toured", "2026-10-10");
    expect(p.appliedAt).toBe("");
    expect(p.touredAt).toBe("2026-10-08");
  });
  it("nets out a cancelled lease and counts a re-lease once on its new date", () => {
    let p = moveProspect(lead(), "leased", "2026-10-10");
    p = moveProspect(p, "lost", "2026-10-15", { lostReason: "Other" });
    expect(p).toMatchObject({ leasedAt: "2026-10-10", cancelledAt: "2026-10-15" });
    p = moveProspect(p, "leased", "2026-10-20");
    expect(p).toMatchObject({ leasedAt: "2026-10-20", cancelledAt: "", lostAt: "" });
  });
});

describe("weekly roll-up from the pipeline", () => {
  it("buckets activity into weeks running back from today", () => {
    const ps = [
      lead({ id: "a", createdAt: "2026-10-05", touredAt: "2026-10-07", appliedAt: "2026-10-08", leasedAt: "2026-10-12" }),
      lead({ id: "b", createdAt: "2026-10-11" }),
      lead({ id: "c", createdAt: "2026-10-13", leasedAt: "2026-10-14", cancelledAt: "2026-10-18" }),
    ];
    const w = derivedActuals(ps, "2026-10-18");
    expect(w.map((r) => r.weekEnding)).toEqual(["2026-10-11", "2026-10-18"]);
    expect(derivedActuals(ps, "2026-10-13").map((r) => r.weekEnding)).toEqual(["2026-10-06", "2026-10-13"]);
    expect(w[0]).toMatchObject({ leads: 2, tours: 1, applications: 1, leases: 0 });
    expect(w[1]).toMatchObject({ leads: 1, leases: 2, cancellations: 1 });
  });
  it("feeds the plan-to-actual tracker", () => {
    const plan = { startDate: "2026-10-05", targetOccupancy: "93", leasesPerWeek: "2", leaseTerm: "12", freeMonths: "0", moveInLag: "0", monthlyCarry: "50000" };
    const baseline = { inputs: { unitMix: mix, plan, totalUnits: "15" } };
    const ps = [lead({ id: "a", leasedAt: "2026-10-07" }), lead({ id: "b", leasedAt: "2026-10-09" }), lead({ id: "c", leasedAt: "2026-10-15" })];
    const t = trackLeasing({ actuals: derivedActuals(ps, "2026-10-18") }, baseline);
    expect(t.actualLeased).toBe(3);
    expect(t.asOf).toBe("2026-10-18");
  });
});

describe("today", () => {
  it("lists overdue tour outcomes first, then today's tours, decisions, follow-ups and first contacts", () => {
    const ps = [
      lead({ id: "contact", createdAt: "2026-10-20", source: "Zillow" }),
      lead({ id: "follow", nextAt: "2026-10-21" }),
      lead({ id: "tour", stage: "tour", tourAt: "2026-10-21T15:30" }),
      lead({ id: "missed", stage: "tour", tourAt: "2026-10-19T10:00" }),
      lead({ id: "decide", stage: "applied", appliedAt: "2026-10-18" }),
      lead({ id: "fresh", stage: "applied", appliedAt: "2026-10-21" }),
      lead({ id: "done", stage: "leased", nextAt: "2026-10-01" }),
    ];
    const t = todayTasks({ prospects: ps }, "2026-10-21");
    expect(t.map((x) => x.p.id)).toEqual(["missed", "tour", "decide", "follow", "contact"]);
    expect(t[1].title).toBe("Tour at 3:30 pm");
    expect(t[4].detail).toBe("New yesterday from Zillow");
  });
  it("counts prospects by stage", () => {
    expect(stageCounts([lead(), lead({ stage: "leased" }), lead({ stage: "leased" })])).toMatchObject({ lead: 1, leased: 2, tour: 0 });
  });
});
