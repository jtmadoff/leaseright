// Public, read-only ArcGIS REST lookups for Rhode Island. No keys, no paid feeds.
// One generic adapter reads every town through the field map in towns.json.
import { getTown, miles, townByMcode, ALL_TOWNS as INCLUDED_OR_ALL } from "./towns.js";

export const STATE_ZONING =
  "https://services2.arcgis.com/S8zZg9pg23JUEexQ/arcgis/rest/services/RI_Zoning/FeatureServer/1";
export const E911_SITES = "https://risegis.ri.gov/hosting/rest/services/E911/e911Sites/MapServer/0";

async function query(layerUrl, params, { signal, fetcher = fetch, post = false } = {}) {
  const body = new URLSearchParams({ f: "json", ...params });
  const response = post
    ? await fetcher(`${layerUrl}/query`, { method: "POST", body, signal })
    : await fetcher(`${layerUrl}/query?${body}`, { signal });
  if (!response.ok) throw new Error("The public records service did not respond.");
  const data = await response.json();
  if (data.error) throw new Error("The public records service returned an error.");
  if (!Array.isArray(data.features)) throw new Error("The public records service returned no records list.");
  return data;
}

// ---------- normalizing ----------

const text = (v) => (v === null || v === undefined || /^(null|n\/a)$/i.test(String(v).trim()) ? "" : String(v).trim());

function positive(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (m, lead, c) => lead + c.toUpperCase()) // not after an apostrophe: "Brown's"
    .replace(/^(\d+)\s?([a-z])(?=\s)/, (m, n, c) => n + c.toUpperCase()) // lettered house numbers: "29A"
    .replace(/\b(Ne|Nw|Se|Sw|Ri)\b/g, (m) => m.toUpperCase());
}

/** '0530 NARRAGANSETT AVE ' -> '530 Narragansett Ave' */
export function cleanAddress(parts) {
  const joined = parts
    .map((p) => text(p))
    .filter((p) => p && p !== "0")
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/^0+(?=\d)/, "")
    .trim();
  return joined ? titleCase(joined) : "";
}

function validRings(rings) {
  return (
    Array.isArray(rings) &&
    rings.length > 0 &&
    rings.every(
      (r) =>
        Array.isArray(r) &&
        r.length >= 4 &&
        r.every((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90),
    )
  );
}

function ringsExtent(rings) {
  const pts = rings.flat();
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
}

export function ringsCenter(rings) {
  const pts = (rings || []).flat();
  if (!pts.length) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { lng: (minX + maxX) / 2, lat: (minY + maxY) / 2 };
}

/** One ArcGIS feature to the app's parcel shape, through the town's field map. */
export function normalizeParcel(town, feature) {
  const a = feature.attributes || {};
  const f = town.parcel.fields;
  const get = (key) => (f[key] ? a[f[key]] : null);
  const rings = feature.geometry?.rings;
  const oid = a.OBJECTID ?? a.OBJECTID_1 ?? a.FID ?? a.ObjectId ?? null;
  // Rows without a parcel number are rights-of-way or citywide catch-all polygons, not lots.
  const parcelId = text(get("parcelId"));
  if (!parcelId) return null;
  let units = positive(get("units"));
  const guard = town.parcel.unitsGuard;
  if (guard && units !== null) {
    const g = positive(a[guard.field]);
    if (g === null || g > guard.max) units = null;
  }
  const yearBuilt = positive(get("yearBuilt"));
  const lotSqft = positive(get("lotSqft"));
  const lotAcres = positive(get("lotAcres"));
  return {
    town: town.name,
    oid,
    parcelId,
    address: f.address ? cleanAddress(f.address.map((name) => a[name])) : "",
    zoning: text(get("zoning")),
    lotSqft: lotSqft ?? (lotAcres ? Math.round(lotAcres * 43560) : null),
    useDesc: text(get("useDesc")),
    useCode: text(get("useCode")),
    units,
    yearBuilt: yearBuilt && yearBuilt >= 1650 && yearBuilt <= 2100 ? yearBuilt : null,
    floors: positive(get("floors")),
    buildingSqft: positive(get("buildingSqft")),
    taxYear: text(get("taxYear")),
    rings: validRings(rings) ? rings : null,
    records: 1,
  };
}

/**
 * Assessor layers stack one polygon per account, so a condominium returns many
 * features at one point. Collapse them to one parcel and keep the richest record.
 */
export function dedupeParcels(parcels) {
  const groups = new Map();
  for (const p of parcels) {
    if (!p) continue;
    const existing = groups.get(p.parcelId);
    if (!existing) {
      groups.set(p.parcelId, { ...p });
      continue;
    }
    existing.records += 1;
    for (const key of ["address", "zoning", "useDesc", "useCode", "taxYear"]) if (!existing[key] && p[key]) existing[key] = p[key];
    for (const key of ["units", "buildingSqft", "floors", "lotSqft"]) {
      if (p[key] !== null && (existing[key] === null || p[key] > existing[key])) existing[key] = p[key];
    }
    if (p.yearBuilt !== null && (existing.yearBuilt === null || p.yearBuilt < existing.yearBuilt)) existing.yearBuilt = p.yearBuilt;
    if (!existing.rings && p.rings) existing.rings = p.rings;
  }
  return [...groups.values()];
}

// ---------- parcel lookup ----------

/**
 * Find the parcel at a point for a town.
 * status: 'none' (town has no public service) | 'ready' | 'empty'
 */
export async function lookupParcel(townName, point, options = {}) {
  const town = getTown(townName);
  if (!town?.parcel) return { status: "none", parcels: [], town: town?.name || townName };
  const run = async (nearby) => {
    const params = {
      geometry: `${point.lng},${point.lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      resultRecordCount: "200",
    };
    if (nearby) {
      params.distance = "25";
      params.units = "esriSRUnit_Meter";
    }
    const data = await query(town.parcel.url, params, options);
    return dedupeParcels(data.features.map((ft) => normalizeParcel(town, ft)));
  };
  let parcels = await run(false);
  let match = "intersects";
  if (!parcels.length) {
    parcels = await run(true);
    match = "nearby";
  }
  // Smallest footprint first: where lots overlap, the most specific one is the likely match.
  parcels = parcels
    .filter((p) => p.rings)
    .sort((a, b) => ringsExtent(a.rings) - ringsExtent(b.rings))
    .slice(0, 12);
  return {
    status: parcels.length ? "ready" : "empty",
    match,
    parcels,
    town: town.name,
    tier: town.parcel.tier,
    source: town.parcel.url,
    retrievedAt: new Date().toISOString(),
  };
}

/** Apartment-class parcels within `radiusMiles` of a point, for one town. Units may be unknown. */
export async function nearbyApartments(townName, point, radiusMiles = 3, options = {}) {
  const town = getTown(townName);
  if (!town?.parcel?.apartmentWhere) return { town: townName, supported: false, parcels: [], truncated: false };
  const data = await query(
    town.parcel.url,
    {
      where: town.parcel.apartmentWhere,
      geometry: `${point.lng},${point.lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      distance: String(Math.round(radiusMiles * 1609.344)),
      units: "esriSRUnit_Meter",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      geometryPrecision: "5",
      maxAllowableOffset: "0.0002",
      resultRecordCount: String(Math.min(town.parcel.maxRecordCount, 2000)),
    },
    options,
  );
  const parcels = dedupeParcels(data.features.map((ft) => normalizeParcel(town, ft)))
    .map((p) => {
      const center = ringsCenter(p.rings);
      const { rings, ...rest } = p;
      return { ...rest, center, distance: miles(point, center) };
    })
    .filter((p) => p.distance !== null && p.distance <= radiusMiles);
  return {
    town: town.name,
    supported: true,
    hasUnits: !!town.parcel.fields.units,
    parcels,
    truncated: !!data.exceededTransferLimit,
    dataYear: town.parcel.dataYear,
  };
}

// ---------- statewide zoning (also tells us the town) ----------

export async function lookupZoning(point, options = {}) {
  const data = await query(
    STATE_ZONING,
    {
      geometry: `${point.lng},${point.lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "MUNI_NAME,ZONE_CODE,ZONE_DESC,CZONE_CODE,MIN_LOT_SF,DENSITY",
      returnGeometry: "false",
      resultRecordCount: "5",
    },
    options,
  );
  const zones = data.features
    .map((ft) => ft.attributes || {})
    .map((a) => ({
      // "Quonset" is the business park inside North Kingstown.
      town: text(a.MUNI_NAME) === "Quonset" ? "North Kingstown" : text(a.MUNI_NAME),
      code: text(a.ZONE_CODE),
      description: text(a.ZONE_DESC),
      generalClass: text(a.CZONE_CODE),
      minLotSqft: positive(a.MIN_LOT_SF),
      density: text(a.DENSITY),
    }))
    .filter((z) => z.town);
  return { zones, town: zones[0]?.town || null, source: STATE_ZONING, retrievedAt: new Date().toISOString() };
}

// ---------- statewide address search (RI E-911 address points) ----------

const STREET_TYPES = new Set(
  ("ST STREET AV AVE AVENUE RD ROAD DR DRIVE LN LANE CT COURT WY WAY TRL TRAIL CIR CIRCLE PIKE BLVD BOULEVARD HWY HIGHWAY " +
    "TERR TER TERRACE PL PLACE PKWY PARKWAY RUN TPKE TURNPIKE SQ SQUARE ROW PLZ PLAZA EXT").split(" "),
);
const DIRECTIONS = { N: "N", NORTH: "N", S: "S", SOUTH: "S", E: "E", EAST: "E", W: "W", WEST: "W" };
const DISPLAY_TYPE = { Av: "Ave", Wy: "Way", Terr: "Ter", Tpke: "Tpke" };

const sqlText = (s) => s.replace(/'/g, "''");

/**
 * '300 Sixth Avenue, East Greenwich' -> { number: '300', names: ['SIXTH'], direction: null, town }
 * The E-911 file stores the street name on its own (SN), so the search matches on house number
 * plus name and never depends on how a street type is abbreviated ("AV", "AVE", "WY").
 */
export function parseAddressQuery(input) {
  const [first, ...rest] = String(input || "").split(",");
  let tokens = first.toUpperCase().replace(/[’`]/g, "'").replace(/[^A-Z0-9\s'-]/g, " ").split(/\s+/).filter(Boolean);
  let town = null;
  const after = rest.join(" ").replace(/\b(RI|RHODE ISLAND)\b.*$/i, "").trim();
  if (after) town = INCLUDED_OR_ALL.find((t) => t.name.toLowerCase() === after.toLowerCase()) || INCLUDED_OR_ALL.find((t) => t.name.toLowerCase().startsWith(after.toLowerCase())) || null;
  if (!town) {
    // A town typed without a comma: "100 main st pawtucket", "300 sixth ave east greenwich".
    for (const size of [2, 1]) {
      if (tokens.length - size < 2) continue;
      const tail = tokens.slice(-size).join(" ").toLowerCase();
      const hit = INCLUDED_OR_ALL.find((t) => t.name.toLowerCase() === tail);
      if (hit) {
        town = hit;
        tokens = tokens.slice(0, -size);
        break;
      }
    }
  }
  if (tokens.length < 2 || !/^\d+[A-Z]?$/.test(tokens[0])) return null;
  const number = tokens[0];
  let words = tokens.slice(1);
  // "10 Park Row West": a trailing direction is stored apart from the street name.
  if (words.length > 1 && DIRECTIONS[words[words.length - 1]]) words = words.slice(0, -1);
  while (words.length > 1 && STREET_TYPES.has(words[words.length - 1])) words = words.slice(0, -1);
  const direction = words.length > 1 && DIRECTIONS[words[0]] ? DIRECTIONS[words[0]] : null;
  const names = [words.join(" ")];
  if (direction) names.push(words.slice(1).join(" "));
  // "Browns Ln" is stored as "BROWN'S": also try the possessive when a word ends in S.
  for (const name of [...names]) if (/[A-Z]S$/.test(name) && !name.includes("'")) names.push(name.replace(/S$/, "'S"));
  if (names[0].replace(/'/g, "").length < 2) return null;
  // Lettered house numbers are stored with a space: "29 A".
  const lettered = number.match(/^(\d+)([A-Z])$/);
  const numbers = lettered ? [number, `${lettered[1]} ${lettered[2]}`] : [number];
  return { number, numbers, names, direction, town };
}

function e911Row(feature) {
  const a = feature.attributes || {};
  const town = townByMcode(a.MCode);
  const g = feature.geometry;
  if (!g || !Number.isFinite(g.x) || !Number.isFinite(g.y)) return null;
  const street = cleanAddress([a.PrimaryAdd]).replace(/\b(Av|Wy|Terr)\b/g, (m) => DISPLAY_TYPE[m]);
  const townName = town?.name || titleCase(text(a.ZN));
  return {
    id: String(a.OBJECTID_1 ?? `${a.PrimaryAdd}|${a.Zip}`),
    street,
    town: townName,
    zip: text(a.Zip),
    lat: g.y,
    lng: g.x,
    direction: text(a.PD),
    label: `${street}, ${townName}, RI ${text(a.Zip)}`.trim(),
    included: town ? town.included : false,
  };
}

const E911_FIELDS = "OBJECTID_1,PrimaryAdd,Zip,MCode,ZN,PD,SN";

/**
 * Address suggestions from the state's E-911 address points (every municipality).
 * Needs a house number and at least two letters of the street name.
 */
export async function searchAddresses(input, options = {}) {
  const q = parseAddressQuery(input);
  if (!q) return [];
  const nameClause = q.names.map((n) => `SN LIKE '${sqlText(n)}%'`).join(" OR ");
  const numberClause = `HouseNumbe IN (${q.numbers.map((n) => `'${sqlText(n)}'`).join(",")})`;
  const where = [numberClause, `(${nameClause})`, q.town ? `MCode = ${q.town.mcode}` : null].filter(Boolean).join(" AND ");
  const data = await query(
    E911_SITES,
    { where, outFields: E911_FIELDS, returnGeometry: "true", outSR: "4326", orderByFields: "PrimaryAdd", resultRecordCount: "60" },
    options,
  );
  const seen = new Set();
  return data.features
    .map(e911Row)
    .filter(Boolean)
    .filter((r) => {
      const key = `${r.street}|${r.town}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.included) - Number(a.included) || Number(b.direction === (q.direction || "")) - Number(a.direction === (q.direction || "")) || a.town.localeCompare(b.town))
    .slice(0, 8);
}

/** Closest E-911 address point to a map click, within 60 meters. */
export async function reverseAddress(point, options = {}) {
  const data = await query(
    E911_SITES,
    {
      geometry: `${point.lng},${point.lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      distance: "60",
      units: "esriSRUnit_Meter",
      outFields: E911_FIELDS,
      returnGeometry: "true",
      outSR: "4326",
      resultRecordCount: "25",
    },
    options,
  );
  const rows = data.features.map(e911Row).filter(Boolean);
  rows.sort((a, b) => miles(point, a) - miles(point, b));
  return rows[0] || null;
}
