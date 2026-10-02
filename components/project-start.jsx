/* Address-first setup, using the original stage-led journey and theme. */
function ProjectStart({t,project,onEdit,onFinish,onStage,onCancel,saveStatus}) {
  const [townQuery,setTownQuery]=React.useState(''),[showTown,setShowTown]=React.useState(false),[error,setError]=React.useState('');
  const focus=intakeProjectFocus(project), town=project.municipality;
  const suggestions=townQuery.trim()?RI_TOWNS.filter(x=>x.toLowerCase().startsWith(townQuery.trim().toLowerCase())).slice(0,5):[];
  const chooseAddress=(address,location)=>{const municipality=intakeMunicipality(address,location);onEdit({address,location,municipality});setTownQuery('');setShowTown(false);};
  const finish=()=>{
    const next={...project,name:project.name==='Untitled project'||!project.name.trim()?project.address.split(',')[0].trim():project.name};
    const issues=projectSetupIssues(next);if(issues.length){setError(issues[0]);return;}onFinish(next.name);
  };
  return <div className="lr-start" style={{'--start-bg':t.bg,'--start-surface':t.surface,'--start-ink':t.ink,'--start-muted':t.inkSoft,'--start-rule':t.rule,'--start-accent':t.accent,fontFamily:t.sans}}>
    <style>{`
      .lr-start{min-height:100vh;background:var(--start-bg);color:var(--start-ink);font-size:14px}.lr-start *{box-sizing:border-box}.lr-start button,.lr-start input{font:inherit}.lr-start button{cursor:pointer}.lr-start-header{height:72px;padding:0 36px;border-bottom:1px solid var(--start-rule);display:flex;align-items:center;justify-content:space-between}.lr-start-logo{display:flex;gap:10px;align-items:center;font-weight:650}.lr-start-logo b{display:grid;place-items:center;width:24px;height:24px;background:var(--start-accent);color:#0a0a0b}.lr-start-link{background:none;border:0;color:var(--start-muted);padding:6px 0}.lr-start-main{max-width:1140px;margin:auto;padding:55px 32px}.lr-start-eyebrow{display:flex;gap:16px;align-items:center;color:var(--start-muted);font-size:12px;margin-bottom:22px}.lr-start h1{font-size:42px;font-weight:550;letter-spacing:-1.3px;margin:0 0 14px}.lr-start-lead{font-size:16px;color:var(--start-muted);line-height:1.6;margin:0 0 36px}.lr-start-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:40px}.lr-start-side{padding:26px;background:var(--start-surface);border:1px solid var(--start-rule);align-self:start}.lr-start-field{display:block;margin:0 0 26px}.lr-start-field>span{display:block;margin-bottom:10px;font-size:12px;color:var(--start-muted)}.lr-start input{width:100%;background:var(--start-bg);color:var(--start-ink);border:1px solid var(--start-rule);border-radius:3px;padding:12px}.lr-start input:focus{outline:1px solid var(--start-accent)}.lr-start-count{font-size:36px!important;font-variant-numeric:tabular-nums}.lr-start small{display:block;color:var(--start-muted);font-size:12px;line-height:1.6;margin-top:9px}.lr-start-town{margin-top:22px;border-top:1px solid var(--start-rule);padding-top:16px}.lr-start-town button{background:var(--start-surface);color:var(--start-ink);border:1px solid var(--start-rule);padding:8px 12px;margin:6px 6px 0 0}.lr-start-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid var(--start-rule);padding-top:24px;margin-top:32px}.lr-start-primary{background:var(--start-accent);color:#0a0a0b;border:0;padding:14px 24px;font-weight:650!important;border-radius:3px}.lr-start-error{color:#ffbc9a;margin-top:16px}.lr-start .lr-property{margin:0}.lr-start .lr-search-row{margin-top:0}
      @media(max-width:750px){.lr-start-main{padding:32px 20px}.lr-start-grid{grid-template-columns:1fr;gap:22px}.lr-start h1{font-size:32px}.lr-start-header{padding:0 20px}.lr-start-footer{align-items:flex-start;flex-direction:column}.lr-start-primary{width:100%}}
    `}</style>
    <header className="lr-start-header"><div className="lr-start-logo"><b>L</b>LeaseRight</div><button className="lr-start-link" onClick={onCancel}>Back to introduction</button></header>
    <main className="lr-start-main">
      <div className="lr-start-eyebrow"><span>YOUR PROJECT / {focus.label.toUpperCase()}</span><button className="lr-start-link" onClick={onStage}>Change stage ↗</button></div>
      <h1>Which property are we working on?</h1><p className="lr-start-lead">Find the address and tell us the size. We’ll build the workspace around your starting point.</p>
      <div className="lr-start-grid"><div><PropertyLocation t={t} compact address={project.address} location={project.location} onChange={chooseAddress}/>
        <div className="lr-start-town">{town?<><strong>{town}, Rhode Island</strong> <button onClick={()=>setShowTown(v=>!v)}>Change town</button></>:<small>{project.location?.state&&project.location.state!=='RI'?'This pilot currently supports Rhode Island properties.':'The town fills in from your address. If it’s missing, type it below.'}</small>}
          {((project.address&&!town)||showTown)&&<><input aria-label="Find city or town" placeholder="Type a city or town" value={townQuery} onChange={e=>setTownQuery(e.target.value)} autoComplete="off"/>{suggestions.map(x=><button key={x} onClick={()=>{onEdit({municipality:x,location:project.location?.state==='RI'?project.location:null});setShowTown(false);setTownQuery('');}}>{x}</button>)}</>}
        </div>
      </div><aside className="lr-start-side"><label className="lr-start-field"><span>HOW MANY RENTAL UNITS?</span><input className="lr-start-count" aria-label="Number of rental units" type="number" min="1" step="1" placeholder="25" value={project.draft.totalUnits} onChange={e=>onEdit({}, {totalUnits:e.target.value})}/><small>Your building total is enough to start. No unit-by-unit entry needed.</small></label>
        <label className="lr-start-field"><span>PROPERTY NAME · OPTIONAL</span><input aria-label="Property name" placeholder="Use the street address" value={project.name==='Untitled project'?'':project.name} onChange={e=>onEdit({name:e.target.value})}/></label>
        <div style={{borderTop:'1px solid var(--start-rule)',paddingTop:18}}><strong>{focus.label}</strong><small>{focus.detail}</small></div>
      </aside></div>
      {error&&<p role="alert" className="lr-start-error">{error}</p>}
      <footer className="lr-start-footer"><div><span>Start here. Add details as you need them.</span><small role="status">{saveStatus}</small></div><button className="lr-start-primary" onClick={finish}>Open my project →</button></footer>
    </main>
  </div>;
}
Object.assign(window,{ProjectStart});
