import React from "react";

/** Page header in the console style: an amber module code, the project, and a hint on the right. */
export function Head({ code, name, children, hint }) {
  return (
    <div className="chead">
      <span className="code">{code}</span>
      {name && <span className="name">{name}</span>}
      <span className="spacer" />
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Row of headline numbers with a colored rule, as on the original console. */
export function KStrip({ items }) {
  return (
    <div className="kstrip">
      {items.map(([label, value, sub, tone]) => (
        <div key={label}>
          <span>{label}</span>
          <b className={tone || "plain"}>{value}</b>
          {sub && <small>{sub}</small>}
        </div>
      ))}
    </div>
  );
}

export function Band({ children, right }) {
  return (
    <div className="band">
      <span>{children}</span>
      {right}
    </div>
  );
}

export function Gate({ title, body, onStep }) {
  return (
    <div className="cpage">
      <div className="empty" style={{ maxWidth: 560, margin: "40px auto", textAlign: "left" }}>
        <h2 style={{ color: "var(--fg)", fontSize: 18, marginBottom: 8 }}>{title}</h2>
        <p style={{ marginBottom: 16 }}>{body}</p>
        <button className="btn primary" onClick={() => onStep(3)}>
          Review the plan and save a baseline
        </button>
      </div>
    </div>
  );
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Days since a YYYY-MM-DD date, as a short age: 3h is not available without times, so days. */
export function ageDays(fromIso, todayIso) {
  const a = Date.parse(String(fromIso || "").slice(0, 10) + "T00:00:00Z");
  const b = Date.parse(todayIso + "T00:00:00Z");
  if (!Number.isFinite(a)) return "";
  const d = Math.round((b - a) / 86400000);
  return d <= 0 ? "today" : `${d}d`;
}
