import { weeklyLog } from "../../core/sim.js";
import React from "react";
import { Head, Band } from "./common.jsx";
import { useMarket, MarketBody } from "../Market.jsx";
import { concessionStats } from "../../core/ops.js";
import { normalizeMix } from "../../core/model.js";
import { money, dateLong } from "../../core/format.js";

export function MarketPage({ project, data }) {
  const market = useMarket(project, data);
  return (
    <div className="cpage">
      <Head code="Market" name={`${project.town || "Rhode Island"} · rents, comparable buildings, market activity`} />
      <div className="wrap20" style={{ maxWidth: 1100 }}>
        <MarketBody project={project} data={data} market={market} />
      </div>
    </div>
  );
}

function WeeklyActivity({ project, types }) {
  const weeks = weeklyLog(project);
  const changes = project.priceLog || [];
  return (
    <>
      <Band>Leasing activity by week</Band>
      <div className="tablewrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Week</th>
              <th className="n">Leads</th>
              <th className="n">Agent replies</th>
              <th className="n">First reply</th>
              <th className="n">To you</th>
              <th className="n">Tours</th>
              <th className="n">Apps</th>
              <th className="n">Leases</th>
              <th>Rent changes</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => {
              const ch = changes.filter((c) => c.at >= w.from && c.at <= w.to);
              return (
                <tr key={w.from}>
                  <td className="mono">{dateLong(w.from).replace(/, \d{4}$/, "")} to {dateLong(w.to).replace(/, \d{4}$/, "")}</td>
                  <td className="n">{w.leads}</td>
                  <td className="n">{w.auto}</td>
                  <td className="n">{w.responseMedian === null ? "–" : w.responseMedian < 60 ? `${w.responseMedian} min` : `${Math.round(w.responseMedian / 60)} h`}</td>
                  <td className="n">{w.escalated}</td>
                  <td className="n">{w.toursHeld}</td>
                  <td className="n">{w.applications}</td>
                  <td className={`n ${w.leases ? "pos" : ""}`}>{w.leases}</td>
                  <td className="small">{ch.map((c) => `${types[c.typeId] || "Unit type"} to ${money(c.to)}`).join(", ") || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ReportsView({ project, today, baseline, go, onStep, children }) {
  const types = Object.fromEntries(normalizeMix(project.unitMix).map((r) => [r.id, r.label]));
  const log = [...(project.priceLog || [])].reverse();
  const conc = concessionStats(project, today);
  return (
    <div className="cpage">
      <Head code="F7 · Reports" name={project.name}>
        <button className="btn small" disabled={!baseline} onClick={() => go("package")}>
          Lender package
        </button>
      </Head>
      {!baseline ? (
        <div className="empty" style={{ textAlign: "left", maxWidth: 560, margin: "30px auto" }}>
          <p style={{ marginBottom: 14 }}>Reports measure leasing against the saved plan. Save a baseline first.</p>
          <button className="btn primary" onClick={() => onStep(3)}>
            Review the plan and save a baseline
          </button>
        </div>
      ) : (
        <>
          <div className="wrap20">{children}</div>
          {project.sim?.log?.length ? <WeeklyActivity project={project} types={types} /> : null}
          <Band>Rent changes</Band>
          {!log.length ? (
            <div className="empty">No asking rent changes since leasing began.</div>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Unit type</th>
                    <th className="n">From</th>
                    <th className="n">To</th>
                    <th className="n">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((l, i) => (
                    <tr key={i}>
                      <td className="mono">{dateLong(l.at)}</td>
                      <td className="strong">{types[l.typeId] || "Unit type"}</td>
                      <td className="n">{l.from ? money(l.from) : "–"}</td>
                      <td className="n">{money(l.to)}</td>
                      <td className={`n ${l.from && l.to < l.from ? "neg" : ""}`}>{l.from ? `${l.to - l.from > 0 ? "+" : ""}${money(l.to - l.from)}` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Band>Concessions</Band>
          {!conc.length ? (
            <div className="empty">No concession programs.</div>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Status</th>
                    <th className="n">Leases</th>
                    <th className="n">Free rent given</th>
                  </tr>
                </thead>
                <tbody>
                  {conc.map((c) => (
                    <tr key={c.id}>
                      <td className="strong">{c.name}</td>
                      <td>
                        <span className={`tag ${c.status === "active" ? "good" : ""}`}>{c.status}</span>
                      </td>
                      <td className="n">{c.leases}</td>
                      <td className="n">{money(c.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
