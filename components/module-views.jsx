/* global React, THEMES, RESIDENTS, COLLECTION_KPIS, FAILED_PAYMENTS, AR_AGING, PAY_METHODS,
   WORK_ORDERS, MAINT_KPIS, ACCOUNTS, LEDGER_TAPE, LISTINGS, COMPS, CONCESSIONS, PRECON,
   APPLICATIONS, APP_KPIS, LP_REPORT, VENDORS, VENDOR_KPIS, DOC_FOLDERS, RECENT_DOCS,
   Dot, Tag, Btn, Eyebrow, Section, MicroBar, Kbd, PageKpis, Band, UnitChip, dataTH, dataTD,
   fmtUSD, fmtNum, fmtPct */
const { useState, useMemo } = React;

// ═══════════════════════════════════════════════════════════════
//  RESIDENTS — active lease roster with delinquency + renewal
// ═══════════════════════════════════════════════════════════════
const ResidentsView = ({ t }) => {
  const [sel, setSel] = useState(2); // Jamie Patel default
  const [filter, setFilter] = useState("all");
  const payTone = (p) => p === "current" ? "good" : p === "late" ? "warn" : p === "failed" ? "bad" : p === "upcoming" ? "neutral" : "neutral";
  const payDot = (p) => p === "current" ? t.good : p === "late" ? t.warn : p === "failed" ? t.bad : t.inkMute;
  const rows = RESIDENTS.filter(r => filter === "all" ? true : filter === "late" ? (r.pay === "late" || r.pay === "failed") : filter === "renewal" ? r.renewal !== "—" : filter === "ntv" ? r.renewal === "ntv" : true);
  const R = RESIDENTS[sel];

  const kpis = [
    { label: "Active leases", value: "121",  sub: "46.5% occupancy · 260 total", tone: "neutral" },
    { label: "Payments current", value: "117", unit: "/ 121", sub: "3 failed · 1 late", tone: "good" },
    { label: "Renewal window", value: "14", sub: "Jun 1 – Aug 31 · 4 NTVs filed", tone: "warn" },
    { label: "Avg tenure", value: "0.8", unit: "yrs", sub: "earliest Mar 2024", tone: "neutral" },
  ];
  const filters = [["all","All · 121"],["late","Delinquent · 4"],["renewal","Renewal ·  5"],["ntv","NTV · 1"]];

  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}`, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Band t={t} title={`Residents · ${rows.length} of ${RESIDENTS.length}`}
            right={
              <div style={{ display: "flex", gap: 4 }}>
                {filters.map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding: "4px 10px", fontFamily: t.sans, fontSize: 11, border: `1px solid ${filter===v ? t.ink : t.rule}`, background: filter===v ? t.ink : "transparent", color: filter===v ? t.surface : t.inkSoft, borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
                ))}
              </div>
            } />
          <div style={{ overflow: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>Unit</th>
              <th style={dataTH(t)}>Resident</th>
              <th style={dataTH(t)}>Lease</th>
              <th style={dataTH(t, "right")}>Rent</th>
              <th style={dataTH(t)}>Payment</th>
              <th style={dataTH(t, "right")}>On-time</th>
              <th style={dataTH(t)}>Renewal</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const idx = RESIDENTS.indexOf(r);
                const selected = idx === sel;
                return (
                  <tr key={r.id} onClick={() => setSel(idx)}
                    style={{ cursor: "pointer", background: selected ? t.hover : "transparent", borderLeft: `2px solid ${selected ? t.accent : "transparent"}` }}>
                    <td style={dataTD(t)}><UnitChip t={t}>{r.unit}</UnitChip></td>
                    <td style={dataTD(t)}>
                      <div style={{ fontWeight: 500 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: t.inkMute, marginTop: 2 }}>{r.beds}</div>
                    </td>
                    <td style={dataTD(t, { color: t.inkSoft })}>
                      <div style={{ fontSize: 12 }}>{r.start.split(", ")[0]} →</div>
                      <div style={{ fontSize: 11, color: t.inkMute, marginTop: 1 }}>{r.end.split(", ")[0]}</div>
                    </td>
                    <td style={dataTD(t, { align: "right", mono: true })}>${fmtNum(r.rent)}</td>
                    <td style={dataTD(t)}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Dot c={payDot(r.pay)} size={6} pulse={r.pay === "failed"} />
                        <span style={{ fontSize: 12, color: r.pay === "failed" ? t.bad : r.pay === "late" ? t.warn : t.inkSoft, textTransform: "capitalize" }}>{r.pay}</span>
                      </span>
                    </td>
                    <td style={dataTD(t, { align: "right", mono: true, color: t.inkSoft })}>{r.onTime}</td>
                    <td style={dataTD(t)}>
                      {r.renewal === "ntv" ? <Tag t={t} tone="bad">NTV</Tag>
                        : r.renewal === "eligible" ? <Tag t={t} tone="accent">eligible</Tag>
                        : r.renewal === "pending" ? <Tag t={t} tone="warn">pending</Tag>
                        : <span style={{ color: t.inkFaint }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Resident detail pane */}
        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Resident</Eyebrow>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <UnitChip t={t}>{R.unit}</UnitChip>
              <div style={{ fontFamily: t.sans, fontSize: 16, fontWeight: 600, color: t.ink }}>{R.name}</div>
            </div>
            <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute }}>{R.beds} · ${fmtNum(R.rent)}/mo · tenure {R.tenure.toFixed(1)}y</div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Facts</Eyebrow>
            {[["Lease start", R.start],["Lease end", R.end],["Last paid", R.lastPaid],["On-time", R.onTime],["Payment", R.pay]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: t.sans, fontSize: 12 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Note</Eyebrow>
            <div style={{ padding: "10px 12px", background: t.surfaceAlt, borderRadius: 3, fontFamily: t.sans, fontSize: 12.5, color: t.ink, lineHeight: 1.5 }}>{R.note}</div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Quick actions</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Btn t={t} size="xs">Open ledger</Btn>
              <Btn t={t} size="xs">Open tickets</Btn>
              <Btn t={t} size="xs">Send renewal offer</Btn>
              <Btn t={t} size="xs" variant="ghost">Start NTV</Btn>
            </div>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Activity</Eyebrow>
            {[["Apr 1",  "Rent posted · $"+fmtNum(R.rent)],["Mar 28", "AC ticket opened · MT-4821"],["Mar 1",  "Rent posted · $"+fmtNum(R.rent)],[R.start.split(",")[0], "Lease signed"]].map((a,i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${t.ruleSoft}` : "none" }}>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute, minWidth: 54, flexShrink: 0 }}>{a[0]}</span>
                <span style={{ fontFamily: t.sans, fontSize: 12, color: t.inkSoft }}>{a[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  COLLECTION — failed payments, AR aging, autopay mix
// ═══════════════════════════════════════════════════════════════
const CollectionView = ({ t }) => {
  const K = COLLECTION_KPIS;
  const kpis = [
    { label: "On-time rate",  value: K.onTime.toFixed(1), unit: "% · Apr", sub: "12-mo avg 94.8%", tone: "good" },
    { label: "Collected Apr", value: "$" + fmtNum(K.collected), sub: "processed by renter · $0 fee to owner", tone: "neutral" },
    { label: "Failed today",  value: K.failed, sub: "$7,050 · auto-retry scheduled", tone: "bad" },
    { label: "Outstanding AR", value: "$" + fmtNum(K.outstanding), sub: "1 late · 1 partial", tone: "warn" },
  ];
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}` }}>
          <Band t={t} title="Failed payments · auto-retry" right={<Btn t={t} size="xs" variant="secondary">Run retries now</Btn>} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>Unit</th>
              <th style={dataTH(t)}>Resident</th>
              <th style={dataTH(t, "right")}>Amount</th>
              <th style={dataTH(t)}>Reason</th>
              <th style={dataTH(t, "right")}>Attempt</th>
              <th style={dataTH(t)}>Next retry</th>
              <th style={dataTH(t, "right")}>Action</th>
            </tr></thead>
            <tbody>
              {FAILED_PAYMENTS.map((f, i) => (
                <tr key={f.id}>
                  <td style={dataTD(t)}><UnitChip t={t}>{f.unit}</UnitChip></td>
                  <td style={dataTD(t)}>{f.name}</td>
                  <td style={dataTD(t, { align: "right", mono: true })}>${fmtNum(f.amount)}</td>
                  <td style={dataTD(t, { color: t.inkSoft })}>{f.reason}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.inkSoft })}>{f.attempt} / 3</td>
                  <td style={dataTD(t, { mono: true, color: f.nextRetry === "hold" ? t.bad : t.warn })}>{f.nextRetry}</td>
                  <td style={dataTD(t, { align: "right" })}><Btn t={t} size="xs">Resolve</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>

          <Band t={t} title="AR aging" style={{ marginTop: 0 }} />
          <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {AR_AGING.map((a, i) => (
              <div key={a.bucket} style={{ padding: "14px", background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 4 }}>
                <Eyebrow t={t}>{a.bucket}</Eyebrow>
                <div style={{ fontFamily: t.mono, fontSize: 20, fontWeight: 600, color: i === 0 ? t.good : i === 1 ? t.warn : i === 2 ? t.bad : t.inkMute, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>${fmtNum(a.amount)}</div>
                <div style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute, marginTop: 4 }}>{a.units} unit{a.units === 1 ? "" : "s"}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Payment mix · Apr</Eyebrow>
            {PAY_METHODS.map((p, i) => (
              <div key={p.m} style={{ padding: "10px 0", borderBottom: i < PAY_METHODS.length - 1 ? `1px solid ${t.ruleSoft}` : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: t.sans, fontSize: 13, color: t.ink, fontWeight: 500 }}>{p.m}</span>
                  <span style={{ fontFamily: t.mono, fontSize: 13, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{p.share}%</span>
                </div>
                <MicroBar t={t} value={p.share} max={100} width={280} color={t.inkSoft} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10.5, color: t.inkMute, fontFamily: t.sans }}>
                  <span>fee {p.fee}</span><span>{p.note}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Late-fee policy</Eyebrow>
            <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkSoft, lineHeight: 1.55 }}>
              Grace through the 5th · $50 flat on day 6 · 5% of rent on day 10. NSF $25 (waivable once per year).
            </div>
            <div style={{ marginTop: 10 }}><Btn t={t} size="xs" variant="ghost">Edit policy →</Btn></div>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>This month</Eyebrow>
            {[["NSF fees waived","1 · $25"],["Late fees posted","$400"],["Partial payments","1 · $1,800"],["Autopay churn","0"]].map(([k,v],i) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: t.sans, fontSize: 12 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MAINTENANCE — work order queue
// ═══════════════════════════════════════════════════════════════
const MaintenanceView = ({ t }) => {
  const [sel, setSel] = useState(0);
  const [filter, setFilter] = useState("all");
  const W = WORK_ORDERS[sel];
  const rows = WORK_ORDERS.filter(w => filter === "all" ? true : filter === "open" ? w.status !== "closed" : filter === "urgent" ? (w.priority === "urgent" || w.priority === "high") : filter === "sla" ? w.sla : true);
  const priTone = { urgent: "bad", high: "warn", normal: "neutral", low: "neutral" };
  const stLabel = { "dispatched":"dispatched","scheduled":"scheduled","vendor-eta":"vendor ETA","in-progress":"in progress","open":"open","closed":"closed" };

  const kpis = [
    { label: "Open work orders", value: MAINT_KPIS.open, sub: "1 urgent · 1 high", tone: "neutral" },
    { label: "Urgent",           value: MAINT_KPIS.urgent, sub: "U-312 AC · SLA 24h", tone: "bad" },
    { label: "Avg MTTR",         value: MAINT_KPIS.avgMttr, sub: "target 24h · 90-day", tone: "good" },
    { label: "SLA breaches",     value: MAINT_KPIS.slaBreach, sub: "this week · $0 credit", tone: "warn" },
  ];
  const filters = [["all","All"],["open","Open · 6"],["urgent","Urgent · 2"],["sla","SLA · 1"]];

  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}`, display: "flex", flexDirection: "column" }}>
          <Band t={t} title={`Work orders · ${rows.length}`}
            right={
              <div style={{ display: "flex", gap: 4 }}>
                {filters.map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding: "4px 10px", fontFamily: t.sans, fontSize: 11, border: `1px solid ${filter===v ? t.ink : t.rule}`, background: filter===v ? t.ink : "transparent", color: filter===v ? t.surface : t.inkSoft, borderRadius: 3, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            } />
          <div style={{ flex: 1, overflow: "auto" }}>
            {rows.map((w, i) => {
              const idx = WORK_ORDERS.indexOf(w);
              const selected = idx === sel;
              return (
                <div key={w.id} onClick={() => setSel(idx)}
                  style={{ display: "grid", gridTemplateColumns: "84px 76px 1fr 140px 90px 64px", padding: "12px 20px", gap: 14, alignItems: "center", borderBottom: `1px solid ${t.ruleSoft}`, background: selected ? t.hover : "transparent", borderLeft: `2px solid ${selected ? t.accent : "transparent"}`, cursor: "pointer" }}>
                  <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute, letterSpacing: 0.3 }}>{w.id}</span>
                  <UnitChip t={t} style={{ justifySelf: "start" }}>{w.unit}</UnitChip>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: t.sans, fontSize: 13, color: t.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      <Dot c={priTone[w.priority] === "bad" ? t.bad : priTone[w.priority] === "warn" ? t.warn : t.inkMute} pulse={w.priority === "urgent"} size={6} />
                      {w.issue}
                    </div>
                    <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkMute, marginTop: 3 }}>{w.name} · opened {w.opened} ago</div>
                  </div>
                  <span style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkSoft }}>{w.vendor}</span>
                  <Tag t={t} tone={priTone[w.priority]}>{w.priority}</Tag>
                  <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkSoft, textAlign: "right" }}>{stLabel[w.status]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work order detail */}
        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkMute, letterSpacing: 0.5 }}>{W.id}</span>
              {W.sla && <Tag t={t} tone="bad">SLA</Tag>}
              <Tag t={t} tone={priTone[W.priority]}>{W.priority}</Tag>
            </div>
            <div style={{ fontFamily: t.sans, fontSize: 16, fontWeight: 600, color: t.ink }}>{W.issue}</div>
            <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute, marginTop: 4 }}>{W.unit} · {W.name} · opened {W.opened} ago</div>
          </div>

          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Dispatch</Eyebrow>
            {[["Vendor", W.vendor],["Status", stLabel[W.status]],["Est. cost", W.cost == null ? "—" : "$" + fmtNum(W.cost)],["Photos", W.photos || 0]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: t.sans, fontSize: 12 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Photos · {W.photos || 0}</Eyebrow>
            {W.photos > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {Array.from({ length: Math.min(6, W.photos) }).map((_, i) => (
                  <div key={i} style={{ aspectRatio: "1", background: `linear-gradient(135deg, ${t.surfaceAlt}, ${t.hover})`, borderRadius: 3, border: `1px solid ${t.rule}` }} />
                ))}
              </div>
            ) : <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute }}>No photos uploaded yet.</div>}
          </div>

          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Actions</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Btn t={t} size="xs" variant="primary">Mark resolved</Btn>
              <Btn t={t} size="xs">Message resident</Btn>
              <Btn t={t} size="xs">Re-dispatch</Btn>
              <Btn t={t} size="xs" variant="ghost">Escalate</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  LEDGER — accounts, recon status, live tape
// ═══════════════════════════════════════════════════════════════
const LedgerView = ({ t }) => {
  const [sel, setSel] = useState(0);
  const A = ACCOUNTS[sel];
  const tapeFor = LEDGER_TAPE.filter(x => x.acct === A.label);
  const kpis = [
    { label: "Operating",     value: "$" + fmtNum(ACCOUNTS[0].balance), sub: ACCOUNTS[0].bank, tone: "neutral" },
    { label: "Escrow",        value: "$" + fmtNum(ACCOUNTS[1].balance), sub: ACCOUNTS[1].bank, tone: "neutral" },
    { label: "Reserves",      value: "$" + fmtNum(ACCOUNTS[2].balance), sub: ACCOUNTS[2].bank, tone: "neutral" },
    { label: "Reconciled",    value: "SYNC", sub: "all accounts · 2m ago", tone: "good", mono: false },
  ];
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", minHeight: "calc(100vh - 44px - 96px)" }}>
        {/* Accounts list */}
        <div style={{ borderRight: `1px solid ${t.rule}` }}>
          <Band t={t} title="Accounts" />
          {ACCOUNTS.map((a, i) => (
            <div key={a.id} onClick={() => setSel(i)}
              style={{ padding: "14px 16px", borderBottom: `1px solid ${t.ruleSoft}`, borderLeft: `2px solid ${i === sel ? t.accent : "transparent"}`, background: i === sel ? t.hover : "transparent", cursor: "pointer" }}>
              <div style={{ fontFamily: t.sans, fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute, marginBottom: 6 }}>{a.bank}</div>
              <div style={{ fontFamily: t.mono, fontSize: 15, color: t.ink, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>${fmtNum(a.balance)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <Dot c={t.good} size={5} />
                <span style={{ fontFamily: t.sans, fontSize: 10.5, color: t.inkMute }}>reconciled {a.reconciled}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tape */}
        <div style={{ borderRight: `1px solid ${t.rule}`, display: "flex", flexDirection: "column" }}>
          <Band t={t} title={`${A.label} · tape`} right={
            <div style={{ display: "flex", gap: 6 }}>
              <Btn t={t} size="xs">Post entry</Btn>
              <Btn t={t} size="xs" variant="ghost">Export CSV</Btn>
            </div>
          } />
          <div style={{ flex: 1, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={dataTH(t)}>When</th>
                <th style={dataTH(t)}>Kind</th>
                <th style={dataTH(t)}>Memo</th>
                <th style={dataTH(t, "right")}>Amount</th>
              </tr></thead>
              <tbody>
                {tapeFor.map((r, i) => (
                  <tr key={i}>
                    <td style={dataTD(t, { mono: true, color: t.inkMute })}>{r.at}</td>
                    <td style={dataTD(t)}>
                      <Tag t={t} tone={r.kind === "deposit" ? "good" : r.kind === "expense" ? "bad" : r.kind === "fee" ? "warn" : "neutral"}>{r.kind}</Tag>
                    </td>
                    <td style={dataTD(t, { color: t.inkSoft })}>{r.label}</td>
                    <td style={dataTD(t, { align: "right", mono: true, color: r.amount > 0 ? t.good : r.amount < 0 ? t.bad : t.ink })}>{r.amount > 0 ? "+" : ""}{fmtUSD(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Balance breakdown + actions */}
        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Balance</Eyebrow>
            {[["Book balance", A.balance],["Reserved", A.reserved],["Available", A.available]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: t.sans, fontSize: 12.5 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink, fontVariantNumeric: "tabular-nums", fontWeight: k === "Available" ? 600 : 400 }}>${fmtNum(v)}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Reconciliation</Eyebrow>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: t.sans, fontSize: 12.5, color: t.inkSoft, marginBottom: 6 }}>
              <Dot c={t.good} pulse size={6} />
              Live sync · {A.bank}
            </div>
            <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkMute, lineHeight: 1.5 }}>Last match {A.reconciled}. Plaid webhook · no drift detected.</div>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Actions</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Btn t={t} size="xs">Transfer between accounts</Btn>
              <Btn t={t} size="xs">Reconcile now</Btn>
              <Btn t={t} size="xs" variant="ghost">Export GL · Apr</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  LISTINGS — syndication health
// ═══════════════════════════════════════════════════════════════
const ListingsView = ({ t }) => {
  const [sel, setSel] = useState(4); // Rent.com to show warn state
  const L = LISTINGS[sel];
  const total = LISTINGS.reduce((s,l) => s+l.leads7, 0);
  const viewTotal = LISTINGS.reduce((s,l) => s+l.views7, 0);
  const issues = LISTINGS.filter(l => l.issues > 0).length;
  const kpis = [
    { label: "Syndicated",   value: "6", unit: "/ 7 ok", sub: "1 platform degraded", tone: "warn" },
    { label: "Views · 7d",   value: fmtNum(viewTotal), sub: "Zillow 47% · Apts 30%", tone: "neutral" },
    { label: "Leads · 7d",   value: total, sub: "$14 avg CPL · blended", tone: "neutral" },
    { label: "Issues",       value: issues, sub: "1 expired · 2 content flags", tone: "bad" },
  ];
  const healthTone = (h) => h === "ok" ? t.good : h === "warn" ? t.warn : t.bad;
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}` }}>
          <Band t={t} title="Platforms" right={<Btn t={t} size="xs">Sync all now</Btn>} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>Platform</th>
              <th style={dataTH(t, "right")}>Views 7d</th>
              <th style={dataTH(t, "right")}>Leads</th>
              <th style={dataTH(t, "right")}>CPL</th>
              <th style={dataTH(t, "right")}>Units live</th>
              <th style={dataTH(t)}>Last sync</th>
              <th style={dataTH(t)}>Status</th>
            </tr></thead>
            <tbody>
              {LISTINGS.map((l, i) => (
                <tr key={l.id} onClick={() => setSel(i)}
                  style={{ cursor: "pointer", background: i === sel ? t.hover : "transparent", borderLeft: `2px solid ${i === sel ? t.accent : "transparent"}` }}>
                  <td style={dataTD(t)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Dot c={healthTone(l.health)} pulse={l.health === "bad"} size={6} />
                      <span style={{ fontWeight: 500 }}>{l.name}</span>
                    </div>
                  </td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.inkSoft })}>{fmtNum(l.views7)}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.ink })}>{l.leads7}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.inkSoft })}>{l.cpLead}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.inkSoft })}>{l.unitsLive} / 4</td>
                  <td style={dataTD(t, { mono: true, color: l.health === "bad" ? t.bad : l.health === "warn" ? t.warn : t.inkMute })}>{l.sync}</td>
                  <td style={dataTD(t)}>
                    {l.issues > 0 ? <Tag t={t} tone={l.health === "bad" ? "bad" : "warn"}>{l.issues} issue</Tag> : <Tag t={t} tone="good">healthy</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Platform</Eyebrow>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Dot c={healthTone(L.health)} size={8} pulse={L.health === "bad"} />
              <div style={{ fontFamily: t.sans, fontSize: 16, fontWeight: 600 }}>{L.name}</div>
            </div>
            <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute }}>Last sync {L.sync}</div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>7-day performance</Eyebrow>
            {[["Views", fmtNum(L.views7)],["Leads", L.leads7],["CPL", L.cpLead],["Units syndicated", `${L.unitsLive} / 4`]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: t.sans, fontSize: 12 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
          {L.note && (
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
              <Eyebrow t={t} style={{ marginBottom: 8 }}>Issue</Eyebrow>
              <div style={{ padding: "10px 12px", background: t.badSoft, borderRadius: 3, fontFamily: t.sans, fontSize: 12.5, color: t.bad, lineHeight: 1.5 }}>{L.note}</div>
            </div>
          )}
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Actions</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {L.health === "bad" && <Btn t={t} size="xs" variant="primary">Reconnect</Btn>}
              <Btn t={t} size="xs">Re-sync units</Btn>
              <Btn t={t} size="xs">Edit listing copy</Btn>
              <Btn t={t} size="xs" variant="ghost">Pause platform</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MARKET — comp set with pricing grid
// ═══════════════════════════════════════════════════════════════
const MarketView = ({ t }) => {
  const self = COMPS.find(c => c.self);
  const others = COMPS.filter(c => !c.self);
  const medianFor = (k) => { const arr = others.map(c => c[k]).sort((a,b) => a-b); return Math.round((arr[Math.floor(arr.length/2)] + arr[Math.ceil(arr.length/2)]) / 2); };
  const avgOcc = Math.round(others.reduce((s,c) => s + c.occ, 0) / others.length * 10) / 10;
  const kpis = [
    { label: "Comp set",    value: others.length, sub: "within 1.5 mi of The Meridian", tone: "neutral" },
    { label: "1BR vs median", value: (self.oneBed - medianFor("oneBed") > 0 ? "+" : "") + "$" + fmtNum(self.oneBed - medianFor("oneBed")), sub: "our $2,100 · median $" + fmtNum(medianFor("oneBed")), tone: self.oneBed > medianFor("oneBed") ? "good" : "warn" },
    { label: "Market occupancy", value: avgOcc.toFixed(1), unit: "%", sub: "our 46.5% · trailing comps", tone: avgOcc > self.occ ? "warn" : "good" },
    { label: "Concession index", value: "MED", sub: "we are at 1mo · market 0–2mo", tone: "neutral", mono: false },
  ];
  const cellTone = (ours, comp) => {
    const diff = ours - comp;
    return diff > 100 ? t.good : diff > 0 ? t.inkSoft : diff > -100 ? t.warn : t.bad;
  };
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <Band t={t} title="Comparable pricing · monthly ask" right={<Btn t={t} size="xs" variant="ghost">Edit comp set →</Btn>} />
      <div style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
        <thead><tr>
          <th style={dataTH(t)}>Property</th>
          <th style={dataTH(t, "right")}>Units</th>
          <th style={dataTH(t, "right")}>Occ</th>
          <th style={dataTH(t, "right")}>Dist</th>
          <th style={dataTH(t)}>Concession</th>
          <th style={dataTH(t, "right")}>Studio</th>
          <th style={dataTH(t, "right")}>1BR</th>
          <th style={dataTH(t, "right")}>2BR</th>
          <th style={dataTH(t, "right")}>3BR</th>
        </tr></thead>
        <tbody>
          {COMPS.map((c) => (
            <tr key={c.id} style={{ background: c.self ? t.surfaceAlt : "transparent" }}>
              <td style={dataTD(t)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {c.self && <Tag t={t} tone="accent">OURS</Tag>}
                  <span style={{ fontWeight: c.self ? 600 : 500 }}>{c.name}</span>
                  {c.trend === "concession-up" && <Tag t={t} tone="warn">conc ▲</Tag>}
                  {c.trend === "pricing-up" && <Tag t={t} tone="good">price ▲</Tag>}
                </div>
              </td>
              <td style={dataTD(t, { align: "right", mono: true, color: t.inkSoft })}>{c.units}</td>
              <td style={dataTD(t, { align: "right", mono: true, color: c.occ < 60 ? t.warn : t.inkSoft })}>{c.occ.toFixed(1)}%</td>
              <td style={dataTD(t, { align: "right", mono: true, color: t.inkMute })}>{c.dist === 0 ? "—" : c.dist.toFixed(1) + " mi"}</td>
              <td style={dataTD(t, { color: c.concession === "none" ? t.good : c.concession === "2mo" ? t.bad : t.inkSoft })}>{c.concession}</td>
              {["studio","oneBed","twoBed","threeBed"].map(k => (
                <td key={k} style={dataTD(t, { align: "right", mono: true, color: c.self ? t.ink : cellTone(self[k], c[k]) })}>${fmtNum(c[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${t.rule}`, background: t.surfaceAlt, fontFamily: t.sans, fontSize: 12, color: t.inkSoft, lineHeight: 1.6 }}>
        <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkMute, marginBottom: 6 }}>Takeaways</div>
        Our 3BR is <span style={{ fontFamily: t.mono, color: t.bad }}>$250 above</span> the comp median — consistent with stalled 3BR velocity. The Vance moved to 2 months free this week; monitor for leakage.
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CONCESSIONS — active programs
// ═══════════════════════════════════════════════════════════════
const ConcessionsView = ({ t }) => {
  const active = CONCESSIONS.filter(c => c.status === "active");
  const totalApplied = active.reduce((s,c) => s + c.applied, 0);
  const totalCost = active.reduce((s,c) => s + c.cost, 0);
  const kpis = [
    { label: "Active programs", value: active.length, sub: active.map(a => a.name).join(" · "), tone: "neutral" },
    { label: "Applied",         value: totalApplied, sub: "leases signed under a concession", tone: "good" },
    { label: "ARR at risk",     value: "$" + fmtNum(totalCost), sub: "concession cost · YTD", tone: "warn" },
    { label: "Expiring ≤30d",   value: "2", sub: "1 month free · $500 credit", tone: "bad" },
  ];
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <Band t={t} title="Programs" right={<Btn t={t} size="xs" variant="primary">New program</Btn>} />
      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {CONCESSIONS.map(c => {
          const expired = c.status === "archived";
          const expiringSoon = !expired && (c.expires.includes("May") || c.expires.includes("Jun"));
          return (
            <div key={c.id} style={{ background: t.surface, border: `1px solid ${expired ? t.ruleSoft : t.rule}`, borderRadius: 4, padding: 16, opacity: expired ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: t.sans, fontSize: 14, fontWeight: 600, color: t.ink, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute }}>Expires {c.expires}</div>
                </div>
                {expired ? <Tag t={t} tone="neutral">archived</Tag>
                  : expiringSoon ? <Tag t={t} tone="warn">expiring</Tag>
                  : <Tag t={t} tone="good">active</Tag>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "10px 0", borderTop: `1px solid ${t.ruleSoft}`, borderBottom: `1px solid ${t.ruleSoft}` }}>
                {[["Applied", c.applied],["Conversion", c.conversion + "%"],["Cost", "$" + fmtNum(c.cost)]].map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontFamily: t.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkMute, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontFamily: t.mono, fontSize: 15, fontWeight: 600, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkSoft, marginTop: 10, lineHeight: 1.5, minHeight: 34 }}>{c.note}</div>
              {!expired && (
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <Btn t={t} size="xs">Extend</Btn>
                  <Btn t={t} size="xs">Narrow scope</Btn>
                  <Btn t={t} size="xs" variant="ghost">Archive</Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PRE-CON — absorption model
// ═══════════════════════════════════════════════════════════════
const PreconView = ({ t }) => {
  const P = PRECON;
  const kpis = [
    { label: "Target CO",        value: "Jan 15", sub: "2025 · actual", tone: "good", mono: false },
    { label: "Stabilization",    value: "Jul 28", sub: "2026 · 73-week plan", tone: "neutral", mono: false },
    { label: "Leased vs model",  value: "+28", sub: "121 actual · 93 plan", tone: "good" },
    { label: "Pace ahead",       value: "30", unit: "days", sub: "projected early stabilization", tone: "good" },
  ];
  // simple sparkline for absorption curves
  const W = 640, H = 180;
  const maxUnits = 260;
  const plan = Array.from({length: 78}, (_, i) => Math.round(maxUnits * (1 - Math.exp(-i / 28))));
  const actual = [0,1,3,6,10,15,22,30,39,49,60,71,82,93,105,121];
  const projected = (() => { const arr = [...actual]; let v = arr[arr.length-1]; for (let i = arr.length; i < 78; i++) { v = Math.min(maxUnits, v + 9.2); arr.push(Math.round(v)); } return arr; })();
  const xy = (arr) => arr.map((y,i) => [i / 77 * W, H - (y / maxUnits * H)]);
  const toPath = (pts) => pts.map((p,i) => (i===0?"M":"L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}` }}>
          <Band t={t} title="Absorption · 78-week model" right={<Btn t={t} size="xs">Adjust assumptions</Btn>} />
          <div style={{ padding: 20 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 220, display: "block" }}>
              {[0, 0.25, 0.5, 0.75, 1].map(f => (
                <line key={f} x1={0} x2={W} y1={H - f*H} y2={H - f*H} stroke={t.ruleSoft} strokeWidth={1} />
              ))}
              <path d={toPath(xy(plan))} stroke={t.inkFaint} strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
              <path d={toPath(xy(projected.slice(actual.length-1)).map(([x,y]) => [x + (actual.length-1)/77 * W, y]))}
                    stroke={t.accent} strokeWidth={1.5} fill="none" strokeDasharray="2 3" opacity={0.8} />
              <path d={toPath(xy(actual))} stroke={t.good} strokeWidth={2} fill="none" />
              <line x1={0} x2={W} y1={H - 0.93*H} y2={H - 0.93*H} stroke={t.warn} strokeWidth={1} strokeDasharray="2 2" opacity={0.7} />
              <text x={W-4} y={H - 0.93*H - 4} textAnchor="end" fill={t.warn} fontSize={10} fontFamily={t.mono}>stabilization · 93%</text>
              {/* Today marker */}
              <line x1={(actual.length-1)/77*W} x2={(actual.length-1)/77*W} y1={0} y2={H} stroke={t.ink} strokeWidth={1} opacity={0.4} />
            </svg>
            <div style={{ display: "flex", gap: 18, marginTop: 12, fontFamily: t.sans, fontSize: 11 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: t.inkSoft }}><span style={{ width: 14, height: 2, background: t.good }} /> Actual · 121 units</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: t.inkSoft }}><span style={{ width: 14, height: 2, background: t.accent, opacity: 0.7 }} /> Projected @ 9.2/wk</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: t.inkSoft }}><span style={{ width: 14, borderTop: `1.5px dashed ${t.inkFaint}` }} /> Pro-forma plan</span>
            </div>
          </div>
          <Band t={t} title="Variance vs pro forma" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>Metric</th>
              <th style={dataTH(t, "right")}>Actual</th>
              <th style={dataTH(t, "right")}>Plan</th>
              <th style={dataTH(t, "right")}>Variance</th>
            </tr></thead>
            <tbody>
              {P.variance.map((v, i) => (
                <tr key={i}>
                  <td style={dataTD(t)}>{v.l}</td>
                  <td style={dataTD(t, { align: "right", mono: true })}>{v.actual}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.inkMute })}>{v.plan}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: v.tone === "good" ? t.good : v.tone === "bad" ? t.bad : t.warn })}>{v.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Assumptions</Eyebrow>
            {P.assumptions.map((a,i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < P.assumptions.length - 1 ? `1px solid ${t.ruleSoft}` : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute }}>{a.l}</span>
                  <span style={{ fontFamily: t.mono, fontSize: 12, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{a.v}</span>
                </div>
                <div style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute, marginTop: 3 }}>{a.d}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Export</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Btn t={t} size="xs" variant="primary">Lender PDF</Btn>
              <Btn t={t} size="xs">LP one-pager</Btn>
              <Btn t={t} size="xs" variant="ghost">Model .xlsx</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════
const SettingsView = ({ t }) => {
  const groups = [
    { id: "property",   label: "Property",       items: [["Name & address", "The Meridian · Austin, TX"],["Unit count", "260"],["Certificate of occupancy", "Jan 15, 2025"],["Target stabilization", "Jul 28, 2026"]] },
    { id: "rent",       label: "Rent & fees",    items: [["Grace period", "5 days"],["Late fee schedule", "$50 flat · then 5% of rent day 10"],["NSF fee", "$25 · one waive / yr"],["Processing fee", "Passed to renter"]] },
    { id: "listings",   label: "Listing feeds",  items: [["Zillow", "connected"],["Apartments.com", "connected"],["Realtor.com", "connected"],["Facebook Mktpl", "reconnect needed"]] },
    { id: "bank",       label: "Bank & payments",items: [["Operating · Chase ••4821", "live sync"],["Escrow · Chase ••6219", "live sync"],["Reserves · Chase ••7733", "live sync"],["Autopay provider", "Stripe"]] },
    { id: "market",     label: "Market data",    items: [["Comp set size", "6 properties within 1.5 mi"],["Refresh cadence", "daily · 6am CT"],["Data source", "HelloData · CoStar overlay"]] },
    { id: "team",       label: "Team & access",  items: [["You", "J. Mori · admin"],["Priya S.", "leasing · editor"],["Paragon (vendor)", "portal only"],["Invite teammate", "→"]] },
    { id: "compliance", label: "Compliance",     items: [["Fair housing",  "templates enabled"],["Pet & smoking policy", "set"],["Renewal notice window", "90 days"],["NTV window", "60 days"]] },
  ];
  const [sel, setSel] = useState("property");
  const G = groups.find(g => g.id === sel);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 44px - 52px)" }}>
      <div style={{ borderRight: `1px solid ${t.rule}`, background: t.bg }}>
        <div style={{ padding: "16px 20px" }}>
          <Eyebrow t={t}>Workspace</Eyebrow>
        </div>
        {groups.map(g => (
          <button key={g.id} onClick={() => setSel(g.id)}
            style={{ width: "100%", padding: "10px 20px", textAlign: "left", background: sel === g.id ? t.hover : "transparent", border: "none", borderLeft: `2px solid ${sel === g.id ? t.accent : "transparent"}`, color: sel === g.id ? t.ink : t.inkSoft, fontFamily: t.sans, fontSize: 13, cursor: "pointer" }}>
            {g.label}
          </button>
        ))}
      </div>
      <div style={{ padding: "24px 28px", maxWidth: 720 }}>
        <Eyebrow t={t} style={{ marginBottom: 6 }}>{G.label}</Eyebrow>
        <div style={{ fontFamily: t.sans, fontSize: 20, fontWeight: 600, color: t.ink, marginBottom: 20 }}>{G.label}</div>
        <div style={{ border: `1px solid ${t.rule}`, borderRadius: 4, background: t.surface }}>
          {G.items.map(([k, v], i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: i < G.items.length - 1 ? `1px solid ${t.ruleSoft}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.sans, fontSize: 13, color: t.ink, fontWeight: 500 }}>{k}</div>
                <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkMute, marginTop: 3 }}>{v}</div>
              </div>
              <Btn t={t} size="xs" variant="ghost">Edit →</Btn>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  APPLICATIONS — screening queue
// ═══════════════════════════════════════════════════════════════
const ApplicationsView = ({ t }) => {
  const [sel, setSel] = useState(0);
  const A = APPLICATIONS[sel];
  const kpis = [
    { label: "Pending",     value: APP_KPIS.pending, sub: "underwriting + waiting on docs", tone: "warn" },
    { label: "Approved",    value: APP_KPIS.approved, sub: "awaiting lease signature", tone: "good" },
    { label: "Denied · 30d",value: APP_KPIS.denied, sub: "policy · credit floor 620", tone: "neutral" },
    { label: "Avg cycle",   value: APP_KPIS.avgCycle, sub: "submit → decision", tone: "good", mono: false },
  ];
  const stTone = { approved: "good", "underwriting": "warn", "pending-income": "warn", review: "bad" };
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}` }}>
          <Band t={t} title="Applications · screening queue" right={<Btn t={t} size="xs" variant="ghost">Policy →</Btn>} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>Applicant</th>
              <th style={dataTH(t)}>Unit</th>
              <th style={dataTH(t, "right")}>Credit</th>
              <th style={dataTH(t)}>BG</th>
              <th style={dataTH(t)}>Income</th>
              <th style={dataTH(t, "right")}>Rent / Inc</th>
              <th style={dataTH(t)}>Deposit</th>
              <th style={dataTH(t)}>Status</th>
            </tr></thead>
            <tbody>
              {APPLICATIONS.map((a, i) => (
                <tr key={a.id} onClick={() => setSel(i)}
                  style={{ cursor: "pointer", background: i === sel ? t.hover : "transparent", borderLeft: `2px solid ${i === sel ? t.accent : "transparent"}` }}>
                  <td style={dataTD(t)}>
                    <div style={{ fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: t.inkMute, marginTop: 2 }}>{a.received}</div>
                  </td>
                  <td style={dataTD(t)}><UnitChip t={t}>{a.unit}</UnitChip></td>
                  <td style={dataTD(t, { align: "right", mono: true, color: a.credit >= 700 ? t.good : a.credit >= 650 ? t.warn : t.bad })}>{a.credit}</td>
                  <td style={dataTD(t)}>
                    <Tag t={t} tone={a.bgCheck === "clear" ? "good" : a.bgCheck === "minor" ? "warn" : "bad"}>{a.bgCheck}</Tag>
                  </td>
                  <td style={dataTD(t)}>
                    <Tag t={t} tone={a.income === "verified" ? "good" : "warn"}>{a.income}</Tag>
                  </td>
                  <td style={dataTD(t, { align: "right", mono: true, color: a.ratio >= 3 ? t.good : t.warn })}>{a.ratio.toFixed(1)}x</td>
                  <td style={dataTD(t, { color: a.deposit === "paid" ? t.good : t.warn })}>{a.deposit}</td>
                  <td style={dataTD(t)}><Tag t={t} tone={stTone[a.status] || "neutral"}>{a.status.replace("-"," ")}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Application</Eyebrow>
            <div style={{ fontFamily: t.sans, fontSize: 16, fontWeight: 600, color: t.ink }}>{A.name}</div>
            <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute, marginTop: 4 }}>Unit {A.unit} · received {A.received}</div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Screening</Eyebrow>
            {[["Credit score", A.credit],["Background", A.bgCheck],["Income", A.income],["Rent-to-income", A.ratio.toFixed(1) + "x"],["Deposit", A.deposit]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: t.sans, fontSize: 12 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Note</Eyebrow>
            <div style={{ padding: "10px 12px", background: t.surfaceAlt, borderRadius: 3, fontFamily: t.sans, fontSize: 12.5, color: t.ink, lineHeight: 1.5 }}>{A.note}</div>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Decision</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Btn t={t} size="xs" variant="primary">Approve · send lease</Btn>
              <Btn t={t} size="xs">Request cosigner</Btn>
              <Btn t={t} size="xs">Request docs</Btn>
              <Btn t={t} size="xs" variant="ghost">Decline</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  LP REPORTING — actual vs pro forma
// ═══════════════════════════════════════════════════════════════
const LPReportingView = ({ t }) => {
  const L = LP_REPORT;
  const kpis = [
    { label: "NOI vs plan",    value: "+$38K", sub: "$41.8K actual · $3.6K plan", tone: "good" },
    { label: "Absorption",     value: "+28", sub: `${L.absorption.actualUnits} leased · ${L.absorption.planUnits} plan`, tone: "good" },
    { label: "IRR to LP",      value: L.irr.toLP.toFixed(1), unit: "%", sub: "pro forma " + L.irr.planIrr.toFixed(1) + "% · +180 bps", tone: "good" },
    { label: "Next report",    value: "Apr 30", sub: L.nextDue, tone: "warn", mono: false },
  ];
  const grouped = [];
  let currentGroup = null;
  L.lines.forEach(l => {
    if (l.group !== currentGroup) { grouped.push({ head: l.group }); currentGroup = l.group; }
    grouped.push(l);
  });
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}` }}>
          <Band t={t} title={`Actual vs pro forma · ${L.period}`} right={<Btn t={t} size="xs" variant="primary">Generate LP letter</Btn>} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>Line</th>
              <th style={dataTH(t, "right")}>Actual</th>
              <th style={dataTH(t, "right")}>Plan</th>
              <th style={dataTH(t, "right")}>Δ %</th>
            </tr></thead>
            <tbody>
              {grouped.map((r, i) => r.head ? (
                <tr key={"h"+i}><td colSpan={4} style={{ padding: "10px 14px 6px", fontFamily: t.sans, fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: t.inkMute, borderBottom: `1px solid ${t.rule}`, background: t.surfaceAlt }}>{r.head}</td></tr>
              ) : (
                <tr key={i} style={{ background: r.bold ? t.surfaceAlt : "transparent" }}>
                  <td style={dataTD(t, { color: r.bold ? t.ink : t.inkSoft })}><span style={{ fontWeight: r.bold ? 600 : 400 }}>{r.l}</span></td>
                  <td style={dataTD(t, { align: "right", mono: true, color: r.bold ? t.ink : t.ink })}>{fmtUSD(r.actual)}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.inkMute })}>{fmtUSD(r.plan)}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: r.delta > 0 ? t.good : r.delta < 0 ? t.bad : t.inkMute })}>{fmtPct(r.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>LP summary</Eyebrow>
            <div style={{ fontFamily: t.sans, fontSize: 12.5, color: t.inkSoft, lineHeight: 1.6 }}>
              Leasing velocity <span style={{ fontFamily: t.mono, color: t.good }}>9.2/wk</span> is running <span style={{ fontFamily: t.mono, color: t.good }}>+178%</span> against the <span style={{ fontFamily: t.mono }}>3.3/wk</span> underwriting assumption. Projecting stabilization 30 days early; NOI ahead of plan primarily on reduced concession burn.
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Distribution history</Eyebrow>
            {[["Q4 2025", "$0 · pre-NOI"],["Q1 2026", "—"],["Q2 2026", "projected · $125K"]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: t.sans, fontSize: 12 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Exports</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Btn t={t} size="xs" variant="primary">LP letter · PDF</Btn>
              <Btn t={t} size="xs">Lender package</Btn>
              <Btn t={t} size="xs">Investor deck</Btn>
              <Btn t={t} size="xs" variant="ghost">Raw GL · .xlsx</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  VENDORS — COI + 1099
// ═══════════════════════════════════════════════════════════════
const VendorsView = ({ t }) => {
  const [sel, setSel] = useState(3); // Citywide (bad COI) to show detail
  const V = VENDORS[sel];
  const kpis = [
    { label: "Active vendors", value: VENDOR_KPIS.active, sub: "cleaning · HVAC · plumb · etc.", tone: "neutral" },
    { label: "COI expiring",   value: VENDOR_KPIS.coiExpiring + VENDOR_KPIS.coiExpired, sub: "1 expired · 1 in 11d", tone: "bad" },
    { label: "W-9 missing",    value: VENDOR_KPIS.w9Missing, sub: "blocks 1099 at year-end", tone: "warn" },
    { label: "Spend YTD",      value: "$" + fmtNum(VENDOR_KPIS.spendYtd), sub: "trailing · 1099 reportable", tone: "neutral" },
  ];
  const statusTone = { ok: "good", warn: "warn", bad: "bad" };
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}` }}>
          <Band t={t} title="Vendors" right={<Btn t={t} size="xs">Add vendor</Btn>} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>Name</th>
              <th style={dataTH(t)}>Category</th>
              <th style={dataTH(t)}>COI expiry</th>
              <th style={dataTH(t)}>W-9</th>
              <th style={dataTH(t, "right")}>YTD spend</th>
              <th style={dataTH(t)}>Last activity</th>
              <th style={dataTH(t)}>Status</th>
            </tr></thead>
            <tbody>
              {VENDORS.map((v, i) => (
                <tr key={v.id} onClick={() => setSel(i)}
                  style={{ cursor: "pointer", background: i === sel ? t.hover : "transparent", borderLeft: `2px solid ${i === sel ? t.accent : "transparent"}` }}>
                  <td style={dataTD(t)}><span style={{ fontWeight: 500 }}>{v.name}</span></td>
                  <td style={dataTD(t, { color: t.inkSoft })}>{v.category}</td>
                  <td style={dataTD(t, { mono: true, color: v.coiDays < 0 ? t.bad : v.coiDays < 30 ? t.warn : t.inkSoft })}>
                    {v.coi} {v.coiDays < 0 ? <span style={{ color: t.bad }}>· expired</span> : v.coiDays < 30 ? <span style={{ color: t.warn }}> · {v.coiDays}d</span> : ""}
                  </td>
                  <td style={dataTD(t)}>
                    {v.w9 ? <Tag t={t} tone="good">on file</Tag> : <Tag t={t} tone="warn">missing</Tag>}
                  </td>
                  <td style={dataTD(t, { align: "right", mono: true })}>${fmtNum(v.ytd)}</td>
                  <td style={dataTD(t, { color: t.inkSoft })}>{v.last}</td>
                  <td style={dataTD(t)}><Tag t={t} tone={statusTone[v.status]}>{v.status === "bad" ? "blocked" : v.status === "warn" ? "attention" : "ok"}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ overflow: "auto", background: t.surface }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Vendor</Eyebrow>
            <div style={{ fontFamily: t.sans, fontSize: 16, fontWeight: 600 }}>{V.name}</div>
            <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkMute, marginTop: 4 }}>{V.category}</div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Compliance</Eyebrow>
            {[["COI expires", V.coi],["Days out", V.coiDays < 0 ? V.coiDays + "d · expired" : V.coiDays + "d"],["W-9 on file", V.w9 ? "yes" : "no"],["Status", V.status]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: t.sans, fontSize: 12 }}>
                <span style={{ color: t.inkMute }}>{k}</span>
                <span style={{ fontFamily: t.mono, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
          {V.note && (
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
              <div style={{ padding: "10px 12px", background: V.status === "bad" ? t.badSoft : t.warnSoft, borderRadius: 3, fontFamily: t.sans, fontSize: 12.5, color: V.status === "bad" ? t.bad : t.warn, lineHeight: 1.5 }}>{V.note}</div>
            </div>
          )}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.rule}` }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Activity</Eyebrow>
            <div style={{ fontFamily: t.sans, fontSize: 12, color: t.inkSoft }}>Last work: {V.last} · YTD <span style={{ fontFamily: t.mono, color: t.ink }}>${fmtNum(V.ytd)}</span></div>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <Eyebrow t={t} style={{ marginBottom: 10 }}>Actions</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {V.status === "bad" && <Btn t={t} size="xs" variant="primary">Request new COI</Btn>}
              {!V.w9 && <Btn t={t} size="xs">Request W-9</Btn>}
              <Btn t={t} size="xs">Open ledger</Btn>
              <Btn t={t} size="xs" variant="ghost">Pause vendor</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  DOCUMENTS — folder browser
// ═══════════════════════════════════════════════════════════════
const DocumentsView = ({ t }) => {
  const [folder, setFolder] = useState("all");
  const rows = folder === "all" ? RECENT_DOCS : RECENT_DOCS.filter(d => d.folder === DOC_FOLDERS.find(f => f.id === folder)?.label);
  const total = DOC_FOLDERS.reduce((s,f) => s + f.count, 0);
  const kpis = [
    { label: "Documents",       value: fmtNum(total), sub: "across 6 folders", tone: "neutral" },
    { label: "Leases",          value: 121, sub: "all executed · e-sign", tone: "good" },
    { label: "Compliance",      value: 18, sub: "fair housing + legal", tone: "neutral" },
    { label: "Expiring ≤ 30d",  value: 1, sub: "Mike R. HVAC · COI 11d", tone: "warn" },
  ];
  const tagTone = { signed: "good", new: "accent", coi: "neutral" };
  return (
    <div>
      <PageKpis t={t} items={kpis} />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 44px - 96px)" }}>
        <div style={{ borderRight: `1px solid ${t.rule}`, background: t.bg }}>
          <div style={{ padding: "14px 20px" }}><Eyebrow t={t}>Folders</Eyebrow></div>
          <button onClick={() => setFolder("all")} style={{ width: "100%", padding: "10px 20px", textAlign: "left", background: folder === "all" ? t.hover : "transparent", border: "none", borderLeft: `2px solid ${folder === "all" ? t.accent : "transparent"}`, color: folder === "all" ? t.ink : t.inkSoft, fontFamily: t.sans, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>All recent</span>
            <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute }}>{RECENT_DOCS.length}</span>
          </button>
          {DOC_FOLDERS.map(f => (
            <button key={f.id} onClick={() => setFolder(f.id)}
              style={{ width: "100%", padding: "10px 20px", textAlign: "left", background: folder === f.id ? t.hover : "transparent", border: "none", borderLeft: `2px solid ${folder === f.id ? t.accent : "transparent"}`, color: folder === f.id ? t.ink : t.inkSoft, fontFamily: t.sans, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{f.label}</span>
              <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkMute }}>{f.count}</span>
            </button>
          ))}
        </div>
        <div>
          <Band t={t} title={folder === "all" ? "All recent activity" : DOC_FOLDERS.find(f => f.id === folder)?.label}
            right={<div style={{ display: "flex", gap: 6 }}><Btn t={t} size="xs">Upload</Btn><Btn t={t} size="xs" variant="ghost">New folder</Btn></div>} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={dataTH(t)}>File</th>
              <th style={dataTH(t)}>Folder</th>
              <th style={dataTH(t, "right")}>Size</th>
              <th style={dataTH(t)}>Source</th>
              <th style={dataTH(t)}>When</th>
              <th style={dataTH(t)}>Tag</th>
            </tr></thead>
            <tbody>
              {rows.map(d => (
                <tr key={d.id} style={{ cursor: "pointer" }}>
                  <td style={dataTD(t)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 16, height: 18, border: `1px solid ${t.rule}`, borderRadius: 2, background: t.surfaceAlt, flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{d.name}</span>
                    </div>
                  </td>
                  <td style={dataTD(t, { color: t.inkSoft })}>{d.folder}</td>
                  <td style={dataTD(t, { align: "right", mono: true, color: t.inkMute })}>{d.size}</td>
                  <td style={dataTD(t, { color: t.inkSoft })}>{d.by}</td>
                  <td style={dataTD(t, { mono: true, color: t.inkMute })}>{d.at}</td>
                  <td style={dataTD(t)}><Tag t={t} tone={tagTone[d.tag] || "neutral"}>{d.tag}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  ResidentsView, CollectionView, MaintenanceView, LedgerView,
  ListingsView, MarketView, ConcessionsView, PreconView,
  SettingsView, ApplicationsView, LPReportingView, VendorsView, DocumentsView,
});
