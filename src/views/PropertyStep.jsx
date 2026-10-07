import React, { useEffect, useMemo, useRef, useState } from "react";
import { Field, TextField, NumberField, Chip, Icon } from "../ui/atoms.jsx";
import { ParcelSketch, SiteMap } from "../ui/SiteMap.jsx";
import { STAGES, PROJECT_TYPES } from "../store/store.jsx";
import { INCLUDED_TOWNS, getTown, coverageSummary } from "../ri/towns.js";
import { searchAddresses, lookupParcel, lookupZoning, reverseAddress } from "../ri/arcgis.js";
import { number } from "../core/format.js";

/** A project type the public record points to, or null. A suggestion only. */
export function suggestType(parcel) {
  if (!parcel) return null;
  const use = `${parcel.useDesc} ${parcel.useCode}`.toLowerCase();
  if (/single|one fam|1 fam|\b01\b/.test(use)) return null;
  if (/apart|apt|multi|[2-9][\s-]*(to|-)?[\s\d]*fam|two fam|three fam|four fam|\b0[23]\b|111\d|112\d/.test(use)) return { type: "Existing rental property", why: "the city records apartments here" };
  if (parcel.buildingSqft || parcel.yearBuilt) return { type: "Conversion / adaptive reuse", why: `the city records an existing ${parcel.useDesc ? parcel.useDesc.toLowerCase() : "non-residential"} building here` };
  if (/vacant|land/.test(use)) return { type: "New construction", why: "the city records vacant land here" };
  return null;
}

function AddressSearch({ onPick, onManual }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(0);
  const request = useRef(0);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 4 || !/^\d/.test(q)) {
      setRows(null);
      setBusy(false);
      return;
    }
    const id = ++request.current;
    setBusy(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchAddresses(q, { signal: controller.signal })
        .then((found) => {
          if (id !== request.current) return;
          setRows(found);
          setCursor(0);
          setError("");
        })
        .catch((e) => {
          if (id === request.current && e.name !== "AbortError") setError("Address search is not responding. Enter the address manually.");
        })
        .finally(() => id === request.current && setBusy(false));
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const choose = (row) => {
    setQuery("");
    setRows(null);
    onPick(row);
  };
  return (
    <div className="search">
      <div className="box">
        <Icon.search size={17} />
        <input
          aria-label="Find the property by street address"
          placeholder="Start with the street number: 10 Dorrance St"
          value={query}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (!rows?.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, rows.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(rows[cursor]);
            }
          }}
        />
        {busy && <span className="muted small">Searching</span>}
      </div>
      {rows && (
        <div className="results" role="listbox">
          {rows.map((r, i) => (
            <button key={r.id} role="option" aria-selected={i === cursor} className={i === cursor ? "cursor" : ""} onMouseEnter={() => setCursor(i)} onClick={() => choose(r)}>
              <strong>{r.label}</strong>
              {!r.included && <span>Outside current coverage</span>}
            </button>
          ))}
          {!rows.length && (
            <div className="none">
              No Rhode Island address starts with that.{" "}
              <button className="linkbtn" onClick={onManual}>
                Enter it manually
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p className="muted small" role="alert" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}

export function PropertyStep({ project, patch }) {
  const [changing, setChanging] = useState(!project.address);
  const [manual, setManual] = useState(false);
  const [notice, setNotice] = useState("");
  const [record, setRecord] = useState({ status: "idle", parcels: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [mapOff, setMapOff] = useState(false);
  const town = getTown(project.town);
  const loc = project.location;

  // Public record lookup follows the saved location. Nothing is fetched while typing.
  useEffect(() => {
    if (!loc || !town) {
      setRecord({ status: town && !loc ? "nolocation" : "idle", parcels: [] });
      return;
    }
    const controller = new AbortController();
    let off = false;
    if (!project.zoning || project.zoning.at !== `${loc.lat},${loc.lng}`) {
      lookupZoning(loc, { signal: controller.signal })
        .then((z) => !off && patch({ zoning: z.zones[0] ? { ...z.zones[0], more: z.zones.length - 1, at: `${loc.lat},${loc.lng}` } : null }))
        .catch(() => {});
    }
    if (project.parcel && project.parcel.at === `${loc.lat},${loc.lng}`) {
      setRecord({ status: "ready", parcels: [project.parcel], match: project.parcel.match });
      setSelectedId(project.parcel.parcelId);
      return () => {
        off = true;
        controller.abort();
      };
    }
    setRecord({ status: "loading", parcels: [] });
    lookupParcel(town.name, loc, { signal: controller.signal })
      .then((r) => {
        if (off) return;
        setRecord(r);
        setSelectedId(r.parcels[0]?.parcelId || null);
      })
      .catch((e) => !off && e.name !== "AbortError" && setRecord({ status: "error", parcels: [] }));
    return () => {
      off = true;
      controller.abort();
    };
    // Also runs when a confirmed parcel is cleared, so the candidates are fetched fresh.
  }, [loc?.lat, loc?.lng, town?.name, project.parcel?.parcelId]);

  const selected = record.parcels.find((p) => p.parcelId === selectedId) || null;
  const confirmed = !!project.parcel && selected?.parcelId === project.parcel.parcelId;
  const shown = confirmed ? project.parcel : selected;
  const suggestion = useMemo(() => suggestType(shown), [shown]);

  const pickAddress = (row) => {
    if (!row.included) {
      setNotice(`${row.town} is outside current coverage. ${getTown(row.town)?.excludedReason || ""}`);
      return;
    }
    setNotice("");
    setChanging(false);
    setManual(false);
    patch({
      address: row.street,
      town: row.town,
      zip: row.zip,
      location: { lat: row.lat, lng: row.lng, source: "RI E-911 address point" },
      parcel: null,
      zoning: null,
      name: !project.name || project.name === project.address ? row.street : project.name,
    });
  };
  const movePin = async (point) => {
    const hit = await reverseAddress(point).catch(() => null);
    patch({
      location: { lat: point.lat, lng: point.lng, source: "map pin" },
      parcel: null,
      zoning: null,
      ...(hit && hit.included ? { address: hit.street, town: hit.town, zip: hit.zip, name: !project.name || project.name === project.address ? hit.street : project.name } : {}),
    });
  };
  const confirmParcel = () =>
    patch({
      parcel: { ...selected, match: record.match ?? selected.match, source: record.source ?? selected.source, retrievedAt: record.retrievedAt ?? selected.retrievedAt, confirmedAt: new Date().toISOString(), at: `${loc.lat},${loc.lng}` },
      ...(suggestion && !project.projectType ? { projectType: suggestion.type } : {}),
    });

  const units = Number(project.totalUnits) > 0 ? Number(project.totalUnits) : null;
  const unitHint = [
    shown?.units && `The city records ${number(shown.units)} units on this parcel.`,
    shown?.buildingSqft && units && `${number(shown.buildingSqft)} gross SF works out to about ${number(shown.buildingSqft / units)} SF per unit.`,
  ]
    .filter(Boolean)
    .join(" ");

  const facts = shown
    ? [
        ["Lot", shown.lotSqft ? `${number(shown.lotSqft)} SF` : null],
        ["Building", shown.buildingSqft ? `${number(shown.buildingSqft)} SF` : null],
        ["Recorded units", shown.units ? number(shown.units) : null],
        ["Year built", shown.yearBuilt],
        ["Stories", shown.floors],
        ["Recorded use", shown.useDesc || shown.useCode || null],
      ].filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <div className="page">
      <div className="main">
        <div className="head">
          <div className="eyebrow">Step 1 of 4</div>
          <h1>Which property, and where does it stand?</h1>
          <p>Find the address. LeaseRight pulls the parcel and zoning from public records and builds the rest of the plan around them.</p>
        </div>

        <section className="card">
          <h2>Where is the project today?</h2>
          <div className="seg" role="group" aria-label="Project stage">
            {Object.entries(STAGES).map(([id, s]) => (
              <button key={id} aria-pressed={project.stage === id} onClick={() => patch({ stage: id })}>
                <strong>{s.label}</strong>
                <span>{s.short}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>
            Property address <small>All Rhode Island addresses, from the state E-911 file</small>
          </h2>
          {project.address && !changing ? (
            <div className="picked">
              <div>
                <strong>{project.address}</strong>
                <span>
                  {[project.town && `${project.town}, RI`, project.zip].filter(Boolean).join(" ")}
                </span>
              </div>
              <button className="btn small" onClick={() => setChanging(true)}>
                Change address
              </button>
            </div>
          ) : manual ? (
            <div className="grid2">
              <TextField label="Street address" value={project.address} onChange={(v) => patch({ address: v, location: null, parcel: null, zoning: null })} placeholder="10 Dorrance St" />
              <Field label="City or town">
                <select value={project.town} onChange={(e) => patch({ town: e.target.value, location: null, parcel: null, zoning: null })}>
                  <option value="">Choose</option>
                  {INCLUDED_TOWNS.map((t) => (
                    <option key={t.name}>{t.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <AddressSearch onPick={pickAddress} onManual={() => setManual(true)} />
          )}
          {(changing || !project.address) && (
            <div className="row" style={{ marginTop: 10 }}>
              <button className="linkbtn small" onClick={() => setManual((v) => !v)}>
                {manual ? "Search for the address instead" : "Enter the address manually"}
              </button>
              {project.address && (
                <button
                  className="linkbtn small"
                  onClick={() => {
                    setChanging(false);
                    setManual(false);
                  }}
                >
                  Keep {project.address}
                </button>
              )}
            </div>
          )}
          {notice && (
            <div className="notice" role="alert">
              {notice}
            </div>
          )}
        </section>

        <section className="card">
          <h2>The project</h2>
          <div className="grid2">
            <TextField label="Project name" value={project.name} onChange={(v) => patch({ name: v })} placeholder={project.address || "Name it or use the address"} />
            <NumberField
              label="Total rental units"
              value={project.totalUnits}
              onChange={(v) => patch({ totalUnits: v })}
              min="1"
              step="1"
              placeholder="100"
              hint={unitHint || "The building total is enough for now. The mix comes next."}
            />
            <Field
              label="Project type"
              hint={
                suggestion && project.projectType !== suggestion.type
                  ? `Suggested: ${suggestion.type}, because ${suggestion.why}.`
                  : suggestion && project.projectType
                    ? `Set from the public record: ${suggestion.why}. Change it if that is wrong.`
                    : "Sets how comparable buildings are matched."
              }
            >
              <select value={project.projectType} onChange={(e) => patch({ projectType: e.target.value })}>
                <option value="">Choose</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <TextField label="Sponsor or owner" optional value={project.sponsor} onChange={(v) => patch({ sponsor: v })} />
          </div>
        </section>
      </div>

      <aside className="aside" aria-label="Public record">
        <div className="sect">
          <span>Public record</span>
          {confirmed ? <Chip tone="good">Parcel confirmed</Chip> : town ? <Chip>{town.name}</Chip> : null}
        </div>
        {!town && <p className="muted">Pick an address and the parcel, zoning and existing building details appear here.</p>}
        {town && (
          <>
            {loc && !mapOff && <SiteMap point={loc} rings={shown?.rings || null} onPick={movePin} onUnavailable={() => setMapOff(true)} />}
            {loc && shown?.rings && mapOff && <ParcelSketch rings={shown.rings} point={loc} />}
            {record.status === "loading" && <p className="muted" role="status">Looking up the parcel in {town.name} records.</p>}
            {record.status === "none" && (
              <div className="notice quiet">
                {town.name} does not publish a parcel service.{" "}
                {town.viewerUrl && (
                  <a href={town.viewerUrl} target="_blank" rel="noreferrer">
                    Open the town GIS viewer
                  </a>
                )}
              </div>
            )}
            {record.status === "nolocation" && <div className="notice quiet">The address was entered manually, so it is not pinned to a parcel. Search for it to pull the record.</div>}
            {record.status === "empty" && <div className="notice quiet">No parcel found within 25 meters of this point.{!mapOff ? " Click the property on the map to try again." : " Try the nearest street address instead."}</div>}
            {record.status === "error" && <div className="notice quiet">{town.name} records are not responding right now. You can keep going and confirm the parcel later.</div>}

            {shown && (
              <div className="card" style={{ marginTop: 12 }}>
                {record.parcels.length > 1 && !confirmed && (
                  <Field label={`${record.parcels.length} parcels at this point`}>
                    <select value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)}>
                      {record.parcels.map((p) => (
                        <option key={p.parcelId} value={p.parcelId}>
                          {p.address || "No address"} · {p.parcelId}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: record.parcels.length > 1 && !confirmed ? 12 : 0 }}>{shown.address || project.address}</div>
                <div className="muted mono small">Parcel {shown.parcelId}</div>
                {record.match === "nearby" && !confirmed && <p className="muted small" style={{ marginTop: 6 }}>Nearest parcel within 25 meters. Check the outline before confirming.</p>}
                {shown.records > 1 && <p className="muted small" style={{ marginTop: 6 }}>{shown.records} assessor records share this parcel (condominium units or multiple accounts).</p>}
                {facts.length > 0 && (
                  <dl className="facts" style={{ marginTop: 12 }}>
                    {facts.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {!confirmed ? (
                  <button className="btn primary" style={{ width: "100%", marginTop: 12 }} onClick={confirmParcel}>
                    <Icon.check /> Use this parcel
                  </button>
                ) : (
                  <button className="linkbtn small" style={{ marginTop: 10 }} onClick={() => patch({ parcel: null })}>
                    Not the right parcel
                  </button>
                )}
              </div>
            )}

            {project.zoning && (
              <div className="card">
                <div className="sect">Zoning</div>
                <div style={{ fontSize: 16, fontWeight: 600 }} className="mono">{project.zoning.code}</div>
                <div className="muted">{project.zoning.description || "No description published"}</div>
                {project.zoning.more > 0 && <p className="muted small" style={{ marginTop: 6 }}>{project.zoning.more} more zone{project.zoning.more > 1 ? "s" : ""} at this point.</p>}
              </div>
            )}

            <p className="muted small">
              {coverageSummary(town)}
              {town.parcel?.thirdParty ? " · published by a third party" : ""}.
              {shown?.taxYear ? ` Tax year ${shown.taxYear}.` : ""} Records describe what exists today, not the proposed program.
              {town.viewerUrl && (
                <>
                  {" "}
                  <a href={town.viewerUrl} target="_blank" rel="noreferrer">
                    {town.name} GIS viewer
                  </a>
                </>
              )}
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
