#!/usr/bin/env python3
"""Harvest Rhode Island rent data into pipeline/rents.json. No hand entry.

Three layers, each optional except the first:

  1. Zillow Observed Rent Index (ZORI)   free, monthly, by town / ZIP / county.
     One index per place (all bedroom counts together). Attribution to Zillow is required.
  2. HUD Fair Market Rents               free with a token, annual, by town and bedroom count.
     Set HUD_API_TOKEN. FMRs are a 40th-percentile voucher benchmark, not Class A asking rents.
  3. Active rental listings (RentCast)   paid API, listing level, rolled up here into
     town-by-bedroom medians and building-level comps. Set RENTCAST_API_KEY.
     One call per town per run (36 towns fits the free 50-call tier at a monthly cadence).

Usage:
  python3 tools/harvest_rents.py                 # download and write pipeline/rents.json
  python3 tools/harvest_rents.py --zori-dir DIR  # use ZORI CSVs already on disk
  python3 tools/harvest_rents.py --listings-file FILE.json   # aggregate a saved listings dump

The transform is deterministic and invents nothing: a cell with too few listings is
kept with its real count and flagged low-sample, never filled in.
"""
import argparse
import csv
import io
import json
import os
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "pipeline" / "rents.json"
TOWNS = json.loads((ROOT / "src" / "ri" / "towns.json").read_text())
INCLUDED = [t["name"] for t in TOWNS if t["included"]]

ZORI_BASE = "https://files.zillowstatic.com/research/public_csvs/zori/"
ZORI_FILES = {
    "city": "City_zori_uc_sfrcondomfr_sm_month.csv",
    "zip": "Zip_zori_uc_sfrcondomfr_sm_month.csv",
    "county": "County_zori_uc_sfrcondomfr_sm_month.csv",
    "metro_mf": "Metro_zori_uc_mfr_sm_month.csv",
}
RENTCAST_URL = "https://api.rentcast.io/v1/listings/rental/long-term"
HUD_URL = "https://www.huduser.gov/hudapi/public/fmr/statedata/RI"

# Sample thresholds. Below these a cell is shown with its count and a low-sample flag.
MIN_TOWN_CELL = 8
MIN_BUILDING_CELL = 3
MIN_BUILDING_LISTINGS = 3
PRICE_FLOOR, PRICE_CEILING = 400, 15000


def fetch(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": "leaseright-harvest/2.0", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


# ---------------------------------------------------------------- ZORI

def read_zori(kind, zori_dir):
    name = ZORI_FILES[kind]
    if zori_dir:
        text = (Path(zori_dir) / name).read_text()
    else:
        text = fetch(ZORI_BASE + name).decode("utf-8")
    return list(csv.DictReader(io.StringIO(text)))


def series_from_row(row, months=25):
    cols = [c for c in row if re.fullmatch(r"\d{4}-\d{2}-\d{2}", c)]
    points = [(c[:7], round(float(row[c]))) for c in cols if row[c] not in ("", None)]
    points = points[-months:]
    if not points:
        return None
    latest_month, latest = points[-1]
    out = {"asOf": latest_month, "rent": latest, "series": [[m, v] for m, v in points]}
    year_ago = [v for m, v in points if m == f"{int(latest_month[:4]) - 1}{latest_month[4:]}"]
    if year_ago:
        out["yoyPct"] = round((latest / year_ago[0] - 1) * 100, 1)
    return out


def harvest_zori(zori_dir):
    names = {t["name"] for t in TOWNS}
    out = {"town": {}, "zip": {}, "county": {}, "metroMultifamily": None}
    for row in read_zori("city", zori_dir):
        if row.get("State") == "RI" and row.get("RegionName") in names:
            s = series_from_row(row)
            if s:
                out["town"][row["RegionName"]] = s
    for row in read_zori("zip", zori_dir):
        if row.get("State") == "RI":
            s = series_from_row(row)
            if s and row.get("City") in names:
                out["zip"][row["RegionName"].zfill(5)] = {**s, "town": row["City"]}
    for row in read_zori("county", zori_dir):
        if row.get("State") == "RI":
            s = series_from_row(row)
            if s:
                out["county"][row["RegionName"]] = s
    for row in read_zori("metro_mf", zori_dir):
        if row.get("RegionName") == "Providence, RI":
            out["metroMultifamily"] = series_from_row(row)
    return out


# ---------------------------------------------------------------- HUD

def harvest_hud(token):
    raw = json.loads(fetch(HUD_URL, headers={"Authorization": f"Bearer {token}"}))
    data = raw.get("data", raw)
    year = data.get("year") or data.get("metroareas", [{}])[0].get("year")
    names = {t["name"].lower(): t["name"] for t in TOWNS}
    towns = {}
    # New England FMR areas are built from towns; county rows carry a town_name.
    for row in data.get("counties", []):
        label = re.sub(r"\s+(city|town)$", "", str(row.get("town_name") or "").strip().lower())
        town = names.get(label)
        if not town:
            continue
        beds = {}
        for i, key in enumerate(["Efficiency", "One-Bedroom", "Two-Bedroom", "Three-Bedroom", "Four-Bedroom"]):
            try:
                value = float(str(row.get(key)).replace(",", ""))
            except (TypeError, ValueError):
                continue
            if value > 0:
                beds[str(i)] = int(round(value))
        if beds:
            towns[town] = {"byBed": beds, "area": row.get("metro_name") or row.get("county_name")}
    if not towns:
        raise RuntimeError("HUD response had no Rhode Island town rows; schema may have changed")
    return {"fiscalYear": int(year) if year else None, "town": towns}


# ---------------------------------------------------------------- listings

SUFFIXES = {
    "STREET": "ST", "AVENUE": "AVE", "ROAD": "RD", "BOULEVARD": "BLVD", "DRIVE": "DR", "COURT": "CT",
    "PLACE": "PL", "LANE": "LN", "HIGHWAY": "HWY", "TERRACE": "TER", "PARKWAY": "PKWY", "SQUARE": "SQ",
    "CIRCLE": "CIR", "TRAIL": "TRL",
}
DIRECTIONS = {"NORTH": "N", "SOUTH": "S", "EAST": "E", "WEST": "W"}


def normalize_street(address_line):
    """'126 Union Street, Apt 4B' -> '126 UNION ST'.

    The unit is dropped. Only the street type (the last word) and a direction at either end
    are abbreviated, so "1 Court St" and "10 East Ave" keep their names.
    """
    s = str(address_line or "").upper().split(",")[0]
    s = re.split(r"\s+(?:APT|APARTMENT|UNIT|STE|SUITE|#)\s*[\w-]*$", s)[0]
    s = re.sub(r"[^A-Z0-9\s'-]", " ", s)
    tokens = s.split()
    if len(tokens) > 2 and tokens[-1] in DIRECTIONS:
        tokens[-1] = DIRECTIONS[tokens[-1]]
        if tokens[-2] in SUFFIXES:
            tokens[-2] = SUFFIXES[tokens[-2]]
    elif len(tokens) > 2 and tokens[-1] in SUFFIXES:
        tokens[-1] = SUFFIXES[tokens[-1]]
    if len(tokens) > 3 and tokens[1] in DIRECTIONS:
        tokens[1] = DIRECTIONS[tokens[1]]
    return " ".join(tokens)


def display_street(street):
    """'10 PARK ROW W' -> '10 Park Row W'; ordinals stay lower case ('1st', not '1St')."""
    return " ".join(w.lower() if w[:1].isdigit() else w.capitalize() for w in street.split())


def percentile(sorted_values, p):
    if not sorted_values:
        return None
    k = (len(sorted_values) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(sorted_values) - 1)
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (k - lo)


def cell_stats(listings, min_n):
    prices = sorted(x["price"] for x in listings)
    sqfts = sorted(x["sqft"] for x in listings if x["sqft"])
    psf = sorted(x["price"] / x["sqft"] for x in listings if x["sqft"])
    return {
        "n": len(prices),
        "median": round(statistics.median(prices)),
        "p25": round(percentile(prices, 0.25)),
        "p75": round(percentile(prices, 0.75)),
        "min": prices[0],
        "max": prices[-1],
        "medianSqft": round(statistics.median(sqfts)) if sqfts else None,
        "medianPsf": round(statistics.median(psf), 2) if psf else None,
        "lowSample": len(prices) < min_n,
    }


def clean_listings(raw, town_names):
    """Keep active Rhode Island apartment listings with a usable price and bedroom count."""
    lower = {n.lower(): n for n in town_names}
    seen = {}
    for x in raw:
        if str(x.get("state") or "").upper() != "RI":
            continue
        town = lower.get(str(x.get("city") or "").strip().lower())
        price, beds = x.get("price"), x.get("bedrooms")
        if not town or not isinstance(price, (int, float)) or not isinstance(beds, (int, float)):
            continue
        if not (PRICE_FLOOR <= price <= PRICE_CEILING) or beds < 0 or beds > 5 or beds != int(beds):
            continue
        if str(x.get("status") or "Active") != "Active":
            continue
        street = normalize_street(x.get("addressLine1") or x.get("formattedAddress"))
        if not street or not re.match(r"^\d", street):
            continue
        sqft = x.get("squareFootage")
        item = {
            "town": town,
            "street": street,
            "zip": str(x.get("zipCode") or "")[:5],
            "unit": str(x.get("addressLine2") or "").strip().upper(),
            "beds": int(beds),
            "price": int(round(price)),
            "sqft": int(sqft) if isinstance(sqft, (int, float)) and 150 <= sqft <= 6000 else None,
            "yearBuilt": x.get("yearBuilt") if isinstance(x.get("yearBuilt"), int) and 1700 <= x["yearBuilt"] <= date.today().year + 2 else None,
            "lat": x.get("latitude"),
            "lng": x.get("longitude"),
            "seen": str(x.get("lastSeenDate") or x.get("listedDate") or "")[:10],
        }
        # The same unit shows up on several portals: one row per address + unit + beds + price.
        # Without a unit number there is no way to tell two units apart, so fall back to the
        # provider's own listing id rather than collapse a building's identical floor plans.
        if item["unit"] or not x.get("id"):
            key = (item["town"], item["street"], item["unit"], item["beds"], item["price"])
        else:
            key = ("id", str(x["id"]))
        if key not in seen or item["seen"] > seen[key]["seen"]:
            seen[key] = item
    return list(seen.values())


def trim_outliers(listings):
    """Drop prices beyond 1.5 x IQR within a town and bedroom count (needs 8+ to judge)."""
    by_cell = {}
    for x in listings:
        by_cell.setdefault((x["town"], x["beds"]), []).append(x)
    kept, dropped = [], 0
    for cell in by_cell.values():
        if len(cell) < MIN_TOWN_CELL:
            kept.extend(cell)
            continue
        prices = sorted(x["price"] for x in cell)
        q1, q3 = percentile(prices, 0.25), percentile(prices, 0.75)
        if q3 == q1:  # most prices identical: a fence of zero width would discard real listings
            kept.extend(cell)
            continue
        lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
        for x in cell:
            if lo <= x["price"] <= hi:
                kept.append(x)
            else:
                dropped += 1
    return kept, dropped


def aggregate_listings(raw, town_names=None, pulled_at=None):
    town_names = town_names or INCLUDED
    listings, dropped = trim_outliers(clean_listings(raw, town_names))
    towns = {}
    for name in town_names:
        rows = [x for x in listings if x["town"] == name]
        if not rows:
            continue
        by_bed = {}
        for beds in sorted({x["beds"] for x in rows}):
            by_bed[str(beds)] = cell_stats([x for x in rows if x["beds"] == beds], MIN_TOWN_CELL)
        buildings = {}
        for x in rows:
            buildings.setdefault((x["street"], x["zip"]), []).append(x)
        out_buildings = []
        for (street, zip_code), items in buildings.items():
            if len(items) < MIN_BUILDING_LISTINGS:
                continue
            years = [i["yearBuilt"] for i in items if i["yearBuilt"]]
            lats = [i["lat"] for i in items if isinstance(i["lat"], (int, float))]
            lngs = [i["lng"] for i in items if isinstance(i["lng"], (int, float))]
            out_buildings.append(
                {
                    "address": display_street(street),
                    "zip": zip_code,
                    "listings": len(items),
                    "yearBuilt": statistics.mode(years) if years else None,
                    "lat": round(statistics.mean(lats), 6) if lats else None,
                    "lng": round(statistics.mean(lngs), 6) if lngs else None,
                    "lastSeen": max(i["seen"] for i in items),
                    "byBed": {
                        str(b): cell_stats([i for i in items if i["beds"] == b], MIN_BUILDING_CELL)
                        for b in sorted({i["beds"] for i in items})
                    },
                }
            )
        out_buildings.sort(key=lambda b: (-b["listings"], b["address"]))
        towns[name] = {"listings": len(rows), "byBed": by_bed, "buildings": out_buildings}
    return {
        "provider": "RentCast",
        "pulledAt": pulled_at or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "rawCount": len(raw),
        "usedCount": len(listings),
        "outliersDropped": dropped,
        "town": towns,
    }


def harvest_rentcast(key, town_names, max_calls):
    raw, calls, fetched = [], 0, []
    for name in town_names:
        offset = 0
        while calls < max_calls:
            params = urllib.parse.urlencode(
                {"city": name, "state": "RI", "propertyType": "Apartment", "status": "Active", "limit": 500, "offset": offset}
            )
            page = json.loads(fetch(f"{RENTCAST_URL}?{params}", headers={"X-Api-Key": key, "Accept": "application/json"}))
            calls += 1
            if not isinstance(page, list):
                raise RuntimeError(f"RentCast returned a non-list for {name}: {str(page)[:200]}")
            raw.extend(page)
            if len(page) < 500:
                break
            offset += 500
            time.sleep(0.2)
        fetched.append(name)
        if calls >= max_calls and name != town_names[-1]:
            print(f"  call budget reached ({max_calls}); stopped after {name}", file=sys.stderr)
            break
    print(f"  RentCast: {calls} calls, {len(raw)} listings, {len(fetched)} of {len(town_names)} towns", file=sys.stderr)
    return raw, fetched


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zori-dir", help="folder holding the ZORI CSVs (skip the download)")
    ap.add_argument("--listings-file", help="aggregate a saved RentCast JSON array instead of calling the API")
    ap.add_argument("--max-calls", type=int, default=int(os.environ.get("RENTCAST_MAX_CALLS", "45")))
    ap.add_argument("--keep-listings", action="store_true", help="carry over the last listings block when no key is set")
    args = ap.parse_args()

    previous = json.loads(OUT.read_text()) if OUT.exists() else {}
    sources, notes = [], []

    zori = harvest_zori(args.zori_dir)
    latest = max((v["asOf"] for v in zori["town"].values()), default=None)
    sources.append(
        {
            "id": "zori",
            "label": "Zillow Observed Rent Index",
            "asOf": latest,
            "attribution": "Zillow Observed Rent Index (ZORI), Zillow Research. All home types, smoothed.",
            "url": "https://www.zillow.com/research/data/",
        }
    )
    print(f"  ZORI: {len(zori['town'])} towns, {len(zori['zip'])} ZIPs, latest {latest}", file=sys.stderr)

    hud = previous.get("hud")
    token = os.environ.get("HUD_API_TOKEN")
    if token:
        try:
            hud = harvest_hud(token)
            print(f"  HUD: FY{hud['fiscalYear']} for {len(hud['town'])} towns", file=sys.stderr)
        except Exception as error:  # keep the last good block; never fabricate
            notes.append(f"HUD refresh failed, previous values kept: {error}")
    if hud:
        sources.append(
            {
                "id": "hud",
                "label": "HUD Fair Market Rents",
                "asOf": f"FY{hud.get('fiscalYear')}",
                "attribution": "This product uses the HUD User Data API but is not endorsed or certified by HUD User.",
                "url": "https://www.huduser.gov/portal/datasets/fmr.html",
            }
        )

    listings = previous.get("listings") if args.keep_listings else None
    key = os.environ.get("RENTCAST_API_KEY")
    if args.listings_file:
        listings = aggregate_listings(json.loads(Path(args.listings_file).read_text()))
    elif key:
        try:
            raw, fetched = harvest_rentcast(key, INCLUDED, args.max_calls)
            listings = aggregate_listings(raw)
            skipped = [t for t in INCLUDED if t not in fetched]
            if skipped:
                # Out of API calls: keep last month's numbers for the towns not reached, and say so.
                old = (previous.get("listings") or {}).get("town", {})
                carried = [t for t in skipped if t in old]
                for t in carried:
                    listings["town"][t] = old[t]
                notes.append(
                    f"Listing refresh stopped at the API call limit: {len(fetched)} of {len(INCLUDED)} towns updated"
                    + (f"; {len(carried)} carried over from the previous pull." if carried else ".")
                )
        except Exception as error:
            listings = previous.get("listings")
            notes.append(f"Listing refresh failed, previous values kept: {error}")
    if listings:
        sources.append(
            {
                "id": "listings",
                "label": "Active rental listings",
                "asOf": listings["pulledAt"],
                "attribution": "Listing data from RentCast. Asking rents; concessions are not captured.",
                "url": "https://www.rentcast.io/",
            }
        )

    out = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "state": "RI",
        "sources": sources,
        "notes": notes,
        "zori": zori,
        "hud": hud,
        "listings": listings,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
