/* Rhode Island intake domain: pure, dependency-free, separate from demo records. */
const RI_TOWNS = ["Barrington","Bristol","Burrillville","Central Falls","Charlestown","Coventry","Cranston","Cumberland","East Greenwich","East Providence","Exeter","Foster","Glocester","Hopkinton","Jamestown","Johnston","Lincoln","Little Compton","Middletown","Narragansett","New Shoreham","Newport","North Kingstown","North Providence","North Smithfield","Pawtucket","Portsmouth","Providence","Richmond","Scituate","Smithfield","South Kingstown","Tiverton","Warren","Warwick","West Greenwich","West Warwick","Westerly","Woonsocket"];
const INTAKE_STORAGE_KEY = "leaseright_ri_intake_v1";
const intakeCopy = value => JSON.parse(JSON.stringify(value));
function newIntakeProject(id, stage, at) {
  return {id, name:"Untitled project", intakeVersion:1, stage, state:"RI", municipality:"", address:"", sponsor:"", objective:"", developmentType:"", location:null, unitCount:0, updatedAt:at,
    draft:{step:0, totalUnits:"", deliveryDate:"", targetDate:"", targetOccupancy:"", leasesPerWeek:"", freeMonths:"", leaseTerm:"", marketing:"", staffing:"", monthlyCarry:"", strategy:"", notes:"", sources:[], unitMix:[], researchReviewed:false}, baselines:[]};
}
function intakeNumber(value) { return value === "" || value == null || !Number.isFinite(Number(value)) ? null : Number(value); }
function intakeDate(value) { const time = Date.parse(value + "T00:00:00Z"); return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === value ? time : null; }
function intakeSafeURL(value) { try { const u = new URL(value); return ["http:","https:"].includes(u.protocol) ? u.href : null; } catch { return null; } }
function projectSetupIssues(project) {
  const issues=[];
  if(!project.name.trim() || project.name==="Untitled project") issues.push("Give the project a name.");
  if(!project.address.trim()) issues.push("Enter the property address.");
  if(!RI_TOWNS.includes(project.municipality)) issues.push("Choose the Rhode Island municipality.");
  const units=intakeNumber(project.draft.totalUnits);
  if(project.draft.totalUnits!=="" && (!Number.isInteger(units) || units<1 || units>10000)) issues.push("Enter a whole-number unit count, or leave it blank for now.");
  if(project.draft.deliveryDate && intakeDate(project.draft.deliveryDate)===null) issues.push("Correct the leasing start date, or leave it blank for now.");
  return issues;
}
function intakeLanding(project) {
  return project.workspaceOpenedAt || project.baselines.length || project.draft.step>0 ? "home" : "setup";
}
function intakeIssues(project) {
  const d = project.draft, issues = [];
  const add = (step, message) => issues.push({step, message});
  if (!project.name.trim() || project.name === "Untitled project") add(0,"Name the project.");
  if (!project.address.trim()) add(0,"Enter the property address.");
  if (!RI_TOWNS.includes(project.municipality)) add(0,"Select a Rhode Island municipality.");
  const total = intakeNumber(d.totalUnits);
  if (!Number.isInteger(total) || total < 1 || total > 10000) add(1,"Enter a whole-number project total between 1 and 10,000 units.");
  if (!d.unitMix.length) add(1,"Add at least one unit type or delivery phase.");
  let sum = 0;
  d.unitMix.forEach((row,i) => {
    const count = intakeNumber(row.count), leased = intakeNumber(row.leased), sqft = intakeNumber(row.sqft), rent = intakeNumber(row.rent);
    if (!row.label.trim()) add(1,`Name unit row ${i+1}.`);
    if (!Number.isInteger(count) || count < 1 || count > 10000) add(1,`Row ${i+1}: enter a positive whole-number unit count.`);
    else sum += count;
    if (!Number.isInteger(leased) || leased < 0 || leased > count) add(1,`Row ${i+1}: existing leased units must be between zero and the row total.`);
    if (row.sqft !== "" && (sqft === null || sqft <= 0 || sqft > 100000)) add(1,`Row ${i+1}: enter a valid average unit size.`);
    if (rent === null || rent <= 0 || rent > 100000) add(3,`Row ${i+1}: enter a monthly asking rent.`);
    if (row.availableDate && intakeDate(row.availableDate) === null) add(1,`Row ${i+1}: correct the availability date.`);
  });
  if (total !== null && sum !== total) add(1,`Unit schedule has ${sum} units; project total is ${total}. Reconcile the difference.`);
  const start = intakeDate(d.deliveryDate), end = intakeDate(d.targetDate);
  if (start === null) add(4,"Enter a valid leasing start date.");
  if (end === null || (start !== null && end <= start)) add(4,"Target stabilization must be after leasing starts.");
  if (start !== null && end !== null && end - start > 3650*86400000) add(4,"Keep the planning horizon within ten years.");
  for (const [key,label,min,max] of [["targetOccupancy","Target occupancy",1,100],["leasesPerWeek","Weekly leasing pace",0.01,1000],["leaseTerm","Lease term",1,120],["freeMonths","Free months",0,120],["marketing","Marketing budget",0,Number.MAX_SAFE_INTEGER],["staffing","Staffing budget",0,Number.MAX_SAFE_INTEGER],["monthlyCarry","Monthly carry",0,Number.MAX_SAFE_INTEGER]]) {
    const v = intakeNumber(d[key]);
    const messages={targetOccupancy:"Choose a target occupancy between 1% and 100%.",leasesPerWeek:"Enter a positive weekly leasing pace.",leaseTerm:"Enter the lease length in months.",freeMonths:"Enter the free-rent allowance, or 0 for none.",marketing:"Add a marketing budget to compare total costs.",staffing:"Add the staffing or brokerage budget to compare total costs.",monthlyCarry:"Add monthly carrying costs to compare the cost of time."};
    if (v === null || v < min || v > max) add(key === "leaseTerm" || key === "freeMonths" ? 3 : 4, v !== null && (v<min || v>max) && ["marketing","staffing","monthlyCarry"].includes(key) ? `${label}: use a non-negative dollar amount.` : messages[key]);
  }
  if (+d.freeMonths > +d.leaseTerm) add(3,"Free months cannot exceed the lease term.");
  return issues;
}
function calculateIntake(project) {
  const issues = intakeIssues(project);
  if (issues.length) return {issues, scenarios:[]};
  const d = project.draft, total = +d.totalUnits;
  const leased = d.unitMix.reduce((n,r)=>n + +r.leased,0);
  const gross = d.unitMix.reduce((n,r)=>n + +r.count * +r.rent,0);
  const averageRent = gross / total, target = Math.ceil(total * +d.targetOccupancy / 100);
  const start = intakeDate(d.deliveryDate), targetTime = intakeDate(d.targetDate);
  const rows = d.unitMix.map(r=>({...r, available:Math.max(start,intakeDate(r.availableDate || d.deliveryDate))}));
  const scenarios = [["Slower",0.8],["Base",1],["Faster",1.2]].map(([name,factor])=>{
    const pace = +d.leasesPerWeek * factor;
    const occupied = rows.map(r=>+r.leased);
    let count = leased, elapsedDays = 0, concession = 0;
    // Leasing is a continuous planning approximation, constrained by each phase's availability.
    while (count < target - 1e-8 && elapsedDays < 3650) {
      const day = start + elapsedDays*86400000;
      let capacity = pace / 7;
      rows.forEach((r,i)=>{
        if (r.available > day || count >= target) return;
        const n = Math.max(0,Math.min(capacity,+r.count-occupied[i],target-count));
        occupied[i] += n; count += n; capacity -= n; concession += n * +r.rent * +d.freeMonths;
      });
      elapsedDays++;
    }
    const reached = count >= target-1e-8;
    const stabilizeDate = reached ? new Date(start + elapsedDays*86400000).toISOString().slice(0,10) : null;
    const carry = +d.monthlyCarry * elapsedDays / 30.4375;
    return {name, factor, leasesPerWeek:pace, elapsedDays, stabilizeDate, meetsTarget:reached && start+elapsedDays*86400000<=targetTime, concessionCost:concession, carryCost:carry, staffingCost:+d.staffing, marketingCost:+d.marketing, totalCost:concession+carry + +d.staffing + +d.marketing};
  });
  return {issues:[], totalUnits:total, existingLeased:leased, targetLeased:target, averageRent, effectiveRent:averageRent*(1- +d.freeMonths/+d.leaseTerm), grossMonthlyRent:gross, requiredLeasesPerWeek:Math.max(0,target-leased)/((targetTime-start)/604800000), scenarios};
}
function parseIntakeCSV(text) {
  if (text.length > 500000) throw new Error("Use a unit schedule smaller than 500 KB.");
  const rows = []; let row = [], cell = "", quoted = false;
  for (let i=0; i<text.length; i++) {
    const c=text[i];
    if (c==='"') { if (quoted && text[i+1]==='"') {cell+='"'; i++;} else quoted=!quoted; }
    else if (!quoted && (c===',' || c==='\n')) {row.push(cell.trim());cell="";if(c==='\n'){rows.push(row);row=[];}}
    else if (c!=='\r') cell+=c;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(cell.trim());if(row.some(Boolean)) rows.push(row);
  const headers = (rows.shift()||[]).map(x=>x.replace(/^\uFEFF/,"").toLowerCase());
  const expected=["label","count","sqft","rent","leased","availabledate"];
  if(expected.some(h=>!headers.includes(h))) throw new Error("CSV headers must include label,count,sqft,rent,leased,availableDate.");
  const data=rows.filter(r=>r.some(Boolean));
  if(!data.length || data.length>200) throw new Error("Import between 1 and 200 unit-type rows.");
  return data.map((r,i)=>{
    if(r.length!==headers.length) throw new Error(`CSV row ${i+2} has an unexpected number of columns.`);
    return Object.fromEntries(expected.map(key=>[key==='availabledate'?'availableDate':key,r[headers.indexOf(key)]]));
  });
}
function intakeUnitTypes(project) {
  return project.draft.unitMix.map((r,i)=>({id:`${project.id}-type-${i}`,projectId:project.id,type:r.label,label:r.label,totalUnits:+r.count,sqft:+r.sqft,askingRent:+r.rent,leasedCount:+r.leased,availableDate:r.availableDate || project.draft.deliveryDate}));
}
function restoreIntakeState(seed, storage) {
  const base = {...intakeCopy(seed),activeProjectId:seed.projects[0]?.id || null};
  try {
    const raw=storage.getItem(INTAKE_STORAGE_KEY); if(!raw) return base;
    const saved=JSON.parse(raw);
    if(saved.version!==1 || !Array.isArray(saved.projects) || saved.projects.some(p=>!validIntakeDraft(p))) throw new Error("Unrecognized saved draft format");
    if(new Set(saved.projects.map(p=>p.id)).size !== saved.projects.length) throw new Error("Duplicate project IDs");
    base.projects.push(...saved.projects);
    saved.projects.forEach(p=>{
      const baseline=p.baselines[p.baselines.length-1];
      if(baseline?.project?.draft?.unitMix) base.unitTypes.push(...intakeUnitTypes({...baseline.project,id:p.id}));
    });
    base.activeProjectId=saved.projects.some(p=>p.id===saved.activeProjectId)?saved.activeProjectId:(saved.projects[0]?.id || base.activeProjectId);
    return base;
  } catch { return {...base,storageError:"Saved drafts could not be read. Existing browser data has been preserved. Export your current work before closing."}; }
}
function validIntakeDraft(p) {
  return p && typeof p.id==='string' && p.id.startsWith('ri-') && p.intakeVersion===1 && p.state==='RI' && ['name','address','sponsor','municipality','objective','developmentType'].every(k=>typeof p[k]==='string') && p.draft && Array.isArray(p.draft.unitMix) && p.draft.unitMix.length<=200 && p.draft.unitMix.every(r=>r && ['label','count','sqft','rent','leased','availableDate'].every(k=>typeof r[k]==='string')) && Array.isArray(p.draft.sources) && p.draft.sources.every(s=>s && ['title','url','observedOn','notes'].every(k=>typeof s[k]==='string')) && Array.isArray(p.baselines) && p.baselines.every(b=>b && typeof b.id==="string" && typeof b.approvedAt==="string" && b.project?.draft && Array.isArray(b.project.draft.unitMix) && b.output && Number.isFinite(b.output.totalUnits)) && ['totalUnits','deliveryDate','targetDate','targetOccupancy','leasesPerWeek','freeMonths','leaseTerm','marketing','staffing','monthlyCarry','strategy','notes'].every(k=>typeof p.draft[k]==='string') && Number.isInteger(p.draft.step) && p.draft.step>=0 && p.draft.step<=5;
}
function persistIntakeState(state, storage) {
  if(state.storageError) throw new Error(state.storageError);
  storage.setItem(INTAKE_STORAGE_KEY, JSON.stringify({version:1,activeProjectId:state.activeProjectId,projects:state.projects.filter(p=>p.intakeVersion===1)}));
}
Object.assign(window,{RI_TOWNS,INTAKE_STORAGE_KEY,newIntakeProject,projectSetupIssues,intakeLanding,intakeIssues,calculateIntake,parseIntakeCSV,intakeSafeURL,intakeUnitTypes,restoreIntakeState,persistIntakeState,validIntakeDraft});

// Municipality is derived from a selected place or an explicit city segment, never a street-name substring.
function intakeMunicipality(address,location) {
  if(location?.state && location.state!=="RI")return "";
  const parts=[location?.municipality,...String(address||"").split(",").slice(1).map(s=>s.trim().replace(/\s+(?:RI|Rhode Island)(?:\s+\d{5})?$/i,""))];
  return RI_TOWNS.find(t=>parts.some(p=>String(p||"").toLowerCase()===t.toLowerCase())) || "";
}
function intakeProjectFocus(project) {
  const count=intakeNumber(project.draft.totalUnits);
  const stage={pre_funding:{label:"Pre-funding",title:"Shape the plan before you commit.",primary:"Explore the market",section:2,detail:"Start with the property and local context. Build financial assumptions when you’re ready."},funded_prelaunch:{label:"Funded · pre-launch",title:"Get the building ready to lease.",primary:"Set up your units",section:1,detail:"Bring in the unit mix you already have, then prepare pricing and launch timing."},active_leaseup:{label:"Already leasing",title:"Start with the building you have.",primary:"Add the current unit mix",section:1,detail:"Capture which units are already leased and which need attention. There’s no need to recreate a development plan."}}[project.stage] || {label:"Planning",title:"Your property, your starting point.",primary:"Set up your units",section:1,detail:"Add details as you need them."};
  return {...stage,count,small:count!==null&&count<=50};
}
Object.assign(window,{intakeMunicipality,intakeProjectFocus});
