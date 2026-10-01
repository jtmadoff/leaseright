/* Automatic public-record discovery and transparent matching. No credentials or paid feed. */
function marketAddress(value) {
  return String(value||'').split(',')[0].split(/\s+(?:apt|suite|unit|#)\s*/i)[0].toUpperCase().replace(/[^A-Z0-9\s-]/g,' ').replace(/\b(STREET|AVENUE|ROAD|BOULEVARD|DRIVE|COURT|PLACE|LANE)\b/g,x=>({STREET:'ST',AVENUE:'AVE',ROAD:'RD',BOULEVARD:'BLVD',DRIVE:'DR',COURT:'CT',PLACE:'PL',LANE:'LN'}[x])).replace(/\s+/g,' ').trim();
}
function marketFingerprint(project) {return ['apartments-v1',marketAddress(project.address),project.municipality,project.location?.lat||'',project.location?.lng||''].join('|');}
function marketCenter(parcel) {
  const pts=parcel?.rings?.flat()||[];if(!pts.length)return null;
  return {lat:(Math.min(...pts.map(p=>p[1]))+Math.max(...pts.map(p=>p[1])))/2,lng:(Math.min(...pts.map(p=>p[0]))+Math.max(...pts.map(p=>p[0])))/2};
}
function marketMiles(a,b){if(!a||!b)return null;const rad=Math.PI/180;const v=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;return 3958.8*2*Math.asin(Math.sqrt(Math.min(1,v)));}
function marketBedrooms(label) {const s=String(label||'').trim();if(/\bstudio\b/i.test(s))return 0;const m=s.match(/^(\d)\s*(?:br\b|bed|bedroom)/i);return m?+m[1]:null;}
function marketSubject(project,record) {const n=Number(project.draft.totalUnits);return {units:n>0?n:(/apart|family/i.test(record?.use||"")?record.units:null),yearBuilt:project.developmentType==='New construction'?null:record?.yearBuilt||null,buildingType:project.developmentType==='Conversion / adaptive reuse'?'Historic conversion':project.developmentType==='New construction'?'Contemporary apartments':null};}
async function marketQuery(params,{signal,fetcher=fetch}={}) {
  const url=PROVIDENCE_PARCELS+'/query?'+new URLSearchParams({f:'json',outFields:PROVIDENCE_FIELDS,returnGeometry:'true',outSR:'4326',...params});
  const response=await fetcher(url,{signal});if(!response.ok)throw new Error('City records are temporarily unavailable.');const data=await response.json();
  if(data.error||!Array.isArray(data.features))throw new Error('City records could not be read.');
  return {parcels:data.features.map(providenceParcel).filter(Boolean),truncated:!!data.exceededTransferLimit};
}
async function discoverMarket(project,{signal,fetcher=fetch}={}) {
  const fingerprint=marketFingerprint(project), fetchedAt=new Date().toISOString();
  if(project.municipality!=='Providence')return {fingerprint,status:'outside',fetchedAt,subject:null,candidates:[],matches:[]};
  let subject=null,matches=[],point=project.location && Number.isFinite(project.location.lat)&&Number.isFinite(project.location.lng)?project.location:null;
  if(point && !providenceCoverage(point)) return {fingerprint,status:'outside',fetchedAt,subject:null,candidates:[],matches:[]};
  if(point){const located=await lookupProvidenceParcels(point,{signal,fetcher});matches=located.parcels;if(located.match==='intersects'&&matches.length===1)subject=matches[0];}
  else {
    const address=marketAddress(project.address);
    if(!/^\d+[A-Z]?\s+[A-Z]/.test(address))return {fingerprint,status:'unmatched',fetchedAt,subject:null,candidates:[],matches:[]};
    const prefix=address.replace(/\s+(?:ST|AVE|RD|BLVD|DR|CT|PL|LN)$/,'');
    const found=await marketQuery({where:`UPPER(ParcAddress) LIKE '${prefix}%'`,resultRecordCount:'25'}, {signal,fetcher});
    if(found.truncated)throw new Error('The city returned several address matches. A map pin will narrow the location.');
    matches=found.parcels;const exact=matches.filter(p=>marketAddress(p.address)===address);
    if(exact.length===1)subject=exact[0];
    point=marketCenter(subject);
  }
  if(!point)return {fingerprint,status:matches.length?'ambiguous':'unmatched',fetchedAt,subject:null,candidates:[],matches};
  const found=await marketQuery({where:"MuniUseCodeDesc = 'Apartments'",geometry:`${point.lng},${point.lat}`,geometryType:'esriGeometryPoint',inSR:'4326',spatialRel:'esriSpatialRelIntersects',distance:'4828.032',units:'esriSRUnit_Meter',resultRecordCount:'1000',orderByFields:'OBJECTID'}, {signal,fetcher});
  const candidates=found.parcels.filter(p=>p.id!==subject?.id && marketAddress(p.address)!==marketAddress(project.address)).map(p=>{const {rings,...record}=p;return {...record,distance:marketMiles(point,marketCenter(p))};}).filter(p=>p.distance!==null&&p.distance<=3);
  return {fingerprint,status:'ready',fetchedAt,subject,matches:subject?[]:matches,point,candidates,truncated:found.truncated};
}
function rankMarketBuildings(project,result) {
  const subject=marketSubject(project,result?.subject);
  return (result?.candidates||[]).map(p=>{
    const reasons=[`${p.distance.toFixed(1)} mi from the site`];let score=Math.max(0,1-p.distance/3)*3;
    if(subject.units && p.units){const ratio=Math.max(subject.units,p.units)/Math.min(subject.units,p.units);score+=2/ratio;if(ratio<=2)reasons.push(`Similar scale: ${p.units} recorded units`);}
    if(subject.yearBuilt&&p.yearBuilt){const gap=Math.abs(subject.yearBuilt-p.yearBuilt);score+=1/(1+gap/20);if(gap<=25)reasons.push(`Similar recorded vintage: ${p.yearBuilt}`);}
    return {...p,reasons,score};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
function rankMarketEvidence(project,result,catalog=RI_MARKET_EVIDENCE) {
  const subject=marketSubject(project,result?.subject), types=project.draft.unitMix.map(r=>({beds:marketBedrooms(r.label),sqft:Number(r.sqft)||null})).filter(r=>r.beds!==null);
  const excluded=new Set(project.marketExcluded||[]);
  return catalog.filter(c=>c.municipality===project.municipality && marketAddress(c.address)!==marketAddress(project.address) && c.name.toLowerCase()!==project.name.trim().toLowerCase()).map(c=>{
    const parcel=(result?.candidates||[]).find(p=>marketAddress(p.address)===marketAddress(c.address));
    let score=0;const reasons=[`Same municipality: ${c.municipality}`];
    if(parcel){score+=Math.max(0,3-parcel.distance);reasons.push(`${parcel.distance.toFixed(1)} mi · approximate straight-line distance`);}
    if(subject.buildingType===c.buildingType){score+=2;reasons.push(`Matches ${c.buildingType.toLowerCase()} profile`);}
    const overlap=types.filter(r=>c.plans.some(p=>p.beds===r.beds));if(overlap.length){score+=overlap.length;reasons.push('Overlapping bedroom types');}
    const sized=types.some(r=>r.sqft&&c.plans.some(p=>p.beds===r.beds&&p.sqftMin&&r.sqft>=p.sqftMin*.8&&r.sqft<=p.sqftMax*1.2));if(sized){score++;reasons.push('At least one published size range overlaps your units');}
    if(!parcel)reasons.push('Exact site distance not established');
    return {...c,score,reasons,excluded:excluded.has(c.id)};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
function marketSignals(evidence,{now=new Date()}={}) {
  const groups=new Map();
  evidence.filter(c=>{const age=now-new Date(c.reviewedAt+'T00:00:00Z');return !c.excluded && age>=0 && age<=30*86400000;}).forEach(c=>{
    const byBed=new Map();c.plans.filter(p=>p.status==='advertised'&&!p.restricted&&Number.isFinite(p.price)&&p.price>0).forEach(p=>{const old=byBed.get(p.beds);if(!old||p.price<old.price)byBed.set(p.beds,p);});
    byBed.forEach(p=>{const key=c.basis+':'+p.beds;if(!['monthly-total','advertised-rent'].includes(c.basis))return;if(!groups.has(key))groups.set(key,{basis:c.basis,beds:p.beds,observations:[]});groups.get(key).observations.push({propertyId:c.id,name:c.name,price:p.price,source:c.source,reviewedAt:c.reviewedAt});});
  });
  return [...groups.values()].map(g=>({...g,count:g.observations.length,min:Math.min(...g.observations.map(o=>o.price)),max:Math.max(...g.observations.map(o=>o.price))})).sort((a,b)=>a.beds-b.beds||a.basis.localeCompare(b.basis));
}
Object.assign(window,{marketAddress,marketFingerprint,marketCenter,marketMiles,marketBedrooms,marketSubject,marketQuery,discoverMarket,rankMarketBuildings,rankMarketEvidence,marketSignals});
