# LeaseRight

Lease-up planning for multifamily projects in Rhode Island. Find the property, set the unit
mix against the local market, and see when the building stabilizes and how much reserve the
lease-up needs.

This is the `rebuild/ri-foundation` branch: the new foundation for LeaseRight, approved on
October 7, 2026. It is the Model front door only. `main` and leaserightbeta.netlify.app still
run the static prototype with the operating console (Today, Pipeline, Inbox, Rents,
Applications, Reports). The console gets rebuilt here, wired to real projects, before anything
replaces the beta. See "Relationship to main" below.

It carries over the parts of the prototype's intake that were real (the Providence parcel
lookup and the lease-up arithmetic) and follows the same operating pattern as Lead Engine:
harvesters write a ledger, a validator publishes it, the app reads it.

## What a user does

The app is a dark operating console: a top bar with the project picker, a tab row for the
daily screens, and a sidebar (the menu button at the left of the tabs) with every module.

- **Model.** Overview (where the project stands and what to do next), the four plan steps,
  and the lender package.
  - *Plan steps.* Property: any Rhode Island address, with parcel, building and zoning from
    public records. Units and rents: the mix by unit type, priced against the market.
    Lease-up plan: start date, a pace or a target date, carry and budgets. Review:
    stabilization, the lease-up reserve, pace cases, the free-rent test, and Save baseline.
  - *Lender package.* The saved baseline as a document a lender can underwrite: summary,
    rents against the market, monthly cash and reserve, pace sensitivity, comparable and
    listed buildings, proposed supply, property record, assumptions and sources. Print or
    save as PDF from the browser.
- **Today.** Decisions ranked by what they cost: a unit type stalling above market (with a
  priced step down, accept, add a concession or hold a week), leasing behind the baseline,
  leads not contacted or waiting on a reply, applications and signed leases that are late,
  concessions about to end. Below them, today's tours, follow-ups and same-day replies.
- **Pipeline.** A board from new lead to signed lease. Drag a card to move it; moving into
  tour, application or lease opens the prospect so the date and unit get filled in.
- **Inbox.** Every prospect's messages as a thread, with suggested replies by stage. Messages
  are logged by hand for now; Send opens the user's own mail or messages app.
- **Rents and concessions.** Asking against effective rent, the town's listing median, the gap,
  days on market and leasing velocity per unit type, with a price stepper, suggested cuts and
  Publish. A type that was repriced in the last two weeks gets no new cut. Concession programs
  with their cost and end dates.
- **Applications.** A queue screened against the project's policy (credit floor, income
  multiple), with approve, decline and a policy editor.
- **Listings.** The syndication desk: each platform (Zillow, Apartments.com, Zumper,
  Realtor.com, Facebook Marketplace, the website) with leads, tours, leases, cost per lead,
  units live and issues such as a listing not updated since a price change; listing copy per
  unit type to paste. LeaseRight does not post to the sites yet.
- **Units, Market, Reports.** Unit tiles by floor and status; the market page (rent index,
  listing medians, comparable buildings, market activity from planning agendas); plan against
  actual with a re-forecast, plus the rent change log.

**The simulated backend.** The services the product depends on (leads arriving from the listing
sites, an agent that answers within minutes and books tours, screening, e-signature, listing
sync) run as stand-ins in the browser, writing the same fields the real services will. A clock in
the bar under the tabs moves a simulated project a day or a week at a time. Inquiries respond to
price against what the town pays for a building like this (the listing median plus the
project's premium, set on Rents), fast replies tour more often, and decisions left waiting cost
applicants. Today opens with what happened while you were away, and the Leasing agent page holds
the agent's settings, tour hours, the building facts it answers with, and the practice market's
assumptions. Any project with a saved baseline can start a practice lease-up: a copy of the
building on the simulated market, leaving the real project untouched. `docs/BACKEND.md` designs
each real service, its provider and cost, and the build order.

"Explore a sample project" on the home screen creates a fictional building eight weeks into
leasing. Its history is produced by the simulated backend itself, with the last two days left
for you, and its clock keeps running from there.

Projects live in the browser (localStorage) with JSON export and restore. Projects from the
first build are carried over automatically the first time the new version opens.

## How the data runs (same loop as Lead Engine)

```
tools/harvest_rents.py   ->  pipeline/rents.json     rent index, HUD rents, listing roll-ups
tools/sync_supply.py     ->  pipeline/supply.json    multifamily pipeline from Lead Engine
tools/build_data.py      ->  public/data/*.json      validates, then publishes for the app
.github/workflows/refresh.yml                        runs the three on a schedule and commits
```

Nobody types comps in. `build_data.py` invents nothing and fails the build on a bad row.

| Layer | Source | Cost | Refresh | Gives |
|---|---|---|---|---|
| Rent index | Zillow ZORI public CSVs | free | monthly | one rent level and 12-month trend per town, ZIP and county |
| Benchmark rents | HUD Fair Market Rents API | free token | yearly | rent by bedroom count per town (40th percentile) |
| Listings | RentCast API | free up to 50 calls a month, then $74 | monthly | median asking rent by town and bedroom count, and per-building rents |
| Pipeline | Lead Engine (`Macallan/entitlement_app/pipeline/leads.json`) | none | weekly | proposed multifamily projects of 10+ units |
| Parcels, zoning, addresses | Town and state ArcGIS services | none | live | read in the browser at lookup time |

The seven operator-page prices from the first build are kept in
`pipeline/operator_observations.json` as a dated reference (observed October 1, 2026). They
are shown with their date and are never refreshed by hand. Delete the file's rows once the
listing feed is on.

### Turning on the listing feed

GitHub only runs scheduled workflows from the default branch, so until cutover the refresh is
run by hand on the Mac Mini:

```bash
export RENTCAST_API_KEY=...        # from your RentCast account; never commit it
python3 tools/harvest_rents.py
python3 tools/build_data.py
git add pipeline public/data && git commit -m "Market data refresh" && git push
```

The harvester calls RentCast at most once a calendar month. A second run in the same month
reuses the last pull and spends nothing; `--force-listings` overrides that.

After cutover, add `RENTCAST_API_KEY` under the repo's Settings, Secrets and variables,
Actions, and the "Refresh market data" workflow takes over on its schedule.

The roll-up in `harvest_rents.py` follows RentCast's published listing schema and is covered by
`tools/test_harvest.py` against a fixture. It has not been run against a live key yet, so check
the first real run's numbers before relying on them.

Optional secrets: `HUD_API_TOKEN` (HUD rents by bedroom), `LEAD_ENGINE_TOKEN` (a read-only
token for the private lead-engine repo so the pipeline syncs weekly).

## Rhode Island coverage

`pipeline/ri_parcel_registry.json` is the research record: every municipality's public parcel
service, tested with real point, distance and attribute queries in October 2026.
`tools/build_towns.py` turns it into `src/ri/towns.json`.

- 36 of 39 towns are covered. Little Compton, New Shoreham and Foster are excluded as having
  no realistic 10+ unit lease-up. To change that, edit `EXCLUDED` in `build_towns.py` and rerun.
- Address search and zoning work in every town (state E-911 file and the RIGIS zoning layer).
- 8 towns publish a full record (use, units, year, building area), 9 publish parcel, address
  and use, 9 publish an outline only, and 10 publish no parcel service at all.
- Several layers are consultant or neighboring-town copies and could disappear. The app treats
  a failed lookup as "records not responding" and carries on.

Similar buildings are ranked, not listed: 10+ units, within a quarter to four times the
subject's size, then scored on size, building era and distance. The top six are shown with
the counts of what was filtered out. Rules are in `src/core/similarity.js`.

## The model

`src/core/model.js`, pure functions, 45 tests.

- Each day's leases are spread across unit types in proportion to what is left to lease.
- A lease starts paying after the move-in lag, and pays nothing for the free-rent months.
- Cash is rent collected, less monthly carry, less marketing and staffing spread over the
  lease-up. The lease-up reserve is the deepest cumulative shortfall.
- The three pace cases (80%, 100%, 120%) are run to the same date so they can be compared.
- The free-rent test finds the pace at which one more free month breaks even on total cash.

Not modeled: turnover, renewals, rent growth, seasonality, or any link between concessions
and pace. Pace is an input.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # model, comps, market data, parsing (114 tests)
npm run test:live    # 40 checks against the live Rhode Island services
python3 tools/test_harvest.py
python3 tools/build_data.py --check
npm run build        # writes dist/
```

## Deploy

Do not deploy this branch to production yet. To look at it, turn on a Netlify branch deploy
for `rebuild/ri-foundation`; it gets its own address and the beta is untouched. Build command
`npm run build`, publish directory `dist` (both set in `netlify.toml`).

The satellite map uses the existing Google Maps key, which is restricted to the production
domain. Anywhere else the app shows the parcel outline instead. Address search no longer
uses Google at all.

## Layout

```
src/core/      model, comps, market data, leasing pipeline, tracking, operations (ops.js), simulated backend (sim.js), formatting
src/ri/        town registry, ArcGIS adapter (parcels, zoning, E-911 address search)
src/store/     projects, persistence, migration from the first build
src/views/     plan steps, overview, lender package, market, project list
src/views/console/  Today, Pipeline, Inbox, Rents, Applications, Listings, Agent, Reports
docs/          BACKEND.md: the real services behind each stand-in
src/ui/        fields, drawer, charts, parcel sketch and satellite map
tools/         harvesters, validator, town registry builder, harvest tests
pipeline/      source ledgers (committed)
public/data/   published copies the app fetches (generated, do not hand-edit)
tests/         unit tests, plus tests/live for the public services
```

## Not built yet

- Accounts and sync. Work is per browser until there is a backend; use Export to move a project.
  Deliberate for now: the product is being worked out on the front end first.
- The real services behind the simulation: lead intake, the leasing agent over text and email,
  listing feeds, online applications and screening, lease signature and payments. On a real
  project leads are still typed in. See `docs/BACKEND.md`.
- Owner, leasing agent and broker roles.
- Broker versus in-house economics.
- Joins for Newport and South Kingstown, where units live on a second layer.
- A second state. Rhode Island specifics are confined to `src/ri/` and `tools/`.

## Relationship to main

One repo, one product. The static prototype stays on `main` and stays live until this branch
has the console. Cutover, when Justin approves it, is three commands on the Mac Mini:

```bash
git branch archive/static-prototype-2026 main
git switch rebuild/ri-foundation && git merge -s ours --allow-unrelated-histories main
git switch main && git merge --ff-only rebuild/ri-foundation
```

That keeps the prototype's full history, makes this tree the new `main`, and needs no force
push. `PROJECT.md`, `PRODUCT_DIRECTION.md` and `spec/` are carried on this branch unchanged
apart from one dated section at the top of `PROJECT.md`.
