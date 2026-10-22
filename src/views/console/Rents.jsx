import React, { useState } from "react";
import { Head, KStrip, Band, plural } from "./common.jsx";
import { typeMetrics, concessionStats, repriceType } from "../../core/ops.js";
import { generateUnits, unitStatuses } from "../../core/leasing.js";
import { money, number, dateLong, bedLabel } from "../../core/format.js";
import { uidish } from "./util.js";

export function RentsView({ project, data, today, track, patch, go }) {
  const types = typeMetrics(project, data, today, { planPace: track?.planPace });
  const [draft, setDraft] = useState({});
  const val = (t) => draft[t.id] ?? Math.round(t.asking);
  const changes = types.filter((t) => draft[t.id] !== undefined && draft[t.id] !== Math.round(t.asking));
  const rentRoll = types.reduce((s, t) => s + val(t) * t.count, 0);
  const impact = types.reduce((s, t) => s + (val(t) - t.asking) * t.available * 12, 0);
  const vacancy = types.reduce((s, t) => s + t.vacancyCost, 0);
  const vacantUnits = types.reduce((n, t) => n + t.available, 0);
  const step = (t, d) => setDraft({ ...draft, [t.id]: Math.max(0, val(t) + d) });
  const publish = () => {
    let units = project.units?.length ? project.units : generateUnits(project.unitMix, { perFloor: 12 });
    const log = [];
    for (const t of changes) {
      const st = unitStatuses(units, project.prospects || [], today);
      units = repriceType(units, t.id, draft[t.id], st);
      log.push({ at: today, typeId: t.id, from: Math.round(t.asking), to: draft[t.id] });
    }
    patch({ units, priceChangedAt: today, priceLog: [...(project.priceLog || []), ...log] });
    setDraft({});
  };
  return (
    <div className="cpage">
      <Head code="F4 · Rents" name={project.name}>
        <button className="linkbtn small" onClick={() => go("concessions")}>
          Concessions
        </button>
      </Head>
      <div className="rentband">
        <div>
          <span>Full-occupancy rent roll</span>
          <b>{money(rentRoll)}</b>
          <small>a month at current asking</small>
        </div>
        <div>
          <span>Pending changes</span>
          <b className={changes.length ? "warn" : ""}>{changes.length}</b>
          <small>{changes.length ? changes.map((t) => t.label).join(", ") : "none"}</small>
        </div>
        <div>
          <span>Premium over town listings</span>
          <b className="premium">
            <input aria-label="Premium over town listings, percent" type="number" step="1" min="-30" max="60" defaultValue={project.premium ?? ""} placeholder="0" onBlur={(e) => patch({ premium: e.target.value })} />%
          </b>
          <small>what a building like this earns over the median</small>
        </div>
        <div>
          <span>Annualized impact</span>
          <b className={impact < 0 ? "neg" : ""}>{impact ? `${impact > 0 ? "+" : ""}${money(impact)}` : "$0"}</b>
          <small>on the {plural(vacantUnits, "open unit")}</small>
        </div>
        <span className="spacer" />
        <button className="btn small" disabled={!changes.length} onClick={() => setDraft({})}>
          Reset
        </button>
        <button className="btn small primary" disabled={!changes.length} onClick={publish}>
          Publish changes
        </button>
      </div>
      <div className="tablewrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Type</th>
              <th>Leased</th>
              <th className="n">Apps</th>
              <th className="n">Asking</th>
              <th className="n">Effective</th>
              <th className="n">Market</th>
              <th className="n">Gap</th>
              <th className="n">DOM</th>
              <th className="n">Vel</th>
              <th className="n">Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => {
              const pct = t.count ? t.leased / t.count : 0;
              const lag = t.typePlanPace ? t.velocity < t.typePlanPace * 0.6 : false;
              return (
                <tr key={t.id}>
                  <td className="strong">{t.label}</td>
                  <td>
                    <span className="perf" style={{ gridTemplateColumns: "60px 60px", padding: 0 }}>
                      <i>
                        <em className={t.suggestion ? "bad" : pct >= 0.5 ? "good" : ""} style={{ width: `${Math.round(pct * 100)}%` }} />
                      </i>
                      <span className="mono">
                        {t.leased}/{t.count}
                      </span>
                    </span>
                  </td>
                  <td className="n">{t.applied || "–"}</td>
                  <td className="n">
                    <span className="stepper">
                      <button onClick={() => step(t, -25)} aria-label={`Lower ${t.label} rent`}>
                        −
                      </button>
                      <input aria-label={`${t.label} asking rent`} value={val(t)} onChange={(e) => setDraft({ ...draft, [t.id]: Number(e.target.value.replace(/[^\d]/g, "")) || 0 })} />
                      <button onClick={() => step(t, 25)} aria-label={`Raise ${t.label} rent`}>
                        +
                      </button>
                    </span>
                  </td>
                  <td className="n">
                    {money(val(t) * (t.effective / t.asking))}
                    {t.concession && <span className="sub">{t.concession.name}</span>}
                  </td>
                  <td className="n">
                    {t.market ? money(t.market.median) : "–"}
                    {t.market && <span className="sub">{t.market.n} listings</span>}
                  </td>
                  <td className={`n ${t.gap > 100 ? "neg" : t.gap > 0 ? "warnc" : ""}`}>{t.market ? `${val(t) - t.market.median >= 0 ? "+" : ""}${number(val(t) - t.market.median)}` : "–"}</td>
                  <td className={`n ${t.dom > 30 ? "neg" : ""}`}>{t.dom === null ? "–" : `${Math.round(t.dom)}d`}</td>
                  <td className={`n ${lag ? "neg" : "posc"}`}>{t.velocity.toFixed(1)}</td>
                  <td className="n">
                    {t.suggestion && draft[t.id] !== t.suggestion.rent ? (
                      <button className="btn small accent" onClick={() => setDraft({ ...draft, [t.id]: t.suggestion.rent })}>
                        Apply {money(t.suggestion.rent)}
                      </button>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="kstrip foot">
        <div>
          <span>Vacancy cost today</span>
          <b className="bad">{money(vacancy)}/mo</b>
          <small>{plural(vacantUnits, "open unit")} at asking</small>
        </div>
        <div>
          <span>Pace required</span>
          <b className="plain">{track?.paceToHold ? `${track.paceToHold.toFixed(1)}/wk` : track ? `${track.planPace.toFixed(1)}/wk` : "–"}</b>
          <small>{track?.paceToHold ? `to stabilize by ${dateLong(track.base.stabilizeDate)}` : "the baseline pace"}</small>
        </div>
        <div>
          <span>Current pace</span>
          <b className={track && track.trailingPace !== null && track.trailingPace >= (track.paceToHold || track.planPace) ? "good" : "warn"}>{track?.trailingPace !== null && track?.trailingPace !== undefined ? `${track.trailingPace.toFixed(1)}/wk` : "–"}</b>
          <small>last {track?.weeksInWindow || 4} weeks</small>
        </div>
        <div>
          <span>If changes hold</span>
          <b className="plain">{impact ? `${impact > 0 ? "+" : ""}${money(impact)}` : "$0"}</b>
          <small>a year on open units</small>
        </div>
      </div>
      <p className="mono small muted wrap20">
        Asking is what open units are listed at now. Market is the {project.town} median asking rent for the bedroom count from the latest listing pull. Velocity is leases a week over the last four weeks; it turns red under 60% of the type's share of the plan pace. Leased and applied units keep their rent when prices change.
      </p>
    </div>
  );
}

const BEDS = [0, 1, 2, 3, 4];

export function ConcessionsView({ project, today, patch }) {
  const stats = concessionStats(project, today);
  const blank = { name: "", months: "1", beds: [], startsAt: today, endsAt: "", note: "" };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const typesInMix = [...new Set((project.unitMix || []).map((r) => Number(r.beds)).filter((b) => Number.isFinite(b)))];
  const save = () => {
    if (!form.name.trim() || !(Number(form.months) > 0)) return;
    const list = project.concessions || [];
    const row = { ...form, id: editing || uidish() };
    patch({ concessions: editing ? list.map((c) => (c.id === editing ? row : c)) : [...list, row] });
    setForm(blank);
    setEditing(null);
  };
  return (
    <div className="cpage">
      <Head code="Concessions" name={project.name} />
      <KStrip
        items={[
          ["Active programs", stats.filter((c) => c.status === "active").length, `${stats.length} in total`],
          ["Leases under a program", stats.reduce((n, c) => n + c.leases, 0), "signed with free rent", "plain"],
          ["Free rent given", money(stats.reduce((n, c) => n + c.cost, 0)), "rent times free months", "warn"],
        ]}
      />
      <Band>Programs</Band>
      {!stats.length && <div className="empty">No concession programs. Add one below; new leases on matching units pick it up automatically.</div>}
      {stats.length > 0 && (
        <div className="tablewrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>Program</th>
                <th className="n">Free</th>
                <th>Applies to</th>
                <th>Runs</th>
                <th>Status</th>
                <th className="n">Leases</th>
                <th className="n">Given</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stats.map((c) => (
                <tr key={c.id}>
                  <td className="strong">
                    {c.name}
                    {c.note && <span className="sub">{c.note}</span>}
                  </td>
                  <td className="n">{c.months} mo</td>
                  <td>{c.beds?.length ? c.beds.map(bedLabel).join(", ") : "All units"}</td>
                  <td className="mono small">
                    {c.startsAt ? dateLong(c.startsAt) : "now"} → {c.endsAt ? dateLong(c.endsAt) : "open"}
                  </td>
                  <td>
                    <span className={`tag ${c.status === "active" ? (c.daysLeft !== null && c.daysLeft <= 14 ? "warn" : "good") : ""}`}>
                      {c.status}
                      {c.status === "active" && c.daysLeft !== null ? ` · ${c.daysLeft}d left` : ""}
                    </span>
                  </td>
                  <td className="n">{c.leases}</td>
                  <td className="n">{money(c.cost)}</td>
                  <td className="n">
                    <button
                      className="linkbtn small"
                      onClick={() => {
                        setEditing(c.id);
                        setForm({ name: c.name, months: c.months, beds: c.beds || [], startsAt: c.startsAt, endsAt: c.endsAt, note: c.note || "" });
                      }}
                    >
                      Edit
                    </button>{" "}
                    <button className="linkbtn small" onClick={() => patch({ concessions: (project.concessions || []).filter((x) => x.id !== c.id) })}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Band>{editing ? "Edit program" : "New program"}</Band>
      <div className="wrap20">
        <div className="cform">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="One month free on 2 bedrooms" />
          </label>
          <label className="field">
            <span>Free months</span>
            <input type="number" step="0.5" min="0" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} />
          </label>
          <label className="field">
            <span>Starts</span>
            <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </label>
          <label className="field">
            <span>Ends</span>
            <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </label>
        </div>
        <div className="row wrap" style={{ marginTop: 12 }}>
          <span className="mono small muted">Applies to</span>
          {(typesInMix.length ? typesInMix : BEDS).map((b) => (
            <button key={b} className={`chip ${form.beds.includes(b) ? "on" : ""}`} onClick={() => setForm({ ...form, beds: form.beds.includes(b) ? form.beds.filter((x) => x !== b) : [...form.beds, b] })}>
              {bedLabel(b)}
            </button>
          ))}
          <span className="mono small muted">{form.beds.length ? "" : "none picked: all units"}</span>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn small primary" disabled={!form.name.trim() || !(Number(form.months) > 0)} onClick={save}>
            {editing ? "Save program" : "Add program"}
          </button>
          {editing && (
            <button
              className="btn small"
              onClick={() => {
                setEditing(null);
                setForm(blank);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
