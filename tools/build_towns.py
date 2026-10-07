#!/usr/bin/env python3
"""Build src/ri/towns.json from the validated parcel-service registry.

pipeline/ri_parcel_registry.json is the research record: one entry per Rhode Island
municipality, each parcel service tested with real point, distance and attribute
queries (October 2026). This script trims it to what the app needs and applies the
coverage decisions below. It invents nothing: a town without a tested public service
gets `parcel: null` and falls back to its GIS viewer link and the statewide zoning layer.

Run:  python3 tools/build_towns.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Towns left out of coverage: no realistic 10+ unit multifamily lease-up.
# Flip a town back on by deleting its line here and rebuilding.
EXCLUDED = {
    "Little Compton": "No multifamily stock or pipeline of 10+ units.",
    "New Shoreham": "Block Island: three small apartment parcels on record, no 10+ unit pipeline.",
    "Foster": "Three apartment-class parcels on record, no public water or sewer for larger projects.",
}

# Parcel services too stale or thin to show as a property record.
DROP_SERVICE = {
    "Warren": "Only a 2013 outline layer with no address or assessment fields.",
}

# Unit counts that are only trustworthy on single-building parcels.
UNITS_GUARD = {
    "West Warwick": {"field": "NumofBuild", "max": 1},
    "North Smithfield": {"field": "NumofBuild", "max": 1},
}

# Only these towns record a real story count. Elsewhere the field is an assessor style code
# (East Greenwich showed "25" for a low-rise complex), so it is not shown.
NUMERIC_FLOORS = {"Providence", "Johnston"}

# Town centroids (lon, lat), used to find neighboring towns by distance.
CENTROIDS = {
    "Barrington": [-71.317, 41.740], "Bristol": [-71.267, 41.677], "Burrillville": [-71.665, 41.970],
    "Central Falls": [-71.392, 41.890], "Charlestown": [-71.668, 41.383], "Coventry": [-71.660, 41.690],
    "Cranston": [-71.480, 41.770], "Cumberland": [-71.430, 41.970], "East Greenwich": [-71.460, 41.620],
    "East Providence": [-71.370, 41.810], "Exeter": [-71.585, 41.570], "Foster": [-71.745, 41.810],
    "Glocester": [-71.690, 41.890], "Hopkinton": [-71.755, 41.470], "Jamestown": [-71.375, 41.500],
    "Johnston": [-71.510, 41.825], "Lincoln": [-71.450, 41.920], "Little Compton": [-71.120, 41.510],
    "Middletown": [-71.280, 41.520], "Narragansett": [-71.450, 41.430], "New Shoreham": [-71.578, 41.180],
    "Newport": [-71.310, 41.485], "North Kingstown": [-71.460, 41.570], "North Providence": [-71.460, 41.860],
    "North Smithfield": [-71.555, 41.970], "Pawtucket": [-71.382, 41.875], "Portsmouth": [-71.250, 41.600],
    "Providence": [-71.415, 41.823], "Richmond": [-71.660, 41.500], "Scituate": [-71.620, 41.790],
    "Smithfield": [-71.545, 41.900], "South Kingstown": [-71.545, 41.450], "Tiverton": [-71.180, 41.625],
    "Warren": [-71.285, 41.730], "Warwick": [-71.420, 41.700], "West Greenwich": [-71.660, 41.620],
    "West Warwick": [-71.520, 41.700], "Westerly": [-71.795, 41.375], "Woonsocket": [-71.515, 42.000],
}

# E-911 municipal codes (statewide address points, MCode field): 100 + alphabetical index.
NAMES = sorted(CENTROIDS)
MCODE = {name: 100 + i for i, name in enumerate(NAMES)}


def split_field(value):
    """'Street + StreetName' -> ['Street', 'StreetName']; plain names -> ['Name']; None -> None."""
    if not value:
        return None
    return [part.strip() for part in value.split("+")]


def as_of_year(text):
    years = [int(y) for y in re.findall(r"(20\d\d)", text or "")]
    return max(years) if years else None


def main():
    registry = json.loads((ROOT / "pipeline" / "ri_parcel_registry.json").read_text())
    by_name = {t["name"]: t for t in registry}
    missing = set(NAMES) - set(by_name)
    if missing:
        raise SystemExit(f"registry is missing towns: {sorted(missing)}")
    out = []
    for name in NAMES:
        t = by_name[name]
        ps = t.get("parcelService")
        parcel = None
        if ps and name not in DROP_SERVICE:
            f = ps["fields"]
            data_text = ps.get("dataAsOf") or ""
            stale = data_text.upper().startswith("STALE")
            parcel = {
                "url": ps["url"],
                "tier": ps["tier"],
                "fields": {
                    "parcelId": f.get("parcelId"),
                    "address": split_field(f.get("address")),
                    "zoning": f.get("zoning"),
                    "lotSqft": f.get("lotSqft"),
                    "lotAcres": f.get("lotAcres"),
                    "useDesc": f.get("useDesc"),
                    "useCode": f.get("useCode"),
                    "units": f.get("units"),
                    "yearBuilt": f.get("yearBuilt"),
                    "floors": f.get("floors") if name in NUMERIC_FLOORS else None,
                    "buildingSqft": f.get("buildingSqft"),
                    "taxYear": f.get("taxYear"),
                },
                "apartmentWhere": ps.get("apartmentWhere"),
                "unitsGuard": UNITS_GUARD.get(name),
                "maxRecordCount": ps.get("maxRecordCount") or 1000,
                "dataAsOf": re.sub(r"^STALE(-ISH)?:\s*", "", data_text),
                "dataYear": as_of_year(data_text),
                "stale": stale,
                "thirdParty": ps.get("sourceType") in ("third-party", "neighboring-municipality copy"),
                "publisher": ps.get("owner"),
                "stats": {
                    "apartments": ps.get("apartmentCount"),
                    "units10plus": ps.get("unitsGte10Count"),
                    "maxUnits": ps.get("maxUnits"),
                },
            }
            # Pawtucket's LND_UNITS_ is land area in square feet (verified), keep it as lot size only.
        zs = t.get("zoningService")
        out.append(
            {
                "name": name,
                "mcode": MCODE[name],
                "centroid": CENTROIDS[name],
                "included": name not in EXCLUDED,
                "excludedReason": EXCLUDED.get(name),
                "viewerUrl": t.get("viewerUrl"),
                "viewerVendor": t.get("viewerVendor"),
                "parcel": parcel,
                "parcelNote": DROP_SERVICE.get(name) or (None if parcel else (t.get("notes") or "No public parcel service found.")),
                "zoning": {"url": zs["url"], "zoneField": zs.get("zoneField"), "descField": zs.get("descField")} if zs else None,
            }
        )
    target = ROOT / "src" / "ri" / "towns.json"
    target.write_text(json.dumps(out, indent=1) + "\n")
    tiers = {}
    for t in out:
        key = t["parcel"]["tier"] if t["parcel"] else "none"
        tiers[key] = tiers.get(key, 0) + 1
    print(f"wrote {target.relative_to(ROOT)}: {len(out)} towns, {sum(t['included'] for t in out)} included, tiers {tiers}")


if __name__ == "__main__":
    main()
