// A fictional project eight weeks into leasing, so every screen can be tried with real-looking work.
// Everything is generated from a fixed seed relative to today; nothing here is a real building or person.

import { newProject, newRow, newProspect } from "./store.jsx";
import { calculate, parseDate, isoDate, DAY_MS } from "../core/model.js";
import { generateUnits, moveProspect } from "../core/leasing.js";
import { getTown, isIncluded } from "../ri/towns.js";
import { makeBaseline } from "../views/ReviewStep.jsx";
import { localToday } from "../core/format.js";

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Maya", "Jordan", "Priya", "Marcus", "Elena", "Sam", "Olivia", "Diego", "Hannah", "Kwame", "Grace", "Leo", "Nina", "Owen", "Sofia", "Andre", "Claire", "Mateo", "Ivy", "Theo", "Rosa", "Ben", "Lena", "Felix", "Amara", "Jonah", "Tess", "Ravi", "Zoe", "Caleb"];
const LAST = "ABCDFGHJKLMNPRSTVWY";
const SOURCES = [["Zillow", 30], ["Apartments.com", 22], ["Website", 18], ["Walk-in", 8], ["Referral", 10], ["Social", 7], ["Broker", 5]];
const REASONS = ["Price", "Timing", "Chose another building", "No response", "Unit or layout"];

export function sampleProject(todayIso = localToday()) {
  const r = rng(20261021);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const weighted = (pairs) => {
    let x = r() * pairs.reduce((n, [, w]) => n + w, 0);
    for (const [v, w] of pairs) if ((x -= w) <= 0) return v;
    return pairs[0][0];
  };
  const today = parseDate(todayIso);
  const d = (ms) => isoDate(ms);
  // Leasing began on the Monday eight weeks back.
  const back = (new Date(today).getUTCDay() + 6) % 7;
  const start = today - (back + 56) * DAY_MS;
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
  const units = generateUnits(mix, { perFloor: 16 });
  const taken = new Set();
  const unitFor = (beds) => units.find((u) => u.beds === beds && !taken.has(u.id));

  const prospects = [];
  const days = Math.round((today - start) / DAY_MS);
  for (let k = 0; k <= days; k++) {
    const leadsToday = Math.floor(r() * 5); // about two a day
    for (let j = 0; j < leadsToday; j++) {
      const created = start + k * DAY_MS;
      const beds = weighted([[0, 12], [1, 50], [2, 31], [3, 7]]);
      const rent = [1650, 1950, 2450, 2900][beds];
      let p = newProspect({
        name: `${pick(FIRST)} ${pick(LAST.split(""))}.`,
        phone: `(401) 555-${String(Math.floor(r() * 9000) + 1000)}`,
        email: "",
        source: weighted(SOURCES),
        beds: String(beds),
        budget: String(Math.round((rent * (0.9 + r() * 0.3)) / 25) * 25),
        moveIn: d(created + (14 + Math.floor(r() * 35)) * DAY_MS),
        createdAt: d(created),
      });
      p.history = [{ at: d(created), text: `New lead from ${p.source}` }];
      let t = created;
      const step = (lo, hi) => (t += (lo + Math.floor(r() * (hi - lo + 1))) * DAY_MS);
      const due = (ms) => ms <= today;
      // Tour?
      if (r() < 0.55) {
        step(1, 5);
        const tourAt = `${d(t)}T${pick(["10:00", "11:30", "13:00", "15:30", "17:00"])}`;
        p = moveProspect(p, "tour", d(Math.min(created + DAY_MS, today)), { tourAt });
        if (t < today) {
          if (r() < 0.1) {
            p = moveProspect(p, "lost", d(t), { lostReason: "No response" });
          } else {
            p = moveProspect(p, "toured", d(t));
            if (r() < 0.6) {
              step(0, 3);
              const unit = unitFor(beds);
              if (!unit) {
                if (due(t)) p = moveProspect(p, "lost", d(t), { lostReason: "Unit or layout" });
              } else if (due(t)) {
                taken.add(unit.id);
                p = moveProspect(p, "applied", d(t), { unitId: unit.id });
                step(1, 3);
                if (r() < 0.9) {
                  if (due(t)) {
                    p = moveProspect(p, "approved", d(t));
                    step(1, 4);
                    if (due(t)) p = moveProspect(p, "leased", d(t), { leaseRent: String(unit.rent), freeMonths: "0.5" });
                  }
                } else if (due(t)) {
                  taken.delete(unit.id);
                  p = moveProspect(p, "lost", d(t), { lostReason: "Did not qualify" });
                }
              }
            } else if (today - t > 7 * DAY_MS) {
              p = moveProspect(p, "lost", d(t + 7 * DAY_MS), { lostReason: pick(REASONS) });
            } else {
              p.nextAt = d(Math.max(today + DAY_MS, t + 3 * DAY_MS));
              p.nextNote = "Check in after the tour";
            }
          }
        }
      } else if (today - created > 6 * DAY_MS) {
        p = moveProspect(p, "lost", d(created + 6 * DAY_MS), { lostReason: pick(["No response", "Price", "Timing"]) });
      } else if (today - created > DAY_MS) {
        p.nextAt = d(Math.max(today + DAY_MS, created + 3 * DAY_MS));
        p.nextNote = "Second touch";
      }
      prospects.push(p);
    }
  }
  // Make sure today has work on it: one tour this afternoon and one follow-up due.
  const open = prospects.filter((p) => p.stage === "lead");
  if (open[0]) {
    const i = prospects.indexOf(open[0]);
    prospects[i] = moveProspect({ ...open[0], nextAt: "" }, "tour", todayIso, { tourAt: `${todayIso}T15:30` });
  }
  if (open[1]) Object.assign(open[1], { nextAt: todayIso, nextNote: "Send the two-bedroom floor plan" });
  if (open[2]) Object.assign(open[2], { nextAt: d(today - 2 * DAY_MS), nextNote: "Call back about parking" });
  // And applications in flight: one waiting on a decision, one approved and waiting to sign.
  const toured = prospects.filter((p) => p.stage === "toured" && p.touredAt);
  [["applied", 3], ["approved", 2]].forEach(([stage, ago], k) => {
    const p = toured[k];
    const unit = p && unitFor(Number(p.beds));
    if (!unit) return;
    taken.add(unit.id);
    const i = prospects.indexOf(p);
    let q = moveProspect({ ...p, nextAt: "" }, "applied", d(today - (ago + 1) * DAY_MS), { unitId: unit.id });
    if (stage === "approved") q = moveProspect(q, "approved", d(today - ago * DAY_MS));
    prospects[i] = q;
  });
  prospects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    ...project,
    baselines: [baseline],
    units,
    prospects,
    view: "leasing",
    leasingTab: "today",
  };
}
