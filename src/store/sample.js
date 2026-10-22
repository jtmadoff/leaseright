// A fictional project eight weeks into leasing, so every screen can be tried with real-looking work.
// Its history is produced by the simulated backend itself: eight weeks of leads, agent replies,
// tours, screening and signatures, with a person answering handoffs and deciding applications
// each morning. The last two days are left for the user, so there is work waiting.
// Nothing here is a real building or person.

import { newProject, newRow } from "./store.jsx";
import { calculate, parseDate, isoDate, DAY_MS } from "../core/model.js";
import { generateUnits, moveProspect } from "../core/leasing.js";
import { applicationCheck } from "../core/ops.js";
import { startSim, advanceDay } from "../core/sim.js";
import { getTown, isIncluded } from "../ri/towns.js";
import { makeBaseline } from "../views/ReviewStep.jsx";
import { localToday } from "../core/format.js";

const REPLY = {
  "Asked to negotiate rent": "Thanks for asking. Rents are holding for now, but the half month free applies to any 12-month lease. Want to come see it this week?",
  "Special request": "Yes, we can work with that. I'll call you this afternoon to sort out the details.",
  "Confirm the tour time": "Confirmed, see you then.",
};

/** The person's part each morning: answer what the agent handed over and decide applications. */
function morning(project) {
  const now = project.sim.now;
  return {
    ...project,
    prospects: project.prospects.map((p) => {
      if (!p.needsYou) return p;
      if (p.stage === "applied") {
        const unit = project.units.find((u) => u.id === p.unitId);
        const check = applicationCheck(p, project.policy, unit?.rent);
        if (check.status === "review") return { ...moveProspect(p, "lost", now, { lostReason: "Did not qualify" }), needsYou: null };
        return { ...moveProspect(p, "approved", now), needsYou: null };
      }
      const text = REPLY[p.needsYou.reason] || "Thanks, happy to help.";
      return { ...p, needsYou: null, messages: [...p.messages, { id: `${p.id}-p${p.messages.length}`, at: `${now}T09:${String(10 + (p.messages.length % 40)).padStart(2, "0")}`, dir: "out", channel: "sms", text }] };
    }),
  };
}

export function sampleProject(todayIso = localToday(), data = null) {
  const today = parseDate(todayIso);
  const d = (ms) => isoDate(ms);
  // Leasing began on the Monday eight weeks back.
  const back = (new Date(today).getUTCDay() + 6) % 7;
  const start = today - (back + 56) * DAY_MS;
  const days = Math.round((today - start) / DAY_MS);
  const town = getTown("Pawtucket");

  const mix = [
    newRow(0, { label: "Studio", count: "8", sqft: "450", rent: "1650" }),
    newRow(1, { label: "1 bedroom", count: "32", sqft: "680", rent: "1950" }),
    newRow(2, { label: "2 bedroom", count: "20", sqft: "950", rent: "2450" }),
    newRow(3, { label: "3 bedroom", count: "4", sqft: "1200", rent: "2900" }),
  ];
  const project = newProject({
    name: "Riverside Lofts (sample)",
    sample: true,
    stage: "funded_prelaunch",
    projectType: "Conversion / adaptive reuse",
    sponsor: "Sample Sponsor LLC",
    town: "Pawtucket",
    zip: "02860",
    location: { lat: town.centroid[1], lng: town.centroid[0], source: "sample" },
    totalUnits: "64",
    unitMix: mix,
    plan: {
      startDate: d(start),
      targetDate: "",
      targetOccupancy: "93",
      leasesPerWeek: "3.5",
      leaseTerm: "12",
      freeMonths: "0.5",
      moveInLag: "21",
      monthlyCarry: "95000",
      marketing: "40000",
      staffing: "60000",
      notes: "Sample project with made-up numbers for trying LeaseRight.",
    },
  });
  const result = calculate(project, { townIncluded: isIncluded });
  const baseline = { ...makeBaseline(project, result), approvedAt: new Date(start - 7 * DAY_MS).toISOString() };
  const ago = (n) => d(today - n * DAY_MS);

  let p = {
    ...project,
    premium: "18",
    units: generateUnits(mix, { perFloor: 16 }),
    platforms: [
      { id: "zillow", name: "Zillow", active: true, cost: "299", url: "https://www.zillow.com/", syncedAt: "" },
      { id: "apartments-com", name: "Apartments.com", active: true, cost: "450", url: "", syncedAt: "" },
      { id: "zumper", name: "Zumper", active: true, cost: "0", url: "https://www.zumper.com/", syncedAt: "" },
      { id: "realtor-com", name: "Realtor.com", active: false, cost: "", url: "", syncedAt: "" },
      { id: "facebook-marketplace", name: "Facebook Marketplace", active: true, cost: "0", url: "https://www.facebook.com/marketplace/", syncedAt: "" },
      { id: "website", name: "Website", active: true, cost: "", url: "", syncedAt: "" },
    ],
    concessions: [{ id: "c-half", name: "Half month free", months: "0.5", beds: [], startsAt: d(start), endsAt: ago(-5), note: "Launch special on every unit type" }],
    policy: { minCredit: 640, incomeMultiple: 3 },
    priceChangedAt: d(start),
    baselines: [baseline],
    prospects: [],
    view: "today",
    leasingTab: "today",
  };
  p = startSim(p, d(start), 20261021);
  for (let k = 0; k < days; k++) {
    // The last two mornings are left for whoever opens the sample.
    if (k < days - 2) p = morning(p);
    p = advanceDay(p, data).project;
  }
  return { ...p, sim: { ...p.sim, lastRun: { days: 1, to: p.sim.now } } };
}
