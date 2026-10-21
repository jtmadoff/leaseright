import { describe, it, expect } from "vitest";
import { sampleProject } from "../src/store/sample.js";
import { derivedActuals, todayTasks, unitStatuses } from "../src/core/leasing.js";
import { trackLeasing } from "../src/core/tracking.js";

describe("sample project", () => {
  const p = sampleProject("2026-10-21");
  it("is eight weeks into leasing with a saved baseline", () => {
    expect(p.plan.startDate).toBe("2026-08-24");
    expect(p.baselines).toHaveLength(1);
    expect(p.units).toHaveLength(64);
  });
  it("runs a little behind its plan, with work to do today", () => {
    const t = trackLeasing({ ...p, actuals: derivedActuals(p.prospects, "2026-10-21") }, p.baselines[0]);
    expect(t.actualLeased).toBeGreaterThan(10);
    expect(t.actualLeased).toBeLessThan(40);
    const tasks = todayTasks(p, "2026-10-21");
    expect(tasks.some((x) => x.kind === "tour")).toBe(true);
    expect(tasks.some((x) => x.kind === "follow")).toBe(true);
  });
  it("never puts two leases on one unit", () => {
    const leased = p.prospects.filter((x) => x.stage === "leased" || x.stage === "applied" || x.stage === "approved").map((x) => x.unitId);
    expect(new Set(leased).size).toBe(leased.length);
    const st = unitStatuses(p.units, p.prospects, "2026-10-21");
    expect(st.filter((u) => u.status === "leased").length).toBe(p.prospects.filter((x) => x.stage === "leased").length);
  });
});
