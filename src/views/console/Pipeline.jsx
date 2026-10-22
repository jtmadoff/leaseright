import React, { useState } from "react";
import { Head, KStrip } from "./common.jsx";
import { newProspect } from "../../store/store.jsx";
import { moveProspect, want, shortDay, time12 } from "../../core/leasing.js";
import { parseDate, DAY_MS } from "../../core/model.js";
import { money, bedLabel } from "../../core/format.js";

const COLS = [
  ["lead", "New"],
  ["tour", "Tour booked"],
  ["toured", "Toured"],
  ["applied", "Applied"],
  ["approved", "Approved"],
  ["leased", "Signed"],
];
// Moves that need details (a unit, a rent) open the prospect instead of moving on drop.
const NEEDS_DETAIL = new Set(["tour", "applied", "leased"]);

export function PipelineBoard({ project, today, statuses, decided, openProspect, dispatch }) {
  const [beds, setBeds] = useState("");
  const [source, setSource] = useState("");
  const [over, setOver] = useState(null);
  const all = project.prospects || [];
  const t = parseDate(today);
  const recent = (iso, days) => {
    const d = parseDate(String(iso || "").slice(0, 10));
    return d !== null && d <= t && t - d < days * DAY_MS;
  };
  const active = all.filter((p) => ["lead", "tour", "toured", "applied", "approved"].includes(p.stage));
  const flagged = new Set(decided.filter((d) => d.kind === "lead").map((d) => d.key.split(":")[1]));
  const sources = [...new Set(all.map((p) => p.source).filter(Boolean))];
  const shown = all.filter((p) => (!beds || String(p.beds) === beds) && (!source || p.source === source));
  const unitNo = (id) => statuses.find((u) => u.id === id)?.number;
  const drop = (stage, id) => {
    const p = all.find((x) => x.id === id);
    if (!p || p.stage === stage) return;
    if (NEEDS_DETAIL.has(stage)) return openProspect(p);
    dispatch({ type: "prospect-save", id: project.id, prospect: moveProspect(p, stage, today) });
  };
  const age = (p) => {
    const d = parseDate(String(p.createdAt || "").slice(0, 10));
    if (d === null) return "";
    const n = Math.round((t - d) / DAY_MS);
    return n <= 0 ? "today" : `${n}d`;
  };
  return (
    <div className="cpage">
      <Head code="F2 · Pipeline" name={project.name} hint="drag a card to move it">
        <button className="btn small primary" onClick={() => openProspect(newProspect())}>
          Add a lead
        </button>
      </Head>
      <KStrip
        items={[
          ["Active", active.length, "in the funnel"],
          ["Not contacted", flagged.size, "past a day", flagged.size ? "bad" : "plain"],
          ["Tours · 7 days", all.filter((p) => recent(p.touredAt, 7)).length, "completed"],
          ["Signed · 7 days", all.filter((p) => recent(p.leasedAt, 7)).length, `${all.filter((p) => recent(p.leasedAt, 30)).length} in 30 days`, "good"],
        ]}
      />
      <div className="filters">
        <span className="fl">Bed</span>
        {["", "0", "1", "2", "3"].map((b) => (
          <button key={b || "all"} className={`chip ${beds === b ? "on" : ""}`} onClick={() => setBeds(b)}>
            {b === "" ? "All" : bedLabel(b)}
          </button>
        ))}
        <span className="fl">Source</span>
        {["", ...sources].map((s) => (
          <button key={s || "all"} className={`chip ${source === s ? "on" : ""}`} onClick={() => setSource(s)}>
            {s || "All"}
          </button>
        ))}
        <span className="spacer" />
        <span className="mono small muted">
          {shown.filter((p) => p.stage !== "lost").length} of {all.filter((p) => p.stage !== "lost").length}
        </span>
      </div>
      <div className="board">
        {COLS.map(([key, label], ci) => {
          let cards = shown.filter((p) => p.stage === key);
          if (key === "leased") cards = cards.filter((p) => recent(p.leasedAt, 30));
          return (
            <section
              key={key}
              className={`col ${over === key ? "over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(key);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                setOver(null);
                drop(key, e.dataTransfer.getData("text/plain"));
              }}
            >
              <header>
                <span className="mono muted">{String(ci + 1).padStart(2, "0")}</span>
                <b>{label}</b>
                <span className="mono muted">{cards.length}</span>
              </header>
              {cards.map((p) => (
                <article
                  key={p.id}
                  className={`pcard ${flagged.has(p.id) ? "hot" : ""}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                  onClick={() => openProspect(p)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openProspect(p)}
                >
                  <div className="r1">
                    <span className="unittag">{unitNo(p.unitId) || (p.beds === "" ? "Any" : bedLabel(p.beds))}</span>
                    <b>{p.name}</b>
                    <span className={`mono small ${flagged.has(p.id) ? "neg" : "muted"}`}>{age(p)}</span>
                  </div>
                  <div className="r2 mono">
                    {[p.source, p.budget ? money(Number(p.budget)) : null, p.moveIn ? `→ ${shortDay(p.moveIn)}` : null].filter(Boolean).join(" · ") || want(p)}
                  </div>
                  <div className="r3">
                    {p.stage === "tour" && p.tourAt
                      ? `Tour ${shortDay(p.tourAt.slice(0, 10))} ${time12(p.tourAt)}`
                      : p.stage === "leased"
                        ? `Signed ${shortDay(p.leasedAt)} at ${money(Number(p.leaseRent))}`
                        : p.nextNote || (p.history || []).slice(-1)[0]?.text || "New lead"}
                  </div>
                </article>
              ))}
              {key === "leased" && shown.some((p) => p.stage === "leased" && !recent(p.leasedAt, 30)) && (
                <div className="mono small muted" style={{ padding: "6px 10px" }}>
                  + {shown.filter((p) => p.stage === "leased" && !recent(p.leasedAt, 30)).length} signed earlier
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
