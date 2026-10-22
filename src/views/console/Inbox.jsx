import React, { useEffect, useMemo, useState } from "react";
import { Head } from "./common.jsx";
import { STAGE_LABEL, want, shortDay, time12 } from "../../core/leasing.js";
import { money, bedLabel, dateLong, localToday } from "../../core/format.js";

const CHANNEL = { sms: "Text", email: "Email", call: "Call", note: "Note" };
const FILTERS = [
  ["all", "All"],
  ["reply", "Needs reply"],
  ["lead", "Leads"],
  ["applicant", "Applicants"],
];

function stamp() {
  const n = new Date();
  return `${localToday(n)}T${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}
const lastOf = (p, dir) => (p.messages || []).filter((m) => !dir || m.dir === dir).map((m) => m.at).sort().pop() || "";
/** Open prospects whose last message is theirs. Lost and leased threads are closed. */
export const needsReply = (p) => {
  if (p.stage === "lost" || p.stage === "leased") return false;
  const i = lastOf(p, "in");
  const o = lastOf(p, "out");
  return !!i && (!o || o < i);
};

/** Starting points for a reply, by where the prospect stands. Edited before sending. */
function suggestions(p, project, unit) {
  const name = (p.name || "").split(" ")[0] || "there";
  const bld = project.name?.replace(/\s*\(sample\)$/, "") || "the building";
  const type = p.beds === "" ? "an apartment" : `a ${bedLabel(p.beds).replace("BR", "bedroom").toLowerCase()}`;
  if (p.stage === "lead")
    return [
      `Hi ${name}, thanks for reaching out about ${bld}. We have ${type} available now. Would Saturday at 11 or Monday at 5 work for a tour?`,
      `Hi ${name}, happy to help. What move-in date and budget are you working with? I can send floor plans that fit.`,
    ];
  if (p.stage === "tour") return [`Hi ${name}, confirming your tour ${p.tourAt ? `${shortDay(p.tourAt.slice(0, 10))} at ${time12(p.tourAt)}` : "this week"}. Text this number when you arrive.`];
  if (p.stage === "toured")
    return [`Hi ${name}, great to meet you${p.tourAt && p.tourAt.slice(0, 10) === localToday() ? " today" : ""}. Here is the application link. ${unit ? `Unit ${unit.number} is open at ${money(unit.rent)}.` : ""} Happy to hold it for 48 hours once you apply.`.replace("  ", " ")];
  if (p.stage === "applied") return [`Hi ${name}, we received your application and are reviewing it now. Expect a decision within two business days.`];
  if (p.stage === "approved") return [`Hi ${name}, you're approved. The lease is ready to sign; once it's signed and the deposit is in, the unit is yours.`];
  return [];
}

export function InboxView({ project, today, statuses, focus, dispatch, openProspect }) {
  const all = project.prospects || [];
  const [filter, setFilter] = useState("all");
  const [selId, setSelId] = useState(focus || null);
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState("sms");
  const threads = useMemo(
    () =>
      all
        .filter((p) => p.stage !== "lost" || (p.messages || []).length)
        .filter((p) => (p.messages || []).length || ["lead", "tour", "toured", "applied", "approved"].includes(p.stage))
        .filter((p) => (filter === "reply" ? needsReply(p) : filter === "lead" ? ["lead", "tour", "toured"].includes(p.stage) : filter === "applicant" ? ["applied", "approved"].includes(p.stage) : true))
        .sort((a, b) => (lastOf(b) || b.createdAt).localeCompare(lastOf(a) || a.createdAt)),
    [all, filter],
  );
  const sel = all.find((p) => p.id === selId) || threads[0] || null;
  useEffect(() => setDraft(""), [sel?.id]);
  const unit = sel ? statuses.find((u) => u.id === sel.unitId) : null;
  const waiting = all.filter(needsReply).length;
  const log = (dir) => {
    if (!sel || !draft.trim()) return;
    const msg = { id: `m${Date.now()}`, at: stamp(), dir, channel, text: draft.trim() };
    dispatch({ type: "prospect-save", id: project.id, prospect: { ...sel, messages: [...(sel.messages || []), msg] } });
    setDraft("");
  };
  const mailto = sel?.email ? `mailto:${encodeURIComponent(sel.email)}?subject=${encodeURIComponent(project.name || "Your apartment search")}&body=${encodeURIComponent(draft)}` : null;
  const sms = sel?.phone ? `sms:${sel.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(draft)}` : null;
  return (
    <div className="cpage">
      <Head code="F3 · Inbox" name={project.name}>
        <span className="mono small muted">
          Waiting on a reply <b className={waiting ? "neg" : ""}>{waiting}</b>
        </span>
      </Head>
      <div className="inbox">
        <aside className="threads">
          <div className="tfilters">
            {FILTERS.map(([k, l]) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
          {!threads.length && <div className="empty">No conversations here.</div>}
          {threads.map((p) => {
            const last = (p.messages || []).slice().sort((a, b) => a.at.localeCompare(b.at)).pop();
            const u = statuses.find((x) => x.id === p.unitId);
            return (
              <button key={p.id} className={`thread ${sel?.id === p.id ? "on" : ""} ${needsReply(p) ? "unread" : ""}`} onClick={() => setSelId(p.id)}>
                <span className="r1">
                  <span className="unittag">{u?.number || (p.beds === "" ? "Any" : bedLabel(p.beds))}</span>
                  <b>{p.name}</b>
                  <span className="mono small muted">{last ? shortDay(last.at.slice(0, 10)) : shortDay(p.createdAt)}</span>
                </span>
                <span className={`r2 tag ${["applied", "approved"].includes(p.stage) ? "good" : "accent"}`}>
                  {STAGE_LABEL[p.stage]} · {last ? CHANNEL[last.channel] : p.source || "new"}
                </span>
                <span className="r3">{last ? last.text : "No messages yet"}</span>
              </button>
            );
          })}
        </aside>
        <section className="convo">
          {!sel ? (
            <div className="empty">Pick a conversation.</div>
          ) : (
            <>
              <header>
                <span className="unittag">{unit?.number || (sel.beds === "" ? "Any" : bedLabel(sel.beds))}</span>
                <div>
                  <b>{sel.name}</b>
                  <div className="mono small muted">
                    {STAGE_LABEL[sel.stage]} · {[sel.phone, sel.email].filter(Boolean).join(" · ") || "no contact details"}
                  </div>
                </div>
                <span className="spacer" />
                {needsReply(sel) && <span className="tag bad">Needs reply</span>}
              </header>
              <div className="msgs">
                {!(sel.messages || []).length && <div className="empty">No messages logged yet. Log the first contact below.</div>}
                {(sel.messages || [])
                  .slice()
                  .sort((a, b) => a.at.localeCompare(b.at))
                  .map((m) => (
                    <div key={m.id || m.at} className={`msg ${m.dir}`}>
                      <div className="bubble">{m.text}</div>
                      <div className="mono small muted">
                        {m.dir === "out" ? "You" : sel.name.split(" ")[0]} · {CHANNEL[m.channel]} · {dateLong(m.at.slice(0, 10))}
                        {m.at.length > 10 ? ` ${time12(m.at)}` : ""}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="compose">
                {suggestions(sel, project, unit).length > 0 && (
                  <div className="sugg">
                    <span className="tag accent">Suggested</span>
                    {suggestions(sel, project, unit).map((s, i) => (
                      <button key={i} className="btn small" onClick={() => setDraft(s)}>
                        {s.length > 64 ? `${s.slice(0, 62)}…` : s}
                      </button>
                    ))}
                  </div>
                )}
                <textarea className="input" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Write to ${sel.name.split(" ")[0]}, or paste what they sent`} />
                <div className="row wrap">
                  <select className="input" style={{ width: 120 }} value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Channel">
                    {Object.entries(CHANNEL).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button className="btn small primary" disabled={!draft.trim()} onClick={() => log("out")}>
                    Log as sent
                  </button>
                  <button className="btn small" disabled={!draft.trim()} onClick={() => log("in")}>
                    Log their message
                  </button>
                  <span className="spacer" />
                  {mailto && (
                    <a className="btn small" href={mailto} onClick={() => draft.trim() && setTimeout(() => log("out"), 0)}>
                      Send by email
                    </a>
                  )}
                  {sms && (
                    <a className="btn small" href={sms} onClick={() => draft.trim() && setTimeout(() => log("out"), 0)}>
                      Send by text
                    </a>
                  )}
                </div>
                <p className="mono small muted" style={{ marginTop: 6 }}>
                  Messages are logged here by hand for now. Send by email or text opens your own mail or messages app with the reply filled in.
                </p>
              </div>
            </>
          )}
        </section>
        {sel && (
          <aside className="ctx">
            <div className="blk">
              <div className="sect">Context · {STAGE_LABEL[sel.stage]}</div>
              <div style={{ fontWeight: 600 }}>{sel.name}</div>
              <div className="mono small muted">{sel.source || "No source"}</div>
            </div>
            <div className="blk">
              <div className="sect">Facts</div>
              <dl>
                <div>
                  <dt>Looking for</dt>
                  <dd>{want(sel)}</dd>
                </div>
                <div>
                  <dt>Unit</dt>
                  <dd>{unit ? `${unit.number} · ${money(unit.rent)}` : "–"}</dd>
                </div>
                <div>
                  <dt>Added</dt>
                  <dd>{dateLong(sel.createdAt)}</dd>
                </div>
                {sel.tourAt && (
                  <div>
                    <dt>Tour</dt>
                    <dd>
                      {shortDay(sel.tourAt.slice(0, 10))} {time12(sel.tourAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="blk">
              <div className="sect">Quick actions</div>
              <div className="qa">
                <button className="btn small" onClick={() => openProspect(sel)}>
                  Open prospect: tour, apply, lease
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
