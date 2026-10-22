import React, { useState } from "react";
import { Icon } from "../../ui/atoms.jsx";
import { Head, Band } from "./common.jsx";
import { Digest, PracticeCall } from "./Agent.jsx";
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
  const { project, data, today, track, decided, tasks, openProspect, go } = ops;
  const run = useActions(ops);
  const [open, setOpen] = useState(0);
  const sel = decided[open] || decided[0] || null;
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
