import React, { useMemo, useState } from "react";
import { Drawer, Field, Chip } from "../ui/atoms.jsx";
import { useStore, newProspect } from "../store/store.jsx";
import { STAGE_LABEL, SOURCES, LOST_REASONS, UNIT_STATUS, moveProspect, generateUnits, unitStatuses, time12, shortDay, projectToday } from "../core/leasing.js";
import { normalizeMix } from "../core/model.js";
import { activeConcession } from "../core/ops.js";
import { money, number, dateLong, bedLabel } from "../core/format.js";
import { useToday } from "../ui/clock.js";

const TONE = { lead: "", tour: "warn", toured: "warn", applied: "warn", approved: "good", leased: "good", lost: "bad" };
const BEDS = [["", "Any"], ["0", "Studio"], ["1", "1 BR"], ["2", "2 BR"], ["3", "3 BR"], ["4", "4 BR"]];

/** What the prospect can do next from their stage, as buttons. */
function StageActions({ p, units, onMove, defaultFree = "" }) {
  const [mode, setMode] = useState(null);
  const today = useToday();
  const [tourAt, setTourAt] = useState(p.tourAt || `${today}T14:00`);
  const [unitId, setUnitId] = useState(p.unitId || "");
  const [rent, setRent] = useState(p.leaseRent || "");
  const [free, setFree] = useState(p.freeMonths || defaultFree);
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const open = units.filter((u) => u.status === "available" || u.status === "coming" || u.id === p.unitId);
  const matching = open.filter((u) => p.beds === "" || p.beds === null || String(u.beds) === String(p.beds));
  const unitList = (matching.length ? matching : open).slice(0, 200);
  const chosen = units.find((u) => u.id === unitId);

  if (mode === "tour")
    return (
      <div className="actionbox">
        <Field label="Tour date and time">
          <input type="datetime-local" value={tourAt} onChange={(e) => setTourAt(e.target.value)} />
        </Field>
        <div className="row">
          <button className="btn primary small" onClick={() => onMove("tour", today, { tourAt, nextAt: "" })}>
            Book tour
          </button>
          <button className="btn small" onClick={() => setMode(null)}>
            Cancel
          </button>
        </div>
      </div>
    );
  if (mode === "apply" || mode === "lease")
    return (
      <div className="actionbox">
        <Field label="Unit" hint={units.length ? `${unitList.length} open unit${unitList.length === 1 ? "" : "s"}${matching.length ? " that match" : ""}` : "Create the unit list on the Units tab to assign units."}>
          <select
            value={unitId}
            onChange={(e) => {
              setUnitId(e.target.value);
              const u = units.find((x) => x.id === e.target.value);
              if (u && !rent) setRent(String(u.rent || ""));
            }}
          >
            <option value="">No unit yet</option>
            {unitList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.number} · {u.label} · {money(u.rent)}
              </option>
            ))}
          </select>
        </Field>
        {mode === "lease" && (
          <div className="grid2">
            <Field label="Monthly rent">
              <input type="number" value={rent} placeholder={chosen?.rent ? String(chosen.rent) : ""} onChange={(e) => setRent(e.target.value)} />
            </Field>
            <Field label="Free rent" optional="months">
              <input type="number" step="0.5" min="0" value={free} onChange={(e) => setFree(e.target.value)} />
            </Field>
          </div>
        )}
        <div className="row">
          <button
            className="btn primary small"
            onClick={() => (mode === "apply" ? onMove("applied", today, { unitId }) : onMove("leased", today, { unitId, leaseRent: rent || String(chosen?.rent || ""), freeMonths: free, nextAt: "" }))}
          >
            {mode === "apply" ? "Record application" : "Record signed lease"}
          </button>
          <button className="btn small" onClick={() => setMode(null)}>
            Cancel
          </button>
        </div>
      </div>
    );
  if (mode === "lost")
    return (
      <div className="actionbox">
        <Field label={p.stage === "leased" ? "Why the lease was cancelled" : "Why they are not moving forward"}>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {LOST_REASONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <div className="row">
          <button className="btn small danger" onClick={() => onMove("lost", today, { lostReason: reason, nextAt: "" })}>
            {p.stage === "leased" ? "Cancel lease" : "Mark lost"}
          </button>
          <button className="btn small" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
      </div>
    );

  const btn = (label, fn, primary) => (
    <button className={`btn small ${primary ? "primary" : ""}`} onClick={fn}>
      {label}
    </button>
  );
  return (
    <div className="row wrap">
      {p.stage === "lead" && btn("Book a tour", () => setMode("tour"), true)}
      {p.stage === "lead" && btn("Application received", () => setMode("apply"))}
      {p.stage === "tour" && btn("Toured", () => onMove("toured", today, { nextAt: "" }), true)}
      {p.stage === "tour" && btn("Reschedule", () => setMode("tour"))}
      {p.stage === "tour" && btn("No-show", () => onMove("lead", today, { tourAt: "", nextAt: today, nextNote: "Missed tour: rebook" }))}
      {p.stage === "toured" && btn("Application received", () => setMode("apply"), true)}
      {p.stage === "applied" && btn("Approve", () => onMove("approved", today), true)}
      {p.stage === "approved" && btn("Lease signed", () => setMode("lease"), true)}
      {p.stage === "lost" && btn("Reopen", () => onMove("lead", today, { nextAt: today, nextNote: "Reopened" }), true)}
      {p.stage !== "lost" && btn(p.stage === "leased" ? "Cancel lease" : "Lost", () => setMode("lost"))}
    </div>
  );
}

export function ProspectDrawer({ project, prospect, units, onClose }) {
  const { dispatch } = useStore();
  const today = useToday();
  const [p, setP] = useState(prospect);
  const [note, setNote] = useState("");
  const isNew = !project.prospects?.some((x) => x.id === prospect.id);
  const save = (next) => {
    setP(next);
    if (next.name.trim()) dispatch({ type: "prospect-save", id: project.id, prospect: next });
  };
  const set = (k) => (e) => save({ ...p, [k]: e.target.value });
  const unit = units.find((u) => u.id === p.unitId);
  return (
    <Drawer eyebrow={isNew ? "New lead" : `${STAGE_LABEL[p.stage]} · added ${shortDay(p.createdAt)}`} title={p.name || "New lead"} onClose={onClose}>
      <div className="grid2">
        <Field label="Name">
          <input autoFocus={isNew} value={p.name} onChange={set("name")} placeholder="First and last name" />
        </Field>
        <Field label="Source">
          <select value={p.source} onChange={set("source")}>
            <option value="">Choose</option>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Phone" optional>
          <input value={p.phone} onChange={set("phone")} inputMode="tel" />
        </Field>
        <Field label="Email" optional>
          <input value={p.email} onChange={set("email")} inputMode="email" />
        </Field>
        <Field label="Looking for">
          <select value={p.beds} onChange={set("beds")}>
            {BEDS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget" optional>
          <input type="number" value={p.budget} onChange={set("budget")} step="25" />
        </Field>
        <Field label="Move-in date" optional>
          <input type="date" value={p.moveIn} onChange={set("moveIn")} />
        </Field>
        <Field label="Next follow-up" optional>
          <input type="date" value={p.nextAt} onChange={set("nextAt")} />
        </Field>
      </div>
      {!p.name.trim() && <p className="muted small" style={{ marginTop: 8 }}>Add a name to save this lead.</p>}

      {p.name.trim() && (
        <>
          <div className="sect" style={{ marginTop: 20 }}>
            <span>Stage</span>
            <Chip tone={TONE[p.stage]}>{STAGE_LABEL[p.stage]}</Chip>
          </div>
          <p className="small" style={{ marginBottom: 10 }}>
            {p.stage === "tour" && p.tourAt ? `Tour ${shortDay(p.tourAt.slice(0, 10))} at ${time12(p.tourAt)}. ` : ""}
            {unit ? `Unit ${unit.number} (${unit.label}). ` : ""}
            {p.stage === "leased" ? `Lease signed ${dateLong(p.leasedAt)} at ${money(Number(p.leaseRent))}${Number(p.freeMonths) ? ` with ${p.freeMonths} month${Number(p.freeMonths) === 1 ? "" : "s"} free` : ""}.` : ""}
            {p.stage === "lost" ? `Lost ${dateLong(p.lostAt)}${p.lostReason ? `: ${p.lostReason}` : ""}.` : ""}
          </p>
          <StageActions key={`${p.stage}-${(p.history || []).length}`} p={p} units={units} defaultFree={activeConcession(project, unit ? unit.beds : p.beds, today)?.months || ""} onMove={(stage, at, extra) => save(moveProspect(p, stage, at, extra))} />

          <div className="sect" style={{ marginTop: 22 }}>
            Notes and history
          </div>
          <div className="row">
            <input
              className="input"
              style={{ flex: 1 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              onKeyDown={(e) => {
                if (e.key === "Enter" && note.trim()) {
                  save({ ...p, history: [...(p.history || []), { at: today, text: note.trim() }] });
                  setNote("");
                }
              }}
            />
            <button
              className="btn small"
              disabled={!note.trim()}
              onClick={() => {
                save({ ...p, history: [...(p.history || []), { at: today, text: note.trim() }] });
                setNote("");
              }}
            >
              Add
            </button>
          </div>
          <ul className="timeline">
            {[...(p.history || [])].reverse().map((h, i) => (
              <li key={i}>
                <span className="mono small muted">{shortDay(h.at.slice(0, 10))}</span> {h.text}
              </li>
            ))}
          </ul>
          {!isNew && (
            <button
              className="linkbtn small"
              style={{ marginTop: 16, color: "var(--bad)" }}
              onClick={() => {
                dispatch({ type: "prospect-delete", id: project.id, prospectId: p.id });
                onClose();
              }}
            >
              Delete this prospect
            </button>
          )}
        </>
      )}
    </Drawer>
  );
}

function useUnits(project) {
  return useMemo(() => unitStatuses(project.units || [], project.prospects || [], projectToday(project)), [project.units, project.prospects, project.sim?.now]);
}

function UnitDrawer({ project, unit, onClose, onOpenProspect }) {
  const { dispatch } = useStore();
  const [u, setU] = useState(unit);
  const save = (next) => {
    setU(next);
    const { status, prospect, ...clean } = next;
    dispatch({ type: "unit-save", id: project.id, unit: clean });
  };
  return (
    <Drawer eyebrow={`${u.label} · floor ${u.floor}`} title={`Unit ${u.number}`} onClose={onClose}>
      <p style={{ marginBottom: 14 }}>
        <Chip tone={u.status === "leased" ? "good" : u.status === "applied" ? "warn" : ""}>{UNIT_STATUS[u.status]}</Chip>
        {u.prospect && (
          <>
            {" "}
            <button className="linkbtn" onClick={() => onOpenProspect(u.prospect)}>
              {u.prospect.name}
            </button>
            {u.prospect.stage === "leased" ? ` · signed ${dateLong(u.prospect.leasedAt)} at ${money(Number(u.prospect.leaseRent))}` : ""}
          </>
        )}
      </p>
      <div className="grid2">
        <Field label="Unit number">
          <input value={u.number} onChange={(e) => save({ ...u, number: e.target.value.slice(0, 12) })} />
        </Field>
        <Field label="Asking rent">
          <input type="number" step="25" value={u.rent ?? ""} onChange={(e) => save({ ...u, rent: e.target.value === "" ? null : Number(e.target.value) })} />
        </Field>
        <Field label="Available from" optional>
          <input type="date" value={u.availableDate} onChange={(e) => save({ ...u, availableDate: e.target.value })} />
        </Field>
        <Field label="Note" optional>
          <input value={u.note} onChange={(e) => save({ ...u, note: e.target.value.slice(0, 200) })} placeholder="Corner, view, model unit" />
        </Field>
      </div>
      {u.status !== "leased" && u.status !== "applied" && (
        <label className="check" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={u.hold} onChange={(e) => save({ ...u, hold: e.target.checked })} /> Hold this unit off the market (model unit, office, repairs)
        </label>
      )}
    </Drawer>
  );
}

export function Units({ project, onOpenProspect }) {
  const { dispatch } = useStore();
  const [perFloor, setPerFloor] = useState("12");
  const [open, setOpen] = useState(null);
  const units = useUnits(project);
  const mix = normalizeMix(project.unitMix);
  const total = mix.reduce((n, r) => n + r.count, 0);
  if (!units.length) {
    return (
      <>
        <div className="todayhead">
          <div>
              <h1>Create the unit list</h1>
          </div>
        </div>
        <section className="card">
          <p style={{ maxWidth: 680, marginBottom: 14 }}>
            LeaseRight builds one unit for each of the {number(total)} apartments in the unit mix, numbered by floor, with the asking rent from the plan. Unit numbers, rents and dates can be edited one by one afterward.
          </p>
          <div className="row">
            <Field label="Units per floor">
              <input type="number" min="1" value={perFloor} onChange={(e) => setPerFloor(e.target.value)} style={{ width: 120 }} />
            </Field>
            <button className="btn primary" style={{ alignSelf: "flex-end" }} disabled={!total} onClick={() => dispatch({ type: "units-set", id: project.id, units: generateUnits(project.unitMix, { perFloor: Number(perFloor) || 12 }) })}>
              Create {number(total)} units
            </button>
          </div>
        </section>
      </>
    );
  }
  const byStatus = (s) => units.filter((u) => u.status === s).length;
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => b - a);
  const widest = Math.max(...floors.map((f) => units.filter((u) => u.floor === f).length));
  const types = mix.map((r) => {
    const us = units.filter((u) => u.typeId === r.id);
    const leased = us.filter((u) => u.status === "leased");
    const signed = leased.map((u) => Number(u.prospect?.leaseRent)).filter((v) => v > 0);
    return { r, n: us.length, leased: leased.length, applied: us.filter((u) => u.status === "applied").length, avail: us.filter((u) => u.status === "available").length, avgSigned: signed.length ? signed.reduce((a, b) => a + b, 0) / signed.length : null };
  });
  return (
    <>
      <div className="todayhead">
        <div>
          <h1>
            {byStatus("leased")} of {units.length} leased
          </h1>
        </div>
        <div className="legendrow">
          {["available", "applied", "leased", "hold", "coming"].map((s) => (
            <span key={s}>
              <i className={`ucell ${s}`} />
              {UNIT_STATUS[s]} {byStatus(s)}
            </span>
          ))}
        </div>
      </div>
      <section className="card">
        <div className="unitgrid">
          {floors.map((f) => (
            <div className="floor" key={f}>
              <span className="fl mono">{f}</span>
              <div className="cells" style={{ gridTemplateColumns: `repeat(${widest}, minmax(52px, 1fr))` }}>
                {units
                  .filter((u) => u.floor === f)
                  .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
                  .map((u) => (
                    <button key={u.id} className={`ucell ${u.status}`} title={`${u.number} · ${u.label} · ${UNIT_STATUS[u.status]}${u.prospect ? ` · ${u.prospect.name}` : ""}`} onClick={() => setOpen(u)}>
                      <b>{u.number}</b>
                      <span>{bedLabel(u.beds)}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>By unit type</h2>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Type</th>
                <th className="n">Units</th>
                <th className="n">Leased</th>
                <th className="n">In application</th>
                <th className="n">Available</th>
                <th className="n">Plan rent</th>
                <th className="n">Average signed</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.r.id}>
                  <td className="strong">{t.r.label}</td>
                  <td className="n">{t.n}</td>
                  <td className="n">{t.leased}</td>
                  <td className="n">{t.applied}</td>
                  <td className="n">{t.avail}</td>
                  <td className="n">{money(t.r.rent)}</td>
                  <td className="n">{t.avgSigned ? money(t.avgSigned) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          Plan rent is the asking rent in the unit mix. Average signed is what leases have actually been written at, before free rent.
        </p>
      </section>
      {open && <UnitDrawer project={project} unit={units.find((u) => u.id === open.id) || open} onClose={() => setOpen(null)} onOpenProspect={(p) => { setOpen(null); onOpenProspect(p); }} />}
    </>
  );
}

export { newProspect };
