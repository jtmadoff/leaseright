import React, { createContext, useContext, useEffect, useReducer, useState } from "react";
import { bedsFromLabel } from "../core/model.js";
import { getTown } from "../ri/towns.js";
import { localToday } from "../core/format.js";

export const STORAGE_KEY = "leaseright_v2";
const LEGACY_KEY = "leaseright_ri_intake_v1";

export const STAGES = {
  pre_funding: {
    label: "Pre-funding",
    short: "Size the lease-up and the reserve before capital closes.",
    planLead: "A start date, a pace and the monthly carry are enough for a lender-ready first pass.",
  },
  funded_prelaunch: {
    label: "Funded, pre-launch",
    short: "Lock rents, concessions and pace before the first lead arrives.",
    planLead: "Set the launch date and the pace you are staffing for.",
  },
  active_leaseup: {
    label: "Already leasing",
    short: "Start from what is leased today and plan the rest.",
    planLead: "Use today as the start date. Units already leased count from day one.",
  },
};

export const PROJECT_TYPES = ["New construction", "Conversion / adaptive reuse", "Existing rental property"];

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function emptyPlan() {
  return {
    startDate: "",
    targetDate: "",
    targetOccupancy: "",
    leasesPerWeek: "",
    leaseTerm: "",
    freeMonths: "",
    moveInLag: "",
    monthlyCarry: "",
    marketing: "",
    staffing: "",
    notes: "",
  };
}

export function newProject(seed = {}) {
  const at = new Date().toISOString();
  return {
    id: `ri-${uid()}`,
    v: 2,
    state: "RI",
    name: "",
    stage: "pre_funding",
    projectType: "",
    sponsor: "",
    address: "",
    town: "",
    zip: "",
    location: null,
    parcel: null,
    zoning: null,
    totalUnits: "",
    unitMix: [],
    plan: emptyPlan(),
    baselines: [],
    actuals: [],
    units: [],
    prospects: [],
    leasingTab: "today",
    leasingSource: "auto",
    concessions: [],
    platforms: defaultPlatforms(),
    policy: { minCredit: 620, incomeMultiple: 3 },
    dismissed: [],
    priceChangedAt: "",
    view: "plan",
    step: 0,
    createdAt: at,
    updatedAt: at,
    ...seed,
  };
}

export const VIEWS = ["home", "plan", "package", "leasing", "today", "pipeline", "inbox", "rents", "applications", "reports", "listings", "concessions", "market", "units"];

const PLATFORM_NAMES = ["Zillow", "Apartments.com", "Zumper", "Realtor.com", "Facebook Marketplace", "Website"];
export function defaultPlatforms() {
  return PLATFORM_NAMES.map((name) => ({ id: name.toLowerCase().replace(/[^a-z]+/g, "-"), name, active: false, cost: "", url: "", syncedAt: "" }));
}
const STAGE_KEYS = ["lead", "tour", "toured", "applied", "approved", "leased", "lost"];

/** One week of leasing activity. Counts are kept as typed so blanks stay blank. */
export function newActual(seed = {}) {
  return { id: uid(), weekEnding: "", leads: "", tours: "", applications: "", leases: "", cancellations: "", note: "", ...seed };
}

/** Fields added after a project was first saved get their defaults here. */
export function upgradeProject(p) {
  return {
    ...p,
    actuals: Array.isArray(p.actuals) ? p.actuals : [],
    units: Array.isArray(p.units) ? p.units : [],
    prospects: Array.isArray(p.prospects) ? p.prospects : [],
    leasingTab: p.leasingTab || "today",
    leasingSource: p.leasingSource || "auto",
    concessions: Array.isArray(p.concessions) ? p.concessions : [],
    platforms: Array.isArray(p.platforms) ? p.platforms : defaultPlatforms(),
    policy: p.policy && typeof p.policy === "object" ? p.policy : { minCredit: 620, incomeMultiple: 3 },
    dismissed: Array.isArray(p.dismissed) ? p.dismissed : [],
    priceChangedAt: p.priceChangedAt || "",
    view: p.view === "leasing" ? "today" : VIEWS.includes(p.view) ? p.view : p.baselines?.length ? "home" : "plan",
  };
}

/** A new prospect. Dates are YYYY-MM-DD; a tour time is YYYY-MM-DDTHH:MM. */
export function newProspect(seed = {}) {
  return {
    id: uid(),
    name: "",
    phone: "",
    email: "",
    source: "",
    beds: "",
    moveIn: "",
    budget: "",
    stage: "lead",
    createdAt: localToday(),
    tourAt: "",
    touredAt: "",
    appliedAt: "",
    approvedAt: "",
    leasedAt: "",
    lostAt: "",
    lostReason: "",
    cancelledAt: "",
    unitId: "",
    leaseRent: "",
    freeMonths: "",
    nextAt: "",
    nextNote: "",
    notes: [],
    history: [],
    messages: [],
    app: {},
    ...seed,
  };
}

export function newRow(beds, seed = {}) {
  const label = beds === "" || beds === null ? "" : beds === 0 ? "Studio" : `${beds} bedroom`;
  return { id: uid(), label, beds, count: "", sqft: "", rent: "", leased: "0", availableDate: "", ...seed };
}

/** The inputs a baseline freezes. Two projects with the same key produce the same result. */
export function inputsKey(project) {
  return JSON.stringify([
    (project.unitMix || []).map((r) => [r.label, r.beds, r.count, r.sqft, r.rent, r.leased, r.availableDate]),
    project.plan,
  ]);
}

export function currentBaseline(project) {
  const last = project.baselines[project.baselines.length - 1];
  if (!last) return { baseline: null, current: false };
  return { baseline: last, current: last.key === inputsKey(project) };
}

/** True only when nothing has been entered anywhere, so an untouched draft can be dropped. */
export function isBlank(p) {
  return (
    !p.name && !p.address && !p.town && !p.totalUnits && !p.sponsor && !p.projectType && !p.unitMix.length && !p.baselines.length && !(p.actuals || []).length && !(p.prospects || []).length &&
    Object.values(p.plan).every((v) => v === "" || v === null || v === undefined)
  );
}

function validProject(p) {
  return p && typeof p === "object" && typeof p.id === "string" && p.v === 2 && Array.isArray(p.unitMix) && p.plan && typeof p.plan === "object" && Array.isArray(p.baselines);
}

const str = (v) => (v === null || v === undefined ? "" : String(v).slice(0, 2000));

/** Rebuild a project from untrusted JSON (a backup file) field by field, so a bad value cannot break rendering. */
export function sanitizeProject(p) {
  const base = newProject();
  const plan = Object.fromEntries(Object.keys(base.plan).map((k) => [k, str(p.plan?.[k])]));
  const loc = p.location && Number.isFinite(p.location.lat) && Number.isFinite(p.location.lng) ? { lat: p.location.lat, lng: p.location.lng, source: str(p.location.source) } : null;
  return {
    ...base,
    name: str(p.name),
    stage: STAGES[p.stage] ? p.stage : "pre_funding",
    projectType: PROJECT_TYPES.includes(p.projectType) ? p.projectType : "",
    sponsor: str(p.sponsor),
    address: str(p.address),
    town: getTown(p.town)?.name || "",
    zip: /^\d{5}$/.test(p.zip) ? p.zip : "",
    location: loc,
    totalUnits: str(p.totalUnits),
    unitMix: p.unitMix
      .filter((r) => r && typeof r === "object")
      .slice(0, 200)
      .map((r) => newRow(r.beds === "" || r.beds === null || r.beds === undefined || !Number.isFinite(Number(r.beds)) ? "" : Number(r.beds), { label: str(r.label), count: str(r.count), sqft: str(r.sqft), rent: str(r.rent), leased: str(r.leased), availableDate: str(r.availableDate) })),
    plan,
    baselines: p.baselines.filter((b) => b && typeof b.id === "string" && typeof b.approvedAt === "string" && typeof b.key === "string" && b.summary && Number.isFinite(b.summary.reserveNeed) && Number.isFinite(b.summary.leasesPerWeek) && typeof b.summary.stabilizeDate === "string"),
    actuals: (Array.isArray(p.actuals) ? p.actuals : [])
      .filter((r) => r && typeof r === "object" && /^\d{4}-\d{2}-\d{2}$/.test(r.weekEnding))
      .slice(0, 520)
      .map((r) => newActual({ weekEnding: r.weekEnding, leads: str(r.leads), tours: str(r.tours), applications: str(r.applications), leases: str(r.leases), cancellations: str(r.cancellations), note: str(r.note) })),
    units: (Array.isArray(p.units) ? p.units : [])
      .filter((u) => u && typeof u.id === "string")
      .slice(0, 5000)
      .map((u) => ({ id: str(u.id), number: str(u.number), floor: Number(u.floor) || 1, typeId: str(u.typeId), label: str(u.label), beds: Number.isFinite(Number(u.beds)) && u.beds !== "" && u.beds !== null ? Number(u.beds) : null, sqft: Number(u.sqft) || null, rent: Number(u.rent) || null, availableDate: str(u.availableDate), hold: !!u.hold, note: str(u.note) })),
    prospects: (Array.isArray(p.prospects) ? p.prospects : [])
      .filter((x) => x && typeof x.id === "string")
      .slice(0, 20000)
      .map((x) => {
        const base = newProspect();
        const clean = Object.fromEntries(Object.keys(base).filter((k) => !["notes", "history", "messages", "app"].includes(k)).map((k) => [k, str(x[k])]));
        const list = (v) => (Array.isArray(v) ? v.filter((h) => h && typeof h.text === "string").slice(0, 500).map((h) => ({ at: str(h.at), text: str(h.text) })) : []);
        const msgs = Array.isArray(x.messages) ? x.messages.filter((m) => m && typeof m.text === "string").slice(0, 1000).map((m) => ({ id: str(m.id) || uid(), at: str(m.at), dir: m.dir === "in" ? "in" : "out", channel: ["sms", "email", "call", "note"].includes(m.channel) ? m.channel : "note", text: str(m.text) })) : [];
        const a = x.app && typeof x.app === "object" ? x.app : {};
        const app = { credit: str(a.credit), background: str(a.background), income: str(a.income), incomeVerified: !!a.incomeVerified, deposit: str(a.deposit), cosigner: !!a.cosigner, note: str(a.note) };
        return { ...clean, stage: STAGE_KEYS.includes(x.stage) ? x.stage : "lead", notes: list(x.notes), history: list(x.history), messages: msgs, app };
      }),
    concessions: (Array.isArray(p.concessions) ? p.concessions : []).filter((c) => c && typeof c.id === "string").slice(0, 100).map((c) => ({ id: str(c.id), name: str(c.name), months: str(c.months), beds: Array.isArray(c.beds) ? c.beds.map(Number).filter(Number.isFinite) : [], startsAt: str(c.startsAt), endsAt: str(c.endsAt), note: str(c.note) })),
    platforms: (Array.isArray(p.platforms) ? p.platforms : defaultPlatforms()).filter((f) => f && typeof f.name === "string").slice(0, 40).map((f) => ({ id: str(f.id) || uid(), name: str(f.name), active: !!f.active, cost: str(f.cost), url: /^https?:\/\//.test(f.url || "") ? str(f.url) : "", syncedAt: str(f.syncedAt) })),
    policy: { minCredit: Number(p.policy?.minCredit) || 620, incomeMultiple: Number(p.policy?.incomeMultiple) || 3 },
    view: p.baselines.length ? "home" : "plan",
    step: Number.isInteger(p.step) && p.step >= 0 && p.step <= 3 ? p.step : 0,
    // The parcel and zoning are looked up again from the address rather than trusted from the file.
  };
}

/** Carry projects over from the first intake build so nothing typed there is lost. */
export function migrateLegacy(raw) {
  try {
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || !Array.isArray(saved.projects)) return [];
    return saved.projects
      .filter((p) => p?.draft)
      .map((p) => {
        const d = p.draft;
        const street = String(p.address || "").split(",")[0].trim();
        const zip = (String(p.address || "").match(/\b(0\d{4})\b/) || [])[1] || "";
        const town = getTown(p.municipality)?.name || "";
        return newProject({
          id: p.id,
          name: p.name === "Untitled project" ? "" : p.name || "",
          stage: STAGES[p.stage] ? p.stage : "pre_funding",
          projectType: PROJECT_TYPES.includes(p.developmentType) ? p.developmentType : "",
          sponsor: p.sponsor || "",
          address: street,
          town,
          zip,
          location: p.location && Number.isFinite(p.location.lat) ? { lat: p.location.lat, lng: p.location.lng, source: "migrated" } : null,
          totalUnits: d.totalUnits || "",
          unitMix: (d.unitMix || []).map((r) => newRow(bedsFromLabel(r.label) ?? "", { label: r.label, count: r.count, sqft: r.sqft, rent: r.rent, leased: r.leased || "0", availableDate: r.availableDate || "" })),
          plan: {
            ...emptyPlan(),
            startDate: d.deliveryDate || "",
            targetDate: d.targetDate || "",
            targetOccupancy: d.targetOccupancy || "",
            leasesPerWeek: d.leasesPerWeek || "",
            leaseTerm: d.leaseTerm || "",
            freeMonths: d.freeMonths || "",
            monthlyCarry: d.monthlyCarry || "",
            marketing: d.marketing || "",
            staffing: d.staffing || "",
            notes: d.notes || "",
          },
          step: 0,
          updatedAt: p.updatedAt || new Date().toISOString(),
          migratedFrom: "v1",
        });
      });
  } catch {
    return [];
  }
}

export function loadState(storage) {
  const base = { projects: [], activeId: null, storageError: null };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.version !== 2 || !Array.isArray(saved.projects) || saved.projects.some((p) => !validProject(p))) {
        // Keep the unreadable copy under its own key and start clean, so new work can be saved.
        const backupKey = `${STORAGE_KEY}_unreadable_${Date.now()}`;
        storage.setItem(backupKey, raw);
        return { ...base, notice: `Saved projects could not be read. A copy was kept in this browser under "${backupKey}" and a fresh workspace was started.` };
      }
      const projects = saved.projects.map(upgradeProject).filter((p) => !isBlank(p));
      return { ...base, projects, activeId: projects.some((p) => p.id === saved.activeId) ? saved.activeId : projects[0]?.id || null };
    }
    const legacy = storage.getItem(LEGACY_KEY);
    if (legacy) {
      const projects = migrateLegacy(legacy).filter((p) => !isBlank(p));
      return { ...base, projects, activeId: projects[0]?.id || null, migrated: projects.length };
    }
  } catch {
    return { ...base, storageError: "Browser storage is not available. Work will not be saved." };
  }
  return base;
}

export function reducer(state, action) {
  const touch = (p, patch) => ({ ...p, ...patch, updatedAt: action.at || new Date().toISOString() });
  const mapProject = (fn) => ({ ...state, projects: state.projects.map((p) => (p.id === action.id ? fn(p) : p)) });
  switch (action.type) {
    // Untouched drafts are dropped whenever the user moves on, so the list never fills with blanks.
    case "create":
      return { ...state, projects: [...state.projects.filter((p) => !isBlank(p)), action.project], activeId: action.project.id };
    case "activate":
      return state.projects.some((p) => p.id === action.id) ? { ...state, projects: state.projects.filter((p) => p.id === action.id || !isBlank(p)), activeId: action.id } : state;
    case "close":
      return { ...state, projects: state.projects.filter((p) => !isBlank(p)), activeId: null };
    case "patch":
      return mapProject((p) => touch(p, action.patch));
    case "plan":
      return mapProject((p) => touch(p, { plan: { ...p.plan, ...action.patch } }));
    case "step":
      return mapProject((p) => ({ ...p, view: "plan", step: action.step }));
    case "view":
      return mapProject((p) => ({ ...p, view: action.view }));
    case "actual-save":
      return mapProject((p) => {
        const exists = p.actuals.some((r) => r.id === action.row.id);
        const actuals = exists ? p.actuals.map((r) => (r.id === action.row.id ? action.row : r)) : [...p.actuals, action.row];
        return touch(p, { actuals });
      });
    case "prospect-save":
      return mapProject((p) => {
        const list = p.prospects || [];
        const exists = list.some((x) => x.id === action.prospect.id);
        return touch(p, { prospects: exists ? list.map((x) => (x.id === action.prospect.id ? action.prospect : x)) : [action.prospect, ...list] });
      });
    case "prospect-delete":
      return mapProject((p) => touch(p, { prospects: (p.prospects || []).filter((x) => x.id !== action.prospectId) }));
    case "units-set":
      return mapProject((p) => touch(p, { units: action.units }));
    case "unit-save":
      return mapProject((p) => touch(p, { units: (p.units || []).map((u) => (u.id === action.unit.id ? action.unit : u)) }));
    case "actual-delete":
      return mapProject((p) => touch(p, { actuals: p.actuals.filter((r) => r.id !== action.rowId) }));
    case "approve":
      return mapProject((p) => touch(p, { baselines: [...p.baselines, action.baseline] }));
    // Another tab saved: take its projects, keep this tab's open project if it still exists.
    case "hydrate": {
      const ids = new Set(action.projects.map((p) => p.id));
      return { ...state, projects: action.projects.map(upgradeProject), activeId: ids.has(state.activeId) ? state.activeId : null };
    }
    case "delete": {
      const projects = state.projects.filter((p) => p.id !== action.id);
      return { ...state, projects, activeId: state.activeId === action.id ? null : state.activeId };
    }
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState(window.localStorage));
  const [saveStatus, setSaveStatus] = useState("");
  const lastWritten = React.useRef(null);
  useEffect(() => {
    if (state.storageError) {
      setSaveStatus(state.storageError);
      return;
    }
    try {
      const text = JSON.stringify({ version: 2, activeId: state.activeId, projects: state.projects });
      lastWritten.current = text;
      window.localStorage.setItem(STORAGE_KEY, text);
      setSaveStatus("Saved in this browser");
    } catch {
      setSaveStatus("Not saved: browser storage is full or blocked. Export a backup.");
    }
  }, [state]);
  // Two tabs share one saved state. When another tab writes, adopt its projects instead of
  // overwriting them with this tab's older copy on the next edit.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue || event.newValue === lastWritten.current) return;
      const next = loadState({ getItem: () => event.newValue, setItem: () => {} });
      if (!next.notice && !next.storageError) dispatch({ type: "hydrate", projects: next.projects });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return <StoreContext.Provider value={{ state, dispatch, saveStatus }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

export function exportProject(project) {
  return JSON.stringify({ format: "leaseright-project", version: 2, project }, null, 2);
}

export function importProject(text) {
  const saved = JSON.parse(text);
  if (saved?.format !== "leaseright-project") throw new Error("That file is not a LeaseRight backup.");
  if (saved.version === 2 && validProject(saved.project)) return sanitizeProject(saved.project);
  if (saved.version === 1 && saved.project?.draft) {
    const [p] = migrateLegacy(JSON.stringify({ version: 1, projects: [saved.project] }));
    if (p) return { ...p, id: `ri-${uid()}` };
  }
  throw new Error("That backup could not be read.");
}
