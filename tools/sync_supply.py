#!/usr/bin/env python3
"""Pull the multifamily development pipeline from Lead Engine into pipeline/supply.json.

Lead Engine harvests every Rhode Island planning and zoning agenda. LeaseRight uses the
multifamily projects in that ledger as future competing supply and as a way to start
a project from a known filing.

Only public agenda facts cross over: project, town, units, stage, reviewing body, date,
agenda link and the applicant named on the agenda. Lead Engine's private working fields
(priority, status, CRM flag, notes) are never copied.

Usage:
  python3 tools/sync_supply.py ../lead-engine/pipeline/leads.json
  LEAD_ENGINE_LEADS=path/to/leads.json python3 tools/sync_supply.py
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "pipeline" / "supply.json"
TOWNS = {t["name"] for t in json.loads((ROOT / "src" / "ri" / "towns.json").read_text())}
MIN_UNITS = 10

# Rhode Island review steps. First match wins: an explicit pre-application first, then the
# furthest step named (a combined "Preliminary/Final" filing counts as final).
STAGES = [
    ("pre-application", r"pre-?app|concept"),
    ("final", r"(?<!not )\bfinal\b"),
    ("preliminary", r"prelim"),
    ("master", r"master|dev plan review|public hearing|major land dev|major multi|udr|special use|planning/zoning"),
]


def stage_bucket(stage):
    s = str(stage or "").lower()
    for bucket, pattern in STAGES:
        if re.search(pattern, s):
            return bucket
    return "filed"


def main():
    source = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("LEAD_ENGINE_LEADS")
    if not source:
        raise SystemExit("usage: sync_supply.py path/to/lead-engine/pipeline/leads.json")
    data = json.loads(Path(source).read_text())
    leads = data.get("leads", data) if isinstance(data, dict) else data
    rows = []
    for lead in leads:
        if lead.get("state") != "RI" or lead.get("lead_type") != "Development":
            continue
        if lead.get("real") is False or lead.get("status") == "Draft":
            continue  # unreviewed auto-drafts stay in Lead Engine until vetted
        units = lead.get("units")
        if not isinstance(units, (int, float)) or units < MIN_UNITS or lead.get("town") not in TOWNS:
            continue
        size = str(lead.get("size") or "")
        affordable = re.search(r"(\d+)\s*%\s*aff", size)
        rows.append(
            {
                "id": lead["id"],
                "town": lead["town"],
                "name": lead.get("project_or_entity") or "Unnamed project",
                "units": int(units),
                "size": size,
                "affordablePct": int(affordable.group(1)) if affordable else None,
                "stage": lead.get("stage") or "",
                "stageBucket": stage_bucket(lead.get("stage")),
                "applicant": (lead.get("developer") or "").strip(),
                "sourceBody": lead.get("source_body") or "",
                "sourceDate": lead.get("source_date") or "",
                "agendaUrl": lead.get("agenda_url") or "",
            }
        )
    rows.sort(key=lambda r: (r["town"], -r["units"]))
    harvested = data.get("meta", {}).get("harvested_at") if isinstance(data, dict) else None
    out = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "state": "RI",
        "source": {
            "label": "Lead Engine",
            "detail": "Rhode Island planning and zoning agendas (Secretary of State Open Meetings portal)",
            "asOf": (str(harvested)[:10] if harvested else None) or max((r["sourceDate"] for r in rows), default=None),
        },
        "minUnits": MIN_UNITS,
        "projects": rows,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(rows)} projects, {sum(r['units'] for r in rows)} units", file=sys.stderr)


if __name__ == "__main__":
    main()
