// Rhode Island coverage registry. Generated data lives in towns.json (tools/build_towns.py).
import TOWNS from "./towns.json";

export const ALL_TOWNS = TOWNS;
export const INCLUDED_TOWNS = TOWNS.filter((t) => t.included);
const BY_NAME = new Map(TOWNS.map((t) => [t.name.toLowerCase(), t]));
const BY_MCODE = new Map(TOWNS.map((t) => [t.mcode, t]));

export function getTown(name) {
  return BY_NAME.get(String(name || "").trim().toLowerCase()) || null;
}

export function townByMcode(code) {
  return BY_MCODE.get(Number(code)) || null;
}

export function isIncluded(name) {
  return !!getTown(name)?.included;
}

/** Great-circle distance in miles between two { lat, lng } points. */
export function miles(a, b) {
  if (!a || !b) return null;
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** Other covered towns whose center is within `radius` miles of a point, nearest first. */
export function neighbors(point, { radius = 7, exclude } = {}) {
  return INCLUDED_TOWNS.filter((t) => t.name !== exclude)
    .map((t) => ({ town: t, distance: miles(point, { lng: t.centroid[0], lat: t.centroid[1] }) }))
    .filter((x) => x.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map((x) => x.town);
}

export const TIER_LABEL = {
  full: "Parcel, use, units and building record",
  basic: "Parcel, address and land use",
  boundary: "Parcel outline",
};

/** One line describing what public record is available for a town. */
export function coverageSummary(town) {
  if (!town) return "";
  if (!town.parcel) return "No public parcel service; zoning comes from the state layer";
  const bits = [TIER_LABEL[town.parcel.tier] || "Parcel record"];
  if (town.parcel.dataYear) bits.push(`data from ${town.parcel.dataYear}`);
  return bits.join(" · ");
}

export function coverageCounts() {
  const counts = { full: 0, basic: 0, boundary: 0, none: 0 };
  for (const t of INCLUDED_TOWNS) counts[t.parcel ? t.parcel.tier : "none"]++;
  return counts;
}
