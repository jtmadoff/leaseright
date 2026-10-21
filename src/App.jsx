import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore, newProject, exportProject, importProject, currentBaseline, STAGES } from "./store/store.jsx";
import { useMarketData } from "./data.js";
import { calculate, num } from "./core/model.js";
import { isIncluded, getTown } from "./ri/towns.js";
import { sourceById } from "./core/market.js";
import { money, moneyShort, dateLong, monthLabel, number, duration } from "./core/format.js";
import { Icon, Menu, download } from "./ui/atoms.jsx";
import { Projects } from "./views/Projects.jsx";
import { PropertyStep } from "./views/PropertyStep.jsx";
import { UnitsStep } from "./views/UnitsStep.jsx";
import { PlanStep } from "./views/PlanStep.jsx";
import { ReviewStep, makeBaseline } from "./views/ReviewStep.jsx";
import { MarketOverlay } from "./views/Market.jsx";

const STEPS = ["Property", "Units and rents", "Lease-up plan", "Review"];

function TopBar({ state, project, data, onHome, onNew, onSwitch, onMessage, onAskDelete }) {
  const { dispatch } = useStore();
  const fileRef = useRef(null);
  const zori = sourceById(data.rents, "zori");
  const listings = sourceById(data.rents, "listings");
  const restore = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5000000) throw new Error("Choose a backup smaller than 5 MB.");
      dispatch({ type: "create", project: importProject(await file.text()) });
      onMessage("");
    } catch (e) {
      onMessage(e.message || "That backup could not be read.");
    }
  };
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label="LeaseRight projects">
        <span className="glyph">L</span>
        <span>LEASERIGHT</span>
      </button>
      <span className="sep" />
      {state.projects.length > 0 && (
        <select className="switcher" aria-label="Switch project" value={project?.id || ""} onChange={(e) => (e.target.value ? onSwitch(e.target.value) : onHome())}>
          <option value="">All projects</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || p.address || "Untitled project"}
            </option>
          ))}
        </select>
      )}
      <span className="statechip">
        <i /> RI <span style={{ color: "var(--fg-3)" }}>Rhode Island</span>
      </span>
      <div className="meta">
        {zori && (
          <span>
            Rent index <b>{monthLabel(zori.asOf)}</b>
          </span>
        )}
        <span>
          Listings <b>{listings ? dateLong(listings.asOf) : "not connected"}</b>
        </span>
        {data.supply?.source?.asOf && (
          <span>
            Pipeline <b>{dateLong(data.supply.source.asOf)}</b>
          </span>
        )}
      </div>
      <span className="spacer" />
      <button className="btn" onClick={() => onNew()}>
        <Icon.plus /> New project
      </button>
      <Menu label="More actions">
        {project && <button onClick={() => download(`${project.name || "leaseright-project"}.json`, exportProject(project), "application/json")}>Export this project</button>}
        <button onClick={() => fileRef.current?.click()}>Restore from backup</button>
        {project && (
          <button className="danger" onClick={onAskDelete}>
            Delete this project
          </button>
        )}
      </Menu>
      <input ref={fileRef} type="file" accept=".json,application/json" onChange={restore} style={{ display: "none" }} aria-label="Restore project backup" />
    </header>
  );
}

function ProjectShell({ project, data }) {
  const { dispatch, saveStatus } = useStore();
  const [marketOpen, setMarketOpen] = useState(false);
  const result = useMemo(() => calculate(project, { townIncluded: isIncluded }), [project]);
  const step = Math.max(0, Math.min(3, project.step || 0));
  const setStep = (s) => {
    dispatch({ type: "step", id: project.id, step: s });
    window.scrollTo({ top: 0 });
  };
  const patch = (p) => dispatch({ type: "patch", id: project.id, patch: p });
  const planPatch = (p) => dispatch({ type: "plan", id: project.id, patch: p });
  const blocking = (s) => result.issues.some((i) => i.blocking && i.step === s);
  const done = [
    !!(project.address && project.town && isIncluded(project.town) && num(project.totalUnits) > 0),
    project.unitMix.length > 0 && !blocking(1),
    !blocking(2),
    currentBaseline(project).current,
  ];
  const approve = (baseline) => dispatch({ type: "approve", id: project.id, baseline });
  const baselineCurrent = currentBaseline(project).current;
  const canSave = result.ready && result.base.reached;
  const units = num(project.totalUnits) || result.inputs.totalUnits || null;
  const b = result.ready ? result.base : null;
  const kpis = [
    ["Units", units ? number(units) : null, project.town ? `${project.town} · ${STAGES[project.stage].label}` : STAGES[project.stage].label],
    ["Asking rent", result.ready ? money(result.averageRent) : null, result.ready ? `${money(result.effectiveRent)} effective` : "set in step 2"],
    ["Pace", result.ready ? `${result.inputs.pace.toFixed(1)} / wk` : null, result.ready && result.inputs.paceSource === "required" ? "required by target date" : "leases signed"],
    ["Stabilized", b?.reached ? dateLong(b.stabilizeDate) : null, b?.reached ? duration(b.leaseUpDays) : "set in step 3"],
    ["Reserve need", b && result.inputs.monthlyCarry ? (b.reserveNeed < 1 ? "None" : moneyShort(b.reserveNeed)) : null, b && result.inputs.monthlyCarry ? (b.reserveNeed < 1 ? "rent covers carry" : `deepest ${dateLong(b.reserveTroughDate)}`) : "needs monthly carry"],
  ];
  return (
    <>
      <nav className="steps" aria-label="Plan steps">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className="line" />}
            <button className={`step ${i === step ? "on" : ""} ${done[i] ? "done" : ""}`} aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)}>
              <span className="n">{done[i] ? <Icon.check size={12} /> : i + 1}</span>
              {label}
            </button>
          </React.Fragment>
        ))}
        <span className="spacer" />
        {project.town && (
          <button className="btn small" onClick={() => setMarketOpen(true)}>
            {project.town} market <Icon.arrow size={13} />
          </button>
        )}
      </nav>
      {marketOpen && <MarketOverlay project={project} data={data} onClose={() => setMarketOpen(false)} />}
      <div className="kpis" aria-label="Plan summary">
        {kpis.map(([label, value, sub]) => (
          <div className="kpi" key={label}>
            <span className="k-label">{label}</span>
            <span className={`k-val ${value ? "" : "empty"}`}>{value || "–"}</span>
            <span className="k-sub">{sub}</span>
          </div>
        ))}
      </div>
      {step === 0 && <PropertyStep project={project} patch={patch} />}
      {step === 1 && <UnitsStep project={project} patch={patch} data={data} />}
      {step === 2 && <PlanStep project={project} planPatch={planPatch} result={result} onStep={setStep} />}
      {step === 3 && <ReviewStep project={project} result={result} data={data} onStep={setStep} onApprove={approve} onMarket={() => setMarketOpen(true)} />}
      <div className="navbar">
        <span className="muted small" role="status">
          {saveStatus}
        </span>
        <span className="spacer" />
        {step > 0 && (
          <button className="btn" onClick={() => setStep(step - 1)}>
            <Icon.back /> {STEPS[step - 1]}
          </button>
        )}
        {step < 3 && (
          <button className="btn primary" onClick={() => setStep(step + 1)}>
            Next: {STEPS[step + 1]} <Icon.arrow />
          </button>
        )}
        {step === 3 && !baselineCurrent && (
          <button className="btn primary" disabled={!canSave} title={canSave ? undefined : "The plan has to reach target occupancy first"} onClick={() => approve(makeBaseline(project, result))}>
            <Icon.check /> Save baseline
          </button>
        )}
        {step === 3 && baselineCurrent && (
          <button className="btn primary" onClick={() => dispatch({ type: "close" })}>
            Done: back to projects <Icon.arrow />
          </button>
        )}
      </div>
    </>
  );
}

export default function App() {
  const { state, dispatch } = useStore();
  const data = useMarketData();
  const [message, setMessage] = useState(state.notice || (state.migrated ? `Carried over ${state.migrated} project${state.migrated > 1 ? "s" : ""} from the earlier version.` : ""));
  const [deleteId, setDeleteId] = useState(null);
  const project = state.projects.find((p) => p.id === state.activeId) || null;

  const create = (seed = {}) => {
    const clean = { ...seed };
    if (clean.town && !getTown(clean.town)?.included) delete clean.town;
    dispatch({ type: "create", project: newProject(clean) });
    setDeleteId(null);
    window.scrollTo({ top: 0 });
  };

  // Hand-off link from Lead Engine: /?new=1&name=...&town=...&units=...&sponsor=...
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("new") !== "1") return;
    const units = Number(q.get("units"));
    create({
      name: (q.get("name") || "").slice(0, 120),
      town: getTown(q.get("town"))?.name || "",
      totalUnits: Number.isInteger(units) && units > 0 && units <= 10000 ? String(units) : "",
      sponsor: (q.get("sponsor") || "").slice(0, 120),
    });
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <>
      <TopBar
        state={state}
        project={project}
        data={data}
        onHome={() => dispatch({ type: "close" })}
        onNew={create}
        onSwitch={(id) => dispatch({ type: "activate", id })}
        onMessage={setMessage}
        onAskDelete={() => setDeleteId(project?.id || null)}
      />
      {(message || state.storageError) && (
        <div className="banner" role="status">
          <span>{state.storageError || message}</span>
          {!state.storageError && (
            <button className="linkbtn" onClick={() => setMessage("")}>
              Dismiss
            </button>
          )}
        </div>
      )}
      {project && deleteId === project.id && (
        <div className="banner bad" role="alertdialog" aria-label="Delete project">
          <span>
            Delete <strong>{project.name || project.address || "this project"}</strong> and its {project.baselines.length} baseline{project.baselines.length === 1 ? "" : "s"}? This cannot be undone.
          </span>
          <span className="row">
            <button
              className="btn small danger"
              onClick={() => {
                dispatch({ type: "delete", id: project.id });
                setDeleteId(null);
              }}
            >
              Delete project
            </button>
            <button className="btn small" onClick={() => setDeleteId(null)}>
              Keep it
            </button>
          </span>
        </div>
      )}
      {project ? <ProjectShell key={project.id} project={project} data={data} /> : <Projects projects={state.projects} data={data} onOpen={(id) => dispatch({ type: "activate", id })} onNew={create} />}
    </>
  );
}
