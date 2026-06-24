/* global React, THEMES, INBOX_THREADS, INBOX_FILTERS, Dot, Tag, Btn, Kbd, Eyebrow, fmtNum */
const { useState, useMemo, useEffect, useRef } = React;

// ═══════════════════════════════════════════════════════════════
//  INBOX · conversational
//  Layout: [ThreadList · 320px] · [Conversation · flex] · [Context · 300px]
//  Terse, keyboard-friendly. Auto-drafts shown as cards above composer.
// ═══════════════════════════════════════════════════════════════

const inboxInitials = (name) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const INBOX_AVATAR_COLORS = ["#F5A524", "#22D3EE", "#22C55E", "#E879F9"];
const avatarColorFor = (name) => INBOX_AVATAR_COLORS[name.charCodeAt(0) % INBOX_AVATAR_COLORS.length];

const kindGlyph = {
  resident: "R",
  prospect: "P",
  vendor:   "V",
};

const channelGlyph = {
  SMS: "SMS",
  Email: "EML",
  Zillow: "ZIL",
  "Apt.com": "APT",
};

// ── Thread row ───────────────────────────────────────────────────
const ThreadRow = ({ t, thread, active, onClick }) => {
  const [hover, setHover] = useState(false);
  const toneC = thread.tone === "bad" ? t.bad : thread.tone === "warn" ? t.warn : thread.tone === "good" ? t.good : t.inkSoft;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "10px 12px 10px 10px",
        borderBottom: `1px solid ${t.ruleSoft}`,
        borderLeft: active ? `2px solid ${t.accent}` : thread.unread > 0 ? `2px solid ${toneC}` : "2px solid transparent",
        background: active ? t.hover : hover ? t.surfaceAlt : "transparent",
        cursor: "pointer",
        transition: "background 120ms",
        position: "relative",
      }}
    >
      {/* Line 1 — unit chip · name · timestamp */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <span style={{
          fontFamily: t.mono,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 0.3,
          color: t.inkSoft,
          background: t.bg,
          border: `1px solid ${t.rule}`,
          padding: "2px 5px",
          borderRadius: 2,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>{thread.unit}</span>
        <span style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink, fontWeight: thread.unread > 0 ? 600 : 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {thread.name}
        </span>
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.2 }}>{thread.lastAt}</span>
      </div>
      {/* Line 2 — kind · channel */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, color: toneC, letterSpacing: 0.6, textTransform: "uppercase" }}>{thread.kind}</span>
        <span style={{ fontFamily: t.mono, fontSize: 9, color: t.inkMute }}>·</span>
        <span style={{ fontFamily: t.mono, fontSize: 9, color: t.inkMute, letterSpacing: 0.3 }}>{channelGlyph[thread.channel] || thread.channel}</span>
      </div>
      {/* Line 3 — summary */}
      <div style={{ fontFamily: t.sans, fontSize: 11.5, color: thread.unread > 0 ? t.inkSoft : t.inkMute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
        {thread.summary}
      </div>
      {thread.unread > 0 && (
        <span style={{ position: "absolute", right: 10, bottom: 10, background: t.accent, color: "#0A0A0B", fontFamily: t.mono, fontSize: 9, fontWeight: 700, padding: "1px 5px", letterSpacing: 0.2 }}>
          {thread.unread}
        </span>
      )}
      {thread.sla && (
        <span style={{ position: "absolute", right: 10, top: 10, width: 5, height: 5, borderRadius: "50%", background: t.bad, animation: "pulseDot 1.6s infinite" }} />
      )}
    </div>
  );
};

// ── Message bubble ───────────────────────────────────────────────
const Bubble = ({ t, msg, thread }) => {
  const isThem = msg.from === "them";
  const isAuto = msg.from === "auto";
  const mono = inboxInitials(thread.name);
  const monoC = avatarColorFor(thread.name);

  if (isAuto) {
    return (
      <div style={{ padding: "8px 0", margin: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 14, height: 1, background: t.rule }} />
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600 }}>
            AUTO
          </span>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.inkMute, letterSpacing: 0.3 }}>·</span>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.inkMute, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{msg.at}</span>
          <span style={{ flex: 1, height: 1, background: t.rule }} />
        </div>
        <div style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkSoft, fontStyle: "italic", textAlign: "center", padding: "0 20px", lineHeight: 1.4 }}>
          {msg.body}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "10px 0", justifyContent: isThem ? "flex-start" : "flex-end" }}>
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isThem ? "flex-start" : "flex-end", gap: 3 }}>
        <div style={{
          padding: "9px 13px",
          background: isThem ? t.surface : t.accent,
          color: isThem ? t.ink : "#0A0A0B",
          border: isThem ? `1px solid ${t.rule}` : "none",
          borderRadius: 4,
          borderTopLeftRadius: isThem ? 2 : 4,
          borderTopRightRadius: isThem ? 4 : 2,
          fontFamily: t.sans,
          fontSize: 13,
          lineHeight: 1.45,
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
        }}>
          {msg.body}
        </div>
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{msg.at}</span>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────
const InboxView = ({ t }) => {
  const [filter, setFilter] = useState("all");
  const [threads, setThreads] = useState(INBOX_THREADS);
  const [activeId, setActiveId] = useState(INBOX_THREADS[0].id);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  const filtered = useMemo(() => {
    return threads.filter(th => {
      if (filter === "all") return true;
      if (filter === "unread") return th.unread > 0;
      if (filter === "sla") return th.sla;
      return th.kind === filter;
    });
  }, [threads, filter]);

  const active = threads.find(th => th.id === activeId);

  // KPIs
  const unreadCount = threads.filter(t => t.unread > 0).length;
  const slaCount = threads.filter(t => t.sla).length;
  const avgFirstReply = "8m";

  // scroll to bottom when switching thread
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeId]);

  const sendMessage = (body) => {
    if (!body?.trim()) return;
    setThreads(prev => prev.map(th => th.id === activeId ? { ...th, messages: [...th.messages, { at: "now", from: "you", body }], unread: 0, lastAt: "now" } : th));
    setDraft("");
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 72px)" }}>
      {/* COMPACT HEADER BAR — single line */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.rule}`, padding: "8px 16px", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: t.accent }}>F3 · INBOX</span>
        <span style={{ width: 1, height: 10, background: t.rule }} />
        <span style={{ fontFamily: t.sans, fontSize: 11.5, color: t.inkMute }}>The Meridian</span>
        <span style={{ width: 1, height: 10, background: t.rule }} />

        {/* inline metrics */}
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.3, textTransform: "uppercase" }}>Unread</span>
        <span style={{ fontFamily: t.mono, fontSize: 13, color: t.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{unreadCount}</span>

        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.3, textTransform: "uppercase", marginLeft: 8 }}>SLA</span>
        <span style={{ fontFamily: t.mono, fontSize: 13, color: slaCount > 0 ? t.bad : t.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 5 }}>
          {slaCount}
          {slaCount > 0 && <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.bad, animation: "pulseDot 1.6s infinite" }} />}
        </span>

        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.3, textTransform: "uppercase", marginLeft: 8 }}>Avg reply</span>
        <span style={{ fontFamily: t.mono, fontSize: 13, color: t.good, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{avgFirstReply}</span>

        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.3, textTransform: "uppercase", marginLeft: 8 }}>Auto</span>
        <span style={{ fontFamily: t.mono, fontSize: 13, color: t.good, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>62%</span>

        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.4 }}>⏎ reply · J/K navigate · ⌘↵ send</span>
      </div>

      {/* BODY — 3 panes */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* LEFT — thread list */}
        <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${t.rule}`, background: t.surface, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Filter chips */}
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${t.rule}`, display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 }}>
            {INBOX_FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: "4px 9px",
                fontFamily: t.mono,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: 0.3,
                border: "none",
                background: filter === f.id ? t.accent : "transparent",
                color: filter === f.id ? "#0A0A0B" : t.inkSoft,
                cursor: "pointer",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
              }}>{f.label}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map(th => (
              <ThreadRow key={th.id} t={t} thread={th} active={th.id === activeId} onClick={() => setActiveId(th.id)} />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", fontFamily: t.mono, fontSize: 10, color: t.inkFaint, letterSpacing: 0.4 }}>
                NO THREADS · {filter.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE — conversation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: t.bg }}>
          {active && (
            <>
              {/* Thread header */}
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${t.rule}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: t.surface }}>
                <span style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  color: t.inkSoft,
                  background: t.bg,
                  border: `1px solid ${t.rule}`,
                  padding: "3px 7px",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                }}>{active.unit}</span>
                <div>
                  <div style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink, fontWeight: 600 }}>{active.name}</div>
                  <div style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.3 }}>
                    {active.kind.toUpperCase()} · {active.channel}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                {active.sla && <Tag t={t} tone="bad">SLA · {active.lastAt}</Tag>}
                <Btn t={t} variant="ghost" size="xs">···</Btn>
              </div>

              {/* Messages */}
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "10px 18px 16px", minHeight: 0 }}>
                {active.messages.map((m, i) => <Bubble key={i} t={t} msg={m} thread={active} />)}
              </div>

              {/* Suggested replies */}
              {active.suggested?.length > 0 && (
                <div style={{ padding: "10px 14px 6px", borderTop: `1px solid ${t.rule}`, background: t.surface, flexShrink: 0 }}>
                  <div style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, letterSpacing: 1, color: t.inkMute, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 5, height: 5, background: t.accent, borderRadius: "50%" }} />
                    SUGGESTED · AUTO
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {active.suggested.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)} style={{
                        padding: "6px 10px",
                        fontFamily: t.sans,
                        fontSize: 11.5,
                        border: `1px solid ${t.rule}`,
                        background: t.bg,
                        color: t.inkSoft,
                        cursor: "pointer",
                        borderRadius: 3,
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.ink; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = t.rule; e.currentTarget.style.color = t.inkSoft; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Composer */}
              <div style={{ padding: "10px 14px", borderTop: `1px solid ${t.rule}`, background: t.surface, flexShrink: 0, display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendMessage(draft); } }}
                  placeholder={`Message ${active.name}… (⌘↵ to send)`}
                  rows={2}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontFamily: t.sans,
                    fontSize: 13,
                    background: t.bg,
                    color: t.ink,
                    border: `1px solid ${t.rule}`,
                    borderRadius: 3,
                    outline: "none",
                    resize: "none",
                    lineHeight: 1.4,
                  }}
                />
                <Btn t={t} variant="accent" size="sm" onClick={() => sendMessage(draft)}>Send</Btn>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — context */}
        <div style={{ width: 248, flexShrink: 0, borderLeft: `1px solid ${t.rule}`, background: t.surface, display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto" }}>
          {active && (
            <>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${t.rule}` }}>
                <Eyebrow t={t} style={{ marginBottom: 6 }}>CONTEXT · {active.kind.toUpperCase()}</Eyebrow>
                <div style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink, fontWeight: 600 }}>{active.name}</div>
                <div style={{ fontFamily: t.mono, fontSize: 10, color: t.inkMute, letterSpacing: 0.2, marginTop: 2 }}>{active.unit}</div>
              </div>

              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.rule}` }}>
                <Eyebrow t={t} style={{ marginBottom: 8 }}>FACTS</Eyebrow>
                {active.facts.map(([l, v], i) => (
                  <div key={i} style={{ display: "flex", padding: "4px 0", fontSize: 11.5 }}>
                    <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.inkMute, letterSpacing: 0.3, width: 90, flexShrink: 0 }}>{l.toUpperCase()}</span>
                    <span style={{ color: t.ink, flex: 1, fontFamily: t.sans }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "10px 14px" }}>
                <Eyebrow t={t} style={{ marginBottom: 8 }}>QUICK ACTIONS</Eyebrow>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {active.kind === "resident" && ["Open maintenance ticket", "Schedule call", "Send lease doc", "Payment history"].map((a, i) => (
                    <button key={i} style={{ padding: "7px 10px", fontFamily: t.sans, fontSize: 11.5, textAlign: "left", border: `1px solid ${t.rule}`, background: "transparent", color: t.inkSoft, cursor: "pointer", borderRadius: 3 }}
                      onMouseEnter={e => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.ink; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.inkSoft; }}>
                      {a}
                    </button>
                  ))}
                  {active.kind === "prospect" && ["Book tour", "Send application", "Move to Applied", "View lead details"].map((a, i) => (
                    <button key={i} style={{ padding: "7px 10px", fontFamily: t.sans, fontSize: 11.5, textAlign: "left", border: `1px solid ${t.rule}`, background: "transparent", color: t.inkSoft, cursor: "pointer", borderRadius: 3 }}
                      onMouseEnter={e => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.ink; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.inkSoft; }}>
                      {a}
                    </button>
                  ))}
                  {active.kind === "vendor" && ["Approve invoice", "View past invoices", "Request update", "Escalate"].map((a, i) => (
                    <button key={i} style={{ padding: "7px 10px", fontFamily: t.sans, fontSize: 11.5, textAlign: "left", border: `1px solid ${t.rule}`, background: "transparent", color: t.inkSoft, cursor: "pointer", borderRadius: 3 }}
                      onMouseEnter={e => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.ink; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.inkSoft; }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { InboxView });
