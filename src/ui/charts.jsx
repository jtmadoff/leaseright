import React, { useMemo, useRef, useState } from "react";
import { money, moneyShort, monthLabel } from "../core/format.js";

/** Twelve-month trend for a stat tile: muted line, current month marked in the series color. */
export function Sparkline({ series, width = 120, height = 34, label }) {
  const points = series.slice(-13);
  if (points.length < 3) return null;
  const values = points.map((p) => p[1]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 5;
  const x = (i) => pad + (i * (width - pad * 2)) / (points.length - 1);
  const y = (v) => (max === min ? height / 2 : height - pad - ((v - min) * (height - pad * 2)) / (max - min));
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
  const last = points.length - 1;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={d} fill="none" stroke="var(--series-muted)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r="4" fill="var(--series-1)" stroke="var(--panel-2)" strokeWidth="2" />
    </svg>
  );
}

function niceStep(range, ticks) {
  const raw = range / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
}

const SERIES = {
  slower: { stroke: "var(--series-muted)", width: 1.5 },
  base: { stroke: "var(--series-1)", width: 2 },
  faster: { stroke: "var(--series-muted)", width: 1.5 },
};

/**
 * Cumulative cash position through the lease-up, one line per pace scenario.
 * Emphasis form: the base case carries the color, slower and faster are context.
 * The deepest point of the base line is the reserve the plan needs.
 */
export function CashChart({ scenarios, startLabel, reserve }) {
  const wrap = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = 300;
  const m = { top: 18, right: 64, bottom: 30, left: 62 };
  const model = useMemo(() => {
    const maxMonths = Math.max(...scenarios.map((s) => s.months.length));
    const all = scenarios.flatMap((s) => s.months.map((p) => p.cumulative)).concat(0);
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (hi - lo < 1) hi = lo + 1;
    const step = niceStep(hi - lo, 4);
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
    const x = (month) => m.left + (month * (W - m.left - m.right)) / maxMonths;
    const y = (v) => m.top + ((hi - v) * (H - m.top - m.bottom)) / (hi - lo);
    return { maxMonths, ticks, x, y };
  }, [scenarios]);
  const { maxMonths, ticks, x, y } = model;
  const base = scenarios.find((s) => s.key === "base");
  const trough = base.months.reduce((a, b) => (b.cumulative < a.cumulative ? b : a), { cumulative: 0, month: 0 });
  const xTicks = [];
  const every = maxMonths > 30 ? 12 : maxMonths > 14 ? 6 : 3;
  for (let i = 0; i <= maxMonths; i += every) xTicks.push(i);
  const path = (s) => [{ month: 0, cumulative: 0 }, ...s.months].map((p, i) => `${i ? "L" : "M"}${x(p.month).toFixed(1)},${y(p.cumulative).toFixed(1)}`).join(" ");
  const ends = scenarios.map((s) => ({ s, last: s.months[s.months.length - 1] }));
  // Keep end labels from overlapping when the lines finish close together.
  const placed = [];
  for (const e of [...ends].sort((a, b) => y(a.last.cumulative) - y(b.last.cumulative))) {
    let ly = y(e.last.cumulative);
    const prev = placed[placed.length - 1];
    if (prev && ly - prev.ly < 13) ly = prev.ly + 13;
    placed.push({ ...e, ly });
  }
  const onMove = (event) => {
    const box = wrap.current.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const month = Math.max(1, Math.min(maxMonths, Math.round(((px - m.left) / (W - m.left - m.right)) * maxMonths)));
    setHover({ month, left: (x(month) / W) * box.width });
  };
  const at = (s, month) => s.months[Math.min(month, s.months.length) - 1];
  return (
    <div className="viz" ref={wrap}>
      <div className="legend" aria-hidden="true">
        {scenarios.map((s) => (
          <span key={s.key}>
            <i style={{ background: SERIES[s.key].stroke }} />
            {s.name} · {s.leasesPerWeek.toFixed(1)} leases a week
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cumulative cash position by month for the slower, base and faster pace" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <g className="grid">
          {ticks.map((t) => (
            <line key={t} x1={m.left} x2={W - m.right} y1={y(t)} y2={y(t)} />
          ))}
        </g>
        <g className="axis">
          {ticks.map((t) => (
            <text key={t} x={m.left - 8} y={y(t) + 3.5} textAnchor="end">
              {moneyShort(t)}
            </text>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={x(t)} y={H - 8} textAnchor="middle">
              {t === 0 ? startLabel : `Mo ${t}`}
            </text>
          ))}
        </g>
        <line className="zero" x1={m.left} x2={W - m.right} y1={y(0)} y2={y(0)} />
        {scenarios
          .filter((s) => s.key !== "base")
          .concat(base)
          .map((s) => (
            <path key={s.key} d={path(s)} fill="none" stroke={SERIES[s.key].stroke} strokeWidth={SERIES[s.key].width} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        {placed.map(({ s, last, ly }) => (
          <g key={s.key}>
            <circle cx={x(last.month)} cy={y(last.cumulative)} r="4" fill={SERIES[s.key].stroke} stroke="var(--panel)" strokeWidth="2" />
            <text className={`lbl ${s.key === "base" ? "strong" : ""}`} x={x(last.month) + 9} y={ly + 4}>
              {s.name}
            </text>
          </g>
        ))}
        {trough.cumulative < 0 && (
          <g>
            <circle cx={x(trough.month)} cy={y(trough.cumulative)} r="4.5" fill="var(--series-1)" stroke="var(--panel)" strokeWidth="2" />
            <text className="lbl strong" x={x(trough.month)} y={y(trough.cumulative) + 18} textAnchor="middle">
              Reserve {moneyShort(reserve ?? -trough.cumulative)}
            </text>
          </g>
        )}
        {hover && <line x1={x(hover.month)} x2={x(hover.month)} y1={m.top} y2={H - m.bottom} stroke="var(--fg-faint)" strokeWidth="1" />}
        <rect x={m.left} y={m.top} width={W - m.left - m.right} height={H - m.top - m.bottom} fill="transparent" />
      </svg>
      {hover && (
        <div className="tip" style={{ left: Math.min(hover.left + 12, (wrap.current?.clientWidth || 600) - 190), top: 40 }}>
          <div className="tt">
            Month {hover.month} · {monthLabel(at(base, hover.month).date)}
          </div>
          {scenarios.map((s) => (
            <div className="r" key={s.key}>
              <span>
                <i style={{ background: SERIES[s.key].stroke }} />
                {s.name}
              </span>
              <b>{money(at(s, hover.month).cumulative)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MS_DAY = 86400000;
const toMs = (iso) => Date.parse(iso + "T00:00:00Z");
const shortDate = (ms) => {
  const d = new Date(ms);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ${d.getUTCDate()}`;
};

/**
 * Leases signed to date against the baseline. The actual line carries the color; the baseline
 * is the reference it is judged against; the re-forecast continues the actual line, dashed.
 */
export function LeaseChart({ startMs, path, existing, target, totalUnits, weeks, reforecast }) {
  const wrap = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = 280;
  const m = { top: 16, right: 92, bottom: 30, left: 44 };
  const planEndMs = startMs + path.length * MS_DAY;
  const lastWeekMs = weeks.length ? toMs(weeks[weeks.length - 1].weekEnding) : startMs;
  const fcMs = reforecast?.reached ? toMs(reforecast.stabilizeDate) : null;
  const endMs = Math.max(planEndMs, lastWeekMs, fcMs || 0) + 14 * MS_DAY;
  const hi = Math.max(totalUnits, ...weeks.map((w) => w.actual));
  const x = (ms) => m.left + ((ms - startMs) / (endMs - startMs)) * (W - m.left - m.right);
  const y = (v) => m.top + ((hi - v) * (H - m.top - m.bottom)) / hi;
  const step = Math.max(1, Math.ceil(path.length / 120));
  const planPts = [[startMs, existing]];
  for (let d = 0; d < path.length; d += step) planPts.push([startMs + (d + 1) * MS_DAY, path[d]]);
  if (path.length) planPts.push([planEndMs, path[path.length - 1]]);
  const line = (pts) => pts.map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const actualPts = [[startMs, existing], ...weeks.map((w) => [toMs(w.weekEnding), w.actual])];
  const last = actualPts[actualPts.length - 1];
  const yTicks = [];
  const yStep = niceStep(hi, 4);
  for (let v = 0; v <= hi + 1e-9; v += yStep) yTicks.push(v);
  const xTicks = [];
  const first = new Date(startMs);
  let t = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1);
  const months = (endMs - startMs) / (30.44 * MS_DAY);
  const every = months > 18 ? 3 : months > 9 ? 2 : 1;
  for (let i = 0; t < endMs; i++) {
    if (i % every === 0) xTicks.push(t);
    const d = new Date(t);
    t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  const plannedAtMs = (ms) => {
    if (ms <= startMs) return existing;
    const d = Math.floor((ms - startMs) / MS_DAY);
    return d >= path.length ? path[path.length - 1] ?? target : path[d];
  };
  const onMove = (event) => {
    if (!weeks.length) return;
    const box = wrap.current.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    let best = null;
    for (const w of weeks) {
      const dx = Math.abs(x(toMs(w.weekEnding)) - px);
      if (!best || dx < best.dx) best = { dx, w };
    }
    setHover({ w: best.w, left: (x(toMs(best.w.weekEnding)) / W) * box.width });
  };
  return (
    <div className="viz" ref={wrap}>
      <div className="legend" aria-hidden="true">
        <span>
          <i style={{ background: "var(--series-1)" }} />
          Actual leases
        </span>
        <span>
          <i style={{ background: "var(--series-muted)" }} />
          Baseline
        </span>
        {fcMs && (
          <span>
            <i className="dash" />
            Re-forecast at current pace
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Leases signed to date against the baseline plan" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <g className="grid">
          {yTicks.map((v) => (
            <line key={v} x1={m.left} x2={W - m.right} y1={y(v)} y2={y(v)} />
          ))}
        </g>
        <g className="axis">
          {yTicks.map((v) => (
            <text key={v} x={m.left - 8} y={y(v) + 3.5} textAnchor="end">
              {Math.round(v)}
            </text>
          ))}
          {xTicks.map((v) => (
            <text key={v} x={x(v)} y={H - 8} textAnchor="middle">
              {monthLabel(new Date(v).toISOString().slice(0, 10))}
            </text>
          ))}
        </g>
        <line className="zero" x1={m.left} x2={W - m.right} y1={y(target)} y2={y(target)} strokeDasharray="2 4" />
        <text className="lbl" x={W - m.right + 6} y={y(target) + 4}>
          Target {target}
        </text>
        <path d={line(planPts)} fill="none" stroke="var(--series-muted)" strokeWidth="1.5" strokeLinejoin="round" />
        {fcMs && <path d={line([last, [fcMs, target]])} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeDasharray="5 5" />}
        <path d={line(actualPts)} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {weeks.map((w) => (
          <circle key={w.id || w.weekEnding} cx={x(toMs(w.weekEnding))} cy={y(w.actual)} r={hover?.w === w ? 5 : 3.5} fill="var(--series-1)" stroke="var(--panel)" strokeWidth="2" />
        ))}
        {weeks.length > 0 && (
          <text className="lbl strong" x={x(last[0]) - 6} y={y(last[1]) - 12} textAnchor="end">
            {Math.round(last[1])} leased
          </text>
        )}
        {hover && <line x1={x(toMs(hover.w.weekEnding))} x2={x(toMs(hover.w.weekEnding))} y1={m.top} y2={H - m.bottom} stroke="var(--fg-faint)" strokeWidth="1" />}
        <rect x={m.left} y={m.top} width={W - m.left - m.right} height={H - m.top - m.bottom} fill="transparent" />
      </svg>
      {hover && (
        <div className="tip" style={{ left: Math.min(hover.left + 12, (wrap.current?.clientWidth || 600) - 190), top: 40 }}>
          <div className="tt">Week ending {shortDate(toMs(hover.w.weekEnding))}</div>
          <div className="r">
            <span>
              <i style={{ background: "var(--series-1)" }} />
              Actual
            </span>
            <b>{Math.round(hover.w.actual)}</b>
          </div>
          <div className="r">
            <span>
              <i style={{ background: "var(--series-muted)" }} />
              Baseline
            </span>
            <b>{Math.round(plannedAtMs(toMs(hover.w.weekEnding)))}</b>
          </div>
          <div className="r">
            <span>Signed that week</span>
            <b>{hover.w.net}</b>
          </div>
        </div>
      )}
    </div>
  );
}
