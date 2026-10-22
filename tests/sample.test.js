import { describe, it, expect } from "vitest";
import { sampleProject } from "../src/store/sample.js";
import { derivedActuals, todayTasks, unitStatuses } from "../src/core/leasing.js";
import { trackLeasing } from "../src/core/tracking.js";
import { decisions } from "../src/core/ops.js";
import { needsYou } from "../src/core/sim.js";
import fs from "fs";

const data = { rents: JSON.parse(fs.readFileSync(new URL("../public/data/rents.json", import.meta.url))), observations: null };

describe("sample project", () => {
  const p = sampleProject("2026-10-21", data);
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
  });
  it("was run by the simulated backend up to this morning, with handoffs waiting", () => {
    expect(p.sim.now).toBe("2026-10-21");
    expect(p.sim.log).toHaveLength(58); // from Monday Aug 24 to the morning of Wednesday Oct 21
    expect(needsYou(p).length).toBeGreaterThan(0);
    const kinds = decisions(p, data, "2026-10-21", trackLeasing({ ...p, actuals: derivedActuals(p.prospects, "2026-10-21") }, p.baselines[0])).map((x) => x.kind);
    expect(kinds).toContain("handoff");
    expect(kinds).toContain("pricing"); // the 2BRs sit well above what Pawtucket pays
  });
  it("never puts two leases on one unit", () => {
    const leased = p.prospects.filter((x) => x.stage === "leased" || x.stage === "applied" || x.stage === "approved").map((x) => x.unitId);
    expect(new Set(leased).size).toBe(leased.length);
    const st = unitStatuses(p.units, p.prospects, "2026-10-21");
    expect(st.filter((u) => u.status === "leased").length).toBe(p.prospects.filter((x) => x.stage === "leased").length);
  });
});
