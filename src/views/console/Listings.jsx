import React, { useState } from "react";
import { Head, KStrip, Band, plural } from "./common.jsx";
import { platformMetrics, typeMetrics, activeConcession } from "../../core/ops.js";
import { money, number, dateLong, bedLabel } from "../../core/format.js";
import { uidish } from "./util.js";

const HEALTH = { ok: ["good", "Healthy"], warn: ["warn", "1 issue"], bad: ["bad", "Issues"], paused: ["", "Paused"], other: ["", "Not a platform"] };

/** Listing copy for a unit type, built from the project; the user edits it before posting. */
function defaultCopy(project, t, conc) {
  const name = (project.name || "").replace(/\s*\(sample\)$/, "");
  const where = [project.address, project.town ? `${project.town}, RI` : ""].filter(Boolean).join(", ");
  const kind = t.beds === 0 ? "Studio" : `${t.beds}-bedroom`;
  const lines = [
    `${kind} at ${name || "a new building"}${where ? `, ${where}` : ""}. ${money(Math.round(t.asking))} a month${conc ? `, with ${conc.months} month${Number(conc.months) === 1 ? "" : "s"} free on new leases (${conc.name})` : ""}.`,
    `${plural(t.available, "unit")} available now. Tours daily; reply to book a time.`,
  ];
  return lines.join("\n\n");
}

export function ListingsView({ project, data, today, track, patch }) {
  const { platforms, others, open } = platformMetrics(project, today);
  const [selId, setSelId] = useState((platforms.find((p) => p.issues.length && p.active) || platforms.find((p) => p.active) || platforms[0])?.id);
  const sel = platforms.find((p) => p.id === selId) || null;
  const live = platforms.filter((p) => p.active);
  const leads7 = (project.prospects || []).filter((p) => {
    const d = Date.parse(p.createdAt + "T00:00:00Z");
    return Number.isFinite(d) && Date.parse(today + "T00:00:00Z") - d < 7 * 86400000;
  }).length;
  const spend = live.reduce((s, p) => s + p.cost, 0);
  const leads30 = live.reduce((s, p) => s + p.leads30, 0);
  const issues = live.reduce((n, p) => n + p.issues.length, 0);
  const setPf = (id, change) => patch({ platforms: (project.platforms || []).map((f) => (f.id === id ? { ...f, ...change } : f)) });
  const types = typeMetrics(project, data, today, { planPace: track?.planPace });
  const [copyFor, setCopyFor] = useState(types[0]?.id);
  const t = types.find((x) => x.id === copyFor) || types[0];
  const conc = t ? activeConcession(project, t.beds, today) : null;
  const copyText = t ? (project.listingCopy || {})[t.id] ?? defaultCopy(project, t, conc) : "";
  const [copied, setCopied] = useState(false);
  return (
    <div className="cpage">
      <Head code="Listings · syndication" name={project.name}>
        <button className="btn small" onClick={() => patch({ platforms: [...(project.platforms || []), { id: uidish(), name: "New platform", active: false, cost: "", url: "", syncedAt: "" }] })}>
          Add platform
        </button>
      </Head>
      <KStrip
        items={[
          ["Live", `${live.length} / ${platforms.length}`, issues ? `${plural(issues, "issue")} on live platforms` : "all live platforms healthy", issues ? "warn" : "good"],
          ["Leads · 7 days", leads7, "all sources", "plain"],
          ["Cost per lead", leads30 && spend ? money(spend / leads30) : "–", spend ? `${money(spend)} a month on live platforms` : "enter monthly costs", "plain"],
          ["Units to market", open, "available today", "plain"],
        ]}
      />
      <div className="split">
        <div>
          <Band>Platforms</Band>
          <div className="tablewrap">
            <table className="dtable click">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th className="n">Leads 7d</th>
                  <th className="n">Leads 30d</th>
                  <th className="n">Tours 30d</th>
                  <th className="n">Leases 30d</th>
                  <th className="n">CPL</th>
                  <th className="n">Units live</th>
                  <th>Updated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.id} className={sel?.id === p.id ? "sel" : ""} onClick={() => setSelId(p.id)}>
                    <td className="strong">
                      <span className={`dot ${HEALTH[p.health][0]}`} style={{ marginRight: 10 }} />
                      {p.name}
                    </td>
                    <td className="n">{p.leads7}</td>
                    <td className="n">{p.leads30}</td>
                    <td className="n">{p.tours30}</td>
                    <td className="n">{p.leases30}</td>
                    <td className="n">{p.cpl ? money(p.cpl) : "–"}</td>
                    <td className="n">
                      {p.unitsLive} / {open}
                    </td>
                    <td className="mono small">{p.platform.syncedAt ? dateLong(p.platform.syncedAt) : "–"}</td>
                    <td>
                      <span className={`tag ${HEALTH[p.health][0]}`}>{p.health === "warn" || p.health === "bad" ? plural(p.issues.length, "issue") : HEALTH[p.health][1]}</span>
                    </td>
                  </tr>
                ))}
                {others.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="dot" style={{ marginRight: 10 }} />
                      {p.name} <span className="sub">other source</span>
                    </td>
                    <td className="n">{p.leads7}</td>
                    <td className="n">{p.leads30}</td>
                    <td className="n">{p.tours30}</td>
                    <td className="n">{p.leases30}</td>
                    <td className="n">–</td>
                    <td className="n">–</td>
                    <td />
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono small muted wrap20">
            Leads, tours and leases count prospects whose source is the platform. LeaseRight does not post to these sites yet: mark a platform updated after you change the listing, and paste the listing link so the team can check it.
          </p>
          {t && (
            <>
              <Band
                right={
                  <span className="row">
                    {types.map((x) => (
                      <button key={x.id} className={`chip ${copyFor === x.id ? "on" : ""}`} onClick={() => setCopyFor(x.id)}>
                        {bedLabel(x.beds)}
                      </button>
                    ))}
                  </span>
                }
              >
                Listing copy
              </Band>
              <div className="wrap20">
                <textarea className="input" rows={6} value={copyText} onChange={(e) => patch({ listingCopy: { ...(project.listingCopy || {}), [t.id]: e.target.value } })} />
                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    className="btn small primary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(copyText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    {copied ? "Copied" : "Copy for posting"}
                  </button>
                  <button className="btn small" onClick={() => patch({ listingCopy: { ...(project.listingCopy || {}), [t.id]: undefined } })}>
                    Rebuild from current rents
                  </button>
                  <span className="mono small muted">Uses today's asking rent and any active concession.</span>
                </div>
              </div>
            </>
          )}
        </div>
        <aside className="ctx">
          {sel && (
            <>
              <div className="blk">
                <div className="sect">Platform</div>
                <div className="row" style={{ gap: 10 }}>
                  <span className={`dot ${HEALTH[sel.health][0]}`} />
                  <input className="input" value={sel.platform.name} onChange={(e) => setPf(sel.id, { name: e.target.value.slice(0, 40) })} style={{ fontWeight: 600 }} />
                </div>
                <div className="mono small muted" style={{ marginTop: 6 }}>
                  {sel.active ? `Live · updated ${sel.platform.syncedAt ? dateLong(sel.platform.syncedAt) : "never"}` : "Paused"}
                </div>
              </div>
              <div className="blk">
                <div className="sect">Last 30 days</div>
                <dl>
                  <div>
                    <dt>Leads</dt>
                    <dd>{sel.leads30}</dd>
                  </div>
                  <div>
                    <dt>Tours</dt>
                    <dd>{sel.tours30}</dd>
                  </div>
                  <div>
                    <dt>Leases</dt>
                    <dd>{sel.leases30}</dd>
                  </div>
                  <div>
                    <dt>Cost per lead</dt>
                    <dd>{sel.cpl ? money(sel.cpl) : "–"}</dd>
                  </div>
                  <div>
                    <dt>Cost per lease</dt>
                    <dd>{sel.cpLease ? money(sel.cpLease) : "–"}</dd>
                  </div>
                </dl>
              </div>
              {sel.issues.length > 0 && (
                <div className="blk">
                  <div className="sect">Issues</div>
                  {sel.issues.map((i) => (
                    <div key={i} className="issue">
                      {i}
                    </div>
                  ))}
                </div>
              )}
              <div className="blk">
                <div className="sect">Settings</div>
                <div className="sgrid" style={{ gridTemplateColumns: "1fr" }}>
                  <label>
                    Listing link
                    <input className="input" value={sel.platform.url} placeholder="https://" onChange={(e) => setPf(sel.id, { url: e.target.value.trim() })} />
                  </label>
                  <label>
                    Monthly cost
                    <input className="input" type="number" value={sel.platform.cost} onChange={(e) => setPf(sel.id, { cost: e.target.value })} />
                  </label>
                </div>
              </div>
              <div className="blk">
                <div className="sect">Actions</div>
                <div className="row wrap">
                  <button className="btn small primary" onClick={() => setPf(sel.id, { active: !sel.active, syncedAt: !sel.active ? today : sel.platform.syncedAt })}>
                    {sel.active ? "Pause platform" : "Go live"}
                  </button>
                  {sel.active && (
                    <button className="btn small" onClick={() => setPf(sel.id, { syncedAt: today })}>
                      Mark updated today
                    </button>
                  )}
                  {/^https?:\/\//.test(sel.platform.url) && (
                    <a className="btn small" href={sel.platform.url} target="_blank" rel="noreferrer">
                      Open listing
                    </a>
                  )}
                  <button className="btn small ghost" onClick={() => patch({ platforms: (project.platforms || []).filter((f) => f.id !== sel.id) })}>
                    Remove
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
