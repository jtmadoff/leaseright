/* global React, THEMES, UNIT_MATRIX, PROSPECTS, STAGES, Dot, Tag, Btn, Eyebrow, Section, MicroBar, Kbd, fmtUSD, fmtNum, fmtPct */
const { useState } = React;

// ═══════════════════════════════════════════════════════════════
//  RENT OPTIMIZER
// ═══════════════════════════════════════════════════════════════
const RentOptimizer = ({ t }) => {
  const [rows, setRows] = useState(UNIT_MATRIX);
  const adjust = (i, d) => setRows(r => r.map((row, j) => j === i ? { ...row, asking: Math.max(500, row.asking + d), delta: (row.delta || 0) + d, touched: true } : row));
  const applySuggest = (i) => setRows(r => r.map((row, j) => j === i && row.suggested ? { ...row, asking: row.suggested, delta: row.suggested - UNIT_MATRIX[j].asking, touched: true } : row));
  const reset = () => setRows(UNIT_MATRIX.map(r => ({ ...r })));

  const baseline = UNIT_MATRIX.reduce((s, r) => s + r.asking * r.total, 0);
  const current = rows.reduce((s, r) => s + r.asking * r.total, 0);
  const delta = current - baseline;

  return (
    <div>
      {/* Header band — BLACK command surface to match Today's priority zone */}
      <div style={{ padding: "20px 24px", background: t.ink, color: t.surface, display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Full-occupancy rent roll</div>
          <div style={{ fontFamily: t.mono, fontSize: 26, fontWeight: 600, color: t.surface, fontVariantNumeric: "tabular-nums", letterSpacing: -0.4, marginTop: 6, whiteSpace: "nowrap" }}>{fmtUSD(current)}<span style={{ fontFamily: t.sans, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 400, marginLeft: 6 }}>/mo</span></div>
        </div>
        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.12)" }} />
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Your changes</div>
          <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 600, color: delta > 0 ? "#9be5b4" : delta < 0 ? "#ffcc73" : "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums", letterSpacing: -0.3, marginTop: 6, whiteSpace: "nowrap", transition: "color 180ms" }}>
            {delta === 0 ? "—" : (delta > 0 ? "+" : "") + fmtUSD(delta)}
            <span style={{ fontFamily: t.sans, fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: 8, fontWeight: 400 }}>/ mo</span>
          </div>
        </div>
        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.12)" }} />
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Annualized impact</div>
          <div style={{ fontFamily: t.mono, fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.85)", fontVariantNumeric: "tabular-nums", letterSpacing: -0.2, marginTop: 6, whiteSpace: "nowrap" }}>
            {delta === 0 ? "—" : (delta > 0 ? "+" : "") + fmtUSD(delta * 12, true)}
            <span style={{ fontFamily: t.sans, fontSize: 11, color: "rgba(255,255,255,0.45)", marginLeft: 8, fontWeight: 400 }}>/ yr</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 20 }} />
        <button onClick={reset} style={{ padding: "8px 14px", background: "transparent", color: "rgba(255,255,255,0.6)", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 4, cursor: "pointer", fontFamily: t.sans, fontSize: 12.5, fontWeight: 500 }}>Reset</button>
        <button style={{ padding: "8px 14px", background: t.surface, color: "#0d1a12", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: t.sans, fontSize: 12.5, fontWeight: 600 }}>Publish changes</button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 1020, borderCollapse: "collapse", fontFamily: t.sans, fontSize: 13 }}>
        <thead>
          <tr style={{ background: t.surfaceAlt }}>
            {["Type", "Leased", "Apps", "Asking", "Effective", "Comp", "Gap", "DOM", "Vel", "Suggestion"].map((h, i) => (
              <th key={i} style={{ padding: "8px 14px", textAlign: i >= 3 ? "right" : "left", fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: t.inkMute, borderBottom: `1px solid ${t.rule}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const gap = r.asking - r.comp;
            return (
              <tr key={r.id} style={{ borderBottom: `1px solid ${t.ruleSoft}` }}>
                <td style={{ padding: "14px", color: t.ink, fontWeight: 500 }}>{r.type}</td>
                <td style={{ padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <MicroBar t={t} value={r.leased} max={r.total} width={50} color={r.leased/r.total > 0.5 ? t.good : r.id === "3b" ? t.bad : t.inkSoft} />
                  <span style={{ fontFamily: t.mono, fontSize: 11.5, color: t.inkSoft }}>{r.leased}/{r.total}</span>
                </td>
                <td style={{ padding: "14px", textAlign: "right", fontFamily: t.mono, fontSize: 12, color: t.inkSoft }}>{r.apps || "—"}</td>
                <td style={{ padding: "14px", textAlign: "right" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${r.touched ? t.accent : t.rule}`, borderRadius: 4, overflow: "hidden", background: r.touched ? t.accentSoft : t.surface }}>
                    <button onClick={() => adjust(i, -25)} style={{ width: 24, height: 26, border: "none", background: "transparent", cursor: "pointer", color: t.inkSoft, fontSize: 14, lineHeight: 1 }}>−</button>
                    <span style={{ padding: "0 10px", minWidth: 76, fontFamily: t.mono, fontSize: 12, color: t.ink, textAlign: "center", fontWeight: 500 }}>${fmtNum(r.asking)}</span>
                    <button onClick={() => adjust(i, 25)} style={{ width: 24, height: 26, border: "none", background: "transparent", cursor: "pointer", color: t.inkSoft, fontSize: 14, lineHeight: 1 }}>+</button>
                  </div>
                </td>
                <td style={{ padding: "14px", textAlign: "right", fontFamily: t.mono, fontSize: 12, color: t.inkMute }}>${fmtNum(r.effective)}</td>
                <td style={{ padding: "14px", textAlign: "right", fontFamily: t.mono, fontSize: 12, color: t.inkMute }}>${fmtNum(r.comp)}</td>
                <td style={{ padding: "14px", textAlign: "right", fontFamily: t.mono, fontSize: 12, color: Math.abs(gap) > 150 ? t.bad : Math.abs(gap) > 50 ? t.warn : t.inkSoft }}>{gap > 0 ? "+" : ""}{gap}</td>
                <td style={{ padding: "14px", textAlign: "right", fontFamily: t.mono, fontSize: 12, color: r.dom > 30 ? t.bad : r.dom > 20 ? t.warn : t.inkSoft }}>{r.dom}d</td>
                <td style={{ padding: "14px", textAlign: "right", fontFamily: t.mono, fontSize: 12, color: r.vel < 1 ? t.bad : r.vel < 2 ? t.warn : t.good }}>{r.vel.toFixed(1)}</td>
                <td style={{ padding: "14px", textAlign: "right" }}>
                  {r.suggested && !r.touched ? (
                    <Btn t={t} variant="accent" size="xs" onClick={() => applySuggest(i)}>Apply ${fmtNum(r.suggested)}</Btn>
                  ) : r.touched ? (
                    <Tag t={t} tone="accent">edited {r.delta > 0 ? "+" : ""}{r.delta}</Tag>
                  ) : <span style={{ color: t.inkFaint, fontSize: 11 }}>—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      </div>
      {/* Impact footer */}
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${t.rule}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, background: t.bg }}>
        {[
          { l: "Vacancy cost today", v: "$154,300/mo", tone: t.bad, s: "139 vacant × weighted avg" },
          { l: "Velocity required", v: "7.0/wk", tone: t.ink, s: "to hit stabilization on plan" },
          { l: "Current velocity", v: "9.2/wk", tone: t.good, s: "12-wk trailing" },
          { l: "If adjustments hold", v: (delta > 0 ? "+" : "") + fmtUSD(delta*12, true), tone: delta > 0 ? t.good : delta < 0 ? t.warn : t.inkMute, s: "annualized rent roll impact" },
        ].map((x, i) => (
          <div key={i}>
            <Eyebrow t={t} style={{ marginBottom: 6 }}>{x.l}</Eyebrow>
            <div style={{ fontFamily: t.sans, fontSize: 18, fontWeight: 600, color: x.tone, fontVariantNumeric: "tabular-nums", letterSpacing: -0.3 }}>{x.v}</div>
            <div style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute, marginTop: 3 }}>{x.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  Placeholder pages
// ═══════════════════════════════════════════════════════════════
const PLACEHOLDERS = {
  inbox: { tag: "Messages · 4 unread", lines: ["Alex Rivera — 2BR inquiry", "Sarah Chen — lease question", "Priya S. — reschedule tour", "Unit 312 — payment failed notice"] },
  concessions: { tag: "Active programs · 3", lines: ["1 Month Free · expires May 31 · 14 applied", "$500 move-in credit · 11% conversion", "Waived app fee · low uptake"] },
  listings: { tag: "Syndication · 7 platforms", lines: ["Zillow · last sync 3m ago", "Apartments.com · last sync 4m ago", "Realtor.com · last sync 4m ago"] },
  market: { tag: "Comp set · 6 properties", lines: ["The Vance · 310 units · 61% occ · 2mo free", "Ovation · 240 units · 58% occ · 1mo free", "Halcyon · 180 units · 72% occ · none"] },
  residents: { tag: "Active leases · 121", lines: ["3 renewals pending this month", "1 notice to vacate · unit 504", "All rent current except 3 failed overnight"] },
  maintenance: { tag: "Open tickets · 2", lines: ["Unit 607 — HVAC urgent — Mike 12m out", "Common — elevator inspection due"] },
  messages: { tag: "Threads · 6 active", lines: ["4 unread from residents", "2 from prospects", "1 from vendor"] },
  collection: { tag: "April · 96.2% on-time", lines: ["$248,400 collected", "3 failed overnight · auto-retry scheduled", "Processing fees paid by renter — $0 to owner"] },
  ledger: { tag: "Two accounts · reconciled", lines: ["Operating · Chase ••4821 · $412,180", "Escrow · Chase ••6219 · $298,000", "Last sync 2 minutes ago"] },
  precon: { tag: "Before you break ground", lines: ["Model absorption curves", "Plan lease-up staffing", "Export to lender"] },
  settings: { tag: "Workspace", lines: ["Rent & compliance rules", "Listing connections", "Market data feeds", "Property config"] },
};
const Placeholder = ({ t, which }) => {
  const p = PLACEHOLDERS[which];
  if (!p) return <div style={{ padding: 20 }}>—</div>;
  return (
    <div style={{ padding: "20px" }}>
      <Eyebrow t={t} style={{ marginBottom: 14 }}>{p.tag}</Eyebrow>
      <div style={{ border: `1px solid ${t.rule}`, borderRadius: 4, background: t.surface }}>
        {p.lines.map((l, i) => (
          <div key={i} style={{ padding: "12px 16px", borderBottom: i < p.lines.length - 1 ? `1px solid ${t.ruleSoft}` : "none", fontFamily: t.sans, fontSize: 13, color: t.ink, display: "flex", alignItems: "center", gap: 10 }}>
            <Dot c={t.inkMute} size={5} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { RentOptimizer, Placeholder });
