import React, { useState, useMemo } from "react";
import { Icon } from "../../ui/atoms.jsx";
import { Head, Band } from "./common.jsx";
import { Digest, PracticeCall } from "./Agent.jsx";
import { whatIf } from "../../core/sim.js";
import { LeaseChart } from "../../ui/charts.jsx";
import { KStrip } from "./common.jsx";
import { typeMetrics, repriceType } from "../../core/ops.js";
import { generateUnits, unitStatuses } from "../../core/leasing.js";
import { newProspect } from "../../store/store.jsx";
import { listingBuildings } from "../../core/market.js";
import { money, bedLabel, dateLong } from "../../core/format.js";
import { isoDate, parseDate, DAY_MS } from "../../core/model.js";

const KIND = { handoff: "Needs you", pricing: "Pricing", pace: "Pace", lead: "Lead", application: "Application", lease: "Lease", concession: "Concession" };

/** Carry out a decision's action against the project. Shared by every console screen. */
export function useActions({ project, today, go, patch, openProspect }) {
  return (act) => {
    if (act.type === "price") {
      const units = project.units?.length ? project.units : generateUnits(project.unitMix, { perFloor: 12 });
      const st = unitStatuses(units, project.prospects || [], today);
      const before = st.find((u) => u.typeId === act.typeId && u.status === "available")?.rent ?? null;
      patch({
        units: repriceType(units, act.typeId, act.rent, st),
        priceChangedAt: today,
        priceLog: [...(project.priceLog || []), { at: today, typeId: act.typeId, from: before, to: act.rent }],
      });
    } else if (act.type === "hold") {
      patch({ dismissed: [...(project.dismissed || []).filter((d) => d.until >= today), { key: act.key, until: isoDate(parseDate(today) + act.days * DAY_MS) }] });
    } else if (act.type === "extend") {
      patch({
        concessions: (project.concessions || []).map((c) => (c.id === act.concessionId ? { ...c, endsAt: isoDate(Math.max(parseDate(c.endsAt) ?? parseDate(today), parseDate(today)) + act.days * DAY_MS) } : c)),
      });
    } else if (act.type === "go") go(act.to);
    else if (act.type === "inbox") go("inbox", act.prospectId);
    else if (act.type === "application") go("applications", act.prospectId);
    else if (act.type === "open") openProspect((project.prospects || []).find((p) => p.id === act.prospectId));
  };
}

export function TodayConsole(ops) {
  const { project, data, today, track, decided, tasks, openProspect, go, baseline } = ops;
  const run = useActions(ops);
  const [open, setOpen] = useState(0);
  const sel = decided[open] || decided[0] || null;
  const [showChart, setShowChart] = useState(false);
  // On a simulated project, a pricing decision carries an eight-week forecast with and without the cut.
  const forecast = useMemo(() => {
    if (!project.sim?.on || !data.rents || sel?.kind !== "pricing") return null;
    const act = sel.actions.find((a) => a.act.type === "price")?.act;
    if (!act) return null;
    return whatIf(project, data, (p) => {
      const st = unitStatuses(p.units, p.prospects || [], today);
      return { ...p, units: repriceType(p.units, act.typeId, act.rent, st), priceChangedAt: today, priceLog: [...(p.priceLog || []), { at: today, typeId: act.typeId, from: null, to: act.rent }] };
    });
  }, [project, data, sel?.key, today]);
  const stakes = track && baseline ? stakeItems(project, track, baseline, today) : null;
  const types = typeMetrics(project, data, today, { planPace: track?.planPace });
  const focusType = types.find((t) => t.id === sel?.typeId) || types.find((t) => t.suggestion) || null;
  const comps = listingBuildings(data.rents, project.town)
    .map((b) => ({ b, c: focusType ? b.byBed[String(focusType.beds)] : null }))
    .filter((x) => !focusType || x.c)
    .sort((a, b) => b.b.listings - a.b.listings)
    .slice(0, 5);
  return (
    <div className="cpage">
      <Head code="F1 · Today" name={project.name} hint={dateLong(today)} />
      {stakes && (
        <>
          <div className="band">
            <span>Lease-up · {track.stabilized ? "stabilized" : `${Math.round(track.actualLeased)} of ${track.target} to stabilize`}</span>
            <button className="linkbtn small" onClick={() => setShowChart((v) => !v)}>
              {showChart ? "Hide the curve" : "Show the curve"}
            </button>
          </div>
          <KStrip items={stakes} />
          {showChart && (
            <div className="wrap20 curve">
              <LeaseChart startMs={track.inputs.start} path={track.base.leasedPath} existing={track.inputs.existingLeased} target={track.target} totalUnits={track.totalUnits} weeks={track.weeks} reforecast={track.stabilized ? null : track.reforecast} />
            </div>
          )}
        </>
      )}
      <Digest project={project} />
      {!(project.prospects || []).length && <PracticeCall {...ops} />}
      <div className="split">
        <div>
          <Band right={<span>sort: priority ↓</span>}>Needs attention · {decided.length}</Band>
          {!decided.length && <div className="empty">Nothing needs a decision right now.</div>}
          {decided.map((d, i) => (
            <div key={d.key} className={`drow ${open === i ? "open" : ""}`}>
              <button className="dhead" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                <span className={`dot ${d.tone}`} />
                <span className="kind">{KIND[d.kind]}</span>
                <span className="dmain">
                  <b>{d.title}</b>
                  <small>{d.sub}</small>
                </span>
                <span className={`impact ${d.tone}`}>{d.impact}</span>
                <span className="chev">{open === i ? "▴" : "▾"}</span>
              </button>
              {open === i && (
                <div className="dbody2">
                  {d.body && <p>{d.body}</p>}
                  {forecast && sel?.key === d.key && <Forecast f={forecast} />}
                  <div className="row wrap">
                    {d.actions.map((a) => (
                      <button key={a.label} className={`btn small ${a.primary ? "primary" : ""}`} onClick={() => run(a.act)}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Band right={<button className="btn small" onClick={() => openProspect(newProspect({ createdAt: today }))}>Add a lead</button>}>Also today · {tasks.length}</Band>
          {!tasks.length && <div className="empty">No tours, follow-ups or first contacts due.</div>}
          <ul className="tasks" style={{ padding: "0 14px" }}>
            {tasks.map((t, i) => (
              <li key={`${t.p.id}-${t.kind}-${i}`}>
                <button className="taskrow" onClick={() => openProspect(t.p)}>
                  <span className={`kind ${t.kind}`} />
                  <span className="what">
                    <b>{t.title}</b>
                    <span className="muted">{t.p.name}</span>
                  </span>
                  <span className="muted small detail">{t.detail}</span>
                  <Icon.arrow size={13} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <aside className="ctx">
          <div className="blk">
            <div className="sect">Context</div>
            {sel ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{sel.title}</div>
                <div className="muted small" style={{ marginTop: 4 }}>{sel.sub}</div>
              </>
            ) : (
              <div className="muted small">Pick an item to see the evidence behind it.</div>
            )}
          </div>
          <div className="blk">
            <div className="sect">Unit performance</div>
            {types.map((t) => {
              const pct = t.count ? t.leased / t.count : 0;
              const tone = t.suggestion ? "bad" : pct >= 0.5 ? "good" : "neutral";
              return (
                <div key={t.id} className={`perf ${focusType?.id === t.id ? "on" : ""}`}>
                  <span>{t.label}</span>
                  <i>
                    <em className={tone} style={{ width: `${Math.round(pct * 100)}%` }} />
                  </i>
                  <span className="mono">
                    {t.leased}/{t.count}
                  </span>
                </div>
              );
            })}
            {track && (
              <p className="muted small" style={{ marginTop: 10 }}>
                {Math.round(track.actualLeased)} of {track.target} leased · {track.trailingPace?.toFixed(1) ?? "0.0"} a week against {track.planPace.toFixed(1)} planned.
              </p>
            )}
          </div>
          <div className="blk">
            <div className="sect">
              <span>Market{focusType ? ` · ${bedLabel(focusType.beds)}` : ""}</span>
              <button className="linkbtn small" onClick={() => go("market")}>
                Full view
              </button>
            </div>
            {focusType?.market && (
              <div className="perf" style={{ marginBottom: 10 }}>
                <span>Listing median</span>
                <span className="mono">{money(focusType.market.median)}</span>
                <span className="mono muted">{focusType.market.n}</span>
              </div>
            )}
            {focusType && (
              <div className="perf" style={{ marginBottom: 10 }}>
                <span>Your asking</span>
                <span className={`mono ${focusType.gap > 0 ? "neg" : ""}`}>{money(focusType.asking)}</span>
                <span className="mono muted">{focusType.gap !== null ? `${focusType.gap > 0 ? "+" : ""}${money(focusType.gap)}` : ""}</span>
              </div>
            )}
            {comps.map(({ b, c }) => (
              <div className="comp" key={b.address}>
                <span>{b.address}</span>
                <span className="mono">{c ? money(c.median) : `${b.listings} listed`}</span>
              </div>
            ))}
            {!comps.length && <p className="muted small">The latest pull has no building-level listings in {project.town || "this town"} for this unit type; the median above covers the whole town.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Eight weeks ahead, with and without the change, from the same random seed. */
function Forecast({ f }) {
  const d = (k) => f.after[k] - f.before[k];
  const sign = (v) => (v > 0 ? "+" : "");
  return (
    <div className="forecast">
      <div className="sect">Next {f.weeks} weeks, simulated both ways</div>
      <table className="mini">
        <thead>
          <tr>
            <th></th>
            <th>Hold</th>
            <th>Cut</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Inquiries</td><td className="mono">{f.before.leads}</td><td className="mono">{f.after.leads}</td><td className={`mono ${d("leads") > 0 ? "pos" : d("leads") < 0 ? "neg" : ""}`}>{sign(d("leads"))}{d("leads")}</td></tr>
          <tr><td>Leases signed</td><td className="mono">{f.before.leases}</td><td className="mono">{f.after.leases}</td><td className={`mono ${d("leases") > 0 ? "pos" : d("leases") < 0 ? "neg" : ""}`}>{sign(d("leases"))}{d("leases")}</td></tr>
          <tr><td>Monthly rent on them</td><td className="mono">{money(f.before.rent)}</td><td className="mono">{money(f.after.rent)}</td><td className={`mono ${d("rent") > 0 ? "pos" : d("rent") < 0 ? "neg" : ""}`}>{sign(d("rent"))}{money(d("rent"))}</td></tr>
          <tr><td>Units still open</td><td className="mono">{f.before.open}</td><td className="mono">{f.after.open}</td><td className={`mono ${d("open") < 0 ? "pos" : d("open") > 0 ? "neg" : ""}`}>{sign(d("open"))}{d("open")}</td></tr>
        </tbody>
      </table>
      <p className="muted small" style={{ margin: "8px 0 0" }}>
        {d("rent") > 0
          ? "The cut signs more rent than it gives up: units that would sit empty start paying."
          : d("leases") > 0
            ? "More units lease, but the rent roll on them is lower. Worth it if carry is the bigger cost."
            : "The cut does not move leasing enough to pay for itself over this window. Hold, or try a concession."}
      </p>
    </div>
  );
}

/** The numbers that matter this morning: where leasing stands against the plan and what delay costs. */
function stakeItems(project, track, baseline, today) {
  const st = unitStatuses(project.units || [], project.prospects || [], today);
  const open = st.filter((u) => u.status === "available");
  const burn = open.reduce((s, u) => s + (u.rent || 0), 0);
  const ahead = track.daysAhead;
  const fc = track.reforecast;
  const baseDate = track.base?.stabilizeDate;
  const slip = fc?.reached && baseDate ? Math.round((parseDate(fc.stabilizeDate) - parseDate(baseDate)) / DAY_MS) : null;
  const free = (project.prospects || []).filter((p) => p.stage === "leased").reduce((s, p) => s + (Number(p.leaseRent) || 0) * (Number(p.freeMonths) || 0), 0);
  return [
    ["Leased", `${Math.round(track.actualLeased)} / ${track.target}`, `${open.length} open · ${st.filter((u) => u.status === "applied").length} in application`, track.stabilized ? "good" : "plain"],
    ["Against plan", ahead === null ? "–" : ahead >= -3 && ahead <= 3 ? "On schedule" : `${Math.abs(Math.round(ahead / 7))} wk ${ahead < 0 ? "behind" : "ahead"}`, `${track.trailingPace.toFixed(1)} a week against ${track.planPace.toFixed(1)} planned`, ahead === null ? "plain" : ahead < -7 ? "bad" : ahead > 7 ? "good" : "plain"],
    ["Vacancy", `${money(Math.round(burn / 30.44))}/day`, `${money(burn)} a month on open units`, burn > 0 ? "bad" : "good"],
    ["Stabilizes", track.stabilized ? dateLong(fc.stabilizeDate) : fc?.reached ? dateLong(fc.stabilizeDate) : "Not at this pace", track.stabilized ? "done" : slip === null ? `plan: ${baseDate ? dateLong(baseDate) : "–"}` : slip > 0 ? `${slip} days after the plan` : slip < 0 ? `${-slip} days before the plan` : "on the plan date", track.stabilized ? "good" : slip === null ? "bad" : slip > 14 ? "bad" : slip < -7 ? "good" : "plain"],
    ["Free rent given", money(free), "under concessions so far", "plain"],
  ];
}
