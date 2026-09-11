import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const selectorsSource = await readFile(
  new URL("../components/selectors.jsx", import.meta.url),
  "utf8"
);
const context = vm.createContext({ console, window: {} });
vm.runInContext(selectorsSource, context, { filename: "components/selectors.jsx" });
const {
  brokerEconomics,
  deriveLeadStage,
  stageCounts,
  variance,
} = context.window.Selectors;

test("brokerEconomics calculates monthly exclusive and hybrid costs", () => {
  const result = brokerEconomics({
    units: 260,
    avgRent: 2180,
    feePct: 0.5,
    feePeriod: "month",
    inHouseMonthly: 18500,
    hybridMonthly: 9500,
    months: 9,
    locatorShareOfLeases: 0.4,
    carryPerMonth: 227000,
  });

  assert.equal(result.exclusiveCost, 283400);
  assert.equal(result.inHouseCost, 166500);
  assert.equal(result.hybridCommission, 113360);
  assert.equal(result.hybridCost, 198860);
  assert.equal(result.savingsHybrid, 84540);
});

test("deriveLeadStage uses a submitted application to derive applied", () => {
  const seed = {
    applications: [{ id: "application-1", status: "submitted" }],
    leases: [],
    tours: [],
  };
  const lead = {
    id: "lead-1",
    pipelineStage: "contacted",
    applicationId: "application-1",
  };

  assert.equal(deriveLeadStage(lead, seed), "applied");
});

test("stageCounts returns exact buckets for derived stages and lost leads", () => {
  const leads = [
    { id: "new", pipelineStage: "new" },
    { id: "contacted", pipelineStage: "contacted" },
    { id: "toured", pipelineStage: "new", tourIds: ["tour-1"] },
    { id: "lost", pipelineStage: "approved", lostReason: "Not moving" },
  ];
  const seed = {
    applications: [],
    leases: [],
    tours: [{ id: "tour-1", status: "completed" }],
  };

  assert.deepEqual(
    JSON.parse(JSON.stringify(stageCounts(leads, seed))),
    { new: 1, contacted: 1, toured: 1, applied: 0, approved: 0, signed: 0, lost: 1 }
  );
});

test("variance returns exact absolute and percentage differences", () => {
  const result = variance({ plan: 2000, actual: 2150 });

  assert.equal(result.plan, 2000);
  assert.equal(result.actual, 2150);
  assert.equal(result.delta, 150);
  assert.equal(result.pct, 0.075);
});
