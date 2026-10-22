import { describe, it, expect } from "vitest";
import { upgradeProject, sanitizeProject, reducer, newProject, newActual, isBlank, practiceCopy } from "../src/store/store.jsx";
import { startSim } from "../src/core/sim.js";

describe("project record", () => {
  it("gives projects saved before the tracker an empty log and a sensible view", () => {
    const old = { ...newProject(), actuals: undefined, view: undefined, baselines: [{ id: "b" }] };
    const p = upgradeProject(old);
    expect(p.actuals).toEqual([]);
    expect(p.view).toBe("home");
    expect(upgradeProject({ ...old, baselines: [] }).view).toBe("plan");
  });
  it("keeps valid weekly rows from a backup and drops malformed ones", () => {
    const raw = { ...newProject(), actuals: [{ weekEnding: "2026-10-18", leases: 3 }, { weekEnding: "Oct 18", leases: 9 }, null] };
    const p = sanitizeProject(raw);
    expect(p.actuals).toHaveLength(1);
    expect(p.actuals[0]).toMatchObject({ weekEnding: "2026-10-18", leases: "3" });
  });
  it("saves, replaces and deletes weekly rows", () => {
    const p = newProject({ name: "A" });
    let s = { projects: [p], activeId: p.id };
    const row = newActual({ weekEnding: "2026-10-18", leases: "3" });
    s = reducer(s, { type: "actual-save", id: p.id, row });
    s = reducer(s, { type: "actual-save", id: p.id, row: { ...row, leases: "5" } });
    expect(s.projects[0].actuals).toHaveLength(1);
    expect(s.projects[0].actuals[0].leases).toBe("5");
    s = reducer(s, { type: "actual-delete", id: p.id, rowId: row.id });
    expect(s.projects[0].actuals).toHaveLength(0);
  });
  it("does not treat a project with logged weeks as blank", () => {
    expect(isBlank({ ...newProject(), actuals: [newActual({ weekEnding: "2026-10-18" })] })).toBe(false);
  });
  it("makes a practice copy that runs on the simulated backend and leaves the original alone", () => {
    const real = { ...newProject({ name: "258 Pine", unitMix: [{ id: "a", label: "1 bedroom", beds: 1, count: "4", rent: "1900", leased: "0" }], plan: { ...newProject().plan, startDate: "2027-03-01" } }), prospects: [{ id: "x", stage: "lead" }] };
    const copy = practiceCopy(real, "2026-10-22", startSim);
    expect(copy.id).not.toBe(real.id);
    expect(copy.name).toBe("258 Pine (practice)");
    expect(copy.prospects).toEqual([]);
    expect(copy.units).toHaveLength(4);
    expect(copy.sim).toMatchObject({ on: true, now: "2027-03-01" });
    expect(real.prospects).toHaveLength(1);
    expect(real.sim).toBeUndefined();
  });
});
