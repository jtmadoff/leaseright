import React, { useEffect, useState } from "react";
import { Head, KStrip, Band } from "./common.jsx";
import { applicationCheck, DEFAULT_POLICY } from "../../core/ops.js";
import { moveProspect, shortDay } from "../../core/leasing.js";
import { parseDate, DAY_MS, isoDate } from "../../core/model.js";
import { money, bedLabel, dateLong } from "../../core/format.js";

const TONE = { ok: "good", pending: "warn", unverified: "warn", review: "warn", below: "bad" };
const WORD = { ok: "clear", pending: "pending", unverified: "unverified", review: "review", below: "below" };
const STATUS = { ready: ["good", "Ready to approve"], pending: ["warn", "Pending items"], review: ["bad", "Review"], approved: ["good", "Approved"] };

export function ApplicationsView({ project, today, statuses, focus, dispatch, patch, openProspect }) {
  const all = project.prospects || [];
  const queue = all.filter((p) => p.stage === "applied" || p.stage === "approved").sort((a, b) => (a.appliedAt || "").localeCompare(b.appliedAt || ""));
  const [selId, setSelId] = useState(focus && queue.some((p) => p.id === focus) ? focus : queue[0]?.id || null);
  const sel = all.find((p) => p.id === selId) || queue[0] || null;
  const t = parseDate(today);
  const rentOf = (p) => Number(p.leaseRent) || statuses.find((u) => u.id === p.unitId)?.rent || null;
  const policy = { ...DEFAULT_POLICY, ...(project.policy || {}) };
  const declined30 = all.filter((p) => p.stage === "lost" && p.lostReason === "Did not qualify" && parseDate(p.lostAt) !== null && t - parseDate(p.lostAt) < 30 * DAY_MS).length;
  const cycles = all
    .filter((p) => p.appliedAt && p.approvedAt && t - parseDate(p.approvedAt) < 60 * DAY_MS)
    .map((p) => (parseDate(p.approvedAt) - parseDate(p.appliedAt)) / DAY_MS);
  const save = (p) => dispatch({ type: "prospect-save", id: project.id, prospect: p });
  const setApp = (k, v) => sel && save({ ...sel, app: { ...(sel.app || {}), [k]: v } });
  const note = (text, next = null) => sel && save({ ...sel, history: [...(sel.history || []), { at: today, text }], ...(next ? { nextAt: next, nextNote: text } : {}) });
  const check = sel ? applicationCheck(sel, project.policy, rentOf(sel)) : null;
  return (
    <div className="cpage">
      <Head code="F5 · Applications" name={project.name} />
      <KStrip
        items={[
          ["Pending", queue.filter((p) => p.stage === "applied").length, "screening and documents", "warn"],
          ["Approved", queue.filter((p) => p.stage === "approved").length, "awaiting lease signature", "good"],
          ["Declined · 30 days", declined30, `policy: credit ${policy.minCredit}+, income ${policy.incomeMultiple}x rent`],
          ["Average cycle", cycles.length ? `${(cycles.reduce((a, b) => a + b, 0) / cycles.length).toFixed(1)}d` : "–", "application to decision", "plain"],
        ]}
      />
      <div className="split">
        <div>
          <Band>Applications · screening queue</Band>
          {!queue.length && <div className="empty">No applications in progress. They appear here when a prospect applies.</div>}
          {queue.length > 0 && (
            <div className="tablewrap">
              <table className="dtable click">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Unit</th>
                    <th className="n">Credit</th>
                    <th>Background</th>
                    <th>Income</th>
                    <th className="n">Inc / rent</th>
                    <th>Deposit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((p) => {
                    const c = applicationCheck(p, project.policy, rentOf(p));
                    const u = statuses.find((x) => x.id === p.unitId);
                    return (
                      <tr key={p.id} className={sel?.id === p.id ? "sel" : ""} onClick={() => setSelId(p.id)}>
                        <td className="strong">
                          {p.name}
                          <span className="sub">{p.appliedAt ? `${shortDay(p.appliedAt)}` : ""}</span>
                        </td>
                        <td>
                          <span className="unittag">{u?.number || bedLabel(p.beds)}</span>
                        </td>
                        <td className={`n ${c.checks.credit === "below" ? "neg" : c.checks.credit === "ok" ? "posc" : ""}`}>{c.credit ?? "–"}</td>
                        <td>
                          <span className={`tag ${TONE[c.checks.background]}`}>{WORD[c.checks.background]}</span>
                        </td>
                        <td>
                          <span className={`tag ${TONE[c.checks.income]}`}>{WORD[c.checks.income]}</span>
                        </td>
                        <td className={`n ${c.ratio !== null && c.ratio < policy.incomeMultiple ? "neg" : ""}`}>{c.ratio ? `${c.ratio.toFixed(1)}x` : "–"}</td>
                        <td className={c.checks.deposit === "ok" ? "posc" : "warnc"}>{c.checks.deposit === "ok" ? "paid" : "pending"}</td>
                        <td>
                          <span className={`tag ${STATUS[c.status][0]}`}>{STATUS[c.status][1]}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Band>Screening policy</Band>
          <div className="wrap20 row wrap">
            <label className="field" style={{ width: 160 }}>
              <span>Minimum credit</span>
              <input type="number" value={policy.minCredit} onChange={(e) => patch({ policy: { ...policy, minCredit: Number(e.target.value) || 0 } })} />
            </label>
            <label className="field" style={{ width: 200 }}>
              <span>Income as a multiple of rent</span>
              <input type="number" step="0.1" value={policy.incomeMultiple} onChange={(e) => patch({ policy: { ...policy, incomeMultiple: Number(e.target.value) || 0 } })} />
            </label>
            <p className="muted small" style={{ maxWidth: 420, alignSelf: "flex-end" }}>
              Screening results are entered from your screening provider for now. Fair housing rules apply: screen every applicant against the same written policy.
            </p>
          </div>
        </div>
        <aside className="ctx">
          {!sel ? (
            <div className="blk muted small">Select an application.</div>
          ) : (
            <>
              <div className="blk">
                <div className="sect">Application</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{sel.name}</div>
                <div className="muted small">
                  {statuses.find((u) => u.id === sel.unitId) ? `Unit ${statuses.find((u) => u.id === sel.unitId).number} · ` : ""}
                  {rentOf(sel) ? `${money(rentOf(sel))} · ` : ""}received {sel.appliedAt ? dateLong(sel.appliedAt) : "–"}
                </div>
              </div>
              <div className="blk">
                <div className="sect">Screening</div>
                <div className="sgrid">
                  <label>
                    Credit score
                    <input className="input" type="number" value={sel.app?.credit || ""} onChange={(e) => setApp("credit", e.target.value)} />
                  </label>
                  <label>
                    Background
                    <select className="input" value={sel.app?.background || ""} onChange={(e) => setApp("background", e.target.value)}>
                      <option value="">Pending</option>
                      <option value="clear">Clear</option>
                      <option value="minor">Minor items</option>
                      <option value="review">Needs review</option>
                    </select>
                  </label>
                  <label>
                    Monthly income
                    <input className="input" type="number" step="100" value={sel.app?.income || ""} onChange={(e) => setApp("income", e.target.value)} />
                  </label>
                  <label className="inline">
                    <input type="checkbox" checked={!!sel.app?.incomeVerified} onChange={(e) => setApp("incomeVerified", e.target.checked)} /> Income verified
                  </label>
                  <label>
                    Deposit
                    <select className="input" value={sel.app?.deposit || ""} onChange={(e) => setApp("deposit", e.target.value)}>
                      <option value="">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </label>
                  <label className="inline">
                    <input type="checkbox" checked={!!sel.app?.cosigner} onChange={(e) => setApp("cosigner", e.target.checked)} /> Cosigner on file
                  </label>
                </div>
                <p className="small" style={{ marginTop: 10 }}>
                  <span className={`tag ${STATUS[check.status][0]}`}>{STATUS[check.status][1]}</span>
                  {check.ratio ? <span className="mono small muted"> · income {check.ratio.toFixed(1)}x rent</span> : null}
                </p>
              </div>
              <div className="blk">
                <div className="sect">Decision</div>
                <div className="row wrap">
                  {sel.stage === "applied" && (
                    <button className="btn small primary" onClick={() => save(moveProspect(sel, "approved", today))}>
                      Approve · send lease
                    </button>
                  )}
                  {sel.stage === "approved" && (
                    <button className="btn small primary" onClick={() => openProspect(sel)}>
                      Record signed lease
                    </button>
                  )}
                  <button className="btn small" onClick={() => note("Requested a cosigner", isoDate(t + 2 * DAY_MS))}>
                    Request cosigner
                  </button>
                  <button className="btn small" onClick={() => note("Requested documents", isoDate(t + 2 * DAY_MS))}>
                    Request docs
                  </button>
                  <button className="btn small ghost" onClick={() => save(moveProspect(sel, "lost", today, { lostReason: "Did not qualify" }))}>
                    Decline
                  </button>
                </div>
              </div>
              <div className="blk">
                <div className="sect">History</div>
                <ul className="timeline" style={{ marginTop: 0 }}>
                  {[...(sel.history || [])].reverse().slice(0, 6).map((h, i) => (
                    <li key={i}>
                      <span className="mono small muted">{shortDay(h.at.slice(0, 10))}</span> {h.text}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
