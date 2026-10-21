import React, { useMemo } from "react";
import { Chip, Icon } from "../ui/atoms.jsx";
import { STAGES, currentBaseline } from "../store/store.jsx";
import { calculate } from "../core/model.js";
import { INCLUDED_TOWNS, ALL_TOWNS, coverageCounts, isIncluded } from "../ri/towns.js";
import { dateLong, moneyShort, number, relativeDay } from "../core/format.js";

function Coverage() {
  const c = coverageCounts();
  const excluded = ALL_TOWNS.filter((t) => !t.included);
  const group = (tier) => INCLUDED_TOWNS.filter((t) => (t.parcel ? t.parcel.tier : "none") === tier).map((t) => t.name);
  return (
    <section className="card">
      <h2>
        Rhode Island coverage <small>{INCLUDED_TOWNS.length} of 39 cities and towns</small>
      </h2>
      <p className="muted" style={{ maxWidth: 760 }}>
        Address search and zoning work statewide. The parcel record depends on what each town publishes.
      </p>
      <dl className="facts" style={{ marginTop: 12, gridTemplateColumns: "1fr" }}>
        <div>
          <dt>Parcel, use, units and building record ({c.full})</dt>
          <dd className="small">{group("full").join(", ")}</dd>
        </div>
        <div>
          <dt>Parcel, address and land use ({c.basic})</dt>
          <dd className="small">{group("basic").join(", ")}</dd>
        </div>
        <div>
          <dt>Parcel outline only ({c.boundary})</dt>
          <dd className="small">{group("boundary").join(", ")}</dd>
        </div>
        <div>
          <dt>No public parcel service; zoning and viewer link only ({c.none})</dt>
          <dd className="small">{group("none").join(", ")}</dd>
        </div>
        <div>
          <dt>Not covered ({excluded.length})</dt>
          <dd className="small">{excluded.map((t) => t.name).join(", ")}</dd>
        </div>
      </dl>
    </section>
  );
}

export function Projects({ projects, data, onOpen, onNew }) {
  const rows = useMemo(
    () =>
      projects.map((p) => {
        const r = calculate(p, { townIncluded: isIncluded });
        return { p, r, baseline: currentBaseline(p) };
      }),
    [projects],
  );
  const activity = [...(data.supply?.projects || [])].sort((a, b) => (b.sourceDate || "").localeCompare(a.sourceDate || "")).slice(0, 10);
  return (
    <div className="page wide">
      <div className="main">
        <div className="head">
          <div className="eyebrow">Lease-up planning · Rhode Island</div>
          <h1>{projects.length ? "Projects" : "Know what stabilization will take."}</h1>
          {!projects.length && (
            <p>
              Plan the lease-up against the local market, send lenders a plan they can underwrite, then track every week of leasing against it.
            </p>
          )}
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={() => onNew()}>
              <Icon.plus /> {projects.length ? "New project" : "Start a project"}
            </button>
          </div>
        </div>

        {rows.length > 0 && (
          <section className="card">
            <div className="tablewrap">
              <table className="t click">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Town</th>
                    <th>Stage</th>
                    <th className="n">Units</th>
                    <th className="n">Stabilized</th>
                    <th className="n">Reserve</th>
                    <th>Status</th>
                    <th className="n">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, r, baseline }) => (
                    <tr key={p.id} onClick={() => onOpen(p.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(p.id)}>
                      <td className="strong">
                        {p.name || p.address || "Untitled project"}
                        <span className="sub">{p.address}</span>
                      </td>
                      <td>{p.town || "–"}</td>
                      <td>{STAGES[p.stage]?.label}</td>
                      <td className="n">{number(Number(p.totalUnits) || r.inputs.totalUnits || null)}</td>
                      <td className="n">{r.ready && r.base.reached ? dateLong(r.base.stabilizeDate) : "–"}</td>
                      <td className="n">{r.ready && r.inputs.monthlyCarry ? moneyShort(r.base.reserveNeed) : "–"}</td>
                      <td>
                        {p.actuals?.length ? (
                          <Chip tone="good">Leasing</Chip>
                        ) : baseline.baseline ? (
                          <Chip tone={baseline.current ? "good" : "warn"}>{baseline.current ? `Baseline v${p.baselines.length}` : `v${p.baselines.length}, edited since`}</Chip>
                        ) : (
                          <span className="muted">Draft</span>
                        )}
                      </td>
                      <td className="n">{relativeDay(p.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activity.length > 0 && (
          <section className="card">
            <h2>
              Market activity
              <small>
                Planning and zoning agendas
                {data.supply.source.asOf ? ` through ${dateLong(data.supply.source.asOf)}` : ""}
              </small>
            </h2>
            <p className="muted" style={{ maxWidth: 760, marginBottom: 12 }}>
              Multifamily projects of 10+ units in front of Rhode Island planning boards: the supply that may compete with yours. Each project's market view shows the ones near it.
            </p>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Town</th>
                    <th className="n">Units</th>
                    <th>Review stage</th>
                    <th className="n">Agenda</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((s) => (
                    <tr key={s.id}>
                      <td className="strong">
                        {s.name}
                        <span className="sub">{s.applicant}</span>
                      </td>
                      <td>{s.town}</td>
                      <td className="n">{number(s.units)}</td>
                      <td>{s.stage}</td>
                      <td className="n">{s.agendaUrl ? <a href={s.agendaUrl} target="_blank" rel="noreferrer">{dateLong(s.sourceDate)}</a> : dateLong(s.sourceDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Coverage />
      </div>
    </div>
  );
}
