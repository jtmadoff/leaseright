/* global React, THEMES, PROSPECTS, STAGES, Dot, Tag, Btn, Kbd, Eyebrow, fmtNum */
const { useState, useRef, useMemo } = React;

// ═══════════════════════════════════════════════════════════════
//  PIPELINE · KANBAN RAIL — drag between stages
//  Terse, dense. Each column = stage. Each card = prospect.
//  Dragging a card over another column advances/reverts stage.
// ═══════════════════════════════════════════════════════════════

const PROSPECT_AVATAR_COLORS = {
  // Deterministic monogram backgrounds — cycle a small palette
  "A": "#F5A524", "B": "#22D3EE", "C": "#22C55E", "D": "#E879F9",
  "E": "#F5A524", "F": "#22D3EE", "G": "#22C55E", "H": "#E879F9",
  "I": "#F5A524", "J": "#22D3EE", "K": "#22C55E", "L": "#E879F9",
  "M": "#F5A524", "N": "#22D3EE", "O": "#22C55E", "P": "#E879F9",
  "Q": "#F5A524", "R": "#22D3EE", "S": "#22C55E", "T": "#E879F9",
  "U": "#F5A524", "V": "#22D3EE", "W": "#22C55E", "X": "#E879F9",
  "Y": "#F5A524", "Z": "#22D3EE",
};

const initials = (name) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const stageToneColor = (t, tone) => tone === "good" ? t.good : tone === "bad" ? t.bad : tone === "warn" ? t.warn : tone === "cyan" ? t.cyan : t.inkSoft;

// ── Prospect card ───────────────────────────────────────────────
const ProspectCard = ({ t, p, onDragStart, onDragEnd, onClick, isDragging }) => {
  const [hover, setHover] = useState(false);
  const scoreC = p.score >= 85 ? t.good : p.score >= 70 ? t.ink : t.inkMute;
  const ageC = p.sla ? t.bad : t.inkMute;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(p); }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hover ? t.inkFaint : t.rule}`,
        borderLeft: p.sla ? `2px solid ${t.bad}` : `1px solid ${t.rule}`,
        borderRadius: 3,
        padding: "10px 11px",
        marginBottom: 6,
        cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
        transition: "border-color 120ms, transform 120ms, box-shadow 120ms",
        transform: hover ? "translateY(-1px)" : "none",
        boxShadow: hover ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
        fontFamily: t.sans,
      }}
    >
      {/* Line 1 — unit chip · name · score */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{
          fontFamily: t.mono,
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: 0.3,
          color: t.inkSoft,
          background: t.bg,
          border: `1px solid ${t.rule}`,
          padding: "2px 6px",
          borderRadius: 2,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}>{p.unit}</span>
        <span style={{ fontSize: 12, color: t.ink, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
        <span style={{ fontFamily: t.mono, fontSize: 11, color: scoreC, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{p.score}</span>
      </div>

      {/* Line 2 — source · budget · move · age */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.2, marginBottom: p.note ? 6 : 0, whiteSpace: "nowrap" }}>
        <span>{p.source}</span>
        <span>·</span>
        <span>${fmtNum(p.budget)}</span>
        <span>·</span>
        <span>→ {p.move}</span>
        <span style={{ flex: 1 }} />
        {p.sla && <span style={{ width: 4, height: 4, borderRadius: "50%", background: t.bad }} />}
        <span style={{ color: ageC }}>{p.age}</span>
      </div>

      {/* Note */}
      {p.note && (
        <div style={{ fontSize: 10.5, color: t.inkSoft, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderTop: `1px solid ${t.ruleSoft}`, paddingTop: 6 }}>
          {p.note}
        </div>
      )}
    </div>
  );
};

// ── Column header ───────────────────────────────────────────────
// Stage progression shown via a numbered prefix, not color.
// Color reserved for state (SLA / urgent). Header is quiet.
const ColumnHeader = ({ t, stage, count, index, isDropTarget }) => {
  return (
    <div style={{
      padding: "10px 12px 8px",
      borderBottom: `1px solid ${isDropTarget ? t.accent : t.rule}`,
      display: "flex",
      alignItems: "center",
      gap: 8,
      transition: "border-color 120ms",
    }}>
      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.inkFaint, fontVariantNumeric: "tabular-nums", letterSpacing: 0.4 }}>0{index + 1}</span>
      <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase", color: t.ink }}>{stage.label}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{count}</span>
    </div>
  );
};

// ── Main kanban view ────────────────────────────────────────────
const PipelineView = ({ t }) => {
  const [cards, setCards] = useState(PROSPECTS);
  const [dragging, setDragging] = useState(null); // prospect currently being dragged
  const [dragOver, setDragOver] = useState(null); // stage id being hovered
  const [detailId, setDetailId] = useState(null);
  const [filter, setFilter] = useState({ source: null, bedroom: null, sla: false });

  const detailP = cards.find(c => c.id === detailId);

  const filtered = useMemo(() => {
    return cards.filter(p => {
      if (filter.source && p.source !== filter.source) return false;
      if (filter.bedroom && !p.unit.startsWith(filter.bedroom)) return false;
      if (filter.sla && !p.sla) return false;
      return true;
    });
  }, [cards, filter]);

  const onDragStart = (p) => { setDragging(p); };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };
  const onColEnter = (e, stageId) => { e.preventDefault(); setDragOver(stageId); };
  const onColLeave = (e, stageId) => {
    // only clear if leaving to outside the column
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(v => v === stageId ? null : v);
  };
  const onDrop = (e, stageId) => {
    e.preventDefault();
    if (!dragging || dragging.stage === stageId) { onDragEnd(); return; }
    setCards(prev => prev.map(c => c.id === dragging.id ? { ...c, stage: stageId } : c));
    onDragEnd();
  };

  // KPI strip for Pipeline
  const totalActive = cards.filter(c => c.stage !== "signed").length;
  const slaBreaches = cards.filter(c => c.sla).length;
  const hotLeads = cards.filter(c => c.score >= 85 && c.stage !== "signed").length;
  const signedThisWeek = cards.filter(c => c.stage === "signed").length;

  const sources = [...new Set(cards.map(c => c.source))];

  return (
    <div>
      {/* HERO STRIP — dark slab like Today */}
      <div style={{ background: t.bg, borderBottom: `1px solid ${t.rule}`, padding: "18px 24px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12 }}>
          <span style={{ fontFamily: t.mono, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: t.accent }}>F2 · PIPELINE</span>
          <span style={{ width: 1, height: 10, background: t.rule }} />
          <span style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute }}>The Meridian</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.4 }}>drag to advance</span>
        </div>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: `1px solid ${t.rule}` }}>
          {[
            { l: "Active", v: totalActive, s: "in funnel", tone: t.ink },
            { l: "SLA breaches", v: slaBreaches, s: "past 4h", tone: slaBreaches > 0 ? t.bad : t.ink, pulse: slaBreaches > 0 },
            { l: "Hot", v: hotLeads, s: "score ≥ 85", tone: t.good },
            { l: "Signed · wk", v: signedThisWeek, s: "+3 vs last", tone: t.good },
          ].map((x, i) => (
            <div key={i} style={{ padding: "12px 16px", borderLeft: i > 0 ? `1px solid ${t.rule}` : "none" }}>
              <div style={{ fontFamily: t.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: t.inkMute, display: "flex", alignItems: "center", gap: 6 }}>
                {x.l}
                {x.pulse && <span style={{ width: 5, height: 5, background: t.bad, borderRadius: "50%", animation: "pulseDot 1.6s infinite" }} />}
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 600, color: x.tone, fontVariantNumeric: "tabular-nums", letterSpacing: -0.3, marginTop: 4 }}>{x.v}</div>
              <div style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute, marginTop: 2 }}>{x.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ padding: "8px 20px", borderBottom: `1px solid ${t.rule}`, background: t.surface, display: "flex", alignItems: "center", gap: 10, overflowX: "auto", fontFamily: t.sans }}>
        <span style={{ fontFamily: t.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 1, color: t.inkMute }}>FILTER</span>
        <FilterChip t={t} active={filter.sla} onClick={() => setFilter(f => ({ ...f, sla: !f.sla }))} tone={t.bad}>SLA only</FilterChip>
        <div style={{ width: 1, height: 14, background: t.rule, margin: "0 4px" }} />
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, marginRight: 2 }}>BED</span>
        {[["Studio", "Studio"], ["1BR", "1"], ["2BR", "2"], ["3BR", "3"]].map(([lbl, prefix]) => (
          <FilterChip key={lbl} t={t} active={filter.bedroom === prefix} onClick={() => setFilter(f => ({ ...f, bedroom: f.bedroom === prefix ? null : prefix }))}>{lbl}</FilterChip>
        ))}
        <div style={{ width: 1, height: 14, background: t.rule, margin: "0 4px" }} />
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, marginRight: 2 }}>SRC</span>
        {sources.map(s => (
          <FilterChip key={s} t={t} active={filter.source === s} onClick={() => setFilter(f => ({ ...f, source: f.source === s ? null : s }))}>{s}</FilterChip>
        ))}
        <div style={{ flex: 1 }} />
        {(filter.sla || filter.bedroom || filter.source) && (
          <button onClick={() => setFilter({ source: null, bedroom: null, sla: false })} style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, background: "transparent", border: "none", cursor: "pointer", letterSpacing: 0.4 }}>
            CLEAR ×
          </button>
        )}
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkSoft, letterSpacing: 0.3 }}>{filtered.length} of {cards.length}</span>
      </div>

      {/* KANBAN BOARD */}
      <div style={{ padding: "16px 20px", display: "flex", gap: 12, overflowX: "auto", minHeight: 600, background: t.surfaceAlt }}>
        {STAGES.map((stage, stageIdx) => {
          const colCards = filtered.filter(c => c.stage === stage.id);
          const isTarget = dragOver === stage.id;
          const tone = stageToneColor(t, stage.color);
          return (
            <div key={stage.id}
              onDragOver={(e) => onColEnter(e, stage.id)}
              onDragLeave={(e) => onColLeave(e, stage.id)}
              onDrop={(e) => onDrop(e, stage.id)}
              style={{
                minWidth: 240,
                width: 240,
                flexShrink: 0,
                background: isTarget ? t.hover : t.bg,
                border: `1px solid ${isTarget ? tone : t.rule}`,
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                transition: "background 120ms, border-color 120ms",
              }}>
              <ColumnHeader t={t} stage={stage} count={colCards.length} index={stageIdx} isDropTarget={isTarget} />
              <div style={{ flex: 1, padding: "8px 8px 12px", overflowY: "auto" }}>
                {colCards.map(p => (
                  <ProspectCard key={p.id} t={t} p={p} isDragging={dragging?.id === p.id} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={() => setDetailId(p.id)} />
                ))}
                {colCards.length === 0 && (
                  <div style={{ padding: "20px 8px", fontFamily: t.mono, fontSize: 10, color: t.inkFaint, textAlign: "center", letterSpacing: 0.4, border: `1px dashed ${t.rule}`, borderRadius: 3 }}>
                    {isTarget ? "DROP HERE" : "EMPTY"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL DRAWER */}
      {detailP && <DetailDrawer t={t} p={detailP} onClose={() => setDetailId(null)} />}
    </div>
  );
};

// ── Filter chip ─────────────────────────────────────────────────
const FilterChip = ({ t, active, onClick, tone, children }) => (
  <button onClick={onClick} style={{
    padding: "3px 9px",
    fontFamily: t.mono,
    fontSize: 10.5,
    fontWeight: 500,
    letterSpacing: 0.3,
    border: `1px solid ${active ? (tone || t.accent) : t.rule}`,
    background: active ? (tone ? `${tone}22` : t.accentSoft) : "transparent",
    color: active ? (tone || t.accent) : t.inkSoft,
    cursor: "pointer",
    borderRadius: 2,
    whiteSpace: "nowrap",
  }}>
    {children}
  </button>
);

// ── Shared Detail Drawer — slides from right ────────────────────
const DetailDrawer = ({ t, p, onClose }) => {
  const mono = initials(p.name);
  const monoC = PROSPECT_AVATAR_COLORS[mono[0]] || t.inkSoft;
  const stage = STAGES.find(s => s.id === p.stage);
  const stageC = stageToneColor(t, stage?.color);

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 80,
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: t.surface,
        borderLeft: `1px solid ${t.rule}`,
        zIndex: 90,
        display: "flex", flexDirection: "column", fontFamily: t.sans,
        overflowY: "auto",
        boxShadow: "-12px 0 32px rgba(0,0,0,0.4)",
      }}>
        {/* Header band */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.rule}`, background: t.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: t.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, color: t.accent }}>PROSPECT</span>
            <span style={{ flex: 1 }} />
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.inkMute, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: monoC, color: "#0A0A0B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.mono, fontSize: 13, fontWeight: 700 }}>
              {mono}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.ink }}>{p.name}</div>
              <div style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, letterSpacing: 0.2, marginTop: 2 }}>
                {p.unit} · {p.source} · ${fmtNum(p.budget)}/mo
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkMute, letterSpacing: 1 }}>SCORE</div>
              <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 600, color: p.score >= 85 ? t.good : p.score >= 70 ? t.ink : t.inkMute, fontVariantNumeric: "tabular-nums" }}>{p.score}</div>
            </div>
          </div>
        </div>

        {/* Stage band */}
        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 8, background: t.surfaceAlt }}>
          <span style={{ width: 6, height: 6, background: stageC }} />
          <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase", color: t.ink }}>STAGE · {stage?.label}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: t.mono, fontSize: 10, color: p.sla ? t.bad : t.inkMute, letterSpacing: 0.3 }}>
            {p.sla && <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: t.bad, marginRight: 5, verticalAlign: "middle" }} />}
            {p.age} {p.sla ? "· SLA" : ""}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", flex: 1 }}>
          {/* Facts */}
          <Eyebrow t={t} style={{ marginBottom: 8 }}>FACTS</Eyebrow>
          <div style={{ border: `1px solid ${t.rule}`, borderRadius: 3, marginBottom: 16 }}>
            {[
              ["Move-in", p.move],
              ["Budget", `$${fmtNum(p.budget)}/mo`],
              ["Source", p.source],
              ["Age in stage", p.age],
              ["Lead score", `${p.score} / 100`],
            ].map(([l, v], i, a) => (
              <div key={i} style={{ display: "flex", padding: "8px 12px", borderBottom: i < a.length - 1 ? `1px solid ${t.ruleSoft}` : "none" }}>
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.3, width: 82, flexShrink: 0 }}>{l.toUpperCase()}</span>
                <span style={{ fontSize: 12, color: t.ink, fontFamily: t.sans, flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Note */}
          <Eyebrow t={t} style={{ marginBottom: 8 }}>NOTE</Eyebrow>
          <div style={{ padding: "10px 12px", background: t.surfaceAlt, border: `1px solid ${t.rule}`, borderRadius: 3, fontSize: 12, color: t.inkSoft, lineHeight: 1.5, marginBottom: 16 }}>
            {p.note}
          </div>

          {/* Activity */}
          <Eyebrow t={t} style={{ marginBottom: 8 }}>ACTIVITY</Eyebrow>
          <div style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkSoft, letterSpacing: 0.2 }}>
            {[
              [p.age, "Stage entered", p.stage.toUpperCase()],
              ["2d ago", "Email sent", "Tour invite · template 3"],
              ["3d ago", "Lead created", p.source],
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", borderTop: i === 0 ? "none" : `1px solid ${t.ruleSoft}` }}>
                <span style={{ color: t.inkMute, width: 60 }}>{row[0]}</span>
                <span style={{ color: t.ink, width: 100 }}>{row[1]}</span>
                <span style={{ color: t.inkSoft, flex: 1 }}>{row[2]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${t.rule}`, background: t.surfaceAlt, display: "flex", gap: 8 }}>
          <Btn t={t} variant="accent" size="sm">{p.sla ? "Call now" : "Send message"}</Btn>
          <Btn t={t} variant="secondary" size="sm">Schedule tour</Btn>
          <div style={{ flex: 1 }} />
          <Btn t={t} variant="ghost" size="sm">···</Btn>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { PipelineView });
