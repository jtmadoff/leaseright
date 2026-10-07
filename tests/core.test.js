import { describe, it, expect } from "vitest";
import { similarBuildings, subjectProfile, scoreBuilding } from "../src/core/similarity.js";
import { rentIndex, bedMarket, supplyNear, countyOf, observedRange } from "../src/core/market.js";
import { parseUnitCSV, CSV_TEMPLATE } from "../src/core/csv.js";
import { ALL_TOWNS, INCLUDED_TOWNS, getTown, townByMcode, neighbors, coverageCounts } from "../src/ri/towns.js";
import { normalizeParcel, dedupeParcels, cleanAddress, parseAddressQuery } from "../src/ri/arcgis.js";
import rents from "../pipeline/rents.json";
import supply from "../pipeline/supply.json";
import observations from "../pipeline/operator_observations.json";

describe("town registry", () => {
  it("covers all 39 municipalities and excludes three", () => {
    expect(ALL_TOWNS.length).toBe(39);
    expect(INCLUDED_TOWNS.length).toBe(36);
    expect(ALL_TOWNS.filter((t) => !t.included).map((t) => t.name).sort()).toEqual(["Foster", "Little Compton", "New Shoreham"]);
  });
  it("maps E-911 municipal codes", () => {
    expect(townByMcode(127).name).toBe("Providence");
    expect(townByMcode(125).name).toBe("Pawtucket");
    expect(townByMcode(138).name).toBe("Woonsocket");
  });
  it("finds neighbors by distance", () => {
    const names = neighbors({ lat: 41.824, lng: -71.412 }, { radius: 6, exclude: "Providence" }).map((t) => t.name);
    expect(names).toContain("Pawtucket");
    expect(names).toContain("Cranston");
    expect(names).not.toContain("Westerly");
  });
  it("counts coverage tiers", () => {
    const c = coverageCounts();
    expect(c.full + c.basic + c.boundary + c.none).toBe(36);
    expect(c.full).toBe(8);
  });
});

describe("parcel normalizing", () => {
  const pvd = getTown("Providence");
  const ring = [[[-71.41, 41.82], [-71.41, 41.83], [-71.4, 41.83], [-71.41, 41.82]]];
  it("reads Providence text numerics", () => {
    const p = normalizeParcel(pvd, {
      attributes: { OBJECTID: 5, MAP_PAR_ID: "020-0018", ParcAddress: "10 Dorrance St", ZONING: "D-1-300", AreaSF: "27,773", MuniUseCodeDesc: "Commercial II", NumUnits: "0", YearBuilt: "1957", NumFloors: "12", GrBldgArea: "226679", TaxRollYear: "2025" },
      geometry: { rings: ring },
    });
    expect(p).toMatchObject({ parcelId: "020-0018", address: "10 Dorrance St", lotSqft: 27773, units: null, yearBuilt: 1957, floors: 12, buildingSqft: 226679 });
  });
  it("applies the units guard on multi-building parcels", () => {
    const ww = getTown("West Warwick");
    const base = { Parcel_Num: "1", Street: "50", StreetName: "DOGWOOD DRIVE", LUC: "03", RentalLivU: 1512, YearBuilt: 2001 };
    expect(normalizeParcel(ww, { attributes: { ...base, NumofBuild: 12 }, geometry: { rings: ring } }).units).toBeNull();
    expect(normalizeParcel(ww, { attributes: { ...base, RentalLivU: 40, NumofBuild: 1 }, geometry: { rings: ring } }).units).toBe(40);
  });
  it("collapses stacked assessor records into one parcel", () => {
    const rows = [
      { parcelId: "A", address: "", units: null, buildingSqft: 900, yearBuilt: 1990, floors: null, lotSqft: null, rings: null, records: 1 },
      { parcelId: "A", address: "1 Main St", units: 12, buildingSqft: 1200, yearBuilt: 1985, floors: 3, lotSqft: 5000, rings: ring, records: 1 },
      { parcelId: "B", address: "2 Main St", units: null, buildingSqft: null, yearBuilt: null, floors: null, lotSqft: null, rings: ring, records: 1 },
    ];
    const out = dedupeParcels(rows);
    expect(out.length).toBe(2);
    expect(out[0]).toMatchObject({ parcelId: "A", address: "1 Main St", units: 12, buildingSqft: 1200, yearBuilt: 1985, records: 2 });
  });
  it("ignores rows without a parcel number (citywide catch-all polygons)", () => {
    expect(normalizeParcel(pvd, { attributes: { OBJECTID: 1, MAP_PAR_ID: null, ParcAddress: null }, geometry: { rings: ring } })).toBeNull();
  });
  it("cleans addresses", () => {
    expect(cleanAddress(["0530 NARRAGANSETT AVE "])).toBe("530 Narragansett Ave");
    expect(cleanAddress(["0", "RATHBUN STREET"])).toBe("Rathbun Street");
    expect(cleanAddress(["50", "DOGWOOD DRIVE"])).toBe("50 Dogwood Drive");
  });
  it("parses address queries into house number, street name and town", () => {
    expect(parseAddressQuery("10 Dorrance Street, Providence")).toMatchObject({ number: "10", names: ["DORRANCE"], direction: null });
    expect(parseAddressQuery("10 Dorrance Street, Providence").town.name).toBe("Providence");
    expect(parseAddressQuery("300 sixth ave east greenwich")).toMatchObject({ number: "300", names: ["SIXTH"] });
    expect(parseAddressQuery("300 sixth ave east greenwich").town.name).toBe("East Greenwich");
    // A leading direction may be part of the name ("South St") or a prefix ("N Main St"): try both.
    expect(parseAddressQuery("225 north main street")).toMatchObject({ number: "225", names: ["NORTH MAIN", "MAIN"], direction: "N" });
    expect(parseAddressQuery("10 south st")).toMatchObject({ names: ["SOUTH"], direction: null });
    expect(parseAddressQuery("1470 South County Trail")).toMatchObject({ names: ["SOUTH COUNTY", "COUNTY"], direction: "S" });
    expect(parseAddressQuery("dorrance street")).toBeNull();
    expect(parseAddressQuery("10 d")).toBeNull();
  });
});

describe("similar buildings", () => {
  const subject = subjectProfile({ totalUnits: "100", projectType: "New construction" }, 2026);
  const pool = [
    { parcelId: "a", address: "Near, similar, new", units: 110, yearBuilt: 2021, distance: 0.4 },
    { parcelId: "b", address: "Near, tiny", units: 6, yearBuilt: 2022, distance: 0.1 },
    { parcelId: "c", address: "Near, huge", units: 600, yearBuilt: 2020, distance: 0.2 },
    { parcelId: "d", address: "Far, similar, old", units: 95, yearBuilt: 1925, distance: 2.8 },
    { parcelId: "e", address: "Near, unknown size", units: null, yearBuilt: 2019, distance: 0.3 },
    { parcelId: "f", address: "Mid, similar, 1990s", units: 80, yearBuilt: 1995, distance: 1.2 },
  ];
  const r = similarBuildings(subject, pool, { radius: 3 });
  it("drops small, oversized and unknown-size buildings", () => {
    expect(r.buildings.map((b) => b.parcelId)).toEqual(["a", "f", "d"]);
    expect(r.considered).toBe(6);
    expect(r.withUnits).toBe(4);
    expect(r.inSizeBand).toBe(3);
  });
  it("ranks the close, same-size, same-era building first and explains why", () => {
    expect(r.buildings[0].score).toBeGreaterThan(85);
    expect(r.buildings[0].reasons).toContain("110 units vs your 100");
    expect(r.buildings[0].reasons).toContain("Recent build (2021)");
  });
  it("prefers old structures for a conversion", () => {
    const conv = subjectProfile({ totalUnits: "100", projectType: "Conversion / adaptive reuse" }, 2026);
    const old = scoreBuilding(conv, pool[3], 3);
    const recent = scoreBuilding(conv, { ...pool[3], yearBuilt: 2021 }, 3);
    expect(old.score).toBeGreaterThan(recent.score);
  });
  it("caps the list at six", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ parcelId: `p${i}`, address: `${i}`, units: 100, yearBuilt: 2020, distance: i / 10 }));
    expect(similarBuildings(subject, many).buildings.length).toBe(6);
  });
});

describe("market data", () => {
  it("prefers ZIP, then town, then county", () => {
    const idx = rentIndex(rents, "Providence", "02903");
    expect(idx.primary.level).toBe("zip");
    expect(idx.all.map((x) => x.level)).toEqual(["zip", "town", "county"]);
    expect(rentIndex(rents, "Tiverton", "02878").primary.scope).toBe("Newport County");
    expect(countyOf("East Greenwich")).toBe("Kent County");
  });
  it("collects operator observations by bedroom", () => {
    const m = bedMarket({ rents, observations }, "Providence", 1);
    expect(m.observed.length).toBeGreaterThan(2);
    const range = observedRange(m.observed);
    expect(range.min).toBeLessThanOrEqual(range.max);
    expect(m.listings).toBeNull(); // listing feed not connected in the committed data
  });
  it("finds pipeline supply in and around a town", () => {
    const s = supplyNear(supply, "Providence", { lat: 41.824, lng: -71.412 });
    expect(s.projects.some((p) => p.town === "Pawtucket")).toBe(true);
    expect(s.projects.every((p) => p.units >= 10)).toBe(true);
    expect(s.units).toBe(s.projects.reduce((n, p) => n + p.units, 0));
    expect(supplyNear(supply, "Westerly", null).projects.some((p) => p.town === "Pawtucket")).toBe(false);
  });
});

describe("csv import", () => {
  it("parses the template", () => {
    const rows = parseUnitCSV(CSV_TEMPLATE);
    expect(rows.length).toBe(3);
    expect(rows[1]).toMatchObject({ label: "1 bedroom", beds: 1, count: "50", rent: "2300" });
  });
  it("accepts dollar signs and minimal columns", () => {
    const rows = parseUnitCSV('Label,Count,Rent\n"2BR, corner",12,"$3,250"\n');
    expect(rows[0]).toMatchObject({ label: "2BR, corner", beds: 2, count: "12", rent: "3250", leased: "0" });
  });
  it("rejects a file without rents", () => expect(() => parseUnitCSV("label,count\nA,1\n")).toThrow(/rent/));
});

import { publishedRents, addressKey } from "../src/core/market.js";
describe("published rents for a matched building", () => {
  it("normalizes street addresses", () => {
    expect(addressKey("12 Eagle Street")).toBe("12 EAGLE ST");
    expect(addressKey("12 Eagle St, Providence")).toBe("12 EAGLE ST");
  });
  it("joins operator prices to a parcel by address", () => {
    const r = publishedRents({ rents, observations }, "Providence", "12 Eagle St");
    expect(r.source).toBe("operator");
    expect(r.name).toBe("US Rubber Lofts");
    expect(r.byBed[2]).toBe(2070); // lowest advertised 2 BR
    expect(publishedRents({ rents, observations }, "Providence", "1 Nowhere St")).toBeNull();
  });
  it("prefers listing medians when the feed has the building", () => {
    const withListings = { ...rents, listings: { town: { Providence: { byBed: {}, buildings: [{ address: "12 Eagle St", zip: "02909", lastSeen: "2026-10-01", byBed: { 2: { median: 2300 } } }] } } } };
    const r = publishedRents({ rents: withListings, observations }, "Providence", "12 EAGLE STREET");
    expect(r).toMatchObject({ source: "listings", byBed: { 2: 2300 } });
  });
});
