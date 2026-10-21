import { describe, it, expect } from "vitest";
import { trackLeasing, normalizeActuals, weeklySummary, weekEndingFor, plannedAt } from "../src/core/tracking.js";
import { parseDate, simulate, planInputs, DAY_MS } from "../src/core/model.js";

const mix = [
  { label: "Studio", count: "20", rent: "1900", leased: "0", sqft: "", availableDate: "" },
  { label: "1 bedroom", count: "50", rent: "2300", leased: "0", sqft: "", availableDate: "" },
  { label: "2 bedroom", count: "30", rent: "3100", leased: "0", sqft: "", availableDate: "" },
];
const plan = { startDate: "2027-01-04", targetDate: "", targetOccupancy: "93", leasesPerWeek: "2.5", leaseTerm: "12", freeMonths: "0", moveInLag: "0", monthlyCarry: "95000", marketing: "", staffing: "", notes: "" };
const baseline = { id: "b1", approvedAt: "2026-12-01T00:00:00Z", key: "k", inputs: { unitMix: mix, plan, totalUnits: "100" }, summary: {} };
const weeksOf = (leases, extra = {}) =>
  leases.map((n, i) => ({ id: `w${i}`, weekEnding: new Date(parseDate("2027-01-10") + i * 7 * DAY_MS).toISOString().slice(0, 10), leases: String(n), ...extra }));
const project = (actuals, over = {}) => ({ name: "T", unitMix: mix, plan, totalUnits: "100", baselines: [baseline], actuals, ...over });

describe("weekly log", () => {
  it("drops rows without a valid date and nets out cancellations", () => {
    const rows = normalizeActuals([
      { id: "a", weekEnding: "2027-01-17", leases: "5", cancellations: "1" },
      { id: "b", weekEnding: "bad", leases: "9" },
      { id: "c", weekEnding: "2027-01-10", leases: "", cancellations: "-2" },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["c", "a"]);
    expect(rows[1].net).toBe(4);
    expect(rows[0].net).toBe(0);
  });
  it("defaults the week ending to the Sunday on or before a date", () => {
    expect(weekEndingFor(parseDate("2026-10-21"))).toBe("2026-10-18");
    expect(weekEndingFor(parseDate("2026-10-18"))).toBe("2026-10-18");
  });
});

describe("plan to actual", () => {
  it("reports nothing to compare before the first week is logged", () => {
    const t = trackLeasing(project([]), baseline);
    expect(t.asOf).toBeNull();
    expect(t.actualLeased).toBe(0);
    expect(t.reforecast).toBeNull();
  });
  it("measures the baseline from its frozen inputs, not current edits", () => {
    const edited = project(weeksOf([3, 3]), { plan: { ...plan, leasesPerWeek: "9" } });
    expect(trackLeasing(edited, baseline).planPace).toBe(2.5);
  });
  it("compares cumulative leases to the baseline path week by week", () => {
    const t = trackLeasing(project(weeksOf([3, 3, 3, 3])), baseline);
    const inputs = planInputs(project([]));
    const run = simulate(inputs, 2.5);
    expect(t.actualLeased).toBe(12);
    expect(t.asOf).toBe("2027-01-31");
    // Day 27 from Jan 4: 28 days at 2.5 a week.
    expect(t.planned).toBeCloseTo(10, 6);
    expect(t.planned).toBeCloseTo(plannedAt(inputs, run, parseDate("2027-01-31")), 9);
    expect(t.variance).toBeCloseTo(2, 6);
    expect(t.daysAhead).toBe(6); // the baseline reaches 12 leases six days later
  });
  it("uses the last four weeks for pace and re-forecasts the rest at it", () => {
    const t = trackLeasing(project(weeksOf([1, 1, 3, 3, 3, 3])), baseline);
    expect(t.weeksInWindow).toBe(4);
    expect(t.trailingPace).toBeCloseTo(3, 9);
    // 93 target less 14 leased = 79 at 3 a week: 184.33 days, so stabilized on day 185 after Feb 14.
    const due = parseDate("2027-02-14") + 185 * DAY_MS;
    expect(t.reforecast.stabilizeDate).toBe(new Date(due).toISOString().slice(0, 10));
  });
  it("shortens the pace window when leasing started recently", () => {
    const t = trackLeasing(project(weeksOf([4])), baseline);
    expect(t.weeksInWindow).toBe(1);
    expect(t.trailingPace).toBe(4);
  });
  it("gives the pace needed to hold the baseline date when behind", () => {
    const t = trackLeasing(project(weeksOf([1, 1, 1, 1])), baseline);
    const base = simulate(planInputs(project([])), 2.5);
    const weeksLeft = (parseDate(base.stabilizeDate) - parseDate("2027-01-31")) / (7 * DAY_MS);
    expect(t.daysAhead).toBeLessThan(0);
    expect(t.paceToHold).toBeCloseTo((93 - 4) / weeksLeft, 9);
    expect(t.reforecast.stabilizeDate > base.stabilizeDate).toBe(true);
  });
  it("marks the lease-up stabilized on the week the target is reached", () => {
    const t = trackLeasing(project(weeksOf([50, 40, 5])), baseline);
    expect(t.stabilized).toBe(true);
    expect(t.reforecast.stabilizeDate).toBe("2027-01-24");
  });
  it("reports the leasing funnel over the window", () => {
    const t = trackLeasing(project(weeksOf([2, 2], { leads: "20", tours: "8" })), baseline);
    expect(t.funnel).toMatchObject({ leads: 40, tours: 16, leases: 4 });
    expect(t.funnel.tourRate).toBeCloseTo(0.4, 9);
    expect(t.funnel.closeRate).toBeCloseTo(0.25, 9);
  });
  it("writes a plain summary from the numbers", () => {
    const text = weeklySummary(trackLeasing(project(weeksOf([1, 1, 1, 1])), baseline));
    expect(text).toMatch(/^Week ending Jan 31, 2027: 1 lease signed\./);
    expect(text).toMatch(/4 of 100 units are leased \(4%\) against 10 in the baseline, 2 weeks behind plan\./);
    expect(text).toMatch(/takes \d+\.\d a week from here\./);
    expect(text).not.toMatch(/—/);
  });
});
