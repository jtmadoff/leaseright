// Comparable-building selection. Similarity first, then distance: a short list of
// buildings that resemble the subject, never a dump of everything nearby.

export const COMP_RULES = {
  minUnits: 10, // smaller buildings are not lease-up competition
  maxSizeRatio: 4, // a comp is between a quarter and four times the subject's size
  limit: 6,
  minScore: 40, // weaker matches are not worth showing
  weights: { size: 0.45, vintage: 0.3, distance: 0.25 },
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** What we know about the subject, from the project and its confirmed parcel. */
export function subjectProfile(project, year = new Date().getFullYear()) {
  // Planned unit count first; for an existing building fall back to the units on record.
  const units = Number(project.totalUnits) > 0 ? Number(project.totalUnits) : project.parcel?.units || null;
  const type =
    project.projectType === "New construction"
      ? "new"
      : project.projectType === "Conversion / adaptive reuse"
        ? "conversion"
        : project.projectType === "Existing rental property"
          ? "existing"
          : null;
  return { units, type, yearBuilt: type === "existing" ? project.parcel?.yearBuilt || null : null, year };
}

function vintageScore(subject, yearBuilt) {
  if (!subject.type) return null; // no basis to judge
  if (!yearBuilt) return 0.35;
  if (subject.type === "new") return clamp01(1 - (subject.year - yearBuilt) / 60);
  if (subject.type === "conversion") return yearBuilt <= 1950 ? 1 : clamp01(1 - (yearBuilt - 1950) / 50);
  if (!subject.yearBuilt) return 0.5;
  return clamp01(1 - Math.abs(subject.yearBuilt - yearBuilt) / 50);
}

export function scoreBuilding(subject, building, radius) {
  const parts = {};
  const reasons = [];
  if (subject.units && building.units) {
    const ratio = Math.max(subject.units, building.units) / Math.min(subject.units, building.units);
    parts.size = clamp01(1 - Math.log(ratio) / Math.log(COMP_RULES.maxSizeRatio));
    reasons.push(`${building.units} units vs your ${subject.units}`);
  } else if (building.units) {
    reasons.push(`${building.units} units`);
  }
  const v = vintageScore(subject, building.yearBuilt);
  if (v !== null) parts.vintage = v;
  if (building.yearBuilt) {
    reasons.push(
      subject.type === "new" && subject.year - building.yearBuilt <= 15
        ? `Recent build (${building.yearBuilt})`
        : subject.type === "conversion" && building.yearBuilt <= 1950
          ? `Older structure (${building.yearBuilt})`
          : `Built ${building.yearBuilt}`,
    );
  }
  parts.distance = clamp01(1 - building.distance / radius);
  reasons.push(`${building.distance.toFixed(1)} mi`);
  let weight = 0;
  let total = 0;
  for (const [key, w] of Object.entries(COMP_RULES.weights)) {
    if (parts[key] === undefined) continue;
    weight += w;
    total += w * parts[key];
  }
  return { score: weight ? Math.round((total / weight) * 100) : 0, parts, reasons };
}

/**
 * Rank candidate apartment buildings against the subject.
 * Candidates need { units, yearBuilt, distance, parcelId, address }.
 * Returns the short list plus counts explaining what was filtered out.
 */
export function similarBuildings(subject, candidates, { radius = 3, limit = COMP_RULES.limit } = {}) {
  const known = candidates.filter((c) => c.units && c.units >= COMP_RULES.minUnits);
  const sized = subject.units
    ? known.filter((c) => Math.max(c.units, subject.units) / Math.min(c.units, subject.units) <= COMP_RULES.maxSizeRatio)
    : known;
  const ranked = sized
    .map((c) => ({ ...c, ...scoreBuilding(subject, c, radius) }))
    .filter((c) => c.score >= COMP_RULES.minScore)
    .sort((a, b) => b.score - a.score || a.distance - b.distance || String(a.parcelId).localeCompare(String(b.parcelId)));
  return {
    buildings: ranked.slice(0, limit),
    considered: candidates.length,
    withUnits: known.length,
    inSizeBand: sized.length,
    matched: ranked.length,
  };
}
