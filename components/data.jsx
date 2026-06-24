/* global React */
const { useState, useEffect, useRef, useMemo } = React;

const THEMES = {
  terminal: {
    name: "Terminal",
    // Layered blacks: bg < surface < surfaceAlt (lighter = closer to you)
    bg: "#0A0A0B",          // app shell
    surface: "#111113",      // panels on top of bg
    surfaceAlt: "#17171A",   // inset / hover
    hover: "#1D1D21",
    // Text
    ink: "#F4F4F5",          // primary text, numbers
    inkSoft: "#A1A1AA",      // secondary labels
    inkMute: "#6B6B74",      // tertiary, eyebrows
    inkFaint: "#3F3F46",     // disabled, faint rules
    // Rules — whisper-thin white at low alpha
    rule: "rgba(255,255,255,0.08)",
    ruleSoft: "rgba(255,255,255,0.04)",
    // Saturated accent palette — true Bloomberg terminal
    accent: "#F5A524",       // amber "action" primary (Bloomberg orange)
    accentSoft: "rgba(245,165,36,0.12)",
    good: "#22C55E",         // saturated green
    goodSoft: "rgba(34,197,94,0.14)",
    warn: "#F5A524",         // amber
    warnSoft: "rgba(245,165,36,0.14)",
    bad: "#EF4444",          // saturated red
    badSoft: "rgba(239,68,68,0.14)",
    // Extra Bloomberg accents for tape, tickers
    cyan: "#22D3EE",
    magenta: "#E879F9",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    dark: true,
  },
  graphite: {
    name: "Graphite",
    bg: "#FAFAFA", surface: "#FFFFFF", surfaceAlt: "#F4F4F5", hover: "#F4F4F5",
    ink: "#18181B", inkSoft: "#52525B", inkMute: "#A1A1AA", inkFaint: "#D4D4D8",
    rule: "#E4E4E7", ruleSoft: "#F1F1F3",
    accent: "#5B5BD6", accentSoft: "#EEEEFB",
    good: "#2F7A4C", goodSoft: "#E7F2EC",
    warn: "#B07A1F", warnSoft: "#F5ECD7",
    bad: "#B4463B", badSoft: "#F5DEDA",
    cyan: "#0EA5E9", magenta: "#A21CAF",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    dark: false,
  },
  quant: {
    name: "Quant",
    bg: "#F6F7F9", surface: "#FFFFFF", surfaceAlt: "#F1F3F6", hover: "#EEF1F5",
    ink: "#0B1220", inkSoft: "#495362", inkMute: "#8A93A3", inkFaint: "#CDD3DC",
    rule: "#E4E8EE", ruleSoft: "#EEF1F5",
    accent: "#1E6FEB", accentSoft: "#E3EEFD",
    good: "#17855A", goodSoft: "#DDEFE6",
    warn: "#B4641A", warnSoft: "#F4E5D0",
    bad: "#C0392B", badSoft: "#F6DDD9",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
};

const PROPERTIES = [
  { id: "meridian", name: "The Meridian", city: "Austin, TX", units: 260, leased: 121, pace: "ahead", ahead: 3, co: "Dec 15, 2025", monthsIn: 3.3, budget: 18 },
  { id: "luminary", name: "Luminary Midtown", city: "Nashville, TN", units: 188, leased: 42, pace: "on", ahead: 0 },
  { id: "brix", name: "Brix on Sixth", city: "Denver, CO", units: 142, leased: 98, pace: "behind", ahead: -5 },
];

// Actual vs plan curves, week-by-week, 0..78 weeks
const PLAN_CURVE = Array.from({ length: 79 }, (_, w) => Math.round(242 * (1 - Math.exp(-w / 28))));
const ACTUAL_CURVE = [0,1,3,6,10,15,22,30,39,49,60,71,82,93,105,121]; // thru week 15 (~3.3mo)
const PROJECTED_CURVE = (() => {
  const arr = [...ACTUAL_CURVE];
  const rate = 9.2 / 7 * 7; // ~9.2/wk
  let v = arr[arr.length - 1];
  for (let w = arr.length; w <= 78; w++) { v = Math.min(260, v + 9.2); arr.push(Math.round(v)); }
  return arr;
})();

// Four primary numbers ONLY
const HEADLINE = {
  pace: "+3 units ahead",
  paceTone: "good",
  velocity: 9.2,
  velocityPlan: 7.0,
  daysToGoal: 163,
  daysToGoalBaseline: 193,
  carry: 22740,
};

// Only true decisions, max 3 — carousel in the black zone
const PRIORITIES = [
  {
    id: "p1", rank: 1, kind: "pricing", tone: "bad", toneLabel: "HIGH RISK",
    eyebrow: "PRICING",
    headline: "3-bedrooms have stalled.",
    lines: [
      "6 of 28 leased. 52 days on market.",
      "Comps sit $250 below our ask.",
    ],
    recLine: "Drop asking to $3,200 — still $50 above both comps.",
    score: { total: 94, impact: 38, risk: 32, recency: 24 },
    impactLabel: "−$5.6K/mo carry · unblocks 22 units",
    primary: { label: "Accept · $3,200", kbd: "↵", value: 3200 },
    alt: [{ label: "Add parking concession" }, { label: "Hold", ghost: true }],
    owner: "J. Mori",
    context: { baseline: 3400, target: 3200, units: 22, comps: [
      { v: 3100, l: "The Vance",  c: "#ff9b87" },
      { v: 3150, l: "Ovation",    c: "#ffcc73" },
      { v: 3240, l: "Halcyon",    c: "rgba(255,255,255,0.55)" },
    ]},
  },
  {
    id: "p2", rank: 2, kind: "lead", tone: "bad", toneLabel: "SLA BREACH",
    eyebrow: "HOT LEAD",
    headline: "Alex Rivera is past SLA.",
    lines: [
      "Inquired 5h 12m ago · 2BR-1204.",
      "Toured The Vance and Ovation same day.",
    ],
    recLine: "Call within 10 minutes — score 92, pre-check passed.",
    score: { total: 87, impact: 26, risk: 38, recency: 23 },
    impactLabel: "$2,800/mo lease at risk · score 92",
    primary: { label: "Call now", kbd: "↵" },
    alt: [{ label: "Assign to Priya" }, { label: "Text template", ghost: true }],
    owner: "Priya S.",
  },
  {
    id: "p3", rank: 3, kind: "concession", tone: "warn", toneLabel: "DEADLINE",
    eyebrow: "CONCESSION",
    headline: "\u201C1 month free\u201D expires May 31.",
    lines: [
      "14 leases signed under it · best-performing program.",
      "69 eligible units still vacant.",
    ],
    recLine: "Extend through Jul 31 to protect $380K ARR.",
    score: { total: 79, impact: 42, risk: 21, recency: 16 },
    impactLabel: "+$380K ARR protected",
    primary: { label: "Extend to Jul 31", kbd: "↵" },
    alt: [{ label: "Narrow to 3BR only" }, { label: "Let expire", ghost: true }],
    owner: "J. Mori",
  },
];

// Legacy QUEUE still referenced by other layouts — keep slim
const QUEUE = PRIORITIES.map(p => ({
  id: p.id, kind: p.kind, priority: p.rank, status: p.tone === "bad" ? "act" : "sla",
  subject: p.headline, summary: p.lines[0],
  detail: p.recLine,
  meta: { impact: p.impactLabel, risk: p.tone === "bad" ? "high" : "medium", owner: p.owner },
  actions: [{ id: "a1", label: p.primary.label, primary: true, kbd: p.primary.kbd }, ...p.alt.map((a, i) => ({ id: "a" + (i+2), label: a.label, ghost: a.ghost }))],
}));

// Top-nav peek data
const NAV_PEEKS = {
  today:     { status: "3 decisions queued", tone: "warn",    detail: "01 Pricing · 02 Lead · 03 Concession" },
  pipeline:  { status: "2 SLA breaches",     tone: "bad",     detail: "Alex Rivera 5h · Marcus Webb 4h" },
  inbox:     { status: "4 unread",           tone: "accent",  detail: "2 residents · 1 prospect · 1 vendor" },
  rents:     { status: "1 recommended drop", tone: "warn",    detail: "3BR · $3,400 → $3,200 suggested" },
  residents: { status: "3 failed payments",  tone: "bad",     detail: "Auto-retry scheduled tonight" },
  ledger:    { status: "Reconciled · 2m ago",tone: "good",    detail: "Operating + Escrow in sync" },
};

// Watching (demoted from queue — not decisions, just awareness)
const WATCHING = [
  { text: "The Vance bumped to 2 months free · 0.4 mi", tone: "warn" },
  { text: "3 rent payments failed overnight · auto-retry set", tone: "neutral" },
  { text: "Unit 815 move-in tomorrow · lease unsigned", tone: "warn" },
];

// Pricing area
const UNIT_MATRIX = [
  { id: "studio", type: "Studio",  total: 60,  leased: 38, apps: 4, asking: 1650, effective: 1580, comp: 1590, dom: 11, vel: 2.3 },
  { id: "1b",     type: "1 Bed",   total: 100, leased: 52, apps: 6, asking: 2100, effective: 2010, comp: 2050, dom: 18, vel: 2.9 },
  { id: "2b",     type: "2 Bed",   total: 72,  leased: 25, apps: 3, asking: 2800, effective: 2680, comp: 2620, dom: 34, vel: 1.6 },
  { id: "3b",     type: "3 Bed",   total: 28,  leased: 6,  apps: 0, asking: 3400, effective: 3250, comp: 3150, dom: 52, vel: 0.4, suggested: 3200 },
];

const PROSPECTS = [
  // NEW — just inquired, no contact yet
  { id: "pr01", name: "Alex Rivera",      stage: "new",       unit: "2BR-1204",  age: "5h 12m",  source: "Zillow",   score: 92, sla: true,  move: "Jun 1",  budget: 2800, note: "Toured Vance + Ovation same day" },
  { id: "pr02", name: "Devon Carter",     stage: "new",       unit: "1BR",       age: "2h 04m",  source: "Apt.com",  score: 74, sla: false, move: "Jul 1",  budget: 2100, note: "First-time renter · W-2 verified" },
  { id: "pr03", name: "Nadia Rashid",     stage: "new",       unit: "Studio",    age: "22m",     source: "Zumper",   score: 68, sla: false, move: "Jun 15", budget: 1700, note: "Grad student · guarantor" },
  { id: "pr04", name: "Ben Flores",       stage: "new",       unit: "2BR",       age: "47m",     source: "Direct",   score: 81, sla: false, move: "Aug 1",  budget: 2900, note: "Relocating from SF" },
  // CONTACTED — reached out, awaiting tour
  { id: "pr05", name: "Priya Shankar",    stage: "contacted", unit: "1BR",       age: "1d 4h",   source: "Apt.com",  score: 78, sla: false, move: "Jun 20", budget: 2150, note: "Likes 706 · awaiting tour slot" },
  { id: "pr06", name: "Ryan Ng",          stage: "contacted", unit: "2BR",       age: "3h",      source: "Zillow",   score: 83, sla: false, move: "Jun 5",  budget: 2800, note: "Looking with partner" },
  { id: "pr07", name: "Zoe Abara",        stage: "contacted", unit: "Studio",    age: "9h",      source: "Referral", score: 77, sla: false, move: "Jul 1",  budget: 1650, note: "Referred by Unit 412 Priya" },
  // TOURED
  { id: "pr08", name: "Tom & Liv Brooks", stage: "toured",    unit: "2BR",       age: "3d",      source: "Drive-by", score: 64, sla: false, move: "Jul 15", budget: 2700, note: "Comparing 3 properties" },
  { id: "pr09", name: "Marcus Webb",      stage: "toured",    unit: "3BR-0812",  age: "1d",      source: "Direct",   score: 84, sla: false, move: "Jun 1",  budget: 3300, note: "Family of 4 · ready to apply" },
  { id: "pr10", name: "Hana Ito",         stage: "toured",    unit: "1BR",       age: "2d",      source: "Zillow",   score: 79, sla: false, move: "Aug 1",  budget: 2000, note: "Toured Tue · silent since" },
  { id: "pr11", name: "Luka Petrov",      stage: "toured",    unit: "2BR",       age: "4d",      source: "Apt.com",  score: 58, sla: false, move: "Jul 1",  budget: 2500, note: "Credit marginal · needs cosign" },
  // APPLIED
  { id: "pr12", name: "Jordan Kim",       stage: "applied",   unit: "Studio",    age: "1d",      source: "Referral", score: 71, sla: false, move: "Jun 10", budget: 1600, note: "Background in progress" },
  { id: "pr13", name: "Kira Weston",      stage: "applied",   unit: "2BR-0914",  age: "6h",      source: "Zillow",   score: 86, sla: false, move: "Jun 1",  budget: 2750, note: "Clean credit · underwriting" },
  { id: "pr14", name: "Andre Dumas",      stage: "applied",   unit: "1BR",       age: "2d",      source: "Direct",   score: 69, sla: false, move: "Jul 1",  budget: 2100, note: "Waiting on employer verify" },
  // APPROVED
  { id: "pr15", name: "Sarah Chen",       stage: "approved",  unit: "1BR-0706",  age: "6h",      source: "Zillow",   score: 88, sla: false, move: "Jun 15", budget: 2150, note: "Lease sent · awaiting signature" },
  { id: "pr16", name: "Miguel Torres",    stage: "approved",  unit: "2BR",       age: "1d",      source: "Apt.com",  score: 91, sla: false, move: "Jun 1",  budget: 2850, note: "Deposit received" },
  // SIGNED
  { id: "pr17", name: "Ethan Park",       stage: "signed",    unit: "2BR-0710",  age: "1h",      source: "Referral", score: 95, sla: false, move: "Jun 1",  budget: 2800, note: "Move-in Jun 1 · confirmed" },
  { id: "pr18", name: "Maya Holloway",    stage: "signed",    unit: "Studio-204",age: "3h",      source: "Zillow",   score: 89, sla: false, move: "May 28", budget: 1650, note: "Keys delivered yesterday" },
];

const STAGES = [
  { id: "new",       label: "New",       count: 12, color: "cyan" },
  { id: "contacted", label: "Contacted", count: 23, color: "neutral" },
  { id: "toured",    label: "Toured",    count: 19, color: "neutral" },
  { id: "applied",   label: "Applied",   count: 14, color: "warn" },
  { id: "approved",  label: "Approved",  count: 8,  color: "good" },
  { id: "signed",    label: "Signed",    count: 7,  color: "good" },
];

// ═══════════════════════════════════════════════════════════════
//  INBOX — conversational threads
// ═══════════════════════════════════════════════════════════════
const INBOX_THREADS = [
  {
    id: "t01",
    kind: "resident",
    name: "Jamie Patel",
    unit: "U-312",
    channel: "SMS",
    tone: "bad",
    lastAt: "2h",
    unread: 2,
    sla: true,
    summary: "AC not cooling · urgent",
    messages: [
      { at: "Tue 8:12a",  from: "them", body: "Hi — AC has been blowing warm since yesterday afternoon. Pretty hot in the unit now." },
      { at: "Tue 8:14a",  from: "auto", body: "Thanks Jamie — maintenance ticket MT-4821 opened. ETA within 24h." },
      { at: "Tue 10:02a", from: "them", body: "Still nothing? It's 86° in here." },
      { at: "Tue 10:04a", from: "them", body: "Need help today please." },
    ],
    facts: [["Unit","312 · 2BR"],["Lease start","Mar 2024"],["On-time","18 of 18 · 100%"],["Renewal","Mar 2026"]],
    suggested: ["Dispatch Mike · ETA 45m","Escalate to supervisor","Offer 1-night hotel credit"],
  },
  {
    id: "t02",
    kind: "prospect",
    name: "Alex Rivera",
    unit: "2BR-1204",
    channel: "Zillow",
    tone: "good",
    lastAt: "12m",
    unread: 1,
    sla: false,
    summary: "Can I tour Saturday?",
    messages: [
      { at: "Today 9:18a", from: "them", body: "Saw the 2BR on Zillow — is this still available? Looking for a Jun 1 move." },
      { at: "Today 9:20a", from: "auto", body: "Yes — unit 1204 is open. 2BR / 2BA / 1,120 sqft · $2,800/mo." },
      { at: "Today 9:22a", from: "them", body: "Can I tour Saturday afternoon? I can come by any time after 1." },
    ],
    facts: [["Source","Zillow"],["Score","92 / 100"],["Budget","$2,800"],["Move-in","Jun 1"]],
    suggested: ["Book Saturday 2pm","Reply with 3 time slots","Hand off to Priya"],
  },
  {
    id: "t03",
    kind: "vendor",
    name: "Paragon Cleaning",
    unit: "Vendor",
    channel: "Email",
    tone: "neutral",
    lastAt: "5h",
    unread: 1,
    sla: false,
    summary: "Invoice #4412 · $1,840",
    messages: [
      { at: "Mon 2:40p",  from: "them", body: "April turn cleaning complete — 12 units. Invoice #4412 attached, $1,840." },
      { at: "Tue 5h ago", from: "them", body: "Following up — please let me know if you need anything else to process." },
    ],
    facts: [["Invoice","#4412"],["Amount","$1,840"],["Terms","Net 30"],["Last paid","Mar 14"]],
    suggested: ["Approve · send to Ledger","Hold for review","Forward to accounting"],
  },
  {
    id: "t04",
    kind: "resident",
    name: "Tomas Vargas",
    unit: "U-805",
    channel: "SMS",
    tone: "warn",
    lastAt: "5h",
    unread: 0,
    sla: false,
    summary: "Noise complaint · 804",
    messages: [
      { at: "Mon 11:40p", from: "them", body: "Sorry to bother — 804 has been loud most nights this week. Can someone follow up?" },
      { at: "Today 7:02a",from: "you",  body: "Thanks Tomas — logged NC-331. I'll speak to them today." },
    ],
    facts: [["Unit","805 · 1BR"],["Lease start","Sep 2024"],["Prior notes","0"]],
    suggested: ["Send courtesy notice to 804","Mark resolved","Escalate"],
  },
  {
    id: "t05",
    kind: "prospect",
    name: "Hana Ito",
    unit: "1BR",
    channel: "Apt.com",
    tone: "neutral",
    lastAt: "2d",
    unread: 0,
    sla: false,
    summary: "Silent since tour",
    messages: [
      { at: "Sat 2:02p",  from: "them", body: "Thanks for the tour!" },
      { at: "Sat 2:04p",  from: "you",  body: "Any time Hana. Let me know if you have questions — application link if you want it: leaseright.app/apply" },
    ],
    facts: [["Source","Apt.com"],["Score","79"],["Last touch","2d ago"]],
    suggested: ["Send follow-up template","Try phone call","Demote to watch"],
  },
  {
    id: "t06",
    kind: "resident",
    name: "Nia Blackwell",
    unit: "U-211",
    channel: "SMS",
    tone: "bad",
    lastAt: "18h",
    unread: 1,
    sla: false,
    summary: "Payment failed overnight",
    messages: [
      { at: "Tue 2:14a",  from: "auto", body: "Payment of $2,150 failed (insufficient funds). Auto-retry scheduled for tonight." },
      { at: "Tue 7:48a",  from: "them", body: "Saw the text — can you push it to Friday? Just got paid yesterday, funds land Thu." },
    ],
    facts: [["Unit","211 · 1BR"],["Rent","$2,150"],["On-time","11 of 12"]],
    suggested: ["Push auto-retry to Friday","Waive NSF fee (1x)","Send payment-plan form"],
  },
];

const INBOX_FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "resident", label: "Residents" },
  { id: "prospect", label: "Prospects" },
  { id: "vendor", label: "Vendors" },
  { id: "sla", label: "SLA" },
];

// ═══════════════════════════════════════════════════════════════
//  RESIDENTS — active leases
// ═══════════════════════════════════════════════════════════════
const RESIDENTS = [
  { id: "r01", unit: "U-204", name: "Maya Holloway",   beds: "Studio", start: "May 28, 2025", end: "May 27, 2026", rent: 1650, lastPaid: "Apr 1", pay: "current", onTime: "1/1",   renewal: "—",        tenure: 0.0, note: "New lease · keys Apr 1" },
  { id: "r02", unit: "U-211", name: "Nia Blackwell",   beds: "1BR",    start: "Aug 10, 2024", end: "Aug 9, 2025",  rent: 2150, lastPaid: "Mar 1", pay: "failed",  onTime: "11/12", renewal: "pending",  tenure: 0.7, note: "Auto-retry tonight · pushed to Fri" },
  { id: "r03", unit: "U-312", name: "Jamie Patel",     beds: "2BR",    start: "Mar 15, 2024", end: "Mar 14, 2026", rent: 2800, lastPaid: "Apr 1", pay: "current", onTime: "13/13", renewal: "eligible", tenure: 1.1, note: "AC ticket open · MT-4821" },
  { id: "r04", unit: "U-404", name: "Evan Moore",      beds: "1BR",    start: "Jun 1, 2024",  end: "May 31, 2025", rent: 2100, lastPaid: "Apr 1", pay: "current", onTime: "10/10", renewal: "eligible", tenure: 0.9, note: "Lease ends 39 days · no touch yet" },
  { id: "r05", unit: "U-504", name: "Priya Shankar",   beds: "1BR",    start: "Nov 4, 2024",  end: "Nov 3, 2025",  rent: 2050, lastPaid: "Apr 1", pay: "current", onTime: "5/5",   renewal: "ntv",      tenure: 0.4, note: "NTV filed · vacate May 31" },
  { id: "r06", unit: "U-607", name: "Derek Huang",     beds: "2BR",    start: "Jan 20, 2024", end: "Jan 19, 2026", rent: 2750, lastPaid: "Apr 1", pay: "current", onTime: "15/15", renewal: "—",        tenure: 1.3, note: "On-time 100% · candidate for renewal bump" },
  { id: "r07", unit: "U-706", name: "Sarah Chen",      beds: "1BR",    start: "Mar 1, 2025",  end: "Feb 28, 2026", rent: 2150, lastPaid: "Apr 1", pay: "current", onTime: "2/2",   renewal: "—",        tenure: 0.1, note: "Just signed · autopay set" },
  { id: "r08", unit: "U-805", name: "Tomas Vargas",    beds: "1BR",    start: "Sep 9, 2024",  end: "Sep 8, 2025",  rent: 2100, lastPaid: "Apr 1", pay: "current", onTime: "7/7",   renewal: "eligible", tenure: 0.6, note: "Noise complaint re: 804 · NC-331" },
  { id: "r09", unit: "U-812", name: "Rachel Ortiz",    beds: "3BR",    start: "Feb 11, 2024", end: "Feb 10, 2026", rent: 3250, lastPaid: "Mar 24",pay: "late",    onTime: "12/14", renewal: "—",        tenure: 1.2, note: "Partial · $1,800 of $3,250" },
  { id: "r10", unit: "U-915", name: "Ethan Park",      beds: "2BR",    start: "Jun 1, 2025",  end: "May 31, 2026", rent: 2800, lastPaid: "—",    pay: "upcoming",onTime: "—",     renewal: "—",        tenure: 0.0, note: "Move-in tomorrow · lease unsigned" },
];

// ═══════════════════════════════════════════════════════════════
//  COLLECTION — payment activity + AR
// ═══════════════════════════════════════════════════════════════
const COLLECTION_KPIS = { onTime: 96.2, collected: 248400, failed: 3, outstanding: 7450 };
const FAILED_PAYMENTS = [
  { id: "fp1", unit: "U-211", name: "Nia Blackwell", amount: 2150, reason: "NSF",          attempt: 1, nextRetry: "Fri 7:00p", action: "push-friday" },
  { id: "fp2", unit: "U-312", name: "Jamie Patel",   amount: 2800, reason: "Card expired", attempt: 2, nextRetry: "tonight 8:00p", action: "update-card" },
  { id: "fp3", unit: "U-805", name: "Tomas Vargas",  amount: 2100, reason: "Stop payment", attempt: 1, nextRetry: "hold",     action: "manual" },
];
const AR_AGING = [
  { bucket: "Current",   amount: 248400, units: 118 },
  { bucket: "1–30 days", amount: 5450,   units: 2   },
  { bucket: "31–60",     amount: 2000,   units: 1   },
  { bucket: "60+",       amount: 0,      units: 0   },
];
const PAY_METHODS = [
  { m: "ACH",         share: 74, fee: "free",         note: "renter-paid" },
  { m: "Card",        share: 22, fee: "2.9% + $0.30", note: "renter-paid" },
  { m: "Check / cash", share: 4, fee: "—",            note: "manual post" },
];

// ═══════════════════════════════════════════════════════════════
//  MAINTENANCE — work orders
// ═══════════════════════════════════════════════════════════════
const WORK_ORDERS = [
  { id: "MT-4821", unit: "U-312", name: "Jamie Patel",  issue: "AC blowing warm",     priority: "urgent",  status: "dispatched", opened: "2h",    vendor: "Mike R. · HVAC", cost: null, sla: true,  photos: 2 },
  { id: "MT-4820", unit: "U-607", name: "Derek Huang",  issue: "Disposal jammed",     priority: "normal",  status: "scheduled",  opened: "1d",    vendor: "Paragon",        cost: 180,  sla: false, photos: 0 },
  { id: "MT-4819", unit: "COM",   name: "Common area",  issue: "Elevator inspection", priority: "normal",  status: "vendor-eta", opened: "3d",    vendor: "Otis Cert.",     cost: 420,  sla: false, photos: 1 },
  { id: "MT-4815", unit: "U-915", name: "Ethan Park",   issue: "Turn punch list",     priority: "normal",  status: "in-progress",opened: "2d",    vendor: "In-house",       cost: 0,    sla: false, photos: 8 },
  { id: "MT-4810", unit: "U-504", name: "Priya Shankar",issue: "Smoke alarm chirp",   priority: "low",     status: "open",       opened: "4d",    vendor: "—",              cost: null, sla: false, photos: 0 },
  { id: "MT-4807", unit: "U-204", name: "Maya Holloway",issue: "Washer leaking",      priority: "high",    status: "dispatched", opened: "6h",    vendor: "Paragon",        cost: null, sla: false, photos: 3 },
];
const MAINT_KPIS = { open: 6, urgent: 1, avgMttr: "18h", slaBreach: 1 };

// ═══════════════════════════════════════════════════════════════
//  LEDGER — accounts + transactions
// ═══════════════════════════════════════════════════════════════
const ACCOUNTS = [
  { id: "ops",    label: "Operating",    bank: "Chase ••4821", balance: 412180, reserved: 84300,  available: 327880, reconciled: "2m ago" },
  { id: "escrow", label: "Escrow",       bank: "Chase ••6219", balance: 298000, reserved: 298000, available: 0,      reconciled: "2m ago" },
  { id: "res",    label: "Reserves",     bank: "Chase ••7733", balance: 250000, reserved: 0,      available: 250000, reconciled: "2m ago" },
];
const LEDGER_TAPE = [
  { at: "09:42a", kind: "deposit",  label: "Rent batch · 118 units",   amount:  248400, acct: "Operating" },
  { at: "09:41a", kind: "fee",      label: "Stripe fees · 118 charges", amount: -620,    acct: "Operating" },
  { at: "Yday",   kind: "transfer", label: "Ops → Reserves",            amount: -50000,  acct: "Operating" },
  { at: "Yday",   kind: "transfer", label: "Ops → Reserves",            amount:  50000,  acct: "Reserves"  },
  { at: "Mon",    kind: "expense",  label: "Paragon Cleaning · inv #4412", amount: -1840, acct: "Operating" },
  { at: "Mon",    kind: "deposit",  label: "Security deposit · U-706",  amount:  2150,   acct: "Escrow"    },
  { at: "Sun",    kind: "expense",  label: "Yardi utilities · Mar",     amount: -14200,  acct: "Operating" },
];

// ═══════════════════════════════════════════════════════════════
//  LISTINGS — syndication platforms
// ═══════════════════════════════════════════════════════════════
const LISTINGS = [
  { id: "zillow",   name: "Zillow",         sync: "3m ago",  health: "ok",    views7: 4820, leads7: 31, cpLead: "$12",  unitsLive: 4, issues: 0 },
  { id: "aptscom",  name: "Apartments.com", sync: "4m ago",  health: "ok",    views7: 3140, leads7: 22, cpLead: "$18",  unitsLive: 4, issues: 0 },
  { id: "realtor",  name: "Realtor.com",    sync: "4m ago",  health: "ok",    views7: 890,  leads7: 6,  cpLead: "$22",  unitsLive: 4, issues: 0 },
  { id: "zumper",   name: "Zumper",         sync: "12m ago", health: "ok",    views7: 1240, leads7: 9,  cpLead: "$14",  unitsLive: 4, issues: 0 },
  { id: "rent",     name: "Rent.com",       sync: "2h ago",  health: "warn",  views7: 520,  leads7: 3,  cpLead: "$28",  unitsLive: 3, issues: 1, note: "3BR listing photos flagged · too few" },
  { id: "trulia",   name: "Trulia",         sync: "5h ago",  health: "warn",  views7: 210,  leads7: 1,  cpLead: "$40",  unitsLive: 2, issues: 1, note: "Studio description truncated" },
  { id: "facebook", name: "Facebook Mktpl", sync: "error",   health: "bad",   views7: 0,    leads7: 0,  cpLead: "—",    unitsLive: 0, issues: 1, note: "OAuth token expired · reconnect needed" },
];

// ═══════════════════════════════════════════════════════════════
//  MARKET — comp set
// ═══════════════════════════════════════════════════════════════
const COMPS = [
  { id: "self",    name: "The Meridian",    units: 260, occ: 46.5, dist: 0.0, concession: "1mo",  studio: 1650, oneBed: 2100, twoBed: 2800, threeBed: 3400, self: true },
  { id: "vance",   name: "The Vance",       units: 310, occ: 61.0, dist: 0.4, concession: "2mo",  studio: 1580, oneBed: 2050, twoBed: 2720, threeBed: 3150, trend: "concession-up" },
  { id: "ovation", name: "Ovation",         units: 240, occ: 58.0, dist: 0.8, concession: "1mo",  studio: 1610, oneBed: 2080, twoBed: 2750, threeBed: 3200, trend: null },
  { id: "halcyon", name: "Halcyon",         units: 180, occ: 72.0, dist: 1.2, concession: "none", studio: 1650, oneBed: 2120, twoBed: 2820, threeBed: 3240, trend: "pricing-up" },
  { id: "alcove",  name: "Alcove Heights",  units: 220, occ: 54.0, dist: 0.9, concession: "1mo",  studio: 1560, oneBed: 2000, twoBed: 2680, threeBed: 3100, trend: null },
  { id: "parker",  name: "The Parker",      units: 148, occ: 68.0, dist: 1.5, concession: "none", studio: 1680, oneBed: 2150, twoBed: 2850, threeBed: 3250, trend: null },
];

// ═══════════════════════════════════════════════════════════════
//  CONCESSIONS — active programs
// ═══════════════════════════════════════════════════════════════
const CONCESSIONS = [
  { id: "c1", name: "1 month free",        expires: "May 31", applied: 14, conversion: 62, cost: 28000, note: "Best performer · all unit types", status: "active" },
  { id: "c2", name: "$500 move-in credit", expires: "Jun 15", applied: 11, conversion: 38, cost: 5500,  note: "Mid-tier pull", status: "active" },
  { id: "c3", name: "Waived app fee",      expires: "open",   applied: 3,  conversion: 9,  cost: 225,   note: "Low uptake · consider sunset", status: "active" },
  { id: "c4", name: "1mo free · 3BR only", expires: "ended Apr 14", applied: 2,  conversion: 14, cost: 6400,  note: "Archived · 3BR stalled regardless", status: "archived" },
];

// ═══════════════════════════════════════════════════════════════
//  PRE-CON — absorption model
// ═══════════════════════════════════════════════════════════════
const PRECON = {
  assumptions: [
    { l: "Target CO",           v: "Jan 15, 2025",      d: "actual" },
    { l: "Stabilization (93%)", v: "Jul 28, 2026",      d: "78wk from CO" },
    { l: "Target velocity",     v: "3.3 leases/wk",     d: "242 units / 73 weeks" },
    { l: "Current velocity",    v: "9.2 leases/wk",     d: "trailing 12wk · +178%" },
    { l: "Leasing staff",       v: "2 FT + 1 weekend",  d: "planned · actual 2 FT" },
    { l: "Concession budget",   v: "$480K",             d: "$61K used · 13%" },
    { l: "Marketing budget",    v: "$180K · 18mo",      d: "$41K used · 23%" },
  ],
  variance: [
    { l: "Leased vs model",  actual: 121, plan: 93,  delta: "+28",  tone: "good" },
    { l: "Avg rent achieved", actual: 2180, plan: 2100, delta: "+$80", tone: "good" },
    { l: "Concession %",     actual: 4.2, plan: 6.0, delta: "−1.8pp", tone: "good" },
    { l: "Days on market",   actual: 22,  plan: 30,  delta: "−8d",   tone: "good" },
  ],
};

// ═══════════════════════════════════════════════════════════════
//  APPLICATIONS — screening pipeline
// ═══════════════════════════════════════════════════════════════
const APPLICATIONS = [
  { id: "a01", name: "Kira Weston",  unit: "2BR-0914", received: "6h ago", credit: 742, bgCheck: "clear", income: "verified", ratio: 2.9, deposit: "paid",    status: "underwriting", note: "Clean · approve recommended", action: "approve" },
  { id: "a02", name: "Miguel Torres", unit: "2BR",      received: "1d ago", credit: 704, bgCheck: "clear", income: "pending",  ratio: 3.1, deposit: "paid",    status: "pending-income", note: "Employer verify pending" },
  { id: "a03", name: "Andre Dumas",  unit: "1BR",      received: "2d ago", credit: 681, bgCheck: "clear", income: "pending",  ratio: 2.8, deposit: "pending", status: "pending-income", note: "Hold — awaiting pay stubs" },
  { id: "a04", name: "Jordan Kim",   unit: "Studio",   received: "1d ago", credit: 712, bgCheck: "clear", income: "verified", ratio: 3.4, deposit: "paid",    status: "approved", note: "Approved · lease sent" },
  { id: "a05", name: "Luka Petrov",  unit: "2BR",      received: "3d ago", credit: 612, bgCheck: "minor", income: "verified", ratio: 3.6, deposit: "pending", status: "review",   note: "Credit marginal · cosigner required", action: "require-cosigner" },
];
const APP_KPIS = { pending: 3, approved: 1, denied: 0, avgCycle: "1.8d" };

// ═══════════════════════════════════════════════════════════════
//  LP REPORTING — actual vs pro forma
// ═══════════════════════════════════════════════════════════════
const LP_REPORT = {
  nextDue: "Apr 30 · monthly LP letter",
  period: "Q1 2026 · YTD",
  lines: [
    { group: "Income",   l: "Gross potential rent",     actual: 652400, plan: 670000, delta: -2.6 },
    { group: "Income",   l: "Vacancy loss",             actual: -348500, plan: -380000, delta: 8.3 },
    { group: "Income",   l: "Concessions",              actual: -61200,  plan: -80400,  delta: 23.9 },
    { group: "Income",   l: "Other income (parking, fees)", actual: 28400, plan: 30000, delta: -5.3 },
    { group: "Income",   l: "Effective gross income",   actual: 271100, plan: 239600, delta: 13.1, bold: true },
    { group: "Opex",     l: "Payroll",                  actual: -68000,  plan: -72000,  delta: 5.5 },
    { group: "Opex",     l: "Marketing",                actual: -41200,  plan: -45000,  delta: 8.4 },
    { group: "Opex",     l: "Repairs & maintenance",    actual: -32800,  plan: -30000,  delta: -9.3 },
    { group: "Opex",     l: "Utilities",                actual: -58400,  plan: -60000,  delta: 2.7 },
    { group: "Opex",     l: "Admin & insurance",        actual: -28900,  plan: -29000,  delta: 0.3 },
    { group: "NOI",      l: "Net Operating Income",     actual: 41800,   plan: 3600,   delta: 1061, bold: true },
  ],
  absorption: { targetUnits: 121, actualUnits: 121, planUnits: 93, paceDays: 30 },
  irr: { toLP: 14.2, planIrr: 12.4 },
};

// ═══════════════════════════════════════════════════════════════
//  VENDORS — COI + 1099
// ═══════════════════════════════════════════════════════════════
const VENDORS = [
  { id: "v1", name: "Paragon Cleaning",   category: "Cleaning",    coi: "Aug 14, 2025",  coiDays: 115, w9: true,  ytd: 12200, last: "inv #4412 · 3d",  status: "ok" },
  { id: "v2", name: "Mike R. HVAC",        category: "HVAC",        coi: "May 2, 2025",   coiDays: 11,  w9: true,  ytd: 8600,  last: "dispatch · 2h",   status: "warn", note: "COI expires in 11 days" },
  { id: "v3", name: "Otis Certified",      category: "Elevator",    coi: "Feb 28, 2026",  coiDays: 313, w9: true,  ytd: 6200,  last: "inspection · 3d", status: "ok" },
  { id: "v4", name: "Citywide Plumbing",   category: "Plumbing",    coi: "expired",       coiDays: -18, w9: false, ytd: 3400,  last: "repair · 22d",    status: "bad", note: "COI expired · W-9 missing" },
  { id: "v5", name: "GreenThumb Landscape",category: "Landscape",   coi: "Nov 1, 2025",   coiDays: 194, w9: true,  ytd: 4800,  last: "monthly · 12d",   status: "ok" },
  { id: "v6", name: "Brand Studio LLC",    category: "Marketing",   coi: "Dec 31, 2025",  coiDays: 254, w9: true,  ytd: 22400, last: "photos · 18d",    status: "ok" },
];
const VENDOR_KPIS = { active: 6, coiExpiring: 1, coiExpired: 1, w9Missing: 1, spendYtd: 57600 };

// ═══════════════════════════════════════════════════════════════
//  DOCUMENTS — file tree
// ═══════════════════════════════════════════════════════════════
const DOC_FOLDERS = [
  { id: "leases",     label: "Leases",              count: 121, updated: "today 09:12a" },
  { id: "applications",label: "Applications",       count: 42,  updated: "2h ago" },
  { id: "coi",        label: "Vendor COIs",         count: 6,   updated: "3d ago" },
  { id: "compliance", label: "Compliance",          count: 18,  updated: "Mar 14" },
  { id: "property",   label: "Property · plans/CO", count: 34,  updated: "Mar 2" },
  { id: "finance",    label: "Finance · bank, tax", count: 52,  updated: "Apr 1" },
];
const RECENT_DOCS = [
  { id: "d1", name: "Park, E · Lease Jun 1 2025.pdf",  folder: "Leases",       size: "2.4 MB", by: "DocuSign",  at: "today 09:12a", tag: "signed" },
  { id: "d2", name: "Chen, S · Lease Mar 1 2025.pdf",  folder: "Leases",       size: "2.3 MB", by: "DocuSign",  at: "Mar 1",        tag: "signed" },
  { id: "d3", name: "Paragon COI · 2025.pdf",          folder: "Vendor COIs",  size: "1.1 MB", by: "Vendor",    at: "Mar 14",       tag: "coi" },
  { id: "d4", name: "Weston, K · Application.pdf",     folder: "Applications", size: "820 KB", by: "Applicant", at: "6h ago",       tag: "new" },
  { id: "d5", name: "CO · Jan 15 2025.pdf",            folder: "Property",     size: "4.1 MB", by: "Municipal", at: "Mar 2",        tag: "signed" },
  { id: "d6", name: "Operating Agreement · executed.pdf", folder: "Compliance", size: "3.7 MB", by: "Legal",    at: "Mar 14",       tag: "signed" },
];

const fmtUSD = (n, short) => {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (short && a >= 1000) return (n < 0 ? "−$" : "$") + (a / 1000).toFixed(a >= 10000 ? 0 : 1) + "K";
  return (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString();
};
const fmtNum = (n) => n == null ? "—" : Number(n).toLocaleString();
const fmtPct = (n, digits = 1) => n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;

Object.assign(window, {
  THEMES, PROPERTIES, PLAN_CURVE, ACTUAL_CURVE, PROJECTED_CURVE,
  HEADLINE, PRIORITIES, QUEUE, NAV_PEEKS, WATCHING, UNIT_MATRIX, PROSPECTS, STAGES,
  INBOX_THREADS, INBOX_FILTERS,
  RESIDENTS, COLLECTION_KPIS, FAILED_PAYMENTS, AR_AGING, PAY_METHODS,
  WORK_ORDERS, MAINT_KPIS, ACCOUNTS, LEDGER_TAPE,
  LISTINGS, COMPS, CONCESSIONS, PRECON,
  APPLICATIONS, APP_KPIS, LP_REPORT, VENDORS, VENDOR_KPIS,
  DOC_FOLDERS, RECENT_DOCS,
  fmtUSD, fmtNum, fmtPct,
});
