/* global React, THEMES, fmtUSD, fmtNum */
const { useState, useEffect, useRef } = React;

const Dot = ({ c, pulse, size = 6 }) => (
  <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
    {pulse && <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: c, opacity: 0.4, animation: "pulseDot 2s ease-out infinite" }} />}
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: c }} />
  </span>
);

const Tag = ({ t, children, tone = "neutral" }) => {
  const tones = {
    neutral: { c: t.inkSoft, bg: t.surfaceAlt, bd: t.rule },
    accent:  { c: t.accent,  bg: t.accentSoft, bd: "transparent" },
    good:    { c: t.good,    bg: t.goodSoft,   bd: "transparent" },
    warn:    { c: t.warn,    bg: t.warnSoft,   bd: "transparent" },
    bad:     { c: t.bad,     bg: t.badSoft,    bd: "transparent" },
  };
  const to = tones[tone];
  return <span style={{ fontFamily: t.sans, fontSize: 10.5, fontWeight: 500, letterSpacing: 0.2, color: to.c, background: to.bg, border: `1px solid ${to.bd}`, padding: "2px 7px", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 4, lineHeight: 1.3, whiteSpace: "nowrap" }}>{children}</span>;
};

const Btn = ({ t, children, variant = "secondary", onClick, kbd, size = "sm", style, disabled }) => {
  const sz = size === "xs" ? { pad: "4px 9px", fs: 11 } : size === "md" ? { pad: "8px 14px", fs: 13 } : { pad: "6px 11px", fs: 12 };
  const v = {
    primary:   { bg: t.ink,     c: t.surface, bd: t.ink },
    secondary: { bg: t.surface, c: t.ink,     bd: t.rule },
    ghost:     { bg: "transparent", c: t.inkSoft, bd: "transparent" },
    accent:    { bg: t.accent,  c: "#fff",     bd: t.accent },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: sz.pad, fontSize: sz.fs, fontFamily: t.sans, fontWeight: 500, color: v.c, background: v.bg, border: `1px solid ${v.bd}`, borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, lineHeight: 1.2, transition: "background 80ms", ...style }}
      onMouseEnter={e => { if (variant === "secondary") e.currentTarget.style.background = t.hover; }}
      onMouseLeave={e => { if (variant === "secondary") e.currentTarget.style.background = t.surface; }}>
      {children}
      {kbd && <kbd style={{ fontFamily: t.mono, fontSize: 10, padding: "0 4px", background: variant === "primary" ? "rgba(255,255,255,0.15)" : t.ruleSoft, borderRadius: 2, color: variant === "primary" ? "rgba(255,255,255,0.8)" : t.inkMute }}>{kbd}</kbd>}
    </button>
  );
};

const Eyebrow = ({ t, children, style }) => <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: t.inkMute, ...style }}>{children}</div>;

const Kbd = ({ t, children }) => <kbd style={{ fontFamily: t.mono, fontSize: 10, padding: "1px 5px", background: t.ruleSoft, border: `1px solid ${t.rule}`, borderRadius: 3, color: t.inkSoft, fontWeight: 500, lineHeight: 1.4 }}>{children}</kbd>;

const MicroBar = ({ t, value, max, width = 60, color }) => (
  <div style={{ width, height: 4, background: t.ruleSoft, borderRadius: 1, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color || t.inkSoft, transition: "width 380ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
  </div>
);

// Panel container — frames a cell in the grid. Subtle border, slight shadow on hover.
const Section = ({ t, title, action, children, style, hero }) => (
  <section style={{
    background: t.surface,
    border: `1px solid ${t.rule}`,
    borderRadius: 4,
    position: "relative",
    transition: "box-shadow 180ms ease, border-color 180ms ease",
    ...(hero ? { background: t.ink, color: t.surface } : {}),
    ...style,
  }}
    onMouseEnter={e => !hero && (e.currentTarget.style.boxShadow = "0 4px 18px rgba(20,20,20,0.05)")}
    onMouseLeave={e => !hero && (e.currentTarget.style.boxShadow = "none")}>
    {(title || action) && (
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 10px", borderBottom: `1px solid ${hero ? "rgba(255,255,255,0.12)" : t.rule}` }}>
        <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: hero ? "rgba(255,255,255,0.55)" : t.inkMute, flex: 1 }}>{title}</div>
        {action}
      </div>
    )}
    <div style={{ padding: "14px 16px" }}>{children}</div>
  </section>
);

// AnimCounter — count-up on mount, with tabular nums.
const AnimCounter = ({ value, prefix = "", suffix = "", digits = 0, style, duration = 900 }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const to = typeof value === "number" ? value : 0;
    const ease = x => 1 - Math.pow(1 - x, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setV(from + (to - from) * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  const formatted = digits === 0 ? Math.round(v).toLocaleString() : v.toFixed(digits);
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{prefix}{formatted}{suffix}</span>;
};

// Reusable KPI strip used by every module page — same rhythm as Today.
const PageKpis = ({ t, items }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, borderBottom: `1px solid ${t.rule}`, background: t.bg }}>
    {items.map((k, i) => {
      const trendColor = k.tone === "good" ? t.good : k.tone === "bad" ? t.bad : k.tone === "warn" ? t.warn : t.ink;
      return (
        <div key={i} style={{ padding: "14px 18px", minWidth: 0, borderLeft: i === 0 ? "none" : `1px solid ${t.rule}` }}>
          <div style={{ fontFamily: t.sans, fontSize: 9, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkMute, marginBottom: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
            <div style={{ fontFamily: k.mono === false ? t.sans : t.mono, fontSize: 22, fontWeight: 600, color: trendColor, letterSpacing: 0, lineHeight: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            {k.unit && <span style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute }}>{k.unit}</span>}
          </div>
          <div style={{ fontFamily: t.sans, fontSize: 10.5, color: t.inkMute, marginTop: 6, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.sub}</div>
        </div>
      );
    })}
  </div>
);

// Section header band used inside a module page (eyebrow + optional action).
const Band = ({ t, title, right, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: t.bg, borderBottom: `1px solid ${t.rule}`, ...style }}>
    <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: t.inkMute }}>{title}</div>
    <div style={{ flex: 1 }} />
    {right}
  </div>
);

// Unit chip — unit number in mono inside a bordered pill. Replaces random-color initials.
const UnitChip = ({ t, children, style }) => (
  <span style={{ fontFamily: t.mono, fontSize: 10.5, fontWeight: 500, letterSpacing: 0.3, color: t.inkSoft, padding: "2px 7px", borderRadius: 3, border: `1px solid ${t.rule}`, background: t.surfaceAlt, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", lineHeight: 1.4, ...style }}>{children}</span>
);

// Dense data-table <tr> row — shared skin so every page feels like one product.
const dataTH = (t, align = "left") => ({
  padding: "8px 14px",
  textAlign: align,
  fontFamily: t.sans,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: t.inkMute,
  borderBottom: `1px solid ${t.rule}`,
  background: t.surfaceAlt,
  whiteSpace: "nowrap",
});
const dataTD = (t, { align = "left", mono = false, color } = {}) => ({
  padding: "11px 14px",
  textAlign: align,
  fontFamily: mono ? t.mono : t.sans,
  fontSize: mono ? 12 : 13,
  color: color || t.ink,
  borderBottom: `1px solid ${t.ruleSoft}`,
  fontVariantNumeric: mono ? "tabular-nums" : undefined,
});

Object.assign(window, { Dot, Tag, Btn, Eyebrow, Kbd, MicroBar, Section, AnimCounter, PageKpis, Band, UnitChip, dataTH, dataTD });
