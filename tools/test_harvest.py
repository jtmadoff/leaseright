#!/usr/bin/env python3
"""Checks for the listing roll-up in harvest_rents.py. Run: python3 tools/test_harvest.py

The fixture is shaped like RentCast's published listing schema. It is synthetic test data,
never published to the app.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import harvest_rents as h  # noqa: E402

raw = json.loads((Path(__file__).parent / "fixtures" / "rentcast_sample.json").read_text())
out = h.aggregate_listings(raw, pulled_at="2026-10-06")
pvd = out["town"]["Providence"]

assert h.normalize_street("126 Union Street, Apt 4B") == "126 UNION ST"
assert h.normalize_street("10 Park Row West #12") == "10 PARK ROW W"

assert set(out["town"]) == {"Providence"}, out["town"].keys()          # MA, bad rows, excluded town dropped
assert out["rawCount"] == len(raw)
assert out["outliersDropped"] == 1                                       # the $9,000 one-bedroom

one = pvd["byBed"]["1"]
# 5 in the building + 6 scattered (outlier trimmed, duplicate collapsed) = 11
assert one["n"] == 11, one
assert one["median"] == 2050, one
assert one["min"] == 1800 and one["max"] == 2400
assert one["lowSample"] is False
assert pvd["byBed"]["0"]["n"] == 2 and pvd["byBed"]["0"]["lowSample"] is True
assert pvd["byBed"]["2"]["median"] == 3500 and pvd["byBed"]["2"]["lowSample"] is True

# "10 Park Row West" and "10 Park Row W" are the same building once directions are normalized.
buildings = {b["address"]: b for b in pvd["buildings"]}
assert list(buildings) == ["10 Park Row W"], list(buildings)
assert buildings["10 Park Row W"]["listings"] == 8
assert buildings["10 Park Row W"]["byBed"]["1"]["median"] == 2300
assert buildings["10 Park Row W"]["byBed"]["2"]["median"] == 3500
assert buildings["10 Park Row W"]["yearBuilt"] == 2023
assert "126 Union St" not in buildings                                   # only two listings
assert all(b["listings"] >= h.MIN_BUILDING_LISTINGS for b in pvd["buildings"])
assert one["medianPsf"] and 2.5 < one["medianPsf"] < 4.5

assert h.percentile([1, 2, 3, 4, 5], 0.5) == 3
assert h.percentile([10, 20], 0.25) == 12.5
print("harvest tests passed")
