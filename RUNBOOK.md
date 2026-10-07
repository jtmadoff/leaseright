# LeaseRight runbook

## What runs on its own

`.github/workflows/refresh.yml`:

- **18th of each month:** rent index, HUD rents and listings (when their secrets are set),
  pipeline sync, validation, commit. Netlify redeploys on the commit.
- **Every Monday:** pipeline sync and the rent index only. Listings are carried over so the
  API call budget is spent once a month.
- **On demand:** Actions tab, "Refresh market data", Run workflow.

## Secrets

| Secret | Needed for | Without it |
|---|---|---|
| `RENTCAST_API_KEY` | listing medians and per-building rents | the app shows the rent index and dated operator prices |
| `HUD_API_TOKEN` | HUD rents by bedroom | that column is hidden |
| `LEAD_ENGINE_TOKEN` | weekly pipeline sync from the private lead-engine repo | the committed pipeline stays as is |

## Run it by hand

```bash
python3 tools/harvest_rents.py --keep-listings
python3 tools/sync_supply.py ~/HomeBase/Macallan/entitlement_app/pipeline/leads.json
python3 tools/build_data.py
git add pipeline public/data && git commit -m "Market data refresh" && git push
```

`harvest_rents.py --zori-dir DIR` reuses CSVs already downloaded.
`harvest_rents.py --listings-file FILE.json` rolls up a saved RentCast response.

## When something looks wrong

- **A town's parcel lookup stops working.** The service moved or was taken down. Run
  `npm run test:live` to see which, fix the URL or field map in
  `pipeline/ri_parcel_registry.json`, then `python3 tools/build_towns.py`.
- **The build fails on "DATA CHECK FAILED".** The validator names the row. Fix the source
  ledger in `pipeline/`, never the copy in `public/data/`.
- **Listing numbers look thin.** Cells under 8 listings (town) or 3 (building) are flagged
  low-sample in the app. Thresholds are at the top of `harvest_rents.py`.
- **The pipeline is stale.** The top bar shows the date of the newest agenda. Pull the
  lead-engine repo and rerun `sync_supply.py`, or set `LEAD_ENGINE_TOKEN`.

## What crosses from Lead Engine

Only public agenda facts: project, town, units, review stage, reviewing body, date, agenda
link and the applicant named on the agenda. Priority, status, CRM flag and notes never leave
Lead Engine; `build_data.py` fails if one appears. Unreviewed auto-drafts are skipped.
