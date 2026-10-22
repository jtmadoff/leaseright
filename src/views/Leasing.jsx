import React, { useMemo, useState } from "react";
import { Tile, Icon, Field } from "../ui/atoms.jsx";
import { LeaseChart } from "../ui/charts.jsx";
import { useStore, newActual } from "../store/store.jsx";
import { weeklySummary, weekEndingFor, TRAILING_WEEKS } from "../core/tracking.js";
import { parseDate, isoDate, DAY_MS } from "../core/model.js";
import { dateLong, number } from "../core/format.js";

const FIELDS = [
  ["leads", "New leads"],
  ["tours", "Tours"],
  ["applications", "Applications"],
  ["leases", "Leases signed"],
  ["cancellations", "Cancelled"],
];

function nextWeekEnding(project) {
  const dates = (project.actuals || []).map((r) => parseDate(r.weekEnding)).filter((v) => v !== null);
  if (!dates.length) return weekEndingFor(parseDate(isoDate(Date.now())));
  return isoDate(Math.max(...dates) + 7 * DAY_MS);
}

function LogForm({ project, editing, onDone }) {
  const { dispatch } = useStore();
  const [row, setRow] = useState(() => editing || newActual({ weekEnding: nextWeekEnding(project) }));
  const [error, setError] = useState("");
  const set = (k) => (e) => setRow({ ...row, [k]: e.target.value });
  const save = () => {
    if (parseDate(row.weekEnding) === null) return setError("Enter the week-ending date.");
    if (row.leases === "" && row.leads === "" && row.tours === "") return setError("Enter at least the leases signed this week (0 is fine).");
    const bad = FIELDS.find(([k]) => row[k] !== "" && !(Number(row[k]) >= 0 && Number.isInteger(Number(row[k]))));
    if (bad) return setError(`${bad[1]} must be a whole number of 0 or more.`);
    // One row per week: saving a week that already exists replaces it.
    const same = project.actuals.find((r) => r.weekEnding === row.weekEnding && r.id !== row.id);
    if (same) dispatch({ type: "actual-delete", id: project.id, rowId: same.id });
    dispatch({ type: "actual-save", id: project.id, row });
    setError("");
    onDone?.();
    setRow(newActual({ weekEnding: isoDate(parseDate(row.weekEnding) + 7 * DAY_MS) }));
  };
  return (
    <section className="card">
      <h2>{editing ? `Edit week ending ${dateLong(editing.weekEnding)}` : "Log a week"}</h2>
      <div className="logrow">
        <Field label="Week ending">
          <input type="date" value={row.weekEnding} onChange={set("weekEnding")} onInput={set("weekEnding")} />
        </Field>
        {FIELDS.map(([k, label]) => (
          <Field key={k} label={label} optional={k === "leases" ? false : true}>
            <input type="number" min="0" step="1" inputMode="numeric" value={row[k]} onChange={set(k)} aria-label={label} />
          </Field>
        ))}
      </div>
      <Field label="Note" optional className="lognote">
        <input value={row.note} onChange={set("note")} placeholder="Price change, open house, a concession offered" />
      </Field>
      {error && (
        <div className="notice bad" role="alert">
          {error}
        </div>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={save}>
          <Icon.check /> {editing ? "Save changes" : "Save week"}
        </button>
        {editing && (
          <button className="btn" onClick={onDone}>
            Cancel
          </button>
        )}
        <span className="muted small">Leases signed counts toward occupancy; cancellations come off it. Leads, tours and applications are optional and feed the funnel.</span>
      </div>
    </section>
  );
}

export function Performance({ project, baseline, t, source, onSource }) {
  const { dispatch } = useStore();
  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState(false);
  const summary = weeklySummary(t);
  const ver = project.baselines.indexOf(baseline) + 1;
  const ahead = t.daysAhead === null ? null : Math.round(t.daysAhead / 7);
  const shift = t.reforecast?.reached && t.base.stabilizeDate ? Math.round((parseDate(t.reforecast.stabilizeDate) - parseDate(t.base.stabilizeDate)) / (7 * DAY_MS)) : null;
  const rows = [...t.weeks].reverse();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
        <div className="head">
          <div className="eyebrow">
            Leasing · measured against baseline v{ver} of {dateLong(baseline.approvedAt.slice(0, 10))}
          </div>
          <h1>{t.asOf ? `Plan against actual, ${dateLong(t.asOf)}` : "Plan against actual"}</h1>
          <p>
            Plan: {number(t.target)} of {number(t.totalUnits)} units leased at {t.planPace.toFixed(1)} a week from {dateLong(isoDate(t.inputs.start))}, stabilized {t.base.reached ? dateLong(t.base.stabilizeDate) : "beyond ten years"}.
          </p>
        </div>

        {t.weeks.length > 0 && (
          <>
            <div className="tiles">
              <Tile label="Leased" value={`${number(Math.round(t.actualLeased))} of ${number(t.totalUnits)}`} sub={`${Math.round((t.actualLeased / t.totalUnits) * 100)}% · target ${number(t.target)}`} />
              <Tile
                label="Against the baseline"
                value={t.stabilized ? "Stabilized" : `${t.variance >= 0 ? "+" : ""}${Math.round(t.variance)} leases`}
                sub={t.stabilized ? `reached ${dateLong(t.reforecast.stabilizeDate)}` : ahead === null ? "" : ahead === 0 ? "on schedule" : `${Math.abs(ahead)} week${Math.abs(ahead) === 1 ? "" : "s"} ${ahead > 0 ? "ahead" : "behind"}`}
              />
              <Tile label={`Pace, last ${t.weeksInWindow === 1 ? "week" : `${t.weeksInWindow} weeks`}`} value={`${t.trailingPace.toFixed(1)} / wk`} sub={`plan ${t.planPace.toFixed(1)} a week`} />
              <Tile
                label="Re-forecast stabilization"
                value={t.stabilized ? "Done" : t.reforecast?.reached ? dateLong(t.reforecast.stabilizeDate) : "Not at this pace"}
                sub={t.stabilized ? "" : shift === null ? "" : shift === 0 ? "same as the baseline" : `${Math.abs(shift)} week${Math.abs(shift) === 1 ? "" : "s"} ${shift < 0 ? "earlier" : "later"} than the baseline`}
              />
              {t.paceToHold !== null && (
                <Tile label="Pace to hold the baseline date" value={`${t.paceToHold.toFixed(1)} / wk`} sub={`to stabilize by ${dateLong(t.base.stabilizeDate)}`} />
              )}
            </div>

            <section className="card">
              <h2>Leases signed against the plan</h2>
              <LeaseChart startMs={t.inputs.start} path={t.base.leasedPath} existing={t.inputs.existingLeased} target={t.target} totalUnits={t.totalUnits} weeks={t.weeks} reforecast={t.stabilized ? null : t.reforecast} />
              <p className="muted small" style={{ marginTop: 10 }}>
                Net leases (signed less cancelled) added up week by week. The dashed line runs the remaining leases at the pace of the last {TRAILING_WEEKS} weeks.
              </p>
            </section>

            <section className="card">
              <h2>
                This week's update
                <button className="btn small" onClick={copy}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </h2>
              <p style={{ maxWidth: 780 }}>{summary}</p>
              {t.funnel && t.funnel.leads + t.funnel.tours > 0 && (
                <p className="muted small" style={{ marginTop: 10 }}>
                  Last {t.weeksInWindow === 1 ? "week" : `${t.weeksInWindow} weeks`}: {number(t.funnel.leads)} leads, {number(t.funnel.tours)} tours
                  {t.funnel.tourRate !== null ? ` (${Math.round(t.funnel.tourRate * 100)}% of leads)` : ""}, {number(t.funnel.applications)} applications, {number(t.funnel.leases)} leases
                  {t.funnel.closeRate !== null ? ` (${Math.round(t.funnel.closeRate * 100)}% of tours)` : ""}.
                </p>
              )}
            </section>
          </>
        )}

        <div className="row wrap" style={{ marginBottom: 14 }}>
          <span className="muted small">Count leasing from</span>
          <button className={`chip ${source === "pipeline" ? "on" : ""}`} onClick={() => onSource("pipeline")}>
            Prospects, automatically
          </button>
          <button className={`chip ${source === "manual" ? "on" : ""}`} onClick={() => onSource("manual")}>
            Weekly log, by hand
          </button>
        </div>

        {!t.weeks.length && (
          <div className="notice quiet">
            {source === "pipeline"
              ? "No prospect activity yet. Leads, tours, applications and signed leases entered on the Prospects tab add up here week by week."
              : `Nothing logged yet. Enter each week's leasing below, starting with the week leasing began. Leases already signed before the plan's start date (${number(t.inputs.existingLeased)}) are counted from the baseline.`}
          </div>
        )}

        {source === "manual" && <LogForm key={editing?.id || "new"} project={project} editing={editing} onDone={() => setEditing(null)} />}

        {rows.length > 0 && (
          <section className="card">
            <h2>
              {source === "pipeline" ? "Week by week" : "Weekly log"} <small>{rows.length} week{rows.length === 1 ? "" : "s"}{source === "pipeline" ? ", from prospects" : ""}</small>
            </h2>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Week ending</th>
                    <th className="n">Leads</th>
                    <th className="n">Tours</th>
                    <th className="n">Apps</th>
                    <th className="n">Signed</th>
                    <th className="n">Cancelled</th>
                    <th className="n">Leased to date</th>
                    <th className="n">Baseline</th>
                    <th className="n">Difference</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((w) => (
                    <tr key={w.id}>
                      <td className="strong">
                        {dateLong(w.weekEnding)}
                        {w.note && <span className="sub">{w.note}</span>}
                      </td>
                      <td className="n">{w.leads || "–"}</td>
                      <td className="n">{w.tours || "–"}</td>
                      <td className="n">{w.applications || "–"}</td>
                      <td className="n">{w.leases}</td>
                      <td className="n">{w.cancellations || "–"}</td>
                      <td className="n">{number(Math.round(w.actual))}</td>
                      <td className="n">{number(Math.round(w.planned))}</td>
                      <td className={`n ${w.variance < -0.5 ? "neg" : w.variance > 0.5 ? "pos" : ""}`}>
                        {w.variance >= 0 ? "+" : ""}
                        {Math.round(w.variance)}
                      </td>
                      <td className="n nowrap">
                        {source === "manual" && (
                        <>
                        <button className="linkbtn small" onClick={() => setEditing(project.actuals.find((r) => r.id === w.id))}>
                          Edit
                        </button>{" "}
                        <button className="btn ghost small" aria-label={`Delete week ending ${dateLong(w.weekEnding)}`} onClick={() => dispatch({ type: "actual-delete", id: project.id, rowId: w.id })}>
                          <Icon.trash />
                        </button>
                        </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </>
  );
}
