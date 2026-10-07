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
