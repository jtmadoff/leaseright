/* global React, THEMES, TodayView, RentOptimizer, PipelineView, InboxView, Placeholder, TopBar, Sidebar, CmdK,
   ResidentsView, CollectionView, MaintenanceView, LedgerView, ListingsView, MarketView, ConcessionsView,
   PreconView, SettingsView, ApplicationsView, LPReportingView, VendorsView, DocumentsView */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "terminal",
  "layout": "grid",
  "density": "normal"
}/*EDITMODE-END*/;

const TweaksPanel = ({ open, onClose, state, onChange, t }) => {
  if (!open) return null;
  const Row = ({ label, children, hint }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: t.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: t.inkMute, marginBottom: 8 }}>{label}</div>
      {children}
      {hint && <div style={{ fontFamily: t.sans, fontSize: 11, color: t.inkMute, marginTop: 6, lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
  const Pick = ({ options, value, onChange: oc }) => (
    <div style={{ display: "flex", gap: 2, border: `1px solid ${t.rule}`, borderRadius: 4, padding: 2, background: t.surface }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => oc(v)}
          style={{ flex: 1, padding: "6px 10px", border: "none", background: value === v ? t.ink : "transparent", color: value === v ? t.surface : t.inkSoft, fontFamily: t.sans, fontSize: 11.5, fontWeight: 500, cursor: "pointer", borderRadius: 3, letterSpacing: 0.1 }}>
          {l}
        </button>
      ))}
    </div>
  );
  const th = THEMES[state.theme];
  const hints = {
    terminal: "Deep-black shell, saturated accents, dense data. Bloomberg-terminal energy.",
    graphite: "Near-mono grayscale, indigo accent. Flat, keyboard-first — Linear energy.",
    quant: "Neutral cool, Stripe blue, surgical color. Modern dashboard energy.",
  };
  const layoutHints = {
    queue: "Prioritized inbox of decisions · detail pane right.",
    grid: "KPI strip + 2-col panels · velocity, progress, unit mix, funnel.",
    table: "Single master table · filter by status, sort, export.",
  };
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, width: 300, background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 6, padding: 18, zIndex: 150, boxShadow: "0 20px 48px rgba(0,0,0,0.14)", fontFamily: t.sans }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ fontFamily: t.sans, fontSize: 12, fontWeight: 600, color: t.ink, letterSpacing: 0.2 }}>Tweaks</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: t.inkMute, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
      <Row label="Aesthetic" hint={hints[state.theme]}>
        <Pick options={[["terminal", "Terminal"], ["graphite", "Graphite"], ["quant", "Quant"]]} value={state.theme} onChange={v => onChange({ theme: v })} />
      </Row>
      <Row label="Today layout" hint={layoutHints[state.layout]}>
        <Pick options={[["queue", "Queue"], ["grid", "Grid"], ["table", "Table"]]} value={state.layout} onChange={v => onChange({ layout: v })} />
      </Row>
      <Row label="Density">
        <Pick options={[["tight", "Tight"], ["normal", "Normal"], ["open", "Open"]]} value={state.density} onChange={v => onChange({ density: v })} />
      </Row>
    </div>
  );
};

const App = () => {
  const [tweaks, setTweaks] = useState(() => {
    // v8 — new terminal theme, reset stored tweaks
    try { return { ...TWEAK_DEFAULTS, ...JSON.parse(localStorage.getItem("leaseright_tweaks_v1") || "{}") }; } catch { return TWEAK_DEFAULTS; }
  });
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState(() => localStorage.getItem("leaseright_tab_v1") || "today");
  const [propIdx, setPropIdx] = useState(0);
  const [cmdK, setCmdK] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem("leaseright_tab_v1", tab); }, [tab]);
  useEffect(() => { localStorage.setItem("leaseright_tweaks_v1", JSON.stringify(tweaks)); }, [tweaks]);

  // Remove splash once we've rendered.
  useEffect(() => {
    const s = document.getElementById("splash");
    if (!s) return;
    requestAnimationFrame(() => {
      s.classList.add("gone");
      setTimeout(() => s.remove(), 240);
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "__activate_edit_mode") setEditMode(true);
      if (e.data?.type === "__deactivate_edit_mode") setEditMode(false);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const k = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdK(v => !v); }
      if (e.key === "Escape") { setCmdK(false); setSidebar(false); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const updateTweaks = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*");
  };

  const t = THEMES[tweaks.theme];

  const setLayout = (l) => updateTweaks({ layout: l });

  let body;
  if (tab === "today") body = <TodayView t={t} layout={tweaks.layout} />;
  else if (tab === "rents") body = <RentOptimizer t={t} />;
  else if (tab === "pipeline") body = <PipelineView t={t} />;
  else if (tab === "inbox" || tab === "messages") body = <InboxView t={t} />;
  else if (tab === "residents") body = <ResidentsView t={t} />;
  else if (tab === "collection") body = <CollectionView t={t} />;
  else if (tab === "maintenance") body = <MaintenanceView t={t} />;
  else if (tab === "ledger") body = <LedgerView t={t} />;
  else if (tab === "listings") body = <ListingsView t={t} />;
  else if (tab === "market") body = <MarketView t={t} />;
  else if (tab === "concessions") body = <ConcessionsView t={t} />;
  else if (tab === "precon") body = <PreconView t={t} />;
  else if (tab === "settings") body = <SettingsView t={t} />;
  else if (tab === "applications") body = <ApplicationsView t={t} />;
  else if (tab === "lp") body = <LPReportingView t={t} />;
  else if (tab === "vendors") body = <VendorsView t={t} />;
  else if (tab === "documents") body = <DocumentsView t={t} />;
  else body = <Placeholder t={t} which={tab} />;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.ink, display: "flex", flexDirection: "column", fontFamily: t.sans, fontSize: t.baseSize }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes pulseDot { 0% { transform: scale(0.8); opacity: 0.4; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tickGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(91,91,214,0); } 50% { box-shadow: 0 0 0 4px rgba(91,91,214,0.15); } }
        @keyframes slideFromRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideFromLeft  { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
        * { box-sizing: border-box; }
        body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-feature-settings: "cv11", "ss01"; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${t.rule}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.inkFaint}; }
        ::selection { background: ${t.accentSoft}; }
        button:focus-visible { outline: 2px solid ${t.accent}; outline-offset: 1px; }
      `}</style>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar t={t} tab={tab} setTab={setTab} onCmdK={() => setCmdK(true)} layout={tweaks.layout} setLayout={setLayout} propIdx={propIdx} setPropIdx={setPropIdx} onToggleSidebar={() => setSidebar(v => !v)} />
        <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>{body}</div>
      </div>
      <Sidebar t={t} open={sidebar} onClose={() => setSidebar(false)} tab={tab} setTab={setTab} />
      <CmdK t={t} open={cmdK} onClose={() => setCmdK(false)} setTab={setTab} />
      <TweaksPanel open={editMode} onClose={() => { setEditMode(false); window.parent.postMessage({ type: "__deactivate_edit_mode" }, "*"); }} state={tweaks} onChange={updateTweaks} t={t} />
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", background: t.ink, color: t.surface, padding: "8px 14px", borderRadius: 4, fontFamily: t.sans, fontSize: 12, animation: "toastIn 180ms ease-out", zIndex: 300 }}>{toast}</div>}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
