// Read-side helpers over the harvested data files (public/data/*.json).
import { getTown, miles, INCLUDED_TOWNS } from "../ri/towns.js";

const COUNTY = {
  "Bristol County": ["Barrington", "Bristol", "Warren"],
  "Kent County": ["Coventry", "East Greenwich", "Warwick", "West Greenwich", "West Warwick"],
  "Newport County": ["Jamestown", "Little Compton", "Middletown", "Newport", "Portsmouth", "Tiverton"],
  "Washington County": ["Charlestown", "Exeter", "Hopkinton", "Narragansett", "New Shoreham", "North Kingstown", "Richmond", "South Kingstown", "Westerly"],
};

export function countyOf(town) {
  for (const [county, towns] of Object.entries(COUNTY)) if (towns.includes(town)) return county;
  return getTown(town) ? "Providence County" : null;
}

/** Best available rent index for a place: ZIP, then town, then county. */
export function rentIndex(rents, town, zip) {
  const z = rents?.zori;
  if (!z || !town) return null;
  const out = [];
  if (zip && z.zip[zip] && z.zip[zip].town === town) out.push({ scope: `ZIP ${zip}`, level: "zip", ...z.zip[zip] });
  if (z.town[town]) out.push({ scope: town, level: "town", ...z.town[town] });
  const county = countyOf(town);
  if (county && z.county[county]) out.push({ scope: county, level: "county", ...z.county[county] });
  return out.length ? { primary: out[0], all: out, metroMultifamily: z.metroMultifamily } : null;
}

/** Everything known about asking rents for one bedroom count in one town. */
export function bedMarket({ rents, observations }, town, beds) {
  if (!town || beds === null || beds === undefined) return { listings: null, hud: null, observed: [] };
  const key = String(beds);
  const listings = rents?.listings?.town?.[town]?.byBed?.[key] || null;
  const hud = rents?.hud?.town?.[town]?.byBed?.[key] ?? null;
  const observed = (observations?.properties || [])
    .filter((p) => p.town === town)
    .flatMap((p) =>
      p.plans
        .filter((plan) => plan.beds === Number(beds) && plan.status === "advertised" && plan.price)
        .map((plan) => ({ property: p.name, price: plan.price, basis: p.priceBasis, sqftMin: plan.sqftMin, sqftMax: plan.sqftMax })),
    );
  return { listings, hud, observed };
}

export function observedRange(observed) {
  if (!observed.length) return null;
  const prices = observed.map((o) => o.price);
  return { min: Math.min(...prices), max: Math.max(...prices), properties: new Set(observed.map((o) => o.property)).size };
}

/** Building-level listing comps for a town (needs the listing feed). */
export function listingBuildings(rents, town) {
  return rents?.listings?.town?.[town]?.buildings || [];
}

/**
 * Proposed multifamily projects that could deliver into the same market:
 * the subject's town first, then towns whose center is within `radius` miles.
 */
export function supplyNear(supply, town, point, radius = 6) {
  const projects = supply?.projects || [];
  if (!town) return { projects: [], units: 0, towns: [] };
  const origin = point || (getTown(town) ? { lng: getTown(town).centroid[0], lat: getTown(town).centroid[1] } : null);
  const near = new Map([[town, 0]]);
  if (origin) {
    for (const t of INCLUDED_TOWNS) {
      const d = miles(origin, { lng: t.centroid[0], lat: t.centroid[1] });
      if (t.name !== town && d <= radius) near.set(t.name, d);
    }
  }
  const rows = projects
    .filter((p) => near.has(p.town))
    .map((p) => ({ ...p, sameTown: p.town === town, townDistance: near.get(p.town) }))
    .sort((a, b) => Number(b.sameTown) - Number(a.sameTown) || a.townDistance - b.townDistance || b.units - a.units);
  return { projects: rows, units: rows.reduce((n, p) => n + p.units, 0), towns: [...near.keys()] };
}

export function sourceById(rents, id) {
  return (rents?.sources || []).find((s) => s.id === id) || null;
}

const STREET_SUFFIX = { STREET: "ST", AVENUE: "AVE", ROAD: "RD", BOULEVARD: "BLVD", DRIVE: "DR", COURT: "CT", PLACE: "PL", LANE: "LN" };

export function addressKey(address) {
  return String(address || "")
    .toUpperCase()
    .split(",")[0]
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => STREET_SUFFIX[t] || t)
    .join(" ");
}

/**
 * Published asking rents for a specific building, matched by street address:
 * listing-derived medians first, then dated operator-page prices. Null when neither has it.
 */
export function publishedRents({ rents, observations }, town, address) {
  const key = addressKey(address);
  if (!key) return null;
  const listed = listingBuildings(rents, town).find((b) => addressKey(b.address) === key);
  if (listed) {
    return {
      source: "listings",
      name: null,
      asOf: listed.lastSeen,
      byBed: Object.fromEntries(Object.entries(listed.byBed).map(([bed, cell]) => [bed, cell.median])),
    };
  }
  const seen = (observations?.properties || []).find((p) => p.town === town && addressKey(p.address) === key);
  if (!seen) return null;
  const byBed = {};
  for (const plan of seen.plans) {
    if (!plan.price || plan.status !== "advertised") continue;
    byBed[plan.beds] = Math.min(byBed[plan.beds] ?? Infinity, plan.price);
  }
  return Object.keys(byBed).length ? { source: "operator", name: seen.name, asOf: observations.observedOn, byBed } : null;
}
