import React, { useState } from "react";
import { Head, KStrip, Band, plural } from "./common.jsx";
import { advance, digestSince, needsYou, demand, startSim, SIM, REACH, DEFAULT_AGENT, DEFAULT_HOURS } from "../../core/sim.js";
import { practiceCopy } from "../../store/store.jsx";
import { dateLong, money } from "../../core/format.js";
import { parseDate } from "../../core/model.js";

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekday = (iso) => DOW[new Date(parseDate(iso)).getUTCDay()];

/** The clock for a simulated project: move a day or a week, and see what the agent did meanwhile. */
export function SimBar({ project, data, patch, go }) {
  const [busy, setBusy] = useState(false);
  const now = project.sim.now;
  const run = (days) => {
    if (!data.rents || busy) return;
    setBusy(true);
    // Let the button paint its busy state before a week of simulation runs.
    setTimeout(() => {
      const next = advance(project, data, days);
      patch({ units: next.units, platforms: next.platforms, prospects: next.prospects, sim: { ...next.sim, lastRun: { days, to: next.sim.now } } });
      setBusy(false);
      go("today");
    }, 30);
  };
  const waiting = needsYou(project).length;
  return (
    <div className="simbar" role="region" aria-label="Simulation clock">
      <span className="tag accent">{project.sample ? "Sample" : "Practice"} · simulated</span>
      <span className="when">
        <b>{weekday(now)}</b> {dateLong(now)} · morning
      </span>
      <span className="spacer" />
      {waiting > 0 && <span className="muted small">{plural(waiting, "item")} waiting on you</span>}
      <button className="btn small" disabled={busy || !data.rents} onClick={() => run(1)}>
        {busy ? "Running…" : "Next day"}
      </button>
      <button className="btn small" disabled={busy || !data.rents} onClick={() => run(7)}>
        Next week
      </button>
      <button className="btn small ghost" onClick={() => go("agent")}>
        Agent settings
      </button>
    </div>
  );
}

/** What happened since the last time the clock moved. */
export function Digest({ project }) {
  const days = project.sim?.lastRun?.days || 1;
  if (!project.sim?.log?.length) return null;
  const d = digestSince(project, days);
  const waiting = needsYou(project).length;
  const range = d.days === 1 ? `${weekday(d.from)} ${dateLong(d.from)}` : `${dateLong(d.from)} to ${dateLong(d.to)}`;
  const handled = d.auto;
  return (
    <div className="digest">
      <Band right={<span>{range}</span>}>{d.days === 1 ? "Yesterday" : `Last ${d.days} days`} · while you were away</Band>
      <KStrip
        items={[
          ["Leads", d.leads, `${handled} answered by the agent`, d.leads ? "plain" : "warn"],
          ["First reply", d.responseMedian === null ? "–" : d.responseMedian < 60 ? `${d.responseMedian} min` : `${Math.round(d.responseMedian / 60)} h`, "median", d.responseMedian !== null && d.responseMedian <= 15 ? "good" : "warn"],
          ["Tours", d.toursHeld, `${d.toursBooked} booked · ${d.noShows} no-show${d.noShows === 1 ? "" : "s"}`, "plain"],
          ["Applications", d.applications, d.autoApproved ? `${d.autoApproved} approved by the agent` : `${d.approved} approved`, "plain"],
          ["Leases signed", d.leases, d.lost ? `${d.lost} prospects lost` : "none lost", d.leases ? "good" : "plain"],
        ]}
      />
      <p className="digest-line">
        {handled > 0 ? `The agent carried ${plural(handled, "conversation")} without you${d.synced ? ` and pushed new prices to ${plural(d.synced, "listing")}` : ""}. ` : project.agent?.reply === false ? "The agent is off, so every lead waited for you. " : d.leads ? "Every lead this time needed a person. " : "No new leads came in. "}
        {waiting > 0 ? `${plural(waiting, "item")} need${waiting === 1 ? "s" : ""} your judgment below.` : "Nothing is waiting on you."}
      </p>
    </div>
  );
}

const TOGGLES = [
  ["reply", "Answer leads", "Replies by text or email within minutes to routine questions: availability, pets, parking, utilities, laundry, tour requests. Negotiation and special requests come to you, with the conversation attached."],
  ["book", "Book tours", "Offers open slots from your tour hours, confirms them, texts a reminder that morning, reschedules no-shows and sends the application link after the tour."],
  ["approve", "Approve clean applications", "When screening meets your policy on every check (credit, income, background, deposit), approves and sends the lease for signature. Anything short of policy comes to you. Off by default."],
  ["sync", "Sync listings", "Pushes price changes and concessions to every live platform the same night, so no listing shows an old price."],
];
const FACTS = [
  ["pets", "Pets", "cats and dogs under 50 lbs are welcome with a $300 pet deposit"],
  ["parking", "Parking", "there is off-street parking at $75 a month, first come"],
  ["utilities", "Utilities", "heat and hot water are included; electric is separate"],
  ["laundry", "Laundry", "every unit has a washer and dryer"],
];

/** Leasing agent settings, its record, and (in a simulation) the assumptions the practice market runs on. */
export function AgentView({ project, data, today, patch }) {
  const agent = { ...DEFAULT_AGENT, ...(project.agent || {}) };
  const hours = { ...DEFAULT_HOURS, ...(project.tourHours || {}) };
  const facts = project.facts || {};
  const set = (k, v) => patch({ agent: { ...agent, [k]: v } });
  const d30 = project.sim?.log?.length ? digestSince(project, 30) : null;
  const slug = (project.name || "project").toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
  const dem = project.sim?.on && data.rents ? demand(project, data, today) : [];
  return (
    <div className="cpage">
      <Head code="F8 · Agent" name={project.name} hint={project.sim?.on ? "simulated backend" : "connects when the backend ships"} />
      {d30 && (
        <KStrip
          items={[
            ["Conversations · 30 days", d30.auto, `of ${d30.leads} leads`, "plain"],
            ["Median first reply", d30.responseMedian === null ? "–" : `${d30.responseMedian} min`, "inquiry to answer", "good"],
            ["Tours booked", d30.toursBooked, `${d30.noShows} no-shows`, "plain"],
            ["Handed to you", d30.escalated, "negotiation and special requests", "warn"],
          ]}
        />
      )}
      <div className="agentgrid">
        <section>
          <Band>What the agent does</Band>
          {TOGGLES.map(([k, label, body]) => (
            <label key={k} className="toggle">
              <input type="checkbox" checked={!!agent[k]} onChange={(e) => set(k, e.target.checked)} />
              <span>
                <b>{label}</b>
                <small>{body}</small>
              </span>
            </label>
          ))}
          <Band>Tour hours</Band>
          <div className="cform pad" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {[["weekday", "Weekdays"], ["saturday", "Saturday"], ["sunday", "Sunday"]].map(([k, label]) => (
              <label key={k} className="field">
                <span>{label}</span>
                <input
                  defaultValue={(hours[k] || []).join(", ")}
                  placeholder="none"
                  onBlur={(e) => patch({ tourHours: { ...hours, [k]: e.target.value.split(/[,\s]+/).map((t) => t.trim()).filter((t) => /^\d{1,2}:\d{2}$/.test(t)).map((t) => t.padStart(5, "0")) } })}
                />
              </label>
            ))}
          </div>
          <Band>What it says about the building</Band>
          <div className="cform pad">
            {FACTS.map(([k, label, ph]) => (
              <label key={k} className="field wide">
                <span>{label}</span>
                <input defaultValue={facts[k] || ""} placeholder={ph} onBlur={(e) => patch({ facts: { ...facts, [k]: e.target.value.trim() } })} />
              </label>
            ))}
          </div>
        </section>
        <aside className="ctx">
          <div className="blk">
            <div className="sect">Lead address</div>
            <div className="mono" style={{ fontSize: 13 }}>{slug}@leads.leaseright.app</div>
            <p className="muted small" style={{ marginTop: 6 }}>
              Each listing site sends its inquiries to this address. The agent reads them, replies and logs the prospect. Live once the backend ships; today the simulation stands in.
            </p>
          </div>
          {project.sim?.on && (
            <>
              <div className="blk">
                <div className="sect">How the practice market behaves</div>
                <p className="muted small">
                  Leads per open unit fall as effective rent rises above what the market pays for a building like this: the town's listing median plus your premium ({project.premium || 0}%, set on Rents). Fast replies tour more often. Concessions lower effective rent. Stale listings lose a third of their leads.
                </p>
                <table className="mini">
                  <tbody>
                    {dem.map((t) => (
                      <tr key={t.id}>
                        <td>{t.label}</td>
                        <td className="mono">{t.fair ? `${money(t.effective)} vs ${money(t.fair)}` : "–"}</td>
                        <td className={`mono ${t.ratio > 1.05 ? "neg" : t.ratio < 0.97 ? "pos" : ""}`}>{t.ratio ? `${t.ratio > 1 ? "+" : ""}${Math.round((t.ratio - 1) * 100)}%` : ""}</td>
                        <td className="mono">{(t.perDay * 7).toFixed(1)}/wk</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="blk">
                <div className="sect">Assumptions</div>
                <table className="mini">
                  <tbody>
                    <tr><td>Inquiries per open unit, at a fair price</td><td className="mono">{SIM.leadsPerOpenUnitWeek}/wk</td></tr>
                    <tr><td>Tour if answered within an hour</td><td className="mono">{Math.round(SIM.tourIfAnsweredFast * 100)}%</td></tr>
                    <tr><td>Tour if answered the same day</td><td className="mono">{Math.round(SIM.tourIfAnsweredSameDay * 100)}%</td></tr>
                    <tr><td>Tour if answered later</td><td className="mono">{Math.round(SIM.tourIfAnsweredLater * 100)}%</td></tr>
                    <tr><td>Show rate, with a reminder</td><td className="mono">{Math.round(SIM.showRateReminded * 100)}%</td></tr>
                    <tr><td>Apply after a tour, at a fair price</td><td className="mono">{Math.round(SIM.applyAfterTour * 100)}%</td></tr>
                    <tr><td>Leads by platform</td><td className="mono">{Object.entries(REACH).map(([k, v]) => `${k.split(" ")[0]} ${Math.round(v * 100)}%`).join(", ")}</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

/** On a real project with no leasing yet: offer a practice run of this building's lease-up. */
export function PracticeCall({ project, today, baseline, dispatch, compact = false }) {
  if (project.sim?.on || !baseline) return null;
  const start = () => dispatch({ type: "create", project: practiceCopy(project, today, startSim) });
  return (
    <div className={`practice ${compact ? "compact" : ""}`}>
      <div>
        <b>Practice this lease-up before it starts.</b>
        <p>
          A copy of {project.name || "this project"} with its units, rents and baseline, running on a simulated market: leads arrive from the listing sites, the agent answers and books tours, and you run the decisions. Prices you set change how fast it leases. The real project is not touched.
        </p>
      </div>
      <button className="btn primary" onClick={start}>
        Start a practice lease-up
      </button>
    </div>
  );
}
