/* global React, SEED */
const { createContext, useContext, useReducer } = React;

const StoreContext = createContext(null);
const cloneSeed = () => (typeof structuredClone === "function" ? structuredClone(SEED) : JSON.parse(JSON.stringify(SEED)));

function reducer(state, action) {
  switch (action.type) {
    // Record the first real contact with a lead.
    case "contactLead":
      return { ...state, leads: state.leads.map(l => l.id === action.leadId ? { ...l, contactedAt: action.at || new Date().toISOString(), pipelineStage: "contacted" } : l) };
    // Attach a booked tour to the canonical lead.
    case "bookTour": {
      const tour = action.tour;
      return { ...state, tours: [...state.tours, tour], leads: state.leads.map(l => l.id === tour.leadId ? { ...l, tourIds: [...(l.tourIds || []), tour.id], pipelineStage: "toured" } : l) };
    }
    // Create an application beneath the canonical lead.
    case "submitApplication": {
      const application = action.application;
      return { ...state, applications: [...state.applications, application], leads: state.leads.map(l => l.id === application.leadId ? { ...l, applicationId: application.id, pipelineStage: "applied" } : l) };
    }
    // Approve an application without duplicating the applicant.
    case "approveApplication":
      return { ...state, applications: state.applications.map(a => a.id === action.applicationId ? { ...a, status: "approved" } : a) };
    // Attach a signed lease to the same person record.
    case "signLease":
      return { ...state, leases: [...state.leases, action.lease], leads: state.leads.map(l => l.id === action.lease.leadId ? { ...l, leaseId: action.lease.id, pipelineStage: "signed" } : l) };
    // Add a deposit or first-rent payment to the shared ledger.
    case "collectDeposit":
      return { ...state, payments: [...state.payments, action.payment] };
    // Accept a Today decision and write its result through to its subject.
    case "acceptDecision":
      return { ...state, decisions: state.decisions.map(d => d.id === action.decisionId ? { ...d, outcome: "accepted", acceptedValue: action.value } : d) };
    // Publish an asking rent on the canonical unit type.
    case "setRent":
      return { ...state, unitTypes: state.unitTypes.map(u => u.id === action.unitTypeId ? { ...u, askingRent: action.rent } : u) };
    // Transition a lead; surface-specific child creation is layered in subsequent tasks.
    case "dragLeadToStage":
      return { ...state, leads: state.leads.map(l => l.id === action.leadId ? { ...l, pipelineStage: action.stage } : l) };
    // Select the active underwriting scenario.
    case "setActiveScenario":
      return { ...state, scenarios: state.scenarios.map(s => ({ ...s, active: s.id === action.scenarioId })), model: state.model.map(m => m.id === action.modelId ? { ...m, activeScenarioId: action.scenarioId } : m) };
    // Persist controlled model intake edits.
    case "updateModel":
      return { ...state, model: state.model.map(m => m.id === action.modelId ? { ...m, ...action.patch } : m) };
    // Launch the project; baseline freezing and unit generation land in N9.
    case "launchProject": {
      const project = state.projects.find(p => p.id === action.projectId);
      const model = state.model.find(m => m.projectId === action.projectId);
      const scenario = state.scenarios.find(s => s.id === model?.activeScenarioId);
      const baseline = scenario ? Object.freeze({ ...scenario, frozenAt: action.at || new Date().toISOString() }) : null;
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.projectId ? { ...p, stage: "active_leaseup", launchedAt: action.at || new Date().toISOString() } : p),
        model: state.model.map(m => m.projectId === project?.id ? { ...m, baselineScenarioId: scenario?.id || null, baseline } : m),
      };
    }
    case "setActiveProject":
      return { ...state, activeProjectId: action.projectId };
    case "setProjectStage":
      return { ...state, projects: state.projects.map(p => p.id === action.projectId ? { ...p, stage: action.stage } : p) };
    case "updateProject":
      return { ...state, projects: state.projects.map(p => p.id === action.projectId ? { ...p, ...action.patch } : p) };
    default:
      return state;
  }
}

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({ ...cloneSeed(), activeProjectId: SEED.projects[0]?.id || null }));
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

function useSelector(selector) {
  return selector(useStore().state);
}

Object.assign(window, { StoreProvider, useStore, useSelector, leaseRightReducer: reducer });
