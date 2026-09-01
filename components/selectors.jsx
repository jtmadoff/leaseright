/* global SEED */

const LEAD_STAGE_ORDER = ["new", "contacted", "toured", "applied", "approved", "signed", "lost"];

function deriveLeadStage(lead, state = SEED) {
  if (!lead) return "new";
  if (lead.lostReason) return "lost";
  const resident = (state.residents || []).find(r => r.id === lead.residentId);
  const lease = (state.leases || []).find(l => l.id === lead.leaseId);
  const application = (state.applications || []).find(a => a.id === lead.applicationId);
  if (resident || (lease && ["signed", "active"].includes(lease.status))) return "signed";
  if (lease || (application && application.status === "approved")) return "approved";
  if (application) return "applied";
  if ((lead.tourIds || []).length) return "toured";
  if (lead.contactedAt || lead.pipelineStage === "contacted") return "contacted";
  return "new";
}

function stageCounts(leads, state = SEED) {
  return (leads || []).reduce((counts, lead) => {
    const stage = deriveLeadStage(lead, state);
    counts[stage] = (counts[stage] || 0) + 1;
    return counts;
  }, Object.fromEntries(LEAD_STAGE_ORDER.map(stage => [stage, 0])));
}

function sharedQuantities(project, state = SEED) {
  const projectId = typeof project === "string" ? project : project?.id;
  const model = (state.model || []).find(row => row.projectId === projectId);
  const scenario = (state.scenarios || []).find(row => row.id === model?.activeScenarioId);
  const types = (state.unitTypes || []).filter(row => row.projectId === projectId);
  const units = (state.units || []).filter(row => row.projectId === projectId);
  const totalUnits = project?.unitCount || types.reduce((sum, row) => sum + row.totalUnits, 0) || units.length;
  const leasedUnits = types.reduce((sum, row) => sum + row.leasedCount, 0) || units.filter(row => ["leased", "occupied"].includes(row.availabilityStatus)).length;
  const actualVelocity = types.reduce((sum, row) => sum + row.velocityActual, 0);
  const planVelocity = (model?.unitMixPlan || []).reduce((sum, row) => sum + row.plannedVelocity, 0) || scenario?.leasesPerWeek || 0;
  const payments = (state.payments || []).filter(row => row.projectId === projectId);
  return {
    absorption: { plan: planVelocity, actual: actualVelocity },
    velocity: { plan: scenario?.leasesPerWeek || planVelocity, actual: actualVelocity },
    occupancy: { plan: (project?.targetOccupancyPct || 0) / 100, actual: totalUnits ? leasedUnits / totalUnits : 0 },
    concessionSpend: { plan: scenario?.concessionCost || model?.budget?.concessionReserve || 0, actual: payments.filter(row => row.kind === "concession").reduce((sum, row) => sum + row.amount, 0) },
    staffing: { plan: scenario?.staffingCost || model?.staffingPlan?.cost || 0, actual: model?.staffingPlan?.cost || 0 },
    leasedUnits,
    totalUnits,
  };
}

function variance(quantity) {
  return (quantity?.actual || 0) - (quantity?.plan || 0);
}

function __selfTest() {
  const counts = stageCounts(SEED.leads, SEED);
  console.assert(Object.values(counts).reduce((a, b) => a + b, 0) === SEED.leads.length, "Every lead belongs to one derived stage");
  const meridian = SEED.projects.find(p => p.id === "meridian");
  const q = sharedQuantities(meridian, SEED);
  console.assert(q.occupancy.actual === q.leasedUnits / q.totalUnits, "Occupancy is derived from leased / total units");
  console.assert(variance({ plan: 3, actual: 5 }) === 2, "Variance is actual minus plan");
  return true;
}

Object.assign(window, { LEAD_STAGE_ORDER, deriveLeadStage, stageCounts, sharedQuantities, variance, selectorsSelfTest: __selfTest });
