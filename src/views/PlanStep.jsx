import React from "react";
import { DateField, NumberField, Field, Tile } from "../ui/atoms.jsx";
import { STAGES } from "../store/store.jsx";
import { PLAN_DEFAULTS, isoDate } from "../core/model.js";
import { money, moneyShort, dateLong, duration, number } from "../core/format.js";

export function Snapshot({ result, onStep }) {
  const missing = result.issues.filter((i) => i.blocking);
  if (!result.ready) {
    return (
      <>
        <p className="muted">The lease-up result appears here as soon as these are in:</p>
        <ul className="muted" style={{ paddingLeft: 18, margin: "10px 0" }}>
          {missing.slice(0, 6).map((i, n) => (
            <li key={n}>
              <button className="linkbtn" onClick={() => onStep(i.step)}>
                {i.message}
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }
  const b = result.base;
  const i = result.inputs;
  return (
    <>
      <div className="tiles">
        <Tile label="Stabilized" value={b.reached ? dateLong(b.stabilizeDate) : "Not reached"} sub={`${number(result.targetLeased)} of ${number(result.totalUnits)} units leased`} />
        <Tile label="Lease-up" value={!b.reached ? "–" : b.leaseUpDays === 0 ? "Done" : duration(b.leaseUpDays)} sub={b.leaseUpDays === 0 ? "already at target occupancy" : `${i.pace.toFixed(1)} leases a week`} />
        <Tile label="Reserve need" value={!i.monthlyCarry ? "–" : b.reserveNeed < 1 ? "None" : moneyShort(b.reserveNeed)} sub={!i.monthlyCarry ? "add monthly carry" : b.reserveNeed < 1 ? "rent covers carry from the start" : `deepest ${dateLong(b.reserveTroughDate)}`} />
        <Tile label="Rent covers carry" value={i.monthlyCarry ? (b.breakevenDate ? dateLong(b.breakevenDate) : "Not at target") : "–"} sub={result.carryCoverage ? `${result.carryCoverage.toFixed(2)}x at target occupancy` : ""} />
      </div>
      {b.meetsTarget !== null && (
        <p className="small" style={{ marginBottom: 10 }}>
          <span className={`status ${b.meetsTarget ? "good" : "bad"}`}>{b.meetsTarget ? "Meets" : "Misses"} your target date</span>{" "}
          <span className="muted">
            {dateLong(isoDate(i.targetDate))}
            {result.requiredPace ? ` needs ${result.requiredPace.toFixed(2)} leases a week` : ""}
          </span>
        </p>
      )}
      <p className="muted small">
        Slower pace ({result.scenarios[0].leasesPerWeek.toFixed(1)} a week): {result.scenarios[0].reached ? dateLong(result.scenarios[0].stabilizeDate) : "not reached"}
        {i.monthlyCarry ? `, reserve ${moneyShort(result.scenarios[0].reserveNeed)}` : ""}. Faster ({result.scenarios[2].leasesPerWeek.toFixed(1)}): {dateLong(result.scenarios[2].stabilizeDate)}
        {i.monthlyCarry ? `, reserve ${moneyShort(result.scenarios[2].reserveNeed)}` : ""}.
      </p>
    </>
  );
}

export function PlanStep({ project, planPatch, result, onStep }) {
  const p = project.plan;
  const i = result.inputs;
  const stage = STAGES[project.stage];
  const set = (key) => (value) => planPatch({ [key]: value });
  const err = (field) => result.issues.some((x) => x.field === field && x.blocking && x.step === 2 && p[field] !== "");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; // local date, not UTC
  const paceLine =
    i.start === null
      ? null
      : i.requiredPace !== null && p.leasesPerWeek
        ? `Hitting ${dateLong(p.targetDate)} needs ${i.requiredPace.toFixed(2)} leases a week on average.`
        : i.requiredPace !== null
          ? `No pace entered, so the plan uses the ${i.requiredPace.toFixed(2)} leases a week your target date requires.`
          : null;
  return (
    <div className="page">
      <div className="main">
        <div className="head">
          <div className="eyebrow">Step 3 of 4</div>
          <h1>Lease-up plan</h1>
          <p>{stage.planLead} Everything else has a default you can change.</p>
        </div>

        <section className="card">
          <h2>Timing and pace</h2>
          <div className="grid2">
            <DateField
              label="Leasing starts"
              value={p.startDate}
              onChange={set("startDate")}
              error={err("startDate")}
              hint={
                project.stage === "active_leaseup" && p.startDate !== today ? (
                  <button className="linkbtn" onClick={() => planPatch({ startDate: today })}>
                    Use today
                  </button>
                ) : (
                  "First day leases can be signed."
                )
              }
            />
            <NumberField label="Target occupancy" suffix="% leased" value={p.targetOccupancy} onChange={set("targetOccupancy")} placeholder={String(PLAN_DEFAULTS.targetOccupancy)} min="1" max="100" error={err("targetOccupancy")} hint={`Default ${PLAN_DEFAULTS.targetOccupancy}%. Counted on signed leases.`} />
            <NumberField label="Leases per week" value={p.leasesPerWeek} onChange={set("leasesPerWeek")} min="0" step="0.1" placeholder={i.requiredPace ? i.requiredPace.toFixed(2) : "2.5"} error={err("leasesPerWeek")} optional={p.targetDate ? "or leave blank" : false} hint="Your expected pace. Slower and faster cases run at 80% and 120% of it." />
            <DateField label="Target stabilization date" value={p.targetDate} onChange={set("targetDate")} optional={p.leasesPerWeek ? true : "or enter a pace"} error={err("targetDate")} hint="Enter a pace, a date, or both to test one against the other." />
          </div>
          {paceLine && <div className="notice quiet">{paceLine}</div>}
        </section>

        <section className="card">
          <h2>Concessions</h2>
          <div className="grid2">
            <NumberField label="Lease term" suffix="months" value={p.leaseTerm} onChange={set("leaseTerm")} placeholder={String(PLAN_DEFAULTS.leaseTerm)} min="1" error={err("leaseTerm")} />
            <NumberField label="Free rent on new leases" suffix="months" value={p.freeMonths} onChange={set("freeMonths")} placeholder={String(PLAN_DEFAULTS.freeMonths)} min="0" step="0.5" error={err("freeMonths")} hint="Taken up front: a new lease pays nothing for this long." />
          </div>
        </section>

        <section className="card">
          <h2>Costs while leasing up</h2>
          <div className="grid3">
            <NumberField label="Monthly carrying cost" prefix="$" value={p.monthlyCarry} onChange={set("monthlyCarry")} min="0" step="1000" error={err("monthlyCarry")} hint="Debt service plus operating costs each month, before any rent." />
            <NumberField label="Marketing budget" prefix="$" optional value={p.marketing} onChange={set("marketing")} min="0" step="1000" error={err("marketing")} hint="Total for the lease-up." />
            <NumberField label="Staffing or brokerage" prefix="$" optional value={p.staffing} onChange={set("staffing")} min="0" step="1000" error={err("staffing")} hint="Total, including commissions." />
          </div>
          <details className="more" open={p.moveInLag !== "" || p.notes !== ""}>
            <summary>Rent timing and notes</summary>
            <div className="grid2">
              <NumberField label="Days from signing to first rent" suffix="days" value={p.moveInLag} onChange={set("moveInLag")} placeholder={String(PLAN_DEFAULTS.moveInLag)} min="0" error={err("moveInLag")} hint={`Default ${PLAN_DEFAULTS.moveInLag}. Free rent starts after this.`} />
              <Field label="Assumptions and open questions" optional>
                <textarea value={p.notes} onChange={(e) => planPatch({ notes: e.target.value })} />
              </Field>
            </div>
          </details>
        </section>
      </div>

      <aside className="aside" aria-label="Lease-up snapshot">
        <div className="sect">Lease-up snapshot</div>
        <Snapshot result={result} onStep={onStep} />
        {result.ready && i.monthlyCarry > 0 && (
          <div className="card">
            <div className="sect">Through stabilization</div>
            <dl className="facts">
              <div>
                <dt>Gross carry</dt>
                <dd>{money(result.base.grossCarry)}</dd>
              </div>
              <div>
                <dt>Rent collected</dt>
                <dd>{money(result.base.rentCollected)}</dd>
              </div>
              <div>
                <dt>{result.base.netCarry < 0 ? "Rent over carry" : "Net carry"}</dt>
                <dd>{money(Math.abs(result.base.netCarry))}</dd>
              </div>
              <div>
                <dt>Free rent given</dt>
                <dd>{money(result.base.concessionCost)}</dd>
              </div>
            </dl>
          </div>
        )}
      </aside>
    </div>
  );
}
