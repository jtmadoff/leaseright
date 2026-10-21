import React, { useState } from "react";
import { Tile, Chip, Icon, download } from "../ui/atoms.jsx";
import { CashChart } from "../ui/charts.jsx";
import { currentBaseline, inputsKey, STAGES } from "../store/store.jsx";
import { PLAN_DEFAULTS } from "../core/model.js";
import { rentIndex, supplyNear } from "../core/market.js";
import { money, moneyShort, dateLong, duration, number, monthLabel } from "../core/format.js";

const STEP_NAMES = ["Property", "Units and rents", "Lease-up plan"];
const DEFAULT_TEXT = {
  targetOccupancy: `Target occupancy ${PLAN_DEFAULTS.targetOccupancy}%`,
  leaseTerm: `${PLAN_DEFAULTS.leaseTerm}-month leases`,
  freeMonths: "No free rent",
  moveInLag: `Rent starts ${PLAN_DEFAULTS.moveInLag} days after signing`,
};

/** Frozen copy of the inputs and headline results: the plan of record. */
export function makeBaseline(project, result) {
  const b = result.base;
  return {
    id: `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    approvedAt: new Date().toISOString(),
    key: inputsKey(project),
    inputs: { unitMix: project.unitMix, plan: project.plan, totalUnits: project.totalUnits },
    summary: {
      stabilizeDate: b.stabilizeDate,
      leaseUpDays: b.leaseUpDays,
      reserveNeed: b.reserveNeed,
      netCarry: b.netCarry,
      grossCarry: b.grossCarry,
      concessionCost: b.concessionCost,
      averageRent: result.averageRent,
      leasesPerWeek: result.inputs.pace,
      totalUnits: result.totalUnits,
    },
  };
}

export function ReviewStep({ project, result, data, onStep, onApprove, onMarket }) {
  const [table, setTable] = useState(false);
  const { baseline, current } = currentBaseline(project);

  if (!result.ready) {
    const blocking = result.issues.filter((i) => i.blocking);
    return (
      <div className="page wide">
        <div className="main">
          <div className="head">
            <div className="eyebrow">Step 4 of 4</div>
            <h1>A few inputs are still open</h1>
            <p>The plan calculates as soon as these are filled in.</p>
          </div>
          <section className="card">
            {[0, 1, 2].map((s) => {
              const items = blocking.filter((i) => i.step === s);
              if (!items.length) return null;
              return (
                <div key={s} style={{ marginBottom: 14 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{STEP_NAMES[s]}</strong>
                    <button className="btn small" onClick={() => onStep(s)}>
                      Open <Icon.arrow size={13} />
                    </button>
                  </div>
                  <ul className="muted" style={{ paddingLeft: 18, margin: "6px 0 0" }}>
                    {items.map((i, n) => (
                      <li key={n}>{i.message}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    );
  }

  const b = result.base;
  const i = result.inputs;
  const hasCarry = i.monthlyCarry > 0;
  const warnings = result.issues.filter((x) => !x.blocking);
  const index = rentIndex(data.rents, project.town, project.zip);
  const supply = supplyNear(data.supply, project.town, project.location);
  const startLabel = monthLabel(project.plan.startDate);

  return (
    <div className="page wide">
      <div className="main">
        <div className="head">
          <div className="eyebrow">Step 4 of 4 · {STAGES[project.stage].label}</div>
          <h1>{project.name || project.address || "Lease-up plan"}</h1>
          <p>
            {[project.address, project.town && `${project.town}, RI`].filter(Boolean).join(", ")}
            {project.sponsor ? ` · ${project.sponsor}` : ""}
          </p>
        </div>

        <div className="tiles">
          <Tile label="Stabilized" value={b.reached ? dateLong(b.stabilizeDate) : "Not reached"} sub={`${number(result.targetLeased)} of ${number(result.totalUnits)} units at ${i.pace.toFixed(1)} a week`} />
          <Tile label="Lease-up reserve" value={!hasCarry ? "–" : b.reserveNeed < 1 ? "None" : money(b.reserveNeed)} sub={!hasCarry ? "Add a monthly carrying cost" : b.reserveNeed < 1 ? "Rent covers carry and budgets from the start" : `Deepest shortfall, ${dateLong(b.reserveTroughDate)}`} />
          <Tile label={b.netCarry < 0 ? "Rent over carry to stabilization" : "Net carry to stabilization"} value={hasCarry ? money(Math.abs(b.netCarry)) : "–"} sub={hasCarry ? (b.netCarry < 0 ? `${money(b.rentCollected)} rent less ${money(b.grossCarry)} carry` : `${money(b.grossCarry)} carry less ${money(b.rentCollected)} rent`) : ""} />
          <Tile label="Rent covers carry" value={hasCarry ? (b.breakevenDate ? dateLong(b.breakevenDate) : "Not at target") : "–"} sub={result.carryCoverage ? `${result.carryCoverage.toFixed(2)}x coverage at target occupancy` : ""} />
          <Tile label="Asking rent" value={money(result.averageRent)} sub={`${money(result.effectiveRent)} effective${result.rentPerSqft ? ` · $${result.rentPerSqft.toFixed(2)} per SF` : ""}`} />
          <Tile label="Free rent given" value={money(b.concessionCost)} sub={`${i.freeMonths} month${i.freeMonths === 1 ? "" : "s"} on ${number(result.newLeases)} new leases`} />
        </div>

        {b.meetsTarget === false && (
          <div className="notice bad">
            At {i.pace.toFixed(1)} leases a week the plan stabilizes {dateLong(b.stabilizeDate)}, after your {dateLong(project.plan.targetDate)} target. That date needs {result.requiredPace.toFixed(2)} a week.
          </div>
        )}
        {hasCarry && !b.breakevenDate && (
          <div className="notice bad">
            Rent at target occupancy ({money(b.stabilizedMonthlyRent)} a month) does not cover the {money(i.monthlyCarry)} monthly carry, so the shortfall keeps growing after stabilization.
          </div>
        )}

        {hasCarry && (
          <section className="card">
            <h2>
              Cumulative cash through the lease-up
              <button className="btn small" onClick={() => setTable((v) => !v)}>
                {table ? "Show chart" : "Show table"}
              </button>
            </h2>
            {table ? (
              <div className="tablewrap">
                <table className="t">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="n">Units leased</th>
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
                          {m.month} · from {dateLong(m.date)}
                          {m.days < 30 ? ` (${m.days} days)` : ""}
                        </td>
                        <td className="n">{number(m.leased)}</td>
                        <td className="n">{money(m.rent)}</td>
                        <td className="n">{money(m.carry + m.budget)}</td>
                        <td className="n">{money(m.net)}</td>
                        <td className="n">{money(m.cumulative)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <CashChart scenarios={result.scenarios} startLabel={startLabel} reserve={b.reserveNeed} />
            )}
            <p className="muted small" style={{ marginTop: 10 }}>
              Rent collected less monthly carry and the marketing and staffing budgets, added up month by month. The lowest point is the reserve the plan needs.
            </p>
          </section>
        )}

        <section className="card">
          <h2>Pace scenarios</h2>
          <div className="tablewrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Case</th>
                  <th className="n">Leases a week</th>
                  <th className="n">Stabilized</th>
                  <th className="n">Lease-up</th>
                  {hasCarry && <th className="n">Rent covers carry</th>}
                  {hasCarry && <th className="n">Reserve need</th>}
                  {hasCarry && <th className="n">Cash by {monthLabel(result.compareDate)}</th>}
                  {i.targetDate !== null && <th className="n">Target date</th>}
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((s) => (
                  <tr key={s.key} className={s.key === "base" ? "emph" : ""}>
                    <td className="strong">{s.name}</td>
                    <td className="n">{s.leasesPerWeek.toFixed(2)}</td>
                    <td className="n">{s.reached ? dateLong(s.stabilizeDate) : "Beyond 10 years"}</td>
                    <td className="n">{s.reached ? duration(s.leaseUpDays) : "–"}</td>
                    {hasCarry && <td className="n">{s.breakevenDate ? dateLong(s.breakevenDate) : "Not at target"}</td>}
                    {hasCarry && <td className="n">{money(s.reserveNeed)}</td>}
                    {hasCarry && <td className="n">{money(s.finalCumulative)}</td>}
                    {i.targetDate !== null && (
                      <td className="n">
                        <span className={`status ${s.meetsTarget ? "good" : "bad"}`}>{s.meetsTarget ? "Meets" : "Misses"}</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>
            All three cases use the same rents, concessions and budgets; only the weekly pace changes.{hasCarry ? ` Cash is cumulative rent less carry and budgets through ${monthLabel(result.compareDate)}, when the slowest case has every lease paying.` : ""}
            {i.paceSource === "required" ? " The base pace is the one your target date requires, because no pace was entered." : ""}
          </p>
        </section>

        {result.extraFreeMonth && (
          <section className="card">
            <h2>What a month of free rent has to buy</h2>
            <p style={{ maxWidth: 740 }}>
              One {i.freeMonths > 0 ? "more " : ""}free month on the {number(result.newLeases)} leases still to sign gives up about <strong>{money(result.oneFreeMonthCost)}</strong> of rent.{" "}
              {result.extraFreeMonth.pace ? (
                <>
                  It pays for itself only if it lifts the pace from {i.pace.toFixed(1)} to at least <strong>{result.extraFreeMonth.pace.toFixed(1)} leases a week</strong> ({Math.round(result.extraFreeMonth.upliftPct)}% faster), which would stabilize the building by {dateLong(result.extraFreeMonth.stabilizeDate)} instead of {dateLong(b.stabilizeDate)}.
                </>
              ) : (
                <>No pace up to five times the base recovers that, so the concession does not pay for itself on timing alone.</>
              )}
            </p>
            <p className="muted small" style={{ marginTop: 8 }}>Compared on total cash once both plans are fully leased and the free rent has burned off.</p>
          </section>
        )}

        <section className="card">
          <h2>Behind the numbers</h2>
          <div className="grid2">
            <div>
              <div className="sect">Assumptions</div>
              <ul className="muted" style={{ paddingLeft: 18, margin: 0 }}>
                <li>Leasing starts {dateLong(project.plan.startDate)}; {number(result.existingLeased)} of {number(result.totalUnits)} units leased at the start.</li>
                <li>Each week's leases are spread across unit types in proportion to what is left to lease.</li>
                {i.defaulted.map((k) => (
                  <li key={k}>
                    {DEFAULT_TEXT[k]} <Chip>default</Chip>
                  </li>
                ))}
                <li>Carry is gross of rent; rent collected is netted against it. No turnover or renewals are modeled.</li>
                {project.plan.notes && <li>Notes: {project.plan.notes}</li>}
              </ul>
              {warnings.length > 0 && (
                <div className="notice" style={{ marginTop: 12 }}>
                  <ul>
                    {warnings.map((w, n) => (
                      <li key={n}>
                        {w.message}{" "}
                        <button className="linkbtn" onClick={() => onStep(w.step)}>
                          Fix
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <div className="sect">Market context</div>
              <ul className="muted" style={{ paddingLeft: 18, margin: 0 }}>
                {index ? (
                  <li>
                    {index.primary.scope} rent index {money(index.primary.rent)} ({monthLabel(index.primary.asOf)}
                    {index.primary.yoyPct !== undefined ? `, ${index.primary.yoyPct > 0 ? "+" : ""}${index.primary.yoyPct}% in a year` : ""}); your weighted asking rent is {money(result.averageRent)}.
                  </li>
                ) : (
                  <li>No rent index published for {project.town || "this town"}.</li>
                )}
                <li>
                  {supply.projects.length
                    ? `${supply.projects.length} proposed multifamily project${supply.projects.length > 1 ? "s" : ""} (${number(supply.units)} units) in ${project.town} and nearby towns.`
                    : "No proposed multifamily projects of 10+ units nearby in the current pipeline."}
                </li>
                <li>{data.rents?.listings ? "Bedroom-level medians from active listings." : "Listing-based rents by unit type are not connected yet."}</li>
              </ul>
              <button className="linkbtn small" style={{ marginTop: 8 }} onClick={() => (onMarket ? onMarket() : onStep(1))}>
                Open the market view
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>
            Baseline
            {baseline && <span className={`status ${current ? "good" : "neutral"}`}>{current ? `Version ${project.baselines.length} is current` : "Changed since the last baseline"}</span>}
          </h2>
          <p className="muted" style={{ maxWidth: 680 }}>
            {!baseline
              ? "Save a baseline to freeze these inputs and results as the plan of record. Later edits never overwrite it."
              : current
                ? `Saved ${new Date(baseline.approvedAt).toLocaleString()}.`
                : `The inputs have changed since version ${project.baselines.length} (${dateLong(baseline.approvedAt.slice(0, 10))}). That version is kept; save a new one when this is the plan.`}
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn primary"
              disabled={current || !b.reached}
              onClick={() =>
                onApprove(makeBaseline(project, result))
              }
            >
              <Icon.check /> {baseline ? "Save new baseline" : "Save baseline"}
            </button>
            {!b.reached && <span className="muted small">The base case has to reach target occupancy first.</span>}
          </div>
          {project.baselines.length > 0 && (
            <div className="tablewrap" style={{ marginTop: 16 }}>
              <table className="t">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th className="n">Stabilized</th>
                    <th className="n">Reserve</th>
                    <th className="n">Pace</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {project.baselines.map((v, n) => (
                    <tr key={v.id}>
                      <td className="strong">
                        Version {n + 1}
                        <span className="sub">{new Date(v.approvedAt).toLocaleString()}</span>
                      </td>
                      <td className="n">{dateLong(v.summary.stabilizeDate)}</td>
                      <td className="n">{moneyShort(v.summary.reserveNeed)}</td>
                      <td className="n">{v.summary.leasesPerWeek.toFixed(2)}</td>
                      <td className="n">
                        <button className="linkbtn" onClick={() => download(`${project.name || "leaseright"}-baseline-${n + 1}.json`, JSON.stringify(v, null, 2), "application/json")}>
                          Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
