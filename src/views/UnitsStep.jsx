import React, { useState } from "react";
import { Field, Icon, download } from "../ui/atoms.jsx";
import { MarketPanel } from "./Market.jsx";
import { newRow } from "../store/store.jsx";
import { num, normalizeMix } from "../core/model.js";
import { bedMarket, observedRange } from "../core/market.js";
import { parseUnitCSV, CSV_TEMPLATE } from "../core/csv.js";
import { money, number } from "../core/format.js";

const TYPES = [
  ["0", "Studio"],
  ["1", "1 bedroom"],
  ["2", "2 bedroom"],
  ["3", "3 bedroom"],
  ["4", "4 bedroom"],
  ["", "Other"],
];

function MarketRef({ data, town, row, onUse }) {
  if (row.beds === "" || row.beds === null) return null;
  const m = bedMarket(data, town, Number(row.beds));
  const range = observedRange(m.observed);
  if (m.listings) {
    return (
      <div className="ref">
        Listings median {money(m.listings.median)} ({m.listings.n}
        {m.listings.lowSample ? ", low sample" : ""}){" "}
        {!row.rent && (
          <button className="linkbtn" onClick={() => onUse(m.listings.median)}>
            use
          </button>
        )}
      </div>
    );
  }
  if (range) {
    return (
      <div className="ref">
        Operator pages {range.min === range.max ? money(range.min) : `${money(range.min)} to ${money(range.max)}`}
      </div>
    );
  }
  return null;
}

export function UnitsStep({ project, patch, data }) {
  const [phasedOpen, setPhased] = useState(false);
  const hasDates = project.unitMix.some((r) => r.availableDate);
  const phased = phasedOpen || hasDates; // dates that drive the model are never hidden
  const [showSize, setShowSize] = useState(project.unitMix.some((r) => r.sqft));
  const [csv, setCSV] = useState("");
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const mix = project.unitMix;
  const leasing = project.stage === "active_leaseup" || mix.some((r) => Number(r.leased) > 0);
  const setMix = (unitMix) => patch({ unitMix });
  const change = (id, key, value) => setMix(mix.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const changeType = (id, value) =>
    setMix(
      mix.map((r) => {
        if (r.id !== id) return r;
        const label = TYPES.find(([v]) => v === value)[1];
        const standard = !r.label || TYPES.some(([, l]) => l === r.label);
        // A label the user typed ("Phase 2", "1BR, river view") survives a type change.
        return { ...r, beds: value === "" ? "" : Number(value), label: !standard ? r.label : value === "" ? "" : label };
      }),
    );
  const add = (beds) => setMix([...mix, newRow(beds, { leased: project.stage === "active_leaseup" ? "" : "0" })]);

  const rows = normalizeMix(mix);
  const allocated = rows.reduce((n, r) => n + r.count, 0);
  const total = num(project.totalUnits);
  const leased = rows.reduce((n, r) => n + Math.min(r.leased, r.count), 0);
  const gross = rows.reduce((s, r) => s + (r.rent ? r.count * r.rent : 0), 0);
  const priced = rows.filter((r) => r.rent).reduce((n, r) => n + r.count, 0);
  const used = new Set(mix.map((r) => String(r.beds)));

  return (
    <div className="page">
      <div className="main">
        <div className="head">
          <div className="eyebrow">Step 2 of 4</div>
          <h1>Unit mix and rents</h1>
          <p>Group units by type. One row per type is enough; add a second row for a phase that delivers later. The market for {project.town || "the town"} is alongside so rents are set against it.</p>
        </div>

        <section className="card">
          <h2>
            Unit schedule
            <small>
              {total ? `${number(allocated)} of ${number(total)} units allocated` : `${number(allocated)} units`}
              {leasing && allocated ? ` · ${number(leased)} leased` : ""}
            </small>
          </h2>
          {total > 0 && (
            <>
              <div className={`meter ${allocated > total ? "over" : ""}`} aria-hidden="true">
                <i style={{ width: `${Math.min(100, (allocated / total) * 100)}%` }} />
              </div>
              {allocated !== total && allocated > 0 && (
                <p className="muted small">
                  {allocated < total ? `${number(total - allocated)} units still to allocate.` : `${number(allocated - total)} more than the building total.`}{" "}
                  <button className="linkbtn" onClick={() => patch({ totalUnits: String(allocated) })}>
                    Set the building total to {number(allocated)}
                  </button>
                </p>
              )}
            </>
          )}

          {mix.length > 0 && (
            <div className="tablewrap" style={{ marginTop: 14 }}>
              <table className="t mix">
                <thead>
                  <tr>
                    <th style={{ width: "24%" }}>Unit type</th>
                    <th>Units</th>
                    {showSize && <th>Avg SF</th>}
                    <th style={{ width: "24%" }}>Monthly rent</th>
                    {leasing && <th>Leased</th>}
                    {phased && <th>Available from</th>}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {mix.map((r, i) => (
                    <tr key={r.id}>
                      <td>
                        <select aria-label={`Row ${i + 1} unit type`} value={r.beds === "" || r.beds === null ? "" : String(r.beds)} onChange={(e) => changeType(r.id, e.target.value)}>
                          {TYPES.map(([v, l]) => (
                            <option key={l} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                        {(r.beds === "" || r.beds === null || phased) && (
                          <input aria-label={`Row ${i + 1} label`} style={{ marginTop: 6 }} placeholder={phased ? "Label, e.g. Phase 2" : "Name this type"} value={r.label} onChange={(e) => change(r.id, "label", e.target.value)} />
                        )}
                      </td>
                      <td>
                        <input aria-label={`Row ${i + 1} units`} type="number" min="1" step="1" value={r.count} onChange={(e) => change(r.id, "count", e.target.value)} />
                      </td>
                      {showSize && (
                        <td>
                          <input aria-label={`Row ${i + 1} average square feet`} type="number" min="1" value={r.sqft} onChange={(e) => change(r.id, "sqft", e.target.value)} />
                          {num(r.sqft) > 0 && num(r.rent) > 0 && <div className="ref">${(num(r.rent) / num(r.sqft)).toFixed(2)} per SF</div>}
                        </td>
                      )}
                      <td>
                        <div className="affix">
                          <i>$</i>
                          <input aria-label={`Row ${i + 1} monthly rent`} type="number" min="0" step="25" value={r.rent} onChange={(e) => change(r.id, "rent", e.target.value)} />
                        </div>
                        <MarketRef data={data} town={project.town} row={r} onUse={(v) => change(r.id, "rent", String(v))} />
                      </td>
                      {leasing && (
                        <td>
                          <input aria-label={`Row ${i + 1} units already leased`} type="number" min="0" step="1" value={r.leased} onChange={(e) => change(r.id, "leased", e.target.value)} />
                        </td>
                      )}
                      {phased && (
                        <td>
                          <input aria-label={`Row ${i + 1} available from`} type="date" value={r.availableDate} onChange={(e) => change(r.id, "availableDate", e.target.value)} onInput={(e) => change(r.id, "availableDate", e.currentTarget.value)} />
                        </td>
                      )}
                      <td style={{ width: 36 }}>
                        <button className="btn ghost small" aria-label={`Remove row ${i + 1}`} onClick={() => setMix(mix.filter((x) => x.id !== r.id))}>
                          <Icon.trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="chips" style={{ marginTop: mix.length ? 12 : 4 }}>
            {TYPES.filter(([v]) => v !== "" && v !== "4" && (!used.has(v) || phased)).map(([v, l]) => (
              <button key={v} className="chip" onClick={() => add(Number(v))}>
                <Icon.plus size={12} /> {l}
              </button>
            ))}
            <button className="chip" onClick={() => add("")}>
              <Icon.plus size={12} /> Other type
            </button>
          </div>

          {allocated > 0 && (
            <p className="muted small" style={{ marginTop: 14 }}>
              {priced === allocated
                ? `Weighted asking rent ${money(gross / allocated)}. Gross rent at full occupancy ${money(gross)} a month.`
                : `${number(allocated - priced)} units still need a rent.`}
            </p>
          )}

          <div className="row" style={{ marginTop: 14 }}>
            <button className="linkbtn small" onClick={() => setShowSize((v) => !v)}>
              {showSize ? "Hide unit sizes" : "Add unit sizes"}
            </button>
            {!hasDates && (
              <button className="linkbtn small" onClick={() => setPhased((v) => !v)}>
                {phased ? "Hide phased delivery" : "Units deliver in phases"}
              </button>
            )}
          </div>

          <details className="more">
            <summary>Import a unit schedule (CSV)</summary>
            <p className="muted small" style={{ marginBottom: 10 }}>
              Columns: label, count, rent. Optional: sqft, leased, availableDate. Nothing changes until you apply the preview.{" "}
              <button className="linkbtn" onClick={() => download("leaseright-unit-schedule.csv", CSV_TEMPLATE, "text/csv")}>
                Download a template
              </button>
            </p>
            <Field label="Paste the CSV or choose a file">
              <textarea
                value={csv}
                onChange={(e) => {
                  setCSV(e.target.value);
                  setPreview(null);
                }}
                placeholder="label,count,sqft,rent,leased,availableDate"
              />
            </Field>
            <div className="row" style={{ marginTop: 10 }}>
              <input
                aria-label="Upload unit schedule CSV"
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (file.size > 500000) return setMessage("Choose a CSV smaller than 500 KB.");
                  setCSV(await file.text());
                  setPreview(null);
                }}
              />
              <button
                className="btn small"
                disabled={!csv.trim()}
                onClick={() => {
                  try {
                    setPreview(parseUnitCSV(csv));
                    setMessage("");
                  } catch (e) {
                    setPreview(null);
                    setMessage(e.message);
                  }
                }}
              >
                Preview
              </button>
            </div>
            {message && (
              <div className="notice bad" role="alert">
                {message}
              </div>
            )}
            {preview && (
              <div className="notice quiet">
                {preview.length} rows, {number(preview.reduce((n, r) => n + (Number(r.count) || 0), 0))} units: {preview.map((r) => `${r.label} ×${r.count} at $${r.rent}`).join("; ")}
                <div style={{ marginTop: 10 }}>
                  <button
                    className="btn small primary"
                    onClick={() => {
                      const next = preview.map((r) => newRow(r.beds, r));
                      setMix(next);
                      if (next.some((r) => r.sqft)) setShowSize(true);
                      if (next.some((r) => r.availableDate)) setPhased(true);
                      setPreview(null);
                      setCSV("");
                    }}
                  >
                    Replace the schedule with these rows
                  </button>
                </div>
              </div>
            )}
          </details>
        </section>
      </div>
      <MarketPanel project={project} data={data} />
    </div>
  );
}
