#!/usr/bin/env python3
"""Validate pipeline/*.json and publish it to public/data/ for the app.

Same contract as Lead Engine's transform: a deterministic formatter and validator.
It invents nothing and fails the build on a malformed row.

  python3 tools/build_data.py          # validate, then write public/data/*.json
  python3 tools/build_data.py --check  # validate only (CI)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PIPE = ROOT / "pipeline"
PUB = ROOT / "public" / "data"
TOWNS = {t["name"] for t in json.loads((ROOT / "src" / "ri" / "towns.json").read_text())}
BEDS = {"0", "1", "2", "3", "4", "5"}
errors = []


def fail(msg):
    errors.append(msg)


def check_series(where, s):
    if not isinstance(s.get("rent"), int) or not (300 <= s["rent"] <= 20000):
        fail(f"{where}: rent out of range: {s.get('rent')}")
    if not re.fullmatch(r"\d{4}-\d{2}", str(s.get("asOf"))):
        fail(f"{where}: bad asOf {s.get('asOf')}")
    for point in s.get("series", []):
        if len(point) != 2 or not re.fullmatch(r"\d{4}-\d{2}", point[0]) or not isinstance(point[1], int):
            fail(f"{where}: bad series point {point}")


def check_cell(where, c):
    for key in ("n", "median", "p25", "p75", "min", "max"):
        if not isinstance(c.get(key), int):
            fail(f"{where}: {key} must be an integer")
            return
    if not (c["min"] <= c["p25"] <= c["median"] <= c["p75"] <= c["max"]):
        fail(f"{where}: quartiles out of order")
    if c["n"] < 1:
        fail(f"{where}: empty cell")


def check_rents(r):
    if r.get("state") != "RI":
        fail("rents: state must be RI")
    for town, s in r["zori"]["town"].items():
        if town not in TOWNS:
            fail(f"rents.zori.town: unknown town {town}")
        check_series(f"rents.zori.town[{town}]", s)
    for z, s in r["zori"]["zip"].items():
        if not re.fullmatch(r"0\d{4}", z):
            fail(f"rents.zori.zip: bad ZIP {z}")
        check_series(f"rents.zori.zip[{z}]", s)
    for county, s in r["zori"]["county"].items():
        check_series(f"rents.zori.county[{county}]", s)
    if r["zori"].get("metroMultifamily"):
        check_series("rents.zori.metroMultifamily", r["zori"]["metroMultifamily"])
    if r.get("hud"):
        for town, row in r["hud"]["town"].items():
            if town not in TOWNS:
                fail(f"rents.hud: unknown town {town}")
            for bed, value in row["byBed"].items():
                if bed not in BEDS or not isinstance(value, int):
                    fail(f"rents.hud[{town}]: bad bedroom row {bed}={value}")
    if r.get("listings"):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(r["listings"].get("pulledAt"))):
            fail("rents.listings: pulledAt must be YYYY-MM-DD")
        for town, block in r["listings"]["town"].items():
            if town not in TOWNS:
                fail(f"rents.listings: unknown town {town}")
            for bed, cell in block["byBed"].items():
                if bed not in BEDS:
                    fail(f"rents.listings[{town}]: bad bedroom key {bed}")
                check_cell(f"rents.listings[{town}][{bed}br]", cell)
            for b in block["buildings"]:
                if not re.match(r"^\d", b["address"]):
                    fail(f"rents.listings[{town}]: building without a street number: {b['address']}")
                for bed, cell in b["byBed"].items():
                    check_cell(f"rents.listings[{town}] {b['address']} [{bed}br]", cell)
    for s in r["sources"]:
        for key in ("id", "label", "asOf", "attribution"):
            if not s.get(key):
                fail(f"rents.sources: {s.get('id')} is missing {key}")


def check_supply(s):
    seen = set()
    as_of = s.get("source", {}).get("asOf")
    if as_of is not None and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(as_of)):
        fail("supply.source.asOf must be YYYY-MM-DD")
    if not s["projects"]:
        print("warning: the pipeline is empty", file=sys.stderr)
    for p in s["projects"]:
        if p["id"] in seen:
            fail(f"supply: duplicate id {p['id']}")
        seen.add(p["id"])
        if p["town"] not in TOWNS:
            fail(f"supply {p['id']}: unknown town {p['town']}")
        if not isinstance(p["units"], int) or p["units"] < s["minUnits"]:
            fail(f"supply {p['id']}: units below the {s['minUnits']}-unit floor")
        if p["stageBucket"] not in ("pre-application", "master", "preliminary", "final", "filed"):
            fail(f"supply {p['id']}: bad stage bucket {p['stageBucket']}")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(p["sourceDate"])):
            fail(f"supply {p['id']}: sourceDate must be YYYY-MM-DD")
        if p["agendaUrl"] and not p["agendaUrl"].startswith("https://"):
            fail(f"supply {p['id']}: agenda link must be https")
        for private in ("priority", "status", "in_crm", "notes"):
            if private in p:
                fail(f"supply {p['id']}: private Lead Engine field leaked: {private}")


def check_observations(o):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", o["observedOn"]):
        fail("observations: bad observedOn")
    for p in o["properties"]:
        if p["town"] not in TOWNS:
            fail(f"observations {p['id']}: unknown town {p['town']}")
        if not p["source"].startswith("https://"):
            fail(f"observations {p['id']}: source must be https")
        for plan in p["plans"]:
            if plan["price"] is not None and not (300 <= plan["price"] <= 20000):
                fail(f"observations {p['id']}: price out of range")


def main():
    files = {"rents": check_rents, "supply": check_supply, "operator_observations": check_observations}
    loaded = {}
    for name, check in files.items():
        path = PIPE / f"{name}.json"
        if not path.exists():
            fail(f"missing pipeline/{name}.json")
            continue
        loaded[name] = json.loads(path.read_text())
        check(loaded[name])
    if errors:
        print("DATA CHECK FAILED", file=sys.stderr)
        for e in errors:
            print("  -", e, file=sys.stderr)
        sys.exit(1)
    if "--check" in sys.argv:
        print("data check passed")
        return
    PUB.mkdir(parents=True, exist_ok=True)
    for name, data in loaded.items():
        (PUB / f"{name}.json").write_text(json.dumps(data, separators=(",", ":")) + "\n")
    r, s = loaded["rents"], loaded["supply"]
    print(
        f"published: rents ({len(r['zori']['town'])} towns indexed, listings {'on' if r.get('listings') else 'off'}), "
        f"supply ({len(s['projects'])} projects), observations ({len(loaded['operator_observations']['properties'])})"
    )


if __name__ == "__main__":
    main()
