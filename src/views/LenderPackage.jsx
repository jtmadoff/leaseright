import React, { useMemo } from "react";
import { Icon } from "../ui/atoms.jsx";
import { CashChart } from "../ui/charts.jsx";
import { currentBaseline, STAGES } from "../store/store.jsx";
import { calculate, normalizeMix, PLAN_DEFAULTS } from "../core/model.js";
import { baselineProject } from "../core/tracking.js";
import { rentIndex, bedMarket, sourceById } from "../core/market.js";
import { getTown, isIncluded } from "../ri/towns.js";
import { money, dateLong, number, monthLabel, bedLabel, duration } from "../core/format.js";
import { useMarket, SimilarTable, SupplyList } from "./Market.jsx";

const sqft = (v) => (v ? `${number(v)} SF` : "–");

function Fact({ label, value }) {
  if (value === null || value === undefined || value === "" || value === "–") return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** The plan in two sentences a credit officer can repeat. */
function narrative(r, frozen) {
  const b = r.base;
  const i = r.inputs;
  const start = dateLong(frozen.plan.startDate);
  const lead = i.existingLeased
    ? `With ${number(i.existingLeased)} of ${number(r.totalUnits)} units already leased, the plan signs the remaining ${number(r.newLeases)} leases needed at ${i.pace.toFixed(1)} a week from ${start}`
    : `The plan leases ${number(r.targetLeased)} of ${number(r.totalUnits)} units at ${i.pace.toFixed(1)} a week from ${start}`;
  const stab = b.reached ? `, reaching ${i.targetOccupancy}% on ${dateLong(b.stabilizeDate)} (${duration(b.leaseUpDays)}).` : ", and does not reach its target within ten years.";
  if (!i.monthlyCarry) return lead + stab;
  const cover = b.breakevenDate ? `Rent covers the ${money(i.monthlyCarry)} monthly carry from ${dateLong(b.breakevenDate)}` : `Rent at target occupancy does not cover the ${money(i.monthlyCarry)} monthly carry`;
  const reserve = b.reserveNeed < 1 ? "and the lease-up needs no reserve." : `and the deepest cumulative shortfall, ${money(b.reserveNeed)} on ${dateLong(b.reserveTroughDate)}, sizes the lease-up reserve.`;
  return `${lead}${stab} ${cover}, ${reserve}`;
}

export function LenderPackage({ project, data, onStep, onPatch }) {
  const { baseline, current } = currentBaseline(project);
  const frozen = useMemo(() => (baseline ? baselineProject(project, baseline) : project), [project, baseline]);
  const r = useMemo(() => calculate(frozen, { townIncluded: isIncluded }), [frozen]);
  const market = useMarket(frozen, data);

  if (!baseline || !r.ready) {
    return (
      <div className="page wide">
        <div className="main">
          <div className="head">
            <div className="eyebrow">Lender package</div>
            <h1>A plan a lender can underwrite</h1>
            <p>The package presents the saved baseline: the lease-up schedule, the reserve it needs, the pace cases, rents against the market, comparable buildings, nearby supply and every assumption behind the numbers. Save a baseline first so the package shows a fixed version of record.</p>
          </div>
          <button className="btn primary" onClick={() => onStep(3)}>
            Review the plan and save a baseline <Icon.arrow />
          </button>
        </div>
      </div>
    );
  }

  const b = r.base;
  const i = r.inputs;
  const ver = project.baselines.indexOf(baseline) + 1;
  const town = getTown(project.town);
  const index = rentIndex(data.rents, project.town, project.zip);
  const zori = sourceById(data.rents, "zori");
  const listings = sourceById(data.rents, "listings");
  const parcel = project.parcel;
  const mix = normalizeMix(frozen.unitMix);
  const hasCarry = i.monthlyCarry > 0;
  const today = new Date().toISOString().slice(0, 10);
  const prepared = dateLong(today);

  return (
    <div className="page wide pkg">
      <div className="main">
        <div className="pkg-toolbar">
          <div>
            <div className="eyebrow">Lender package · baseline v{ver}</div>
            <p className="muted small">
              {current ? "Matches the current plan." : `Built from version ${ver} saved ${dateLong(baseline.approvedAt.slice(0, 10))}. The plan has been edited since; save a new baseline to update the package.`}
            </p>
          </div>
          <label className="field inline">
            <span>Prepared for</span>
            <input value={project.packageFor || ""} onChange={(e) => onPatch({ packageFor: e.target.value.slice(0, 120) })} placeholder="Lender name (optional)" />
          </label>
          <button className="btn primary" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>

        <article className="doc">
          <header className="doc-cover">
            <div className="doc-brand">LeaseRight · Lease-up plan</div>
            <h1>{project.name || project.address}</h1>
            <p>
              {project.address}, {project.town}, RI {project.zip}
            </p>
            <dl className="doc-meta">
              <Fact label="Sponsor" value={project.sponsor} />
              <Fact label="Prepared for" value={project.packageFor} />
              <Fact label="Stage" value={STAGES[project.stage].label} />
              <Fact label="Units" value={number(r.totalUnits)} />
              <Fact label="Plan version" value={`Baseline v${ver}, ${dateLong(baseline.approvedAt.slice(0, 10))}`} />
              <Fact label="Prepared" value={prepared} />
            </dl>
          </header>

          <section>
            <h2>Summary</h2>
            <p className="lede">{narrative(r, frozen)}</p>
            <div className="doc-figs">
              <div>
                <span>Stabilized</span>
                <b>{b.reached ? dateLong(b.stabilizeDate) : "Not reached"}</b>
                <small>{i.targetOccupancy}% leased</small>
              </div>
              <div>
                <span>Lease-up</span>
                <b>{b.reached ? duration(b.leaseUpDays) : "–"}</b>
                <small>{i.pace.toFixed(1)} leases a week</small>
              </div>
              {hasCarry && (
                <div>
                  <span>Lease-up reserve</span>
                  <b>{b.reserveNeed < 1 ? "None" : money(b.reserveNeed)}</b>
                  <small>{b.reserveNeed < 1 ? "rent covers carry" : `deepest ${dateLong(b.reserveTroughDate)}`}</small>
                </div>
              )}
              {hasCarry && (
                <div>
                  <span>Rent covers carry</span>
                  <b>{b.breakevenDate ? dateLong(b.breakevenDate) : "Not at target"}</b>
                  <small>{r.carryCoverage ? `${r.carryCoverage.toFixed(2)}x at target occupancy` : ""}</small>
                </div>
              )}
              <div>
                <span>Average asking rent</span>
                <b>{money(r.averageRent)}</b>
                <small>{money(r.effectiveRent)} effective</small>
              </div>
              <div>
                <span>Rent at stabilization</span>
                <b>{money(b.stabilizedMonthlyRent)}</b>
                <small>a month, {i.targetOccupancy}% leased</small>
              </div>
            </div>
          </section>

          <section>
            <h2>Unit mix and rents against the market</h2>
            <table className="dt">
              <thead>
                <tr>
                  <th>Unit type</th>
                  <th className="n">Units</th>
                  <th className="n">Avg SF</th>
                  <th className="n">Asking rent</th>
                  <th className="n">Per SF</th>
                  <th className="n">Listings median</th>
                  <th className="n">Difference</th>
                </tr>
              </thead>
              <tbody>
                {mix.map((row) => {
                  const mk = row.beds === null || Number.isNaN(row.beds) ? null : bedMarket(data, project.town, row.beds).listings;
                  return (
                    <tr key={row.id}>
                      <td>{row.label || bedLabel(row.beds)}</td>
                      <td className="n">{number(row.count)}</td>
                      <td className="n">{row.sqft ? number(row.sqft) : "–"}</td>
                      <td className="n">{money(row.rent)}</td>
                      <td className="n">{row.sqft ? `$${(row.rent / row.sqft).toFixed(2)}` : "–"}</td>
                      <td className="n">{mk ? `${money(mk.median)} (${mk.n})` : "–"}</td>
                      <td className="n">{mk ? `${row.rent >= mk.median ? "+" : ""}${Math.round((row.rent / mk.median - 1) * 100)}%` : "–"}</td>
                    </tr>
                  );
                })}
                <tr className="total">
                  <td>Total</td>
                  <td className="n">{number(r.totalUnits)}</td>
                  <td />
                  <td className="n">{money(r.averageRent)}</td>
                  <td className="n">{r.rentPerSqft ? `$${r.rentPerSqft.toFixed(2)}` : ""}</td>
                  <td colSpan={2} className="n">
                    {money(r.grossMonthlyRent)} a month at full occupancy
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="note">
              {index ? `${index.primary.scope} rent index ${money(index.primary.rent)} (${monthLabel(index.primary.asOf)}${index.primary.yoyPct !== undefined ? `, ${index.primary.yoyPct > 0 ? "+" : ""}${index.primary.yoyPct}% in a year` : ""}). ` : ""}
              {listings ? `Listings medians are asking rents for ${project.town} by bedroom count from ${number(data.rents.listings.usedCount)} active listings statewide, pulled ${dateLong(listings.asOf)}; the count in parentheses is the town sample.` : "Bedroom-level listing medians were not available when this was prepared."}
            </p>
          </section>

          {hasCarry && (
            <section className="break">
              <h2>Lease-up cash and the reserve</h2>
              <CashChart scenarios={r.scenarios} startLabel={monthLabel(frozen.plan.startDate)} reserve={b.reserveNeed} />
              <table className="dt compact">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="n">Leased</th>
                    <th className="n">Occupancy</th>
                    <th className="n">Rent collected</th>
                    <th className="n">Carry and budgets</th>
                    <th className="n">Net</th>
                    <th className="n">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {b.months.map((m) => (
                    <tr key={m.month}>
                      <td>
                        {m.month}. {monthLabel(m.date)}
                      </td>
                      <td className="n">{number(m.leased)}</td>
                      <td className="n">{Math.round((m.leased / r.totalUnits) * 100)}%</td>
                      <td className="n">{money(m.rent)}</td>
                      <td className="n">{money(m.carry + m.budget)}</td>
                      <td className="n">{money(m.net)}</td>
                      <td className="n">{money(m.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="note">Rent collected less monthly carry and the marketing and staffing budgets, cumulative by month for the base case. The lowest cumulative point is the reserve.</p>
            </section>
          )}

          <section className="keep">
            <h2>Pace sensitivity</h2>
            <table className="dt">
              <thead>
                <tr>
                  <th>Case</th>
                  <th className="n">Leases a week</th>
                  <th className="n">Stabilized</th>
                  <th className="n">Lease-up</th>
                  {hasCarry && <th className="n">Rent covers carry</th>}
                  {hasCarry && <th className="n">Reserve need</th>}
                </tr>
              </thead>
              <tbody>
                {r.scenarios.map((s) => (
                  <tr key={s.key} className={s.key === "base" ? "total" : ""}>
                    <td>{s.name}</td>
                    <td className="n">{s.leasesPerWeek.toFixed(1)}</td>
                    <td className="n">{s.reached ? dateLong(s.stabilizeDate) : "Beyond 10 years"}</td>
                    <td className="n">{s.reached ? duration(s.leaseUpDays) : "–"}</td>
                    {hasCarry && <td className="n">{s.breakevenDate ? dateLong(s.breakevenDate) : "Not at target"}</td>}
                    {hasCarry && <td className="n">{money(s.reserveNeed)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {r.extraFreeMonth?.pace && (
              <p className="note">
                Concessions: one {i.freeMonths > 0 ? "more " : ""}month of free rent on the {number(r.newLeases)} leases to sign costs about {money(r.oneFreeMonthCost)}. It pays for itself only if it lifts the pace to {r.extraFreeMonth.pace.toFixed(1)} leases a week ({Math.round(r.extraFreeMonth.upliftPct)}% faster).
              </p>
            )}
          </section>

          <section>
            <h2>Market support</h2>
            <h3>Comparable apartment buildings</h3>
            <SimilarTable market={market} data={data} />
            {market.listingBuildings.length > 0 && (
              <>
                <h3>Buildings with active listings in {project.town}</h3>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Building</th>
                      <th className="n">Listings</th>
                      <th className="n">Built</th>
                      <th>Median asking rent by unit type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...market.listingBuildings]
                      .sort((x, y) => y.listings - x.listings)
                      .slice(0, 8)
                      .map((lb) => (
                        <tr key={lb.address}>
                          <td>{lb.address}</td>
                          <td className="n">{lb.listings}</td>
                          <td className="n">{lb.yearBuilt || "–"}</td>
                          <td>
                            {Object.entries(lb.byBed)
                              .sort(([x], [y]) => Number(x) - Number(y))
                              .map(([bed, c]) => `${bedLabel(bed)} ${money(c.median)}`)
                              .join(" · ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <p className="note">Buildings with three or more active listings in the {dateLong(listings?.asOf)} pull, ranked by listing count.</p>
              </>
            )}
            <h3>Proposed supply nearby</h3>
            <SupplyList market={market} limit={8} />
            <p className="note">Proposed multifamily projects of 10+ units on Rhode Island planning and zoning agendas in {project.town} and towns within six miles. Proposed units, not deliveries.</p>
          </section>

          {(parcel || project.zoning) && (
            <section className="keep">
              <h2>Property record</h2>
              <dl className="doc-meta wide">
                <Fact label="Parcel" value={parcel?.parcelId} />
                <Fact label="Lot" value={parcel?.lotSqft ? sqft(parcel.lotSqft) : null} />
                <Fact label="Existing building" value={parcel?.buildingSqft ? sqft(parcel.buildingSqft) : null} />
                <Fact label="Recorded use" value={parcel?.useDesc} />
                <Fact label="Recorded units" value={parcel?.units ? number(parcel.units) : null} />
                <Fact label="Year built" value={parcel?.yearBuilt} />
                <Fact label="Zoning" value={project.zoning ? `${project.zoning.code}${project.zoning.description ? `, ${project.zoning.description}` : ""}` : parcel?.zoning} />
                <Fact label="Project type" value={project.projectType} />
              </dl>
              <p className="note">Public records describe what exists on the parcel today, not the proposed program.</p>
            </section>
          )}

          <section>
            <h2>Assumptions and sources</h2>
            <ul className="doc-list">
              <li>Leasing starts {dateLong(frozen.plan.startDate)} with {number(i.existingLeased)} units leased. Target occupancy {i.targetOccupancy}% ({number(r.targetLeased)} units).</li>
              <li>{i.leaseTerm}-month leases. {i.freeMonths ? `${i.freeMonths} month${i.freeMonths === 1 ? "" : "s"} free on each new lease, taken up front.` : "No free rent."} Rent starts {i.moveInLag} days after signing.</li>
              <li>Each week's leases are spread across unit types in proportion to what is left to lease{mix.some((m) => m.availableDate) ? ", from each type's delivery date" : ""}.</li>
              {hasCarry && (
                <li>
                  Monthly carry {money(i.monthlyCarry)} (debt service and operating costs before rent). Marketing {money(i.marketing)} and staffing or brokerage {money(i.staffing)}, spread across the lease-up.
                </li>
              )}
              <li>Not modeled: turnover, renewals, rent growth, seasonality, or any effect of concessions on pace.</li>
              {i.defaulted.length > 0 && <li>Defaults used for: {i.defaulted.map((k) => ({ targetOccupancy: "target occupancy", leaseTerm: "lease term", freeMonths: "free rent", moveInLag: "rent start" })[k]).join(", ")} (standard values: {PLAN_DEFAULTS.targetOccupancy}%, {PLAN_DEFAULTS.leaseTerm} months, none, {PLAN_DEFAULTS.moveInLag} days).</li>}
              {frozen.plan.notes && <li>Sponsor notes: {frozen.plan.notes}</li>}
            </ul>
            <ul className="doc-list sources">
              {zori && <li>Rent index: Zillow Observed Rent Index, {monthLabel(zori.asOf)}.</li>}
              {listings && <li>Listing rents: RentCast active rental listings, {dateLong(listings.asOf)}.</li>}
              {data.supply?.source?.asOf && <li>Proposed supply: Rhode Island planning and zoning agendas through {dateLong(data.supply.source.asOf)}.</li>}
              {town?.parcel && <li>Parcel record: {project.town} public GIS ({town.parcel.dataAsOf}).</li>}
              <li>Zoning: Rhode Island statewide zoning layer (RIGIS).</li>
            </ul>
            <p className="note">A projection built from the assumptions above, not a guarantee of results. Figures are as of the baseline date shown on the cover.</p>
          </section>
        </article>
      </div>
    </div>
  );
}
