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
  const started = new Set(projects.map((p) => p.supplyId).filter(Boolean));
  const pipeline = (data.supply?.projects || []).filter((s) => !started.has(s.id));
  return (
    <div className="page wide">
      <div className="main">
        <div className="head">
          <div className="eyebrow">Lease-up planning · Rhode Island</div>
          <h1>{projects.length ? "Projects" : "Know what stabilization will take."}</h1>
          {!projects.length && (
            <p>
              Find the property, set the unit mix against the local market, and see the stabilization date and the reserve the lease-up needs. Four steps, with results as you go.
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
                    <th>Baseline</th>
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
                      <td>{baseline.baseline ? <Chip tone={baseline.current ? "good" : "warn"}>{baseline.current ? `v${p.baselines.length}` : `v${p.baselines.length}, edited since`}</Chip> : <span className="muted">Draft</span>}</td>
                      <td className="n">{relativeDay(p.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {pipeline.length > 0 && (
          <section className="card">
            <h2>
              Start from the entitlement pipeline
              <small>
                {data.supply.source.label}
                {data.supply.source.asOf ? ` · agendas through ${dateLong(data.supply.source.asOf)}` : ""}
              </small>
            </h2>
            <p className="muted" style={{ maxWidth: 760, marginBottom: 12 }}>
              Multifamily projects of 10+ units now in front of Rhode Island planning boards. Starting from one carries its town, unit count and applicant into a new plan.
            </p>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Town</th>
                    <th className="n">Units</th>
                    <th>Review stage</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pipeline.map((s) => (
                    <tr key={s.id}>
                      <td className="strong">
                        {s.name}
                        <span className="sub">{s.applicant}</span>
                      </td>
                      <td>{s.town}</td>
                      <td className="n">{number(s.units)}</td>
                      <td>
                        {s.stage}
                        <span className="sub">{dateLong(s.sourceDate)}</span>
                      </td>
                      <td className="n">
                        <button className="btn small" onClick={() => onNew({ name: s.name, town: s.town, totalUnits: String(s.units), sponsor: s.applicant, stage: "pre_funding", supplyId: s.id })}>
                          Plan this
                        </button>
                      </td>
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
