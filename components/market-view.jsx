function useProjectMarket(project,dispatch,enabled) {
  const fingerprint=marketFingerprint(project);
  const saved=project.marketData?.fingerprint===fingerprint?project.marketData:null;
  const [live,setLive]=React.useState(null),[retry,setRetry]=React.useState(0);
  React.useEffect(()=>{
    if(!enabled)return;
    if(saved?.fetchedAt && Date.now()-Date.parse(saved.fetchedAt)<86400000 && !retry)return;
    const controller=new AbortController();let disposed=false;
    const timeout=setTimeout(()=>controller.abort(),18000);
    setLive({fingerprint,status:'loading'});
    discoverMarket(project,{signal:controller.signal}).then(data=>{
      if(disposed)return;
      setLive(null);
      dispatch({type:'saveMarketDiscovery',projectId:project.id,fingerprint,data});
    }).catch(error=>{if(!disposed)setLive({fingerprint,status:'error',message:error.name==='AbortError'?'City records took too long to respond. Your property and pricing evidence are still available.':error.message});}).finally(()=>clearTimeout(timeout));
    return ()=>{disposed=true;clearTimeout(timeout);controller.abort();};
  },[fingerprint,enabled,retry]);
  return {result:live?.fingerprint===fingerprint?live:saved,refresh:()=>setRetry(n=>n+1)};
}
const marketBedLabel=beds=>beds===0?'Studio':`${beds} bedroom`;
const marketPriceLabel=basis=>({'monthly-total':'Monthly total · fees included','advertised-rent':'Advertised rent · fees unverified','unallocated-range':'Building-level range only','unpublished':'No published pricing'})[basis] || 'Price basis unknown';
function MarketPreview({project,result,onOpen}) {
  const evidence=rankMarketEvidence(project,result).filter(c=>!c.excluded);
  return <section className="ri-card ri-market-preview"><div className="ri-section-title"><div><div className="ri-kicker">Your competitive market</div><h2 style={{marginTop:8}}>{evidence.length?`${evidence.length} suggested rental properties`:'Market coverage is being expanded'}</h2></div><button className="ri-button ri-primary" onClick={onOpen}>View comparables →</button></div>
    <p>{evidence.length?'An initial comparison set selected from operator evidence in your municipality. Review the matches and their advertised floor plans.':'The first priced comparison set covers Providence and Pawtucket. We will not substitute another city’s rents for this property.'}</p>
    {evidence.length>0 && <div className="ri-market-teasers">{evidence.slice(0,3).map(c=><div key={c.id}><strong>{c.name}</strong><span>{c.buildingType}</span><small>{c.plans.some(p=>p.status==='advertised')?'Published floor-plan pricing':c.buildingRange?'Building-level price range':'Pricing not established'}</small></div>)}</div>}
    <div className="ri-muted" style={{marginTop:16}}>Pricing evidence reviewed Oct 1, 2026 · not a live vacancy or rent feed.{result?.status==='loading'?' Finding the property and nearby building records…':''}</div>
  </section>;
}
function ComparableMarket({project,result,onRefresh,onExclude,onLocate}) {
  const evidence=rankMarketEvidence(project,result),signals=marketSignals(evidence),buildings=rankMarketBuildings(project,result);
  const included=evidence.filter(c=>!c.excluded),subject=result?.subject;
  return <>
    <style>{`
      .ri-market-teasers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ri-market-teasers>div{padding:16px;background:var(--ri-bg);border:1px solid var(--ri-rule);border-radius:8px}.ri-market-teasers strong,.ri-market-teasers span,.ri-market-teasers small{display:block}.ri-market-teasers span,.ri-market-teasers small{color:var(--ri-muted);font-size:12px;margin-top:6px}.ri-comp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.ri-comp{border:1px solid var(--ri-rule);border-radius:12px;padding:24px;background:var(--ri-surface);min-width:0}.ri-comp.excluded{opacity:.6}.ri-comp h2{margin:8px 0}.ri-comp p{font-size:12px}.ri-reasons{list-style:none;display:flex;gap:7px;flex-wrap:wrap;padding:0;margin:14px 0}.ri-reasons li{font-size:11px;background:var(--ri-bg);border:1px solid var(--ri-rule);padding:5px 8px;border-radius:5px}.ri-comp details{font-size:12px;color:var(--ri-muted);margin-top:16px}.ri-comp summary{cursor:pointer}.ri-price{font-size:20px;font-weight:500}.ri-signal-note{font-size:12px;color:var(--ri-muted)}.ri-market-head{display:flex;gap:16px;align-items:center;justify-content:space-between}.ri-market-status{font-size:12px;color:var(--ri-muted)}
      @media(max-width:750px){.ri-comp-grid,.ri-market-teasers{grid-template-columns:1fr}.ri-market-head{align-items:flex-start;flex-direction:column}}
    `}</style>
    <div className="ri-market-head"><div><strong>{included.length} properties in your comparison set</strong><div className="ri-market-status">Selected by municipality, known building profile, bedroom overlap and size overlap where available.</div></div><button className="ri-button" onClick={onRefresh} disabled={result?.status==='loading'}>Refresh city records</button></div>
    <section className="ri-card"><h2>What the published prices show</h2>
      <p>Starting prices for the selected properties, grouped by bedroom count and price basis. These are reference observations—not a recommended rent or signed-lease evidence.</p>
      {signals.length?<div className="ri-table-wrap"><table><thead><tr><th>Unit type</th><th>Price basis</th><th>Observed starting prices</th><th>Properties</th></tr></thead><tbody>{signals.map(g=><tr key={g.basis+g.beds}><td>{marketBedLabel(g.beds)}</td><td>{marketPriceLabel(g.basis)}</td><td><strong>{intakeMoney(g.min)}{g.max!==g.min?` – ${intakeMoney(g.max)}`:''}</strong></td><td>{g.count}{g.count<3?' · limited evidence':''}</td></tr>)}</tbody></table></div>:<div className="ri-notice">No usable recent prices in this selection. Missing prices and older observations are excluded rather than estimated.</div>}
      <p className="ri-signal-note">One lowest advertised floor-plan price per property and bedroom type. No adjustment for amenities, lease term or concessions. Unknown fee treatment stays separate from published monthly totals. Waitlist, restricted and unallocated building ranges are excluded. Evidence older than 30 days is excluded automatically.</p>
    </section>
    <div className="ri-section-title" style={{margin:'26px 0 16px'}}><div><h2>Suggested rental comparisons</h2><p style={{margin:0}}>Remove a poor match; the observations above update with your selection.</p></div></div>
    {!evidence.length && <div className="ri-notice">We do not yet have operator pricing coverage for {project.municipality || 'this municipality'}. No outside-market rent range has been substituted.</div>}
    <div className="ri-comp-grid">{evidence.map(c=><article className={`ri-comp ${c.excluded?'excluded':''}`} key={c.id}>
      <div className="ri-section-title"><span className="ri-kicker">{c.buildingType}</span><button className="ri-button" aria-label={`${c.excluded?'Restore':'Remove'} ${c.name}`} onClick={()=>onExclude(c.id,!c.excluded)}>{c.excluded?'Restore':'Remove'}</button></div>
      <h2>{c.name}</h2><div className="ri-muted">{c.address} · {c.municipality}</div>
      <ul className="ri-reasons">{c.reasons.map(r=><li key={r}>{r}</li>)}</ul>
      {c.plans.length?<div className="ri-table-wrap"><table><thead><tr><th>Observed plan</th><th>Published SF</th><th>Starting price</th></tr></thead><tbody>{c.plans.map(p=><tr key={p.label}><td>{p.label}<small style={{display:'block'}}>{marketBedLabel(p.beds)}</small>{p.status!=='advertised' && <small style={{display:'block'}}>{p.status==='waitlist'?'Waitlist only':p.status==='contact'?'Contact for availability':'No price'}</small>}</td><td>{p.sqftMin?`${p.sqftMin.toLocaleString()}${p.sqftMin!==p.sqftMax?'–'+p.sqftMax.toLocaleString():''}`:'Unknown'}</td><td>{p.price?intakeMoney(p.price):'Not published'}</td></tr>)}</tbody></table></div>:c.buildingRange?<p className="ri-price">{intakeMoney(c.buildingRange[0])}–{intakeMoney(c.buildingRange[1])}<small className="ri-muted" style={{display:'block'}}>Whole-property advertised range · not allocated to unit types</small></p>:<p>No pricing published in the reviewed evidence.</p>}
      <p>{marketPriceLabel(c.basis)}</p><a href={c.source} target="_blank" rel="noreferrer">Operator source ↗</a><span className="ri-muted"> · Reviewed {c.reviewedAt}</span>
      <details><summary>Evidence and limitations</summary><p>{c.notes}</p><p>{c.concession || 'No concession amount established.'}</p><p>Saved operator evidence, not a fresh inventory check. Property age, amenities and achieved rents are not fully normalized.</p></details>
    </article>)}</div>
    <section className="ri-card"><div className="ri-section-title"><h2>Nearby building candidates</h2>{result?.status!=='outside' && <button className="ri-button" onClick={onLocate}>Check location on map</button>}</div>
      {result?.status==='loading' && <p role="status">Matching your address and finding nearby apartment buildings in Providence GIS…</p>}
      {result?.status==='error' && <p role="alert">{result.message} The operator evidence above remains available.</p>}
      {result?.status==='outside' && <p>Automatic city-record discovery is connected for Providence. Operator coverage above is shown independently.</p>}
      {['ambiguous','unmatched'].includes(result?.status) && <p>{result.status==='ambiguous'?'The address matches multiple city records.':'The address did not match a city record exactly.'} A map pin can help identify the site; market evidence is still available above.</p>}
      {subject && <p className="ri-muted">Matched city record: {subject.address} · {subject.use || 'Use not reported'} · {subject.units || 'Unknown'} recorded units. City facts describe the existing property, not your proposed program.</p>}
      {buildings.length>0 && <><p>{buildings.length} nearby candidates returned{result.truncated?' · partial city result':''}. Showing the closest matches by distance, recorded size and vintage. Coverage includes city records classified as Apartments; small multifamily and other tax classifications are not included. These are building records, not verified available rentals.</p><div className="ri-table-wrap"><table><thead><tr><th>Property</th><th>Recorded units</th><th>Year built</th><th>Why it appears</th><th>Source</th></tr></thead><tbody>{buildings.slice(0,10).map(p=><tr key={p.id}><td>{p.address}</td><td>{p.units || 'Unknown'}</td><td>{p.yearBuilt || 'Unknown'}</td><td>{p.reasons.join(' · ')}</td><td><a href={PROVIDENCE_PARCELS+'/query?'+new URLSearchParams({f:'pjson',objectIds:p.id,outFields:PROVIDENCE_FIELDS,returnGeometry:'false'})} target="_blank" rel="noreferrer">City record ↗</a></td></tr>)}</tbody></table></div></>}
      {result?.status==='ready'&&!buildings.length && <p>No apartment building candidates were returned within three miles.</p>}
      {result?.fetchedAt && <p className="ri-muted">City lookup: {new Date(result.fetchedAt).toLocaleString()} · tax-roll fields can lag current conditions. Distances use parcel centers and are approximate.</p>}
    </section>
  </>;
}
Object.assign(window,{useProjectMarket,MarketPreview,ComparableMarket});
