/* global React, THEMES, PROPERTIES, NAV_PEEKS, PRIORITIES, Dot, Tag, Btn, Kbd, fmtNum, fmtPct */
const { useState, useEffect, useRef, useMemo } = React;

// ═══════════════════════════════════════════════════════════════
//  NAV STRUCTURE — Bloomberg function-key approach
//  F1..F9 = primary modules, overflow goes in cmd-\ sidebar
// ═══════════════════════════════════════════════════════════════
const NAV = [
  { section: null, items: [
    ["today",    "Today",    "F1"],
    ["pipeline", "Pipeline", "F2"],
    ["inbox",    "Inbox",    "F3"],
  ]},
  { section: "Lease-up", items: [
    ["rents",        "Rents",        "F4"],
    ["applications", "Applications", null],
    ["concessions",  "Concessions",  null],
    ["listings",     "Listings",     null],
    ["market",       "Market",       null],
  ]},
  { section: "Operations", items: [
    ["residents",   "Residents",   "F5"],
    ["maintenance", "Maintenance", null],
    ["vendors",     "Vendors",     null],
  ]},
  { section: "Money", items: [
    ["collection", "Collection", null],
    ["ledger",     "Ledger",     "F6"],
    ["lp",         "LP Reporting", null],
  ]},
  { section: "Admin", items: [
    ["documents", "Documents", null],
    ["precon",    "Pre-Con",   null],
    ["settings",  "Settings",  null],
  ]},
];

// Primary nav (with F-keys) shown in the header
const PRIMARY = [
  ["today",     "Today",     "F1"],
  ["pipeline",  "Pipeline",  "F2"],
  ["inbox",     "Inbox",     "F3"],
  ["rents",     "Rents",     "F4"],
  ["residents", "Residents", "F5"],
  ["ledger",    "Ledger",    "F6"],
];

const NAV_BADGES = { inbox: 4, pipeline: 2, today: 3, maintenance: 1 };

// ═══════════════════════════════════════════════════════════════
//  LIVE TAPE — scrolling transactions bar (Bloomberg-style)
// ═══════════════════════════════════════════════════════════════
const TAPE_ITEMS = [
  { t: "LEASE",   v: "1204 · 1BR",      p: "+$2,800/mo",  tone: "good" },
  { t: "APP",     v: "Rivera, A",        p: "score 92",    tone: "good" },
  { t: "PRICE",   v: "3BR ▼",            p: "$3,400→3,200", tone: "warn" },
  { t: "TOUR",    v: "Sat 2p",           p: "3BR",          tone: "neutral" },
  { t: "COMP",    v: "The Vance",        p: "conc 2mo",     tone: "bad" },
  { t: "LEASE",   v: "0812 · 2BR",      p: "+$3,100/mo",  tone: "good" },
  { t: "MAINT",   v: "U-404",            p: "HVAC · urgent", tone: "bad" },
  { t: "PAY",     v: "3 units",          p: "failed",       tone: "bad" },
  { t: "LEAD",    v: "Zillow",           p: "pre-checked",  tone: "good" },
  { t: "APP",     v: "Webb, M",          p: "score 81",     tone: "good" },
  { t: "VELOC",   v: "week",             p: "9.2/wk ▲",     tone: "good" },
  { t: "OCC",     v: "The Meridian",     p: "46.5% ▲0.3",   tone: "good" },
  { t: "LIST",    v: "Zumper",           p: "updated",      tone: "neutral" },
  { t: "SIGN",    v: "0915 · 3BR",      p: "+$3,250/mo",  tone: "good" },
];
const LiveTape = ({ t }) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      setOffset(o => o - dt * 0.03); // ~30px/s
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const items = [...TAPE_ITEMS, ...TAPE_ITEMS]; // doubled for seamless loop
  return (
    <div ref={ref} style={{ flex: 1, minWidth: 0, overflow: "hidden", position: "relative", height: 24, display: "flex", alignItems: "center", marginLeft: 12, marginRight: 12 }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 18, background: `linear-gradient(90deg, ${t.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 18, background: `linear-gradient(270deg, ${t.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
      <div style={{ display: "flex", whiteSpace: "nowrap", transform: `translateX(${offset % (items.length * 180 / 2)}px)`, willChange: "transform" }}>
        {items.map((it, i) => {
          const c = it.tone === "good" ? t.good : it.tone === "bad" ? t.bad : it.tone === "warn" ? t.warn : t.inkSoft;
          return (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 14px", fontFamily: t.mono, fontSize: 10.5, letterSpacing: 0.2, borderRight: `1px solid ${t.rule}` }}>
              <span style={{ color: t.inkMute, fontWeight: 600 }}>{it.t}</span>
              <span style={{ color: t.ink }}>{it.v}</span>
              <span style={{ color: c }}>{it.p}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  NAV PEEK — hover panel w/ live counts + recent items
// ═══════════════════════════════════════════════════════════════
const PEEK_DATA = {
  today: {
    title: "TODAY",
    counts: [["DECISIONS", 3, "warn"], ["QUEUE", 3, "neutral"], ["CLEARED", 7, "good"]],
    items: PRIORITIES.map(p => ({ l: p.eyebrow, r: p.headline, tone: p.tone })),
  },
  pipeline: {
    title: "PIPELINE",
    counts: [["ACTIVE", 83, "neutral"], ["SLA BREACH", 2, "bad"], ["HOT", 11, "good"]],
    items: [
      { l: "SLA 5h 12m", r: "Alex Rivera · 2BR", tone: "bad" },
      { l: "SLA 3h 40m", r: "Marcus Webb · 3BR", tone: "bad" },
      { l: "Hot · 92",   r: "Priya S. · owner",  tone: "good" },
      { l: "Toured",     r: "9 prospects · today", tone: "neutral" },
    ],
  },
  inbox: {
    title: "INBOX",
    counts: [["UNREAD", 4, "bad"], ["RESIDENTS", 2, "neutral"], ["PROSPECTS", 1, "neutral"], ["VENDORS", 1, "neutral"]],
    items: [
      { l: "Resident",  r: "U-312 · AC issue · 2h",    tone: "bad" },
      { l: "Prospect",  r: "Zillow · 2BR-1204 · 12m",  tone: "good" },
      { l: "Vendor",    r: "Paragon · invoice #4412",  tone: "neutral" },
      { l: "Resident",  r: "U-805 · noise · 5h",       tone: "warn" },
    ],
  },
  rents: {
    title: "RENT OPTIMIZER",
    counts: [["SUGGESTED", 1, "warn"], ["UNIT TYPES", 4, "neutral"], ["vs COMPS", "+$50", "good"]],
    items: [
      { l: "3BR ▼",   r: "$3,400 → $3,200 suggested", tone: "warn" },
      { l: "2BR",     r: "$2,800 · at market",        tone: "good" },
      { l: "1BR",     r: "$1,950 · +$30 vs comps",    tone: "good" },
      { l: "Studio",  r: "$1,550 · at market",        tone: "good" },
    ],
  },
  residents: {
    title: "RESIDENTS",
    counts: [["TOTAL", 121, "neutral"], ["PAYMENT FAILED", 3, "bad"], ["RENEWALS", 14, "warn"]],
    items: [
      { l: "Failed", r: "U-312 · retry tonight",  tone: "bad" },
      { l: "Failed", r: "U-805 · retry tonight",  tone: "bad" },
      { l: "Failed", r: "U-211 · retry tonight",  tone: "bad" },
      { l: "Renew",  r: "14 leases · Jun window", tone: "warn" },
    ],
  },
  ledger: {
    title: "LEDGER",
    counts: [["STATUS", "SYNC", "good"], ["OPS", "$4.2M", "neutral"], ["ESCROW", "$892K", "neutral"]],
    items: [
      { l: "Reconciled", r: "Operating + Escrow · 2m ago", tone: "good" },
      { l: "Deposit",    r: "+$14,200 · Yardi",            tone: "good" },
      { l: "Fee",        r: "−$620 · Stripe",              tone: "neutral" },
      { l: "Transfer",   r: "$50K · Ops→Reserve",          tone: "neutral" },
    ],
  },
};

const NavPeek = ({ t, tab }) => {
  const peek = PEEK_DATA[tab];
  if (!peek) return null;
  return (
    <div style={{ position: "absolute", top: "calc(100% + 0px)", left: 0, width: 340, background: t.surface, border: `1px solid ${t.rule}`, borderTop: `1px solid ${t.accent}`, zIndex: 200, fontFamily: t.sans, boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.4, color: t.accent }}>{peek.title}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.4 }}>↵ to open</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${peek.counts.length}, 1fr)`, borderBottom: `1px solid ${t.rule}` }}>
        {peek.counts.map(([lbl, val, tone], i) => {
          const c = tone === "good" ? t.good : tone === "bad" ? t.bad : tone === "warn" ? t.warn : t.ink;
          return (
            <div key={i} style={{ padding: "10px 14px", borderLeft: i > 0 ? `1px solid ${t.rule}` : "none" }}>
              <div style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, letterSpacing: 1.2, color: t.inkMute }}>{lbl}</div>
              <div style={{ fontFamily: t.mono, fontSize: 15, fontWeight: 600, color: c, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{val}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "6px 0" }}>
        {peek.items.map((it, i) => {
          const c = it.tone === "good" ? t.good : it.tone === "bad" ? t.bad : it.tone === "warn" ? t.warn : t.inkMute;
          return (
            <div key={i} style={{ padding: "7px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = t.hover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: c, flexShrink: 0 }} />
              <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.3, minWidth: 64, textTransform: "uppercase" }}>{it.l}</span>
              <span style={{ color: t.inkSoft, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.r}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PROPERTY PEEK — hover the property switcher
// ═══════════════════════════════════════════════════════════════
const PropertyPeek = ({ t, propIdx, setPropIdx, onClose }) => {
  return (
    <div style={{ position: "absolute", top: "calc(100% + 0px)", left: 0, width: 380, background: t.surface, border: `1px solid ${t.rule}`, borderTop: `1px solid ${t.accent}`, zIndex: 200, fontFamily: t.sans, boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.rule}`, display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.4, color: t.accent }}>PROPERTIES · {PROPERTIES.length}</span>
      </div>
      {PROPERTIES.map((p, i) => {
        const pct = (p.leased / p.units) * 100;
        const active = i === propIdx;
        const toneColor = p.pace === "ahead" ? t.good : p.pace === "behind" ? t.bad : t.inkSoft;
        return (
          <button key={p.id} onClick={() => { setPropIdx(i); onClose(); }}
            style={{ display: "block", width: "100%", padding: "12px 14px", borderBottom: i < PROPERTIES.length - 1 ? `1px solid ${t.rule}` : "none", background: active ? t.hover : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.surfaceAlt; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {active && <span style={{ width: 2, height: 14, background: t.accent, marginLeft: -14, marginRight: 4 }} />}
              <span style={{ fontFamily: t.sans, fontSize: 13, fontWeight: 600, color: t.ink }}>{p.name}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: t.mono, fontSize: 9.5, color: toneColor, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                {p.pace === "ahead" ? `▲ +${p.ahead}` : p.pace === "behind" ? `▼ ${p.ahead}` : "—"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, letterSpacing: 0.2, marginBottom: 8 }}>
              <span>{p.city}</span>
              <span>·</span>
              <span>{p.leased}/{p.units}</span>
              <span style={{ color: t.ink, fontWeight: 600 }}>{pct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 3, background: t.surfaceAlt, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: toneColor }} />
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  TOP BAR — 2-row Bloomberg-style header
// ═══════════════════════════════════════════════════════════════
const TopBar = ({ t, tab, setTab, onCmdK, layout, setLayout, propIdx, setPropIdx, onToggleSidebar }) => {
  const [propMenu, setPropMenu] = useState(false);
  const [hoverTab, setHoverTab] = useState(null);
  const [userMenu, setUserMenu] = useState(false);

  const p = PROPERTIES[propIdx];

  // Live clock — hh:mm:ss
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  // F-key routing
  useEffect(() => {
    const h = (e) => {
      if (e.target.closest("input, textarea")) return;
      const m = e.key.match(/^F(\d)$/);
      if (m) {
        const n = parseInt(m[1]);
        const entry = PRIMARY[n - 1];
        if (entry) { e.preventDefault(); setTab(entry[0]); }
      }
      // cmd-\ opens sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); onToggleSidebar?.(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setTab, onToggleSidebar]);

  return (
    <div style={{ borderBottom: `1px solid ${t.rule}`, background: t.bg, position: "sticky", top: 0, zIndex: 50 }}>
      {/* ROW 1 — brand · property · tape · clock · user */}
      <div style={{ height: 40, display: "flex", alignItems: "stretch", padding: "0 0 0 0", borderBottom: `1px solid ${t.rule}` }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", borderRight: `1px solid ${t.rule}` }}>
          <div style={{ width: 20, height: 20, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: "#0A0A0B", letterSpacing: 0 }}>L</span>
          </div>
          <span style={{ fontFamily: t.sans, fontSize: 13, fontWeight: 600, color: t.ink, letterSpacing: -0.1 }}>LeaseRight</span>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.inkMute, letterSpacing: 0.6, padding: "1px 5px", border: `1px solid ${t.rule}` }}>PRO</span>
        </div>

        {/* Property switcher — hover to peek, click to lock */}
        <div style={{ position: "relative", borderRight: `1px solid ${t.rule}` }}
          onMouseEnter={() => setPropMenu(true)}
          onMouseLeave={() => setPropMenu(false)}>
          <button style={{ height: "100%", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", background: propMenu ? t.surfaceAlt : "transparent", border: "none", cursor: "pointer", fontFamily: t.sans }}>
            <span style={{ width: 7, height: 7, background: p.pace === "ahead" ? t.good : p.pace === "behind" ? t.bad : t.inkMute }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: t.ink }}>{p.name}</span>
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.3 }}>{p.leased}/{p.units} · {((p.leased/p.units)*100).toFixed(1)}%</span>
            <svg width={8} height={8} viewBox="0 0 10 10" style={{ marginLeft: 2 }}><path d="M2 4l3 3 3-3" stroke={t.inkMute} strokeWidth={1.2} fill="none" strokeLinecap="round" /></svg>
          </button>
          {propMenu && <PropertyPeek t={t} propIdx={propIdx} setPropIdx={setPropIdx} onClose={() => setPropMenu(false)} />}
        </div>

        {/* Live tape — scrolling ticker */}
        <LiveTape t={t} />

        {/* Clock */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", borderLeft: `1px solid ${t.rule}` }}>
          <span style={{ width: 6, height: 6, background: t.good, animation: "pulseDot 2s ease-out infinite", flexShrink: 0 }} />
          <span style={{ fontFamily: t.mono, fontSize: 11, color: t.ink, fontVariantNumeric: "tabular-nums", letterSpacing: 0.4 }}>{hh}:{mm}<span style={{ color: t.inkMute }}>:{ss}</span></span>
          <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.8, fontWeight: 600 }}>LIVE</span>
        </div>

        {/* Search / cmd-k */}
        <button onClick={onCmdK}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px 0 14px", background: "transparent", border: "none", borderLeft: `1px solid ${t.rule}`, cursor: "pointer", fontFamily: t.sans, fontSize: 11.5, color: t.inkSoft, minWidth: 180 }}>
          <svg width={11} height={11} viewBox="0 0 11 11"><circle cx={4.5} cy={4.5} r={3.5} stroke={t.inkMute} strokeWidth={1.2} fill="none" /><path d="M7 7l2.5 2.5" stroke={t.inkMute} strokeWidth={1.2} strokeLinecap="round" /></svg>
          <span style={{ flex: 1, textAlign: "left" }}>Search or command…</span>
          <Kbd t={t}>⌘K</Kbd>
        </button>

        {/* User */}
        <div style={{ position: "relative", borderLeft: `1px solid ${t.rule}` }}
          onMouseEnter={() => setUserMenu(true)}
          onMouseLeave={() => setUserMenu(false)}>
          <button style={{ height: "100%", display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: userMenu ? t.surfaceAlt : "transparent", border: "none", cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, background: t.accent, color: "#0A0A0B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.mono, fontSize: 10, fontWeight: 700, letterSpacing: 0 }}>JM</div>
            <span style={{ fontFamily: t.sans, fontSize: 12, color: t.ink, fontWeight: 500 }}>J. Mori</span>
          </button>
          {userMenu && (
            <div style={{ position: "absolute", top: "100%", right: 0, width: 220, background: t.surface, border: `1px solid ${t.rule}`, borderTop: `1px solid ${t.accent}`, zIndex: 200, fontFamily: t.sans, boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.rule}` }}>
                <div style={{ fontFamily: t.sans, fontSize: 12, fontWeight: 600, color: t.ink }}>Jordan Mori</div>
                <div style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.3, marginTop: 2 }}>owner · $1/unit · forever</div>
              </div>
              {[["Profile"], ["Org settings"], ["Notifications", "•"], ["Log out"]].map((r, i) => (
                <button key={i} style={{ display: "flex", width: "100%", padding: "8px 14px", background: "transparent", border: "none", fontFamily: t.sans, fontSize: 12, color: t.inkSoft, textAlign: "left", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ flex: 1 }}>{r[0]}</span>
                  {r[1] && <span style={{ color: t.bad, fontFamily: t.mono, fontSize: 10 }}>{r[1]}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROW 2 — function-key nav */}
      <div style={{ height: 32, display: "flex", alignItems: "stretch", padding: "0" }}>
        {/* Sidebar toggle */}
        <button onClick={onToggleSidebar}
          style={{ padding: "0 12px", background: "transparent", border: "none", borderRight: `1px solid ${t.rule}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.background = t.surfaceAlt}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <svg width={11} height={11} viewBox="0 0 11 11"><path d="M1.5 2h8M1.5 5.5h8M1.5 9h8" stroke={t.inkSoft} strokeWidth={1.1} strokeLinecap="round" /></svg>
          <Kbd t={t}>⌘\</Kbd>
        </button>
        {PRIMARY.map(([id, label, fkey]) => {
          const active = tab === id;
          const hovered = hoverTab === id;
          const badge = NAV_BADGES[id];
          return (
            <div key={id} style={{ position: "relative" }}
              onMouseEnter={() => setHoverTab(id)}
              onMouseLeave={() => setHoverTab(null)}>
              <button onClick={() => setTab(id)}
                style={{ height: "100%", padding: "0 14px", background: active ? t.surfaceAlt : hovered ? t.hover : "transparent", border: "none", borderRight: `1px solid ${t.rule}`, cursor: "pointer", fontFamily: t.sans, fontSize: 12, fontWeight: active ? 600 : 500, color: active ? t.ink : t.inkSoft, display: "flex", alignItems: "center", gap: 8, position: "relative", letterSpacing: 0.1, transition: "background 80ms" }}>
                <span style={{ fontFamily: t.mono, fontSize: 9.5, color: active ? t.accent : t.inkMute, fontWeight: 600, letterSpacing: 0.3 }}>{fkey}</span>
                <span>{label}</span>
                {badge && <span style={{ background: t.bad, color: "#0A0A0B", fontFamily: t.mono, fontSize: 9, fontWeight: 700, padding: "1px 5px", letterSpacing: 0.2 }}>{badge}</span>}
                {active && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: t.accent }} />}
              </button>
              {hovered && !active && PEEK_DATA[id] && <NavPeek t={t} tab={id} />}
            </div>
          );
        })}

        {/* Overflow spacer */}
        <div style={{ flex: 1 }} />

        {/* Today-only layout switch */}
        {tab === "today" && (
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px", borderLeft: `1px solid ${t.rule}`, gap: 6 }}>
            <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 1, fontWeight: 600 }}>VIEW</span>
            {[["grid", "GRID"], ["queue", "QUEUE"], ["table", "TABLE"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setLayout(id)}
                style={{ padding: "3px 8px", fontFamily: t.mono, fontSize: 10, fontWeight: 600, border: `1px solid ${layout === id ? t.accent : "transparent"}`, background: layout === id ? t.accentSoft : "transparent", color: layout === id ? t.accent : t.inkSoft, cursor: "pointer", letterSpacing: 0.6 }}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Notifications */}
        <button style={{ padding: "0 12px", background: "transparent", border: "none", borderLeft: `1px solid ${t.rule}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.background = t.surfaceAlt}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <svg width={12} height={12} viewBox="0 0 14 14"><path d="M7 1.5a3.5 3.5 0 00-3.5 3.5v2.5L2.5 9v.5h9V9l-1-1.5V5A3.5 3.5 0 007 1.5zM5.5 10.5a1.5 1.5 0 003 0" stroke={t.inkSoft} strokeWidth={1.1} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, background: t.bad }} />
          </span>
          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink, fontWeight: 600 }}>4</span>
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  COLLAPSIBLE LEFT SIDEBAR (⌘\)
// ═══════════════════════════════════════════════════════════════
const Sidebar = ({ t, open, onClose, tab, setTab }) => {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 99, animation: "slideIn 140ms ease-out" }} />}
      <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, width: 260, background: t.surface, borderRight: `1px solid ${t.rule}`, zIndex: 100, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 220ms cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column", fontFamily: t.sans }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 20, height: 20, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: "#0A0A0B" }}>L</span>
          </div>
          <span style={{ fontFamily: t.sans, fontSize: 13, fontWeight: 600, color: t.ink }}>All modules</span>
          <div style={{ flex: 1 }} />
          <Kbd t={t}>esc</Kbd>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {NAV.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 12 }}>
              {group.section && <div style={{ padding: "4px 16px 4px", fontFamily: t.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: t.inkMute }}>{group.section}</div>}
              {group.items.map(([id, label, key]) => {
                const active = tab === id;
                const badge = NAV_BADGES[id];
                return (
                  <button key={id} onClick={() => { setTab(id); onClose(); }}
                    style={{ width: "100%", padding: "7px 16px", background: active ? t.accentSoft : "transparent", border: "none", borderLeft: `2px solid ${active ? t.accent : "transparent"}`, cursor: "pointer", textAlign: "left", fontFamily: t.sans, fontSize: 12.5, color: active ? t.ink : t.inkSoft, fontWeight: active ? 600 : 400, display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.hover; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge && <span style={{ background: t.bad, color: "#0A0A0B", fontFamily: t.mono, fontSize: 9, fontWeight: 700, padding: "1px 5px", letterSpacing: 0.2 }}>{badge}</span>}
                    {key && <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.3, fontWeight: 600 }}>{key}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, background: t.accent, color: "#0A0A0B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.mono, fontSize: 10, fontWeight: 700 }}>JM</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.ink, fontWeight: 500 }}>J. Mori</div>
            <div style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.2 }}>$1/unit · forever</div>
          </div>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CMD-K
// ═══════════════════════════════════════════════════════════════
const CmdK = ({ t, open, onClose, setTab }) => {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 20); } }, [open]);

  const entries = useMemo(() => [
    ...NAV.flatMap(g => g.items.map(([id, label]) => ({ kind: "Go", label, id, action: () => setTab(id) }))),
    { kind: "Do", label: "Adjust 3BR asking to $3,200",           id: "rents",        action: () => setTab("rents") },
    { kind: "Do", label: "Extend 1-month-free through Jul 31",    id: "concessions",  action: () => setTab("concessions") },
    { kind: "Do", label: "Call Alex Rivera (SLA past)",           id: "pipeline",     action: () => setTab("pipeline") },
    { kind: "Do", label: "Open comp set · The Vance",             id: "market",       action: () => setTab("market") },
    { kind: "Do", label: "Approve Kira Weston · 2BR-0914",        id: "applications", action: () => setTab("applications") },
    { kind: "Do", label: "Retry failed payments · 3 units",       id: "collection",   action: () => setTab("collection") },
    { kind: "Do", label: "Dispatch maintenance · U-312 AC",       id: "maintenance",  action: () => setTab("maintenance") },
    { kind: "Do", label: "Send renewal offer · U-312",            id: "residents",    action: () => setTab("residents") },
    { kind: "Do", label: "Reconnect Facebook Marketplace",        id: "listings",     action: () => setTab("listings") },
    { kind: "Do", label: "Generate April LP letter",              id: "lp",           action: () => setTab("lp") },
    { kind: "Do", label: "Request new COI · Citywide Plumbing",   id: "vendors",      action: () => setTab("vendors") },
    { kind: "Do", label: "Export lender package · Pre-Con",       id: "precon",       action: () => setTab("precon") },
    { kind: "Prop", label: "Switch to Luminary Midtown", id: "today", action: () => setTab("today") },
    { kind: "Prop", label: "Switch to Brix on Sixth",    id: "today", action: () => setTab("today") },
  ], [setTab]);

  const filtered = useMemo(() => q ? entries.filter(e => e.label.toLowerCase().includes(q.toLowerCase())) : entries, [q, entries]);

  useEffect(() => { setSel(0); }, [q]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(filtered.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    if (e.key === "Enter") { e.preventDefault(); filtered[sel]?.action?.(); onClose(); }
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, background: t.surface, border: `1px solid ${t.rule}`, borderTop: `1px solid ${t.accent}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", overflow: "hidden", fontFamily: t.sans }}>
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search properties, actions, navigation…"
          style={{ width: "100%", padding: "14px 20px", fontFamily: t.sans, fontSize: 15, background: "transparent", border: "none", outline: "none", color: t.ink, borderBottom: `1px solid ${t.rule}` }} />
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "4px 0" }}>
          {filtered.slice(0, 12).map((e, i) => (
            <button key={i} onClick={() => { e.action(); onClose(); }}
              style={{ width: "100%", padding: "7px 20px", background: i === sel ? t.hover : "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12, fontFamily: t.sans }}>
              <span style={{ fontFamily: t.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: t.accent, minWidth: 34 }}>{e.kind}</span>
              <span style={{ fontSize: 13, color: t.ink, flex: 1 }}>{e.label}</span>
              {i === sel && <Kbd t={t}>↵</Kbd>}
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: "20px", fontSize: 13, color: t.inkMute, textAlign: "center" }}>No matches.</div>}
        </div>
        <div style={{ padding: "8px 20px", borderTop: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 14, fontSize: 10.5, color: t.inkMute, fontFamily: t.sans }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Kbd t={t}>↑↓</Kbd> navigate</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Kbd t={t}>↵</Kbd> select</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Kbd t={t}>esc</Kbd> close</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { NAV, TopBar, Sidebar, CmdK });
