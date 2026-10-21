import React, { useMemo } from "react";
import { Tile, Icon, Chip } from "../ui/atoms.jsx";
import { currentBaseline, STAGES } from "../store/store.jsx";
import { normalizeMix, parseDate, isoDate, DAY_MS } from "../core/model.js";
import { trackProject, todayTasks } from "../core/leasing.js";
import { rentIndex, bedMarket, supplyNear } from "../core/market.js";
import { isIncluded } from "../ri/towns.js";
import { money, moneyShort, dateLong, number, monthLabel, bedLabel, localToday } from "../core/format.js";
import { makeBaseline } from "./ReviewStep.jsx";

/** The one thing to do next, from where the project stands. */
function nextAction(project, result, baseline, current, track) {
  const blocking = (s) => result.issues.filter((i) => i.blocking && i.step === s);
  // Once leasing is under way, the day's work comes before anything else.
  if (baseline && (project.prospects || []).length) {
    const tasks = todayTasks(project, localToday());
    if (track?.stabilized) return { title: "Stabilized", body: `Leasing reached its ${track.target}-unit target ${dateLong(track.reforecast.stabilizeDate)}.`, label: "Open leasing", go: { view: "leasing" } };
    return tasks.length
      ? { title: `${tasks.length} thing${tasks.length === 1 ? "" : "s"} to do today`, body: tasks.slice(0, 3).map((t) => `${t.title} (${t.p.name})`).join(", ") + (tasks.length > 3 ? ", and more." : "."), label: "Open today", go: { view: "leasing" } }
      : { title: "Nothing due today", body: "Every tour, application and follow-up is handled. New leads go in on the leasing page.", label: "Open leasing", go: { view: "leasing" } };
  }

  if (!project.address || !project.town || !isIncluded(project.town)) return { title: "Find the property", body: "Search the address so the parcel, zoning and local market load.", label: "Open property", go: { step: 0 } };
  if (!normalizeMix(project.unitMix).length || blocking(1).length)
    return { title: "Set the unit mix and rents", body: blocking(1)[0]?.message || "Add each unit type with its count and asking rent, priced against the market alongside.", label: "Open units and rents", go: { step: 1 } };
  if (blocking(2).length) return { title: "Finish the lease-up plan", body: blocking(2)[0].message, label: "Open the plan", go: { step: 2 } };
  if (!baseline) return { title: "Review the plan and save a baseline", body: "The baseline freezes this plan as the version of record. The lender package and leasing tracker both work from it.", label: "Review and save", go: { step: 3 }, save: result.ready && result.base.reached };
  if (!current) return { title: "The plan changed since the baseline", body: `Inputs were edited after version ${project.baselines.length}. Review the results and save a new baseline when this is the plan.`, label: "Review changes", go: { step: 3 } };
  const logged = track?.weeks.length || 0;
  if (track?.stabilized) return { title: "Stabilized", body: `Leasing reached its ${track.target}-unit target ${dateLong(track.reforecast.stabilizeDate)}.`, label: "Open leasing", go: { view: "leasing" } };
  const startMs = parseDate(project.plan.startDate);
  const today = parseDate(isoDate(Date.now()));
  // Pre-funding plans often carry a start date that has passed; only a funded or leasing project is prompted to log.
  const leasingLive = logged > 0 || project.stage === "active_leaseup" || (project.stage === "funded_prelaunch" && startMs !== null && startMs <= today);
  if (leasingLive) {
    const last = logged ? parseDate(track.asOf) : null;
    if (last === null || today - last > 7 * DAY_MS)
      return { title: "Log this week's leasing", body: last === null ? "Leasing has started. Enter the first week's leases to start measuring against the plan." : `The last week logged ended ${dateLong(track.asOf)}.`, label: "Open leasing", go: { view: "leasing" } };
    return { title: "Leasing is up to date", body: "This week is logged. The update for your lender or partners is on the leasing page.", label: "Open leasing", go: { view: "leasing" } };
  }
  return { title: "Send the lender package", body: "The baseline is saved. The package presents it to a lender: plan, reserve, pace cases, rents against the market and the assumptions behind them.", label: "Open lender package", go: { view: "package" } };
}

function RentCheck({ project, data }) {
  const rows = normalizeMix(project.unitMix).filter((r) => r.rent);
  if (!rows.length || !project.town) return <p className="muted">Rents appear here against local listings once the unit mix is in.</p>;
  return (
    <div className="tablewrap">
      <table className="t">
        <thead>
          <tr>
            <th>Unit type</th>
            <th className="n">Units</th>
            <th className="n">Your rent</th>
            <th className="n">Listings median</th>
            <th className="n">Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mk = r.beds === null || Number.isNaN(r.beds) ? null : bedMarket(data, project.town, r.beds).listings;
            const diff = mk ? (r.rent / mk.median - 1) * 100 : null;
            return (
              <tr key={r.id}>
                <td className="strong">{r.label || bedLabel(r.beds)}</td>
                <td className="n">{number(r.count)}</td>
                <td className="n">{money(r.rent)}</td>
                <td className="n">
                  {mk ? money(mk.median) : "–"}
                  {mk && <span className="sub">{mk.n} listings{mk.lowSample ? ", low sample" : ""}</span>}
                </td>
                <td className="n">{diff === null ? "–" : `${diff >= 0 ? "+" : ""}${Math.round(diff)}%`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Overview({ project, result, data, onStep, onView, onMarket, onApprove }) {
  const { baseline, current } = currentBaseline(project);
  const track = useMemo(() => (baseline ? trackProject(project, baseline, localToday()) : null), [project, baseline]);
  const action = nextAction(project, result, baseline, current, track);
  const b = result.ready ? result.base : null;
  const index = rentIndex(data.rents, project.town, project.zip);
  const supply = project.town ? supplyNear(data.supply, project.town, project.location) : { projects: [], units: 0 };
  const go = (g) => (g.view ? onView(g.view) : onStep(g.step));
  const steps = [
    ["Property", !!(project.address && project.town), project.address ? `${project.address}, ${project.town}` : "Not set", () => onStep(0)],
    ["Units and rents", normalizeMix(project.unitMix).length > 0 && !result.issues.some((i) => i.blocking && i.step === 1), result.ready ? `${number(result.totalUnits)} units at ${money(result.averageRent)} average` : "Not complete", () => onStep(1)],
    ["Lease-up plan", !result.issues.some((i) => i.blocking && i.step === 2), result.ready ? `${result.inputs.pace.toFixed(1)} leases a week from ${dateLong(project.plan.startDate)}` : "Not complete", () => onStep(2)],
    ["Baseline", current, baseline ? `Version ${project.baselines.length}, ${dateLong(baseline.approvedAt.slice(0, 10))}${current ? "" : ", edited since"}` : "Not saved", () => onStep(3)],
    ["Lender package", !!baseline, baseline ? "Ready to print or save as PDF" : "Needs a baseline", () => onView("package")],
    ["Leasing", (track?.weeks.length || 0) > 0, (project.prospects || []).length ? `${number(project.prospects.length)} prospects, ${(project.units || []).length ? `${number(project.units.length)} units tracked` : "no unit list yet"}` : track?.weeks.length ? `${track.weeks.length} week${track.weeks.length === 1 ? "" : "s"} logged, through ${dateLong(track.asOf)}` : "Not started", () => onView("leasing")],
  ];
  return (
    <div className="page wide">
      <div className="main">
        <div className="head">
          <div className="eyebrow">
            Overview · {STAGES[project.stage].label}
            {project.projectType ? ` · ${project.projectType}` : ""}
          </div>
          <h1>{project.name || project.address || "Untitled project"}</h1>
          <p>
            {[project.address, project.town && `${project.town}, RI ${project.zip || ""}`.trim()].filter(Boolean).join(", ") || "No address yet"}
            {project.sponsor ? ` · ${project.sponsor}` : ""}
          </p>
        </div>

        <section className="card next">
          <div>
            <div className="sect">Next</div>
            <h2 style={{ marginBottom: 4 }}>{action.title}</h2>
            <p className="muted" style={{ maxWidth: 680 }}>
              {action.body}
            </p>
          </div>
          <div className="row">
            {action.save && (
              <button className="btn primary" onClick={() => onApprove(makeBaseline(project, result))}>
                <Icon.check /> Save baseline now
              </button>
            )}
            <button className={`btn ${action.save ? "" : "primary"}`} onClick={() => go(action.go)}>
              {action.label} <Icon.arrow />
            </button>
          </div>
        </section>

        {track && track.weeks.length > 0 && (
          <div className="tiles">
            <Tile label="Leased" value={`${number(Math.round(track.actualLeased))} of ${number(track.totalUnits)}`} sub={`as of ${dateLong(track.asOf)}`} />
            <Tile label="Against the baseline" value={`${track.variance >= 0 ? "+" : ""}${Math.round(track.variance)} leases`} sub={track.daysAhead === null ? "" : Math.round(track.daysAhead / 7) === 0 ? "on schedule" : `${Math.abs(Math.round(track.daysAhead / 7))} week${Math.abs(Math.round(track.daysAhead / 7)) === 1 ? "" : "s"} ${track.daysAhead > 0 ? "ahead" : "behind"}`} />
            <Tile label="Current pace" value={`${track.trailingPace.toFixed(1)} / wk`} sub={`plan ${track.planPace.toFixed(1)}`} />
            <Tile label="Re-forecast" value={track.stabilized ? "Stabilized" : track.reforecast?.reached ? dateLong(track.reforecast.stabilizeDate) : "Not at this pace"} sub={`baseline ${dateLong(track.base.stabilizeDate)}`} />
          </div>
        )}

        {b && !(track && track.weeks.length) && (
          <div className="tiles">
            <Tile label="Stabilized" value={b.reached ? dateLong(b.stabilizeDate) : "Not reached"} sub={`${number(result.targetLeased)} of ${number(result.totalUnits)} units at ${result.inputs.pace.toFixed(1)} a week`} />
            <Tile label="Lease-up reserve" value={!result.inputs.monthlyCarry ? "–" : b.reserveNeed < 1 ? "None" : moneyShort(b.reserveNeed)} sub={!result.inputs.monthlyCarry ? "add monthly carry" : `deepest ${dateLong(b.reserveTroughDate)}`} />
            <Tile label="Rent covers carry" value={result.inputs.monthlyCarry ? (b.breakevenDate ? dateLong(b.breakevenDate) : "Not at target") : "–"} sub={result.carryCoverage ? `${result.carryCoverage.toFixed(2)}x at target` : ""} />
            <Tile label="Asking rent" value={money(result.averageRent)} sub={index ? `${index.primary.scope} index ${money(index.primary.rent)}` : `${money(result.effectiveRent)} effective`} />
          </div>
        )}

        <div className="grid2 top">
          <section className="card">
            <h2>Where the project stands</h2>
            <ul className="checklist">
              {steps.map(([label, ok, detail, open]) => (
                <li key={label}>
                  <span className={`dot ${ok ? "ok" : ""}`}>{ok ? <Icon.check size={11} /> : null}</span>
                  <button className="linkbtn" onClick={open}>
                    {label}
                  </button>
                  <span className="muted small">{detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>
              {project.town ? `${project.town} market` : "Market"}
              {project.town && (
                <button className="btn small" onClick={onMarket}>
                  Full view <Icon.arrow size={13} />
                </button>
              )}
            </h2>
            {index && (
              <p className="small" style={{ marginBottom: 12 }}>
                Rent index <strong>{money(index.primary.rent)}</strong> <span className="muted">({index.primary.scope}, {monthLabel(index.primary.asOf)}{index.primary.yoyPct !== undefined ? `, ${index.primary.yoyPct > 0 ? "+" : ""}${index.primary.yoyPct}% in a year` : ""})</span>
              </p>
            )}
            <RentCheck project={project} data={data} />
            <p className="muted small" style={{ marginTop: 10 }}>
              {supply.projects.length
                ? `Market activity: ${supply.projects.length} proposed multifamily project${supply.projects.length === 1 ? "" : "s"} (${number(supply.units)} units) on planning agendas in and around ${project.town}.`
                : project.town
                  ? `No proposed multifamily projects of 10+ units on planning agendas near ${project.town}.`
                  : ""}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
