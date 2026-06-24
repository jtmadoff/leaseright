/* global React, THEMES, PROPERTIES, KPIS, VELOCITY, QUEUE, UNIT_MATRIX, STAGES, FEED, Dot, Tag, Btn, Eyebrow, Section, Kpi, Spark, MicroBar, Kbd, fmtUSD, fmtNum, fmtPct */
const { useState, useEffect, useRef, useMemo } = React;

// ═══════════════════════════════════════════════════════════════
//  KPI STRIP — single row, animated count-ups
// ═══════════════════════════════════════════════════════════════
const KPI_ITEMS = [
  { label: "Pace",      value: 3,    prefix: "+", sub: "units ahead of plan · 12-wk", trend: "good", mono: false, digits: 0 },
  { label: "Velocity",  value: 9.2,  suffix: "",   sub: "leases/wk · target 7.0",     trend: "good", mono: true,  digits: 1 },
  { label: "Days left", value: 163,  suffix: "",   sub: "~30 days ahead of plan",     trend: "good", mono: true,  digits: 0 },
  { label: "Carry / wk",value: 23,   prefix: "$",  suffix: "K", sub: "139 vacant units", trend: "warn", mono: true, digits: 0 },
];
const KpiStrip = ({ t }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(4, minmax(0, 1fr))`, borderBottom: `1px solid ${t.rule}`, background: t.bg }}>
    {KPI_ITEMS.map((k, i) => {
      const trendEl = k.trend === "good" ? <span style={{ fontFamily: t.mono, fontSize: 10, color: t.good }}>▲</span>
                    : k.trend === "warn" ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.warn, display: "inline-block" }} />
                    : null;
      return (
        <div key={k.label} style={{ padding: "14px 18px", minWidth: 0, borderLeft: i === 0 ? "none" : `1px solid ${t.rule}` }}>
          <div style={{ fontFamily: t.sans, fontSize: 9, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkMute, marginBottom: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
            <div style={{ fontFamily: k.mono ? t.mono : t.sans, fontSize: k.mono ? 22 : 24, fontWeight: 600, color: t.ink, letterSpacing: k.mono ? 0 : -0.5, lineHeight: 1, whiteSpace: "nowrap" }}>
              <AnimCounter value={k.value} prefix={k.prefix || ""} suffix={k.suffix || ""} digits={k.digits} />
            </div>
            {trendEl}
          </div>
          <div style={{ fontFamily: t.sans, fontSize: 10.5, color: t.inkMute, marginTop: 6, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.sub}</div>
        </div>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  LAYOUT A — QUEUE (inbox-like, prioritized decisions)
// ═══════════════════════════════════════════════════════════════
const QueueRow = ({ t, q, selected, onSelect, expanded, onExpand, done, onDone }) => {
  const kindTone = q.status === "act" ? "bad" : q.status === "sla" ? "warn" : "neutral";
  const kindLabels = { pricing: "PRICING", concession: "CONCESSION", lead: "LEAD", market: "MARKET", ops: "OPS", money: "MONEY" };
  return (
    <div style={{ borderBottom: `1px solid ${t.ruleSoft}`, background: selected ? t.hover : "transparent", borderLeft: `2px solid ${selected ? t.accent : "transparent"}`, transition: "background 80ms" }}>
      <div onClick={onSelect} style={{ padding: "10px 16px 10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, opacity: done ? 0.45 : 1 }}>
        <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, width: 16, letterSpacing: 0.5 }}>{String(q.priority).padStart(2, "0")}</span>
        <Dot c={q.status === "act" ? t.bad : q.status === "sla" ? t.warn : t.inkMute} pulse={q.status === "act" || q.status === "sla"} />
        <span style={{ fontFamily: t.mono, fontSize: 9.5, letterSpacing: 1.2, color: t.inkMute, width: 78, fontWeight: 500 }}>{kindLabels[q.kind]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: t.sans, fontSize: 13, fontWeight: 500, color: t.ink, textDecoration: done ? "line-through" : "none" }}>{q.subject}</div>
          <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkMute, marginTop: 2 }}>{q.summary}</div>
        </div>
        <span style={{ fontFamily: t.mono, fontSize: 10.5, color: q.meta.risk === "high" ? t.bad : q.meta.risk === "medium" ? t.warn : t.inkMute, letterSpacing: 0.2, minWidth: 120, textAlign: "right" }}>{q.meta.impact}</span>
        <button onClick={e => { e.stopPropagation(); onExpand(); }} style={{ width: 22, height: 22, border: `1px solid ${t.rule}`, background: t.surface, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={9} height={9} viewBox="0 0 9 9"><path d={expanded ? "M2 5.5l2.5-2.5 2.5 2.5" : "M2 3.5l2.5 2.5 2.5-2.5"} stroke={t.inkSoft} strokeWidth={1.2} fill="none" strokeLinecap="round" /></svg>
        </button>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 14px 50px", borderTop: `1px solid ${t.ruleSoft}`, paddingTop: 12, background: t.surfaceAlt }}>
          <div style={{ fontFamily: t.sans, fontSize: 12.5, color: t.inkSoft, lineHeight: 1.55, marginBottom: 10, maxWidth: 720 }}>{q.detail}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {q.actions.map(a => (
              <Btn key={a.id} t={t} variant={a.primary ? "primary" : a.ghost ? "ghost" : "secondary"} onClick={onDone} kbd={a.kbd}>{a.label}</Btn>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const QueueLayout = ({ t }) => {
  const [sel, setSel] = useState(0);
  const [expanded, setExpanded] = useState(new Set([QUEUE[0].id]));
  const [done, setDone] = useState(new Set());

  const toggle = (id) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const markDone = (id) => setDone(s => { const n = new Set(s); n.add(id); return n; });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", height: "calc(100vh - 44px - 96px)" }}>
      {/* Queue */}
      <div style={{ borderRight: `1px solid ${t.rule}`, overflowY: "auto" }}>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 12, background: t.bg }}>
          <Eyebrow t={t}>Needs attention · {QUEUE.length}</Eyebrow>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, letterSpacing: 0.3 }}>{done.size} cleared</span>
          <Btn t={t} variant="ghost" size="xs">Sort: Priority ↓</Btn>
        </div>
        {QUEUE.map((q, i) => (
          <QueueRow key={q.id} t={t} q={q}
            selected={i === sel}
            onSelect={() => setSel(i)}
            expanded={expanded.has(q.id)}
            onExpand={() => toggle(q.id)}
            done={done.has(q.id)}
            onDone={() => markDone(q.id)} />
        ))}
        <div style={{ padding: "16px", fontFamily: t.sans, fontSize: 11.5, color: t.inkMute, textAlign: "center" }}>
          End of queue · next sweep 3 hours
        </div>
      </div>

      {/* Detail pane */}
      <div style={{ overflowY: "auto", background: t.surface }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.rule}` }}>
          <Eyebrow t={t} style={{ marginBottom: 8 }}>Context</Eyebrow>
          <div style={{ fontFamily: t.sans, fontSize: 14, fontWeight: 600, color: t.ink }}>{QUEUE[sel].subject}</div>
          <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkMute, marginTop: 4 }}>{QUEUE[sel].summary}</div>
        </div>

        {QUEUE[sel].kind === "pricing" && (
          <>
            <Section t={t} title="Unit performance" style={{ padding: "14px 20px" }}>
              {UNIT_MATRIX.map((u, i) => (
                <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px", padding: "8px 0", borderBottom: i < UNIT_MATRIX.length - 1 ? `1px solid ${t.ruleSoft}` : "none", fontFamily: t.sans, fontSize: 12, alignItems: "center" }}>
                  <span style={{ color: u.id === "3b" ? t.ink : t.inkSoft, fontWeight: u.id === "3b" ? 600 : 400 }}>{u.type}</span>
                  <MicroBar t={t} value={u.leased} max={u.total} color={u.id === "3b" ? t.bad : u.leased/u.total > 0.5 ? t.good : t.inkSoft} />
                  <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkSoft, textAlign: "right" }}>{u.leased}/{u.total}</span>
                </div>
              ))}
            </Section>
            <Section t={t} title="Comp set" style={{ padding: "14px 20px" }}>
              {[
                { name: "The Vance", rent: 3150, conc: "2 mo free", threat: "high" },
                { name: "Ovation",   rent: 3180, conc: "1 mo free", threat: "med" },
                { name: "Halcyon",   rent: 3240, conc: "None",      threat: "low" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", padding: "8px 0", borderBottom: i < 2 ? `1px solid ${t.ruleSoft}` : "none", fontFamily: t.sans, fontSize: 12, alignItems: "center" }}>
                  <span style={{ flex: 1, color: t.ink }}>{c.name}</span>
                  <span style={{ fontFamily: t.mono, fontSize: 11.5, color: t.inkSoft, width: 60, textAlign: "right" }}>${fmtNum(c.rent)}</span>
                  <Tag t={t} tone={c.threat === "high" ? "bad" : c.threat === "med" ? "warn" : "neutral"} subtle>{c.conc}</Tag>
                </div>
              ))}
            </Section>
          </>
        )}

        <div style={{ padding: "14px 20px" }}>
          <Eyebrow t={t} style={{ marginBottom: 10 }}>Activity</Eyebrow>
          {FEED.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", fontFamily: t.sans, fontSize: 11.5, alignItems: "baseline" }}>
              <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, width: 60, letterSpacing: 0.2, flexShrink: 0 }}>{f.time}</span>
              <Dot c={f.type === "failed" ? t.bad : f.type === "signed" ? t.good : t.inkMute} size={5} />
              <span style={{ color: t.inkSoft }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  LAYOUT B — GRID (compact KPI strip + 2-col working panels)
// ═══════════════════════════════════════════════════════════════
//  LAYOUT B — GRID (redesigned w/ hierarchy + motion + real interactions)
// ═══════════════════════════════════════════════════════════════

// 12-week actuals (tail ending today)
const VELOCITY_12W = [5.2, 5.8, 4.9, 6.1, 6.4, 7.1, 6.8, 7.9, 8.3, 9.0, 8.8, 9.2];

// Live activity ticker
const LIVE_FEED = [
  { t: "00:12", type: "signed",   text: "Unit 412 · 1BR signed · Priya S.",          tone: "good" },
  { t: "00:34", type: "app",      text: "Application · 2BR · Marcus W.",             tone: "accent" },
  { t: "02:08", type: "lead",     text: "Hot lead · Zillow · pre-checked",           tone: "accent" },
  { t: "02:41", type: "tour",     text: "Tour booked · Sat 2pm · 3BR",                tone: "neutral" },
  { t: "03:15", type: "failed",   text: "Payment failed · 3 units · auto-retry set", tone: "bad" },
  { t: "04:02", type: "comp",     text: "The Vance raised concession · 2 mo free",   tone: "warn" },
];

// Sparkline — animated stroke-dash draw-on
const Sparkline = ({ values, color, fill, width = "100%", height = 44 }) => {
  const ref = useRef(null);
  const [w, setW] = useState(220);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const mx = Math.max(...values), mn = Math.min(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - ((v - mn) / (mx - mn || 1)) * (height - 6) - 3]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${w},${height} L0,${height} Z`;
  const lastX = pts[pts.length - 1][0], lastY = pts[pts.length - 1][1];
  const pathRef = useRef(null);
  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.transition = "none";
    pathRef.current.style.strokeDasharray = String(len);
    pathRef.current.style.strokeDashoffset = String(len);
    requestAnimationFrame(() => {
      pathRef.current.style.transition = "stroke-dashoffset 1000ms cubic-bezier(0.22,1,0.36,1)";
      pathRef.current.style.strokeDashoffset = "0";
    });
  }, [w]);
  return (
    <div ref={ref} style={{ width, height, position: "relative" }}>
      <svg width={w} height={height} style={{ display: "block" }}>
        <path d={area} fill={fill} stroke="none" opacity={0.12} />
        <path ref={pathRef} d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={3.2} fill={color} />
        <circle cx={lastX} cy={lastY} r={6} fill={color} opacity={0.25} style={{ transformOrigin: `${lastX}px ${lastY}px`, animation: "pulseDot 2s ease-out infinite" }} />
      </svg>
    </div>
  );
};

// Clock that ticks every second
const LiveClock = ({ t }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return (
    <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, letterSpacing: 0.4, display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Dot c={t.good} pulse />
      LIVE · {hh}:{mm}:<span style={{ opacity: 0.55 }}>{ss}</span>
    </span>
  );
};

// Stepper for inline rent adjust — shows live $ delta vs baseline
const RentStepper = ({ t, baseline, value, onChange, units }) => {
  const delta = value - baseline;
  const monthly = delta * units;
  const dtone = delta < 0 ? t.bad : delta > 0 ? t.good : t.inkMute;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={() => onChange(value - 25)} style={{ width: 26, height: 26, border: `1px solid ${t.rule}`, background: t.surface, borderRadius: 4, cursor: "pointer", fontFamily: t.mono, fontSize: 13, color: t.ink }}>−</button>
      <div style={{ fontFamily: t.mono, fontSize: 20, fontWeight: 600, color: t.ink, minWidth: 78, textAlign: "center", letterSpacing: -0.2 }}>${fmtNum(value)}</div>
      <button onClick={() => onChange(value + 25)} style={{ width: 26, height: 26, border: `1px solid ${t.rule}`, background: t.surface, borderRadius: 4, cursor: "pointer", fontFamily: t.mono, fontSize: 13, color: t.ink }}>+</button>
      <div style={{ flex: 1 }} />
      <div style={{ fontFamily: t.mono, fontSize: 11, color: dtone, letterSpacing: 0.2, display: "flex", alignItems: "center", gap: 6 }}>
        {delta === 0 ? "no change"
          : <>
              <span style={{ color: dtone }}>{delta > 0 ? "▲" : "▼"} ${fmtNum(Math.abs(delta))}</span>
              <span style={{ color: t.inkMute }}>·</span>
              <span style={{ color: dtone, fontWeight: 500 }}>{monthly > 0 ? "+" : ""}${fmtNum(monthly)}/mo</span>
            </>}
      </div>
    </div>
  );
};

// ─── Priority carousel: one of 3 decisions at a time ────────────────
const PriorityCarousel = ({ t }) => {
  const [i, setI] = useState(() => {
    const v = Number(localStorage.getItem("lu.priorityIdx")); return Number.isFinite(v) && v >= 0 && v < PRIORITIES.length ? v : 0;
  });
  const [rent3b, setRent3b] = useState(3400);
  const [dir, setDir] = useState(0); // -1 back, +1 forward — for slide anim
  const [accepted, setAccepted] = useState(() => new Set());

  useEffect(() => { localStorage.setItem("lu.priorityIdx", String(i)); }, [i]);

  const go = (delta) => {
    setDir(delta);
    setI(x => (x + delta + PRIORITIES.length) % PRIORITIES.length);
  };

  // Keyboard: ← / → when not in an input
  useEffect(() => {
    const h = (e) => {
      if (e.target.closest("input, textarea")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(+1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const p = PRIORITIES[i];
  const isAccepted = accepted.has(p.id);

  const acceptPrimary = () => {
    if (p.kind === "pricing" && p.context) setRent3b(p.context.target);
    setAccepted(s => { const n = new Set(s); n.add(p.id); return n; });
  };

  return (
    <div style={{ background: t.bg, color: t.ink, position: "relative", overflow: "hidden", boxShadow: `inset 0 -1px 0 ${t.rule}` }}>
      {/* Amber hairline — marks hero as "command zone" */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: `linear-gradient(90deg, transparent 0%, ${t.accent} 18%, ${t.accent} 82%, transparent 100%)`, opacity: 0.35, pointerEvents: "none" }} />

      {/* Context strip — thin, 4 KPIs above the carousel */}
      <div style={{ display: "flex", alignItems: "center", padding: "11px 24px", borderBottom: `1px solid ${t.rule}`, gap: 28, fontFamily: t.sans, fontSize: 11.5 }}>
        {[
          { l: "Pace",      v: "+3",    s: "units ahead · 12-wk",  tone: "good",  mono: true, trend: "up" },
          { l: "Velocity",  v: "9.2",   s: "leases/wk · tgt 7.0",  tone: "good",  mono: true, trend: "up", live: true },
          { l: "Days left", v: "163",   s: "~30 ahead of plan",     tone: "good",  mono: true, trend: "up" },
          { l: "Carry/wk",  v: "$23K",  s: "139 vacant units",      tone: "warn",  mono: true, trend: "flat" },
        ].map((k, ix) => {
          const toneColor = k.tone === "good" ? t.good : k.tone === "warn" ? t.warn : t.inkSoft;
          return (
            <div key={k.l} style={{ display: "flex", alignItems: "baseline", gap: 8, flex: 1, minWidth: 0, position: "relative", paddingLeft: ix === 0 ? 0 : 14, borderLeft: ix === 0 ? "none" : `1px solid ${t.ruleSoft}` }}>
              <span style={{ fontFamily: t.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: t.inkMute, whiteSpace: "nowrap" }}>{k.l}</span>
              <span style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 600, color: t.ink, fontVariantNumeric: "tabular-nums", letterSpacing: -0.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
                {k.v}
                {k.trend === "up" && <span style={{ fontSize: 9, color: toneColor, opacity: 0.85 }}>▲</span>}
                {k.live && <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.good, animation: "pulseDot 2s ease-out infinite", marginLeft: 1 }} />}
              </span>
              <span style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.s}</span>
            </div>
          );
        })}
      </div>

      {/* Top rail: rank pills + nav */}
      <div style={{ display: "flex", alignItems: "center", padding: "14px 24px 0", gap: 14 }}>
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.accent, letterSpacing: 1.6, fontWeight: 600 }}>DECISIONS</span>
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkFaint, letterSpacing: 0.4, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")} / {String(PRIORITIES.length).padStart(2, "0")}</span>
        <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
          {PRIORITIES.map((pp, idx) => {
            const isActive = idx === i;
            const isDone = accepted.has(pp.id);
            const toneDotColor = pp.tone === "bad" ? t.bad : pp.tone === "warn" ? t.warn : t.good;
            return (
              <button key={pp.id} onClick={() => { setDir(idx > i ? 1 : -1); setI(idx); }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 9px", background: isActive ? t.surfaceAlt : "transparent", border: `1px solid ${isActive ? t.rule : "transparent"}`, borderRadius: 3, cursor: "pointer", fontFamily: t.sans, fontSize: 11, color: isActive ? t.ink : t.inkMute, fontWeight: isActive ? 500 : 400, transition: "all 140ms", position: "relative" }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = t.inkSoft; e.currentTarget.style.background = t.ruleSoft; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = t.inkMute; e.currentTarget.style.background = "transparent"; } }}>
                {/* Active indicator — amber edge */}
                {isActive && <span style={{ position: "absolute", left: -1, top: -1, bottom: -1, width: 2, background: t.accent, borderRadius: "2px 0 0 2px" }} />}
                <span style={{ fontFamily: t.mono, fontSize: 9.5, color: isActive ? t.accent : t.inkFaint, fontWeight: 600, letterSpacing: 0.3 }}>{String(pp.rank).padStart(2, "0")}</span>
                <span>{pp.eyebrow}</span>
                {isDone ? <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.good, display: "inline-flex", alignItems: "center", justifyContent: "center", color: t.bg, fontFamily: t.sans, fontSize: 9, fontWeight: 700 }}>✓</span>
                  : <span style={{ width: 5, height: 5, borderRadius: "50%", background: toneDotColor, opacity: isActive ? 1 : 0.6, boxShadow: isActive ? `0 0 8px ${toneDotColor}` : "none" }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => go(-1)} aria-label="Previous"
            style={{ width: 26, height: 26, background: t.surfaceAlt, border: `1px solid ${t.rule}`, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.inkSoft, transition: "all 140ms" }}
            onMouseEnter={e => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background = t.surfaceAlt; e.currentTarget.style.color = t.inkSoft; }}>
            <svg width={10} height={10} viewBox="0 0 10 10"><path d="M6.5 2L3.5 5l3 3" stroke="currentColor" strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => go(+1)} aria-label="Next"
            style={{ width: 26, height: 26, background: t.surfaceAlt, border: `1px solid ${t.rule}`, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.inkSoft, transition: "all 140ms" }}
            onMouseEnter={e => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background = t.surfaceAlt; e.currentTarget.style.color = t.inkSoft; }}>
            <svg width={10} height={10} viewBox="0 0 10 10"><path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.inkFaint, letterSpacing: 0.6, marginLeft: 6 }}>← →</span>
        </div>
      </div>

      {/* Card body — keyed so it re-animates on change */}
      <div key={p.id} style={{ padding: "18px 24px 24px", animation: `slideFrom${dir >= 0 ? "Right" : "Left"} 320ms cubic-bezier(0.22,1,0.36,1)` }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 1.4, fontWeight: 500 }}>
            <span style={{ color: t.accent }}>{String(p.rank).padStart(2, "0")}</span> · {p.eyebrow}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: t.inkFaint }} />
          <span style={{ fontFamily: t.mono, fontSize: 10, color: p.tone === "bad" ? t.bad : p.tone === "warn" ? t.warn : t.inkSoft, letterSpacing: 1.4, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.tone === "bad" ? t.bad : p.tone === "warn" ? t.warn : t.good, animation: p.tone === "bad" ? "pulseDot 1.6s ease-out infinite" : "none" }} />
            {p.toneLabel}
          </span>
          <div style={{ flex: 1 }} />
          {/* Score — with richer bars */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.4 }}>
            <span style={{ fontWeight: 600, letterSpacing: 1.1 }}>SCORE</span>
            <span style={{ fontSize: 15, color: t.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: -0.2 }}>{p.score.total}</span>
            <span style={{ display: "flex", gap: 3, alignItems: "flex-end" }} title={`impact ${p.score.impact} · risk ${p.score.risk} · recency ${p.score.recency}`}>
              {[["I", p.score.impact, 45, t.good], ["R", p.score.risk, 45, t.bad], ["T", p.score.recency, 25, t.accent]].map(([lbl, v, max, col]) => (
                <span key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ width: 4, height: 14, background: t.surfaceAlt, position: "relative", overflow: "hidden", borderRadius: 0.5 }}>
                    <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${(v / max) * 100}%`, background: col }} />
                  </span>
                  <span style={{ fontSize: 8, color: t.inkFaint, letterSpacing: 0.3 }}>{lbl}</span>
                </span>
              ))}
            </span>
          </div>
          <span style={{ width: 1, height: 18, background: t.rule }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: t.surfaceAlt, border: `1px solid ${t.rule}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: t.sans, fontSize: 9, fontWeight: 600, color: t.inkSoft, letterSpacing: 0.2 }}>{p.owner.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
            <span style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute }}>{p.owner}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: p.kind === "pricing" ? "minmax(0, 1fr) minmax(0, 1.3fr)" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 40, alignItems: "start" }}>
          {/* Left — narrative */}
          <div>
            <div style={{ fontFamily: t.sans, fontSize: 28, fontWeight: 600, color: t.ink, letterSpacing: -0.6, lineHeight: 1.15 }}>
              {p.headline}
            </div>
            <div style={{ marginTop: 12, maxWidth: 480 }}>
              {p.lines.map((ln, ix) => (
                <div key={ix} style={{ fontFamily: t.sans, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.6 }}>{ln}</div>
              ))}
            </div>
            {/* Recommendation — callout with amber edge */}
            <div style={{ marginTop: 14, padding: "10px 14px", background: t.surfaceAlt, borderLeft: `2px solid ${t.accent}`, borderRadius: "0 3px 3px 0", maxWidth: 480 }}>
              <div style={{ color: t.accent, fontFamily: t.mono, fontSize: 9.5, letterSpacing: 1.3, fontWeight: 600, marginBottom: 3 }}>RECOMMENDATION</div>
              <div style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink, lineHeight: 1.55 }}>{p.recLine}</div>
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: 8, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={acceptPrimary}
                onMouseEnter={e => { if (!isAccepted) { e.currentTarget.style.background = "#FFB84D"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 14px ${t.accent}40`; } }}
                onMouseLeave={e => { if (!isAccepted) { e.currentTarget.style.background = t.accent; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; } }}
                onMouseDown={e => e.currentTarget.style.transform = "translateY(0)"}
                onMouseUp={e => e.currentTarget.style.transform = "translateY(-1px)"}
                style={{ padding: "10px 16px", background: isAccepted ? t.good : t.accent, color: t.bg, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: t.sans, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, transition: "all 160ms" }}>
                {isAccepted ? <>Accepted <span style={{ fontSize: 11 }}>✓</span></> : <>{p.primary.label} <kbd style={{ fontFamily: t.mono, fontSize: 9.5, padding: "1px 5px", background: "rgba(0,0,0,0.2)", borderRadius: 2, color: t.bg }}>{p.primary.kbd || "↵"}</kbd></>}
              </button>
              {p.alt.map((a, ix) => (
                <button key={ix}
                  onMouseEnter={e => { e.currentTarget.style.background = a.ghost ? "transparent" : t.surfaceAlt; e.currentTarget.style.color = t.ink; e.currentTarget.style.borderColor = a.ghost ? "transparent" : t.inkFaint; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = a.ghost ? t.inkMute : t.ink; e.currentTarget.style.borderColor = a.ghost ? "transparent" : t.rule; }}
                  style={{ padding: a.ghost ? "10px 12px" : "10px 14px", background: "transparent", color: a.ghost ? t.inkMute : t.ink, border: a.ghost ? "1px solid transparent" : `1px solid ${t.rule}`, borderRadius: 4, cursor: "pointer", fontFamily: t.sans, fontSize: 13, fontWeight: 500, transition: "all 140ms" }}>
                  {a.label}
                </button>
              ))}
            </div>
            {/* Impact caption — below actions */}
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: t.mono, fontSize: 10.5, letterSpacing: 0.3 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: p.tone === "bad" ? t.bad : p.tone === "warn" ? t.warn : t.good }} />
              <span style={{ color: p.tone === "bad" ? t.bad : p.tone === "warn" ? t.warn : t.good, fontWeight: 500 }}>{p.impactLabel}</span>
            </div>
          </div>

          {/* Right — context-specific */}
          {p.kind === "pricing" && p.context ? (
            <div style={{ border: `1px solid ${t.rule}`, borderRadius: 4, padding: 16, background: t.surfaceAlt }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkSoft }}>Asking rent · 3BR</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, letterSpacing: 0.2 }}>baseline ${fmtNum(p.context.baseline)} · target ${fmtNum(p.context.target)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setRent3b(r => r - 25)} style={{ width: 32, height: 32, border: `1px solid ${t.rule}`, background: t.surfaceAlt, borderRadius: 4, cursor: "pointer", fontFamily: t.mono, fontSize: 16, color: t.ink }}>−</button>
                <div style={{ fontFamily: t.mono, fontSize: 30, fontWeight: 600, color: t.ink, minWidth: 120, textAlign: "center", letterSpacing: -0.4, fontVariantNumeric: "tabular-nums" }}>${fmtNum(rent3b)}</div>
                <button onClick={() => setRent3b(r => r + 25)} style={{ width: 32, height: 32, border: `1px solid ${t.rule}`, background: t.surfaceAlt, borderRadius: 4, cursor: "pointer", fontFamily: t.mono, fontSize: 16, color: t.ink }}>+</button>
                <div style={{ flex: 1 }} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: t.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkMute }}>Monthly revenue Δ</div>
                  <div style={{ fontFamily: t.mono, fontSize: 18, fontWeight: 600, color: rent3b < p.context.baseline ? t.bad : rent3b > p.context.baseline ? t.good : t.inkSoft, marginTop: 4, fontVariantNumeric: "tabular-nums", transition: "color 200ms" }}>
                    {rent3b === p.context.baseline ? "—" : (rent3b > p.context.baseline ? "+" : "−") + "$" + fmtNum(Math.abs((rent3b - p.context.baseline) * p.context.units))}
                  </div>
                  <div style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, marginTop: 2, letterSpacing: 0.2 }}>× {p.context.units} vacant 3BR units</div>
                </div>
              </div>
              {/* Comp set track */}
              <div style={{ marginTop: 18, position: "relative", height: 34 }}>
                <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 2, background: t.rule }} />
                {p.context.comps.map((m, ix) => {
                  const pct = ((m.v - 3000) / (3500 - 3000)) * 100;
                  return (
                    <div key={ix} style={{ position: "absolute", left: `${pct}%`, top: 0, transform: "translateX(-50%)", textAlign: "center" }}>
                      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkMute, marginBottom: 2 }}>${m.v}</div>
                      <div style={{ width: 2, height: 8, background: m.c, margin: "0 auto" }} />
                      <div style={{ fontFamily: t.mono, fontSize: 8.5, color: t.inkMute, marginTop: 3, letterSpacing: 0.2 }}>{m.l}</div>
                    </div>
                  );
                })}
                <div style={{ position: "absolute", left: `${((rent3b - 3000) / 500) * 100}%`, top: 20, transform: "translateX(-50%)", transition: "left 220ms cubic-bezier(0.22,1,0.36,1)" }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: t.surface, border: "2px solid #5B5BD6", boxShadow: "0 0 0 3px rgba(91,91,214,0.25)" }} />
                </div>
              </div>
            </div>
          ) : p.kind === "lead" ? (
            <LeadContextPanel t={t} />
          ) : (
            <ConcessionContextPanel t={t} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Context panels for non-pricing priorities ────────────────────
const LeadContextPanel = ({ t }) => {
  const rows = [
    { lbl: "Source",    v: "Zillow" },
    { lbl: "Score",     v: "92 / 100", tone: "good" },
    { lbl: "Pre-check", v: "TransUnion · passed", tone: "good" },
    { lbl: "Unit",      v: "2BR-1204 · $2,800/mo" },
    { lbl: "SLA",       v: "5h 12m past (20 min target)", tone: "bad" },
    { lbl: "Toured",    v: "The Vance 11a · Ovation 2p" },
  ];
  return (
    <div style={{ border: `1px solid ${t.rule}`, borderRadius: 4, padding: 16, background: t.surfaceAlt }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkSoft }}>Lead · Alex Rivera</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: t.mono, fontSize: 10.5, color: t.bad, letterSpacing: 0.3 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.bad, animation: "pulseDot 1.4s ease-out infinite" }} />
          SLA BREACH
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
        {rows.map((r, ix) => (
          <div key={ix} style={{ display: "flex", flexDirection: "column", gap: 2, borderBottom: `1px solid ${t.rule}`, paddingBottom: 8 }}>
            <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 1.1, textTransform: "uppercase" }}>{r.lbl}</span>
            <span style={{ fontFamily: t.sans, fontSize: 13, color: r.tone === "good" ? t.good : r.tone === "bad" ? t.bad : t.surface, fontWeight: 500 }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConcessionContextPanel = ({ t }) => {
  const leasesByWeek = [0, 1, 1, 2, 2, 2, 3, 1];
  const weeks = ["Apr 7", "14", "21", "28", "May 5", "12", "19", "26"];
  const max = Math.max(...leasesByWeek);
  return (
    <div style={{ border: `1px solid ${t.rule}`, borderRadius: 4, padding: 16, background: t.surfaceAlt }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkSoft }}>1 month free · leases by week</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute }}>14 total · expires May 31</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72, marginBottom: 8 }}>
        {leasesByWeek.map((v, ix) => (
          <div key={ix} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
            <span style={{ fontFamily: t.mono, fontSize: 9.5, color: v > 0 ? t.inkSoft : t.inkFaint, fontVariantNumeric: "tabular-nums" }}>{v}</span>
            <div style={{ width: "100%", height: `${(v / max) * 56 + 2}px`, background: v > 0 ? t.good : t.rule, borderRadius: 1, transition: "height 400ms cubic-bezier(0.22,1,0.36,1)" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {weeks.map((w, ix) => (
          <span key={ix} style={{ flex: 1, fontFamily: t.mono, fontSize: 9, color: t.inkMute, textAlign: "center", letterSpacing: 0.3 }}>{w}</span>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "10px 12px", background: t.surfaceAlt, borderLeft: `2px solid ${t.warn}`, borderRadius: 2, fontFamily: t.sans, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
        Velocity is still rising. 69 eligible units · 32 more 2BR/3BR leases needed before stabilization.
      </div>
    </div>
  );
};

const GridLayout = ({ t }) => {
  const [tickIdx, setTickIdx] = useState(0);

  // Make the feed roll through — new item enters every 4s
  useEffect(() => {
    const id = setInterval(() => setTickIdx(i => (i + 1) % LIVE_FEED.length), 4200);
    return () => clearInterval(id);
  }, []);
  const feed = useMemo(() => {
    const rolled = [...LIVE_FEED.slice(tickIdx), ...LIVE_FEED.slice(0, tickIdx)];
    return rolled;
  }, [tickIdx]);

  return (
    <div style={{ padding: 0 }}>

      <PriorityCarousel t={t} />

      {/* ═══════════════════════════════════════════════════════════════
          SUPPORTING SURFACE — lighter, below the command zone
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "18px 20px 40px", display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(280px, 1fr)", gap: 14, alignItems: "start" }}>

      {/* ┌──────────────────────────────────────────┐
          │  Right now · live ticker                │
          └──────────────────────────────────────────┘ */}
      <Section t={t} title="Right now" style={{ gridColumn: "1 / 3" }} action={<LiveClock t={t} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0, position: "relative" }}>
          {feed.slice(0, 6).map((f, i) => {
            const tone = f.tone === "good" ? t.good : f.tone === "bad" ? t.bad : f.tone === "warn" ? t.warn : f.tone === "accent" ? t.accent : t.inkMute;
            const isFresh = i === 0;
            const col = i % 3;
            return (
              <div key={`${tickIdx}-${i}`} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px 10px 0",
                borderRight: col < 2 ? `1px solid ${t.ruleSoft}` : "none",
                paddingLeft: col === 0 ? 0 : 14,
                fontFamily: t.sans, fontSize: 12,
                opacity: isFresh ? 1 : 0.78,
                animation: isFresh ? "slideIn 360ms cubic-bezier(0.22,1,0.36,1)" : "none",
                minWidth: 0,
                position: "relative",
              }}>
                {isFresh && <span style={{ position: "absolute", left: col === 0 ? 0 : 14, top: 4, bottom: 4, width: 2, background: tone, opacity: 0.7, borderRadius: 1 }} />}
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.2, flexShrink: 0, paddingTop: 2, width: 34, marginLeft: isFresh ? 8 : 0 }}>{f.t}</span>
                <div style={{ position: "relative", width: 6, height: 6, borderRadius: "50%", background: tone, flexShrink: 0, marginTop: 6 }}>
                  {isFresh && <div style={{ position: "absolute", inset: -3, borderRadius: "50%", background: tone, opacity: 0.3, animation: "pulseDot 2s ease-out infinite" }} />}
                </div>
                <span style={{ color: isFresh ? t.ink : t.inkSoft, flex: 1, lineHeight: 1.4, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", fontWeight: isFresh ? 500 : 400 }}>{f.text}</span>
              </div>
            );
          })}
          {/* Next tick progress bar */}
          <div key={`prog-${tickIdx}`} style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 1, background: t.ruleSoft }}>
            <div style={{ height: "100%", background: t.accent, opacity: 0.5, animation: "fillBar 4.2s linear forwards" }} />
          </div>
        </div>
      </Section>

      {/* ┌──────────────────────────────────────────┐
          │  Velocity · animated sparkline          │
          └──────────────────────────────────────────┘ */}
      <Section t={t} title="Lease velocity · 12 weeks" action={<span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute }}>target 7.0/wk</span>}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: t.sans, fontWeight: 600, color: t.ink, letterSpacing: -0.5, lineHeight: 1, fontSize: 38 }}>
              <AnimCounter value={9.2} digits={1} />
            </div>
            <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.good, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <span>▲</span><span style={{ fontFamily: t.mono }}>+2.2 vs plan</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Sparkline values={VELOCITY_12W} color={t.accent} fill={t.accent} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, marginTop: 4, letterSpacing: 0.3 }}>
              <span>12w ago</span><span style={{ color: t.ink }}>this wk</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ┌──────────────────────────────────────────┐
          │  Progress to stabilization              │
          └──────────────────────────────────────────┘ */}
      <Section t={t} title="To stabilization" action={<Tag t={t} tone="good">+3 ahead</Tag>}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
          <div style={{ fontFamily: t.sans, fontSize: 34, fontWeight: 600, color: t.ink, letterSpacing: -0.5, lineHeight: 1 }}>
            <AnimCounter value={121} />
          </div>
          <div style={{ fontFamily: t.sans, fontSize: 13, color: t.inkMute }}>/ 242</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: t.mono, fontSize: 11, color: t.inkSoft, letterSpacing: 0.2 }}>Jun 2027</div>
        </div>
        <div style={{ height: 6, background: t.ruleSoft, position: "relative", borderRadius: 1, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(3.3/18)*100}%`, background: t.inkFaint }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(121/242)*100}%`, background: t.accent, transition: "width 1000ms cubic-bezier(0.22,1,0.36,1)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.2 }}>
          <span>CO · Dec 15</span>
          <span style={{ textAlign: "center", color: t.ink }}>M3.3 · today</span>
          <span style={{ textAlign: "right" }}>M18 · goal</span>
        </div>
      </Section>

      {/* ┌──────────────────────────────────────────┐
          │  Unit types (full width)                │
          └──────────────────────────────────────────┘ */}
      <Section t={t} title="Unit performance" style={{ gridColumn: "1 / 3" }}
        action={<span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute }}>hover any row →</span>}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 620, fontFamily: t.sans, fontSize: 12.5, borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Type", "Inventory", "Leased", "DOM", "Asking", "vs Comp", "Action"].map((h, i) => (
              <th key={i} style={{ padding: "6px 14px 10px", fontFamily: t.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: t.inkMute, textAlign: i >= 3 ? "right" : "left", whiteSpace: "nowrap", borderBottom: `1px solid ${t.rule}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {UNIT_MATRIX.map((u, i) => {
              const gap = u.asking - u.comp;
              const isStalled = u.id === "3b";
              return (
                <tr key={u.id} style={{ borderBottom: i < UNIT_MATRIX.length - 1 ? `1px solid ${t.ruleSoft}` : "none", cursor: "pointer", transition: "background 140ms" }}
                  onMouseEnter={e => e.currentTarget.style.background = t.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px", color: t.ink, fontWeight: 500, position: "relative" }}>
                    {isStalled && <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 2, background: t.bad }} />}
                    {u.type}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: t.mono, fontSize: 11.5, color: t.inkSoft }}>{u.total}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MicroBar t={t} value={u.leased} max={u.total} width={54} color={u.leased/u.total > 0.5 ? t.good : isStalled ? t.bad : t.inkSoft} />
                      <span style={{ fontFamily: t.mono, fontSize: 11.5, color: t.inkSoft }}>{u.leased}/{u.total}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: t.mono, fontSize: 11.5, textAlign: "right", color: u.dom > 30 ? t.bad : u.dom > 20 ? t.warn : t.inkSoft, fontWeight: u.dom > 30 ? 500 : 400 }}>{u.dom}d</td>
                  <td style={{ padding: "12px 14px", fontFamily: t.mono, fontSize: 11.5, textAlign: "right", color: t.ink, fontWeight: 500 }}>${fmtNum(u.asking)}</td>
                  <td style={{ padding: "12px 14px", fontFamily: t.mono, fontSize: 11, textAlign: "right", color: gap > 100 ? t.bad : t.inkSoft, whiteSpace: "nowrap" }}>{gap > 0 ? "+" : ""}${fmtNum(gap)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>{u.suggested ? <Tag t={t} tone="warn">↓ ${fmtNum(u.suggested)}</Tag> : <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkFaint }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </Section>

      {/* ┌──────────────────────────────────────────┐
          │  Pipeline funnel                        │
          └──────────────────────────────────────────┘ */}
      <Section t={t} title="Pipeline · 83 active">
        <div>
          {STAGES.map((s, i) => {
            const max = Math.max(...STAGES.map(s => s.count));
            const pct = (s.count / max) * 100;
            return (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "82px 1fr 28px", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < STAGES.length - 1 ? `1px solid ${t.ruleSoft}` : "none" }}>
                <span style={{ fontFamily: t.sans, fontSize: 12, color: t.inkSoft }}>{s.label}</span>
                <div style={{ height: 6, background: t.ruleSoft, position: "relative", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: t.inkSoft, opacity: 0.3 + (i/STAGES.length)*0.55, transition: `width ${400 + i*80}ms cubic-bezier(0.22,1,0.36,1)` }} />
                </div>
                <span style={{ fontFamily: t.mono, fontSize: 11.5, color: t.ink, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.count}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ┌──────────────────────────────────────────┐
          │  Watching (ambient awareness)           │
          └──────────────────────────────────────────┘ */}
      <Section t={t} title="Watching" action={<span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute }}>no action needed</span>}>
        <div>
          {WATCHING.map((w, i) => {
            const tone = w.tone === "warn" ? t.warn : w.tone === "bad" ? t.bad : t.inkMute;
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < WATCHING.length - 1 ? `1px solid ${t.ruleSoft}` : "none", fontFamily: t.sans, fontSize: 12 }}>
                <Dot c={tone} size={5} />
                <span style={{ color: t.inkSoft, flex: 1, lineHeight: 1.45 }}>{w.text}</span>
              </div>
            );
          })}
        </div>
      </Section>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  LAYOUT C — TABLE (single dense master table)
// ═══════════════════════════════════════════════════════════════
const TableLayout = ({ t }) => {
  const [filter, setFilter] = useState("all");
  const filters = [["all", "All", QUEUE.length], ["act", "Act", QUEUE.filter(q => q.status === "act").length], ["sla", "SLA", QUEUE.filter(q => q.status === "sla").length], ["info", "Info", QUEUE.filter(q => q.status === "info").length]];
  const visible = filter === "all" ? QUEUE : QUEUE.filter(q => q.status === filter);

  return (
    <div>
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 14, background: t.bg }}>
        <Eyebrow t={t}>Master queue</Eyebrow>
        <div style={{ display: "flex", gap: 2, border: `1px solid ${t.rule}`, borderRadius: 4, padding: 2, background: t.surface }}>
          {filters.map(([id, lbl, n]) => (
            <button key={id} onClick={() => setFilter(id)}
              style={{ padding: "3px 9px", fontFamily: t.sans, fontSize: 11, fontWeight: 500, border: "none", background: filter === id ? t.surfaceAlt : "transparent", color: filter === id ? t.ink : t.inkSoft, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {lbl} <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute }}>{n}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Btn t={t} variant="ghost" size="xs">Columns</Btn>
        <Btn t={t} variant="ghost" size="xs">Export</Btn>
      </div>
      <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse", fontFamily: t.sans, fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: t.surfaceAlt }}>
            {["#", "", "Type", "Subject", "Summary", "Owner", "Impact", "Risk", ""].map((h, i) => (
              <th key={i} style={{ padding: "8px 12px", textAlign: i >= 6 && i <= 7 ? "right" : "left", fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: t.inkMute, borderBottom: `1px solid ${t.rule}`, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((q, i) => (
            <tr key={q.id} style={{ borderBottom: `1px solid ${t.ruleSoft}`, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = t.ruleSoft}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <td style={{ padding: "11px 12px", fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, width: 32 }}>{String(q.priority).padStart(2, "0")}</td>
              <td style={{ padding: "11px 12px", width: 16 }}><Dot c={q.status === "act" ? t.bad : q.status === "sla" ? t.warn : t.inkMute} pulse={q.status !== "info"} /></td>
              <td style={{ padding: "11px 12px", fontFamily: t.mono, fontSize: 10.5, color: t.inkSoft, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 500 }}>{q.kind}</td>
              <td style={{ padding: "11px 12px", color: t.ink, fontWeight: 500, minWidth: 200 }}>{q.subject}</td>
              <td style={{ padding: "11px 12px", color: t.inkMute, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.summary}</td>
              <td style={{ padding: "11px 12px", fontFamily: t.mono, fontSize: 11, color: t.inkSoft }}>{q.meta.owner}</td>
              <td style={{ padding: "11px 12px", fontFamily: t.mono, fontSize: 11, textAlign: "right", color: q.meta.risk === "high" ? t.bad : q.meta.risk === "medium" ? t.warn : t.inkSoft }}>{q.meta.impact}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}><Tag t={t} tone={q.meta.risk === "high" ? "bad" : q.meta.risk === "medium" ? "warn" : "neutral"}>{q.meta.risk}</Tag></td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}><Btn t={t} variant="secondary" size="xs">{q.actions[0].label} →</Btn></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  TODAY entry
// ═══════════════════════════════════════════════════════════════
const TodayView = ({ t, layout }) => (
  <div>
    {layout === "queue" && <QueueLayout t={t} />}
    {layout === "grid"  && <GridLayout t={t} />}
    {layout === "table" && <TableLayout t={t} />}
  </div>
);

Object.assign(window, { TodayView });
