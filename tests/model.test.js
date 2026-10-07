import { describe, it, expect } from "vitest";
import { calculate, simulate, planInputs, planIssues, parseDate, bedsFromLabel, DAYS_PER_MONTH } from "../src/core/model.js";

const project = (over = {}, plan = {}) => ({
  name: "Test",
  address: "1 Main St",
  town: "Providence",
  totalUnits: "100",
  unitMix: [
    { label: "Studio", count: "20", rent: "1900", leased: "0", sqft: "", availableDate: "" },
    { label: "1 bedroom", count: "50", rent: "2300", leased: "0", sqft: "", availableDate: "" },
    { label: "2 bedroom", count: "30", rent: "3100", leased: "0", sqft: "", availableDate: "" },
  ],
  plan: {
    startDate: "2027-01-04",
    targetDate: "2027-10-01",
    targetOccupancy: "93",
    leasesPerWeek: "2.5",
    leaseTerm: "12",
    freeMonths: "1",
    moveInLag: "0",
    monthlyCarry: "95000",
    marketing: "90000",
    staffing: "160000",
    ...plan,
  },
  ...over,
});

describe("dates and labels", () => {
  it("rejects impossible dates", () => {
    expect(parseDate("2027-02-30")).toBeNull();
    expect(parseDate("2027-02-28")).not.toBeNull();
    expect(parseDate("02/28/2027")).toBeNull();
  });
  it("reads bedrooms from labels", () => {
    expect(bedsFromLabel("Studio")).toBe(0);
    expect(bedsFromLabel("1 bedroom")).toBe(1);
    expect(bedsFromLabel("2BR / 2BA")).toBe(2);
    expect(bedsFromLabel("Two Bedroom")).toBe(2);
    expect(bedsFromLabel("Penthouse")).toBeNull();
  });
});

describe("summary math (hand-checked against the v1 walkthrough)", () => {
  const r = calculate(project());
  it("is ready", () => expect(r.ready).toBe(true));
  it("weighted asking rent", () => expect(r.averageRent).toBeCloseTo(2460, 6)); // 246,000 / 100
  it("effective rent spreads free rent over the term", () => expect(r.effectiveRent).toBeCloseTo(2255, 6)); // 2460 x 11/12
  it("gross potential rent", () => expect(r.grossMonthlyRent).toBe(246000));
  it("target leased units", () => expect(r.targetLeased).toBe(93));
  it("required pace", () => {
    const weeks = (parseDate("2027-10-01") - parseDate("2027-01-04")) / (7 * 86400000);
    expect(r.requiredPace).toBeCloseTo(93 / weeks, 9);
    expect(r.requiredPace).toBeCloseTo(2.41, 2);
  });
  it("stabilization dates match v1 for the same pace", () => {
    expect(r.scenarios[0].stabilizeDate).toBe("2027-11-26"); // 2.0 per week
    expect(r.scenarios[1].stabilizeDate).toBe("2027-09-22"); // 2.5 per week
    expect(r.scenarios[2].stabilizeDate).toBe("2027-08-09"); // 3.0 per week
  });
  it("gross carry is monthly carry x days / 30.4375", () => {
    expect(r.base.leaseUpDays).toBe(261); // ceil(93 / (2.5/7))
    expect(r.base.grossCarry).toBeCloseTo((95000 * 261) / DAYS_PER_MONTH, 4);
    expect(Math.round(r.base.grossCarry)).toBe(814620);
  });
  it("free rent is one month on each new lease, leased pro rata across unit types", () => {
    // Pro rata leasing signs 93% of each type: 0.93 x 246,000 = 228,780
    expect(r.base.concessionCost).toBeCloseTo(0.93 * 246000, 4);
    expect(r.scenarios[0].concessionCost).toBeCloseTo(r.scenarios[2].concessionCost, 4);
  });
  it("total plan cost adds concessions, gross carry and budgets", () => {
    expect(r.base.totalCost).toBeCloseTo(r.base.concessionCost + r.base.grossCarry + 250000, 6);
  });
});

describe("rent offset and reserve (closed form, single unit type)", () => {
  // 70 units at $2,100, 7 leases a week (1 a day), no lag, no free rent, 100% target.
  const p = project(
    { totalUnits: "70", unitMix: [{ label: "1 bedroom", count: "70", rent: "2100", leased: "0" }] },
    { leasesPerWeek: "7", targetOccupancy: "100", freeMonths: "0", moveInLag: "0", monthlyCarry: "60875", marketing: "0", staffing: "0", targetDate: "" },
  );
  const r = calculate(p);
  const rentPerDay = 2100 / DAYS_PER_MONTH;
  const carryPerDay = 60875 / DAYS_PER_MONTH; // 2,000 a day
  it("stabilizes in 70 days", () => {
    expect(r.base.leaseUpDays).toBe(70);
    expect(r.base.stabilizeDate).toBe("2027-03-15");
  });
  it("rent collected to stabilization is the triangular sum", () => {
    // Day d (0-based) collects on d+1 units: sum_{k=1..70} k = 2485 unit-days
    expect(r.base.rentCollected).toBeCloseTo(2485 * rentPerDay, 4);
  });
  it("net carry is gross carry less collected rent", () => {
    expect(r.base.netCarry).toBeCloseTo(70 * carryPerDay - 2485 * rentPerDay, 4);
  });
  it("breakeven is the first day rent covers carry", () => {
    // k units cover carry when k x 68.99 >= 2000, so k = 29, which is day index 28
    expect(Math.ceil(carryPerDay / rentPerDay)).toBe(29);
    expect(r.base.breakevenDate).toBe("2027-02-01");
  });
  it("reserve is the deepest cumulative shortfall", () => {
    let cum = 0;
    let trough = 0;
    for (let k = 1; k <= 70; k++) {
      cum += k * rentPerDay - carryPerDay;
      trough = Math.min(trough, cum);
    }
    expect(r.base.reserveNeed).toBeCloseTo(-trough, 4);
    expect(r.base.reserveNeed).toBeGreaterThan(0);
    expect(r.base.reserveNeed).toBeLessThan(r.base.grossCarry);
  });
  it("stabilized rent is full rent roll", () => expect(r.base.stabilizedMonthlyRent).toBeCloseTo(70 * 2100, 4));
  it("coverage ratio", () => expect(r.carryCoverage).toBeCloseTo((70 * 2100) / 60875, 6));
});

describe("concessions, lag and existing leases", () => {
  it("free rent delays collections and deepens the reserve", () => {
    const none = calculate(project({}, { freeMonths: "0" }));
    const one = calculate(project({}, { freeMonths: "1" }));
    expect(one.base.rentCollected).toBeLessThan(none.base.rentCollected);
    expect(one.base.reserveNeed).toBeGreaterThan(none.base.reserveNeed);
    expect(one.base.stabilizeDate).toBe(none.base.stabilizeDate);
  });
  it("move-in lag delays collections", () => {
    const a = calculate(project({}, { moveInLag: "0" }));
    const b = calculate(project({}, { moveInLag: "30" }));
    expect(b.base.rentCollected).toBeLessThan(a.base.rentCollected);
  });
  it("units already leased pay from day one and shorten the lease-up", () => {
    const p = project();
    p.unitMix = p.unitMix.map((r) => ({ ...r, leased: String(Math.round(Number(r.count) * 0.5)) }));
    const r = calculate(p);
    expect(r.existingLeased).toBe(50);
    expect(r.newLeases).toBe(43);
    expect(r.base.leaseUpDays).toBe(Math.ceil(43 / (2.5 / 7)));
    expect(r.base.months[0].rent).toBeGreaterThan(0);
  });
  it("already stabilized needs no leasing", () => {
    const p = project();
    p.unitMix = p.unitMix.map((r) => ({ ...r, leased: r.count }));
    const r = calculate(p);
    expect(r.base.leaseUpDays).toBe(0);
    expect(r.base.concessionCost).toBe(0);
  });
  it("one free month costs one month of rent on each new lease", () => {
    const r = calculate(project());
    expect(r.oneFreeMonthCost).toBeCloseTo(r.base.concessionCost, 4); // freeMonths = 1
  });
});

describe("phasing", () => {
  it("a later phase cannot lease before it is available", () => {
    const p = project(
      {
        totalUnits: "40",
        unitMix: [
          { label: "Phase 1", count: "20", rent: "2000", leased: "0", availableDate: "" },
          { label: "Phase 2", count: "20", rent: "2000", leased: "0", availableDate: "2027-07-05" },
        ],
      },
      { leasesPerWeek: "7", targetOccupancy: "100", targetDate: "" },
    );
    const r = calculate(p);
    // 20 days for phase 1, idle until day 182, then 20 more days.
    expect(r.base.leaseUpDays).toBe(182 + 20);
  });
});

describe("validation and defaults", () => {
  it("applies defaults and reports them", () => {
    const i = planInputs(project({}, { targetOccupancy: "", leaseTerm: "", freeMonths: "", moveInLag: "" }));
    expect(i.targetOccupancy).toBe(93);
    expect(i.leaseTerm).toBe(12);
    expect(i.freeMonths).toBe(0);
    expect(i.moveInLag).toBe(30);
    expect(i.defaulted.sort()).toEqual(["freeMonths", "leaseTerm", "moveInLag", "targetOccupancy"]);
  });
  it("uses the required pace when only a target date is given", () => {
    const r = calculate(project({}, { leasesPerWeek: "" }));
    expect(r.ready).toBe(true);
    expect(r.inputs.paceSource).toBe("required");
    expect(r.base.meetsTarget).toBe(true);
  });
  it("needs a pace or a date", () => {
    const r = calculate(project({}, { leasesPerWeek: "", targetDate: "" }));
    expect(r.ready).toBe(false);
    expect(r.issues.some((i) => i.field === "leasesPerWeek" && i.blocking)).toBe(true);
  });
  it("flags a mix that does not match the building total without blocking", () => {
    const issues = planIssues(project({ totalUnits: "120" }));
    const mismatch = issues.find((i) => i.field === "totalUnits");
    expect(mismatch.blocking).toBe(false);
    expect(calculate(project({ totalUnits: "120" })).ready).toBe(true);
  });
  it("blocks on a missing rent", () => {
    const p = project();
    p.unitMix[0].rent = "";
    expect(calculate(p).ready).toBe(false);
  });
  it("never reaches target when nothing is available", () => {
    const i = planInputs(project());
    i.rows = i.rows.map((r) => ({ ...r, availableDate: "2099-01-01" }));
    const s = simulate(i, 2.5);
    expect(s.reached).toBe(false);
    expect(s.stabilizeDate).toBeNull();
  });
  it("monthly series ends at the cumulative position used for the reserve", () => {
    const r = calculate(project());
    const min = Math.min(0, ...r.base.months.map((m) => m.cumulative));
    expect(r.base.reserveNeed).toBeGreaterThanOrEqual(-min - 1e-6);
    expect(r.base.months.length).toBeGreaterThan(8);
  });
});

describe("comparing cases on a common date", () => {
  const r = calculate(project());
  it("runs all three cases to the same month", () => {
    const lengths = r.scenarios.map((s) => s.months.length);
    expect(new Set(lengths).size).toBe(1);
    expect(new Set(r.scenarios.map((s) => s.horizonDays)).size).toBe(1);
  });
  it("a faster pace ends with more cash and needs a smaller reserve", () => {
    const [slow, base, fast] = r.scenarios;
    expect(fast.finalCumulative).toBeGreaterThan(base.finalCumulative);
    expect(base.finalCumulative).toBeGreaterThan(slow.finalCumulative);
    expect(fast.reserveNeed).toBeLessThan(base.reserveNeed);
    expect(base.reserveNeed).toBeLessThan(slow.reserveNeed);
  });
  it("extending the horizon does not change the lease-up itself", () => {
    const i = planInputs(project());
    const a = simulate(i, 2.5);
    const b = simulate(i, 2.5, { through: a.settledDays + 200 });
    expect(b.stabilizeDate).toBe(a.stabilizeDate);
    expect(b.reserveNeed).toBeCloseTo(a.reserveNeed, 6);
    expect(b.concessionCost).toBeCloseTo(a.concessionCost, 6);
    // After settling, each extra day adds stabilized rent less carry.
    const perDay = (a.stabilizedMonthlyRent - 95000) / DAYS_PER_MONTH;
    expect(b.finalCumulative - a.finalCumulative).toBeCloseTo(200 * perDay, 2);
  });
});

describe("what an extra free month has to buy", () => {
  const i = planInputs(project());
  const x = calculate(project()).extraFreeMonth;
  it("needs a faster pace than the base", () => {
    expect(x.pace).toBeGreaterThan(i.pace);
    expect(x.upliftPct).toBeCloseTo((x.pace / i.pace - 1) * 100, 9);
  });
  it("is the pace where cash is equal once both plans have settled", () => {
    const more = { ...i, freeMonths: i.freeMonths + 1 };
    const through = simulate(more, i.pace).settledDays;
    const hurdle = simulate(i, i.pace, { through }).finalCumulative;
    const at = simulate(more, x.pace, { through }).finalCumulative;
    expect(Math.abs(at - hurdle)).toBeLessThan(250); // within one unit-day of rent
    expect(simulate(more, x.pace * 0.97, { through }).finalCumulative).toBeLessThan(hurdle);
  });
  it("matches the back-of-envelope: each lease must sign about a month sooner on average", () => {
    // Giving up one month per lease is recovered when the average lease signs ~30 days earlier,
    // which means the whole lease-up shortens by roughly twice that.
    const baseDays = simulate(i, i.pace).leaseUpDays;
    const fastDays = simulate({ ...i, freeMonths: i.freeMonths + 1 }, x.pace).leaseUpDays;
    expect(baseDays - fastDays).toBeGreaterThan(50);
    expect(baseDays - fastDays).toBeLessThan(75);
  });
  it("is not offered when free rent would exceed the lease term", () => {
    expect(calculate(project({}, { freeMonths: "12" })).extraFreeMonth).toBeNull();
  });
});

describe("review fixes", () => {
  it("cash foregone to free rent equals rent x free months, including half months", () => {
    for (const free of ["0.5", "1", "2", "1.5"]) {
      const p = project({}, { freeMonths: free, moveInLag: "0", marketing: "0", staffing: "0" });
      const none = project({}, { freeMonths: "0", moveInLag: "0", marketing: "0", staffing: "0" });
      const a = calculate(p).base;
      const b = calculate(none).base;
      // Run both far past settling: the gap in cash is exactly the concession.
      const i = planInputs(p);
      const j = planInputs(none);
      const far = simulate(i, 2.5, { through: 700 }).finalCumulative;
      const farNone = simulate(j, 2.5, { through: 700 }).finalCumulative;
      expect(farNone - far).toBeCloseTo(a.concessionCost, 4);
      expect(a.concessionCost).toBeCloseTo(0.93 * 246000 * Number(free), 4);
      expect(a.stabilizeDate).toBe(b.stabilizeDate);
    }
  });
  it("month rows add up to the cumulative position and label the period start", () => {
    const r = calculate(project());
    const m = r.base.months;
    expect(m[0].date).toBe("2027-01-04");
    expect(m[0].days + m[1].days).toBe(61); // 30.4375-day months alternate 30 and 31
    expect(m.reduce((s, x) => s + x.net, 0)).toBeCloseTo(r.base.finalCumulative, 4);
    expect(m.reduce((s, x) => s + x.days, 0)).toBe(r.base.horizonDays);
  });
  it("budgets land in the first month when the building is already stabilized", () => {
    const p = project();
    p.unitMix = p.unitMix.map((r) => ({ ...r, leased: r.count }));
    const b = calculate(p).base;
    expect(b.months[0].budget).toBe(250000);
    expect(b.months.reduce((s, x) => s + x.net, 0)).toBeCloseTo(b.finalCumulative, 4);
  });
  it("a stabilized building with no pace entered still calculates", () => {
    const p = project({}, { leasesPerWeek: "", targetDate: "" });
    p.unitMix = p.unitMix.map((r) => ({ ...r, leased: r.count }));
    const r = calculate(p);
    expect(r.ready).toBe(true);
    expect(r.inputs.paceSource).toBe("stabilized");
    expect(r.base.leaseUpDays).toBe(0);
    expect(r.extraFreeMonth).toBeNull();
  });
  it("the reserve does not move with the comparison date when rent never covers carry", () => {
    const p = project({}, { monthlyCarry: "300000" });
    const r = calculate(p);
    const alone = simulate(r.inputs, r.inputs.pace);
    expect(r.base.breakevenDate).toBeNull();
    expect(r.base.reserveNeed).toBeCloseTo(alone.reserveNeed, 6);
    expect(r.base.horizonDays).toBeGreaterThan(alone.horizonDays);
  });
  it("rejects an unbounded move-in lag", () => {
    const r = calculate(project({}, { moveInLag: "100000" }));
    expect(r.ready).toBe(false);
    expect(r.issues.some((i) => i.field === "moveInLag" && i.blocking)).toBe(true);
  });
});
