// Live checks against the public Rhode Island services. Run with: npm run test:live
import { describe, it, expect } from "vitest";
import registry from "../../pipeline/ri_parcel_registry.json";
import { ALL_TOWNS } from "../../src/ri/towns.js";
import { searchAddresses, lookupZoning, lookupParcel, nearbyApartments, reverseAddress } from "../../src/ri/arcgis.js";

const testPoint = (name) => registry.find((t) => t.name === name).parcelService.testPoint;

describe("statewide address search", () => {
  it("finds 10 Dorrance St in Providence from a messy query", async () => {
    const rows = await searchAddresses("10 dorrance street, providence");
    expect(rows[0]).toMatchObject({ street: "10 Dorrance St", town: "Providence", zip: "02903" });
    expect(rows[0].lat).toBeCloseTo(41.824, 2);
  });
  it("matches while the street name is still being typed", async () => {
    const rows = await searchAddresses("10 dorr");
    expect(rows.some((r) => r.street === "10 Dorrance St" && r.town === "Providence")).toBe(true);
  });
  it("handles a town typed without a comma, and the state's AV abbreviation", async () => {
    const rows = await searchAddresses("300 sixth avenue east greenwich");
    console.log(rows.map((r) => r.label));
    expect(rows[0]).toMatchObject({ street: "300 Sixth Ave", town: "East Greenwich" });
    const pawt = await searchAddresses("100 main st pawtucket");
    expect(pawt.length).toBeGreaterThan(0);
    expect(pawt.every((r) => r.town === "Pawtucket")).toBe(true);
  });
  it("handles a leading direction", async () => {
    const rows = await searchAddresses("1300 North Main Street, Providence");
    console.log(rows.map((r) => r.label));
    expect(rows[0]).toMatchObject({ street: "1300 N Main St", town: "Providence" });
  });
  it("returns the same street in several towns when no town is given", async () => {
    const rows = await searchAddresses("100 Main St");
    expect(new Set(rows.map((r) => r.town)).size).toBeGreaterThan(1);
  });
  it("needs a house number", async () => expect(await searchAddresses("dorrance")).toEqual([]));
  it("marks excluded towns", async () => {
    const rows = await searchAddresses("125 shore rd, little compton");
    console.log(rows.map((r) => `${r.label} included=${r.included}`));
    expect(rows[0].included).toBe(false);
  });
  it("reverse lookup", async () => {
    const r = await reverseAddress({ lat: 41.82400828, lng: -71.41181063 });
    expect(r).toMatchObject({ street: "10 Dorrance St", town: "Providence" });
  });
});

describe("statewide zoning", () => {
  it("returns town and zone for a Providence point", async () => {
    const z = await lookupZoning({ lat: 41.8239722, lng: -71.4118003 });
    console.log(z.zones);
    expect(z.town).toBe("Providence");
    expect(z.zones[0].code).toBeTruthy();
  });
  it("works where there is no parcel service (Central Falls)", async () => {
    const z = await lookupZoning({ lat: 41.89, lng: -71.392 });
    expect(z.town).toBe("Central Falls");
  });
});

describe("parcel lookup in every town with a service", () => {
  for (const town of ALL_TOWNS.filter((t) => t.parcel)) {
    it(`${town.name} (${town.parcel.tier})`, async () => {
      const r = await lookupParcel(town.name, testPoint(town.name));
      const p = r.parcels[0];
      console.log(town.name, r.status, r.match, r.parcels.length, p && { id: p.parcelId, addr: p.address, use: p.useDesc || p.useCode, units: p.units, yr: p.yearBuilt, sf: p.buildingSqft, lot: p.lotSqft, zoning: p.zoning, records: p.records });
      expect(r.status).toBe("ready");
      expect(p.rings).toBeTruthy();
      if (town.parcel.fields.address) expect(typeof p.address).toBe("string");
    }, 30000);
  }
});

describe("nearby apartments", () => {
  it("Providence returns apartments with units near downtown", async () => {
    const r = await nearbyApartments("Providence", { lat: 41.8239722, lng: -71.4118003 }, 3);
    const withUnits = r.parcels.filter((p) => p.units >= 10);
    console.log("Providence", r.parcels.length, "apartment parcels;", withUnits.length, "with 10+ units; truncated", r.truncated);
    console.log(withUnits.sort((a, b) => b.units - a.units).slice(0, 5).map((p) => `${p.address} ${p.units}u ${p.yearBuilt} ${p.distance.toFixed(2)}mi`));
    expect(withUnits.length).toBeGreaterThan(20);
  }, 40000);
  it("Cranston and West Warwick", async () => {
    for (const name of ["Cranston", "West Warwick", "East Greenwich", "Pawtucket"]) {
      const r = await nearbyApartments(name, testPoint(name), 3);
      console.log(name, r.parcels.length, "parcels; with units>=10:", r.parcels.filter((p) => p.units >= 10).length, "sample", r.parcels.slice(0, 2).map((p) => `${p.address} ${p.units}u ${p.yearBuilt}`));
      expect(r.supported).toBe(true);
    }
  }, 60000);
});
