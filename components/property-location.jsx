/* global React */
// Live requests stay off until a restricted key is configured in LeaseRight.html.
let leaseRightMapsPromise;
function loadLeaseRightMaps() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  const key = document.querySelector('meta[name="leaseright-maps-key"]')?.content?.trim();
  if (!key) return Promise.reject(new Error("Address search is not connected yet. You can enter the address manually."));
  if (!leaseRightMapsPromise) leaseRightMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let timer;
    const fail = () => { clearTimeout(timer); reject(new Error("Address search is unavailable. Please enter the address manually.")); };
    window.leaseRightMapsReady = () => { clearTimeout(timer); resolve(window.google.maps); };
    window.gm_authFailure = fail;
    script.src = "https://maps.googleapis.com/maps/api/js?" + new URLSearchParams({key, loading: "async", callback: "leaseRightMapsReady", v: "weekly"});
    script.async = true;
    script.onerror = fail;
    timer = setTimeout(fail, 15000);
    document.head.appendChild(script);
  });
  return leaseRightMapsPromise;
}
function leaseRightPlaceLocation(place) {
  const lat = place.location?.lat();
  const lng = place.location?.lng();
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !place.formattedAddress) {
    throw new Error("This result has no usable street location. Try another address or enter it manually.");
  }
  return { placeId: place.id || null, address: place.formattedAddress, lat, lng, pinAdjusted: false };
}
const PropertyLocation = ({ t, address, location, onChange }) => {
  const searchHost = React.useRef(null), mapHost = React.useRef(null);
  const requestId = React.useRef(0), mapRef = React.useRef(null), markerRef = React.useRef(null);
  const current = React.useRef({onChange, location});
  current.current = {onChange, location};
  const [status, setStatus] = React.useState("loading"), [message, setMessage] = React.useState("");
  const [manual, setManual] = React.useState(false), [maps, setMaps] = React.useState(null);
  const [mapError, setMapError] = React.useState(""), [mapReady, setMapReady] = React.useState(0);
  const [gis, setGis] = React.useState({status:"idle", parcels:[]});
  const [selectedId, setSelectedId] = React.useState(null), [retry, setRetry] = React.useState(0);
  const [zoning, setZoning] = React.useState({status:"idle", zones:[]});
  const [showBoundary, setShowBoundary] = React.useState(true);
  const selected = gis.parcels.find(p => p.id === selectedId);
  const confirmed = !!selected && location?.gis?.parcel?.id === selected.id && location.gis.confirmed;
  React.useEffect(() => {
    let disposed = false, widget;
    const error = text => { if (!disposed) {setStatus("error"); setMessage(text); setManual(true);} };
    const choose = async ({placePrediction}) => {
      const request = ++requestId.current;
      setStatus("resolving"); setMessage(""); current.current.onChange("", null);
      try {
        const place = placePrediction.toPlace();
        await place.fetchFields({fields:["id", "formattedAddress", "location"]});
        if (disposed || request !== requestId.current) return;
        const next = leaseRightPlaceLocation(place);
        current.current.onChange(next.address, next); setManual(false); setStatus("ready");
      } catch (e) { if (request === requestId.current) error(e.message || "Couldn't locate that address."); }
    };
    const edited = () => {++requestId.current; current.current.onChange("", null); setStatus("ready"); setMessage("");};
    const failed = () => {++requestId.current; error("Address search is unavailable. You can enter an address manually.");};
    loadLeaseRightMaps().then(async api => {
      const {PlaceAutocompleteElement} = await api.importLibrary("places");
      if (disposed) return;
      widget = new PlaceAutocompleteElement();
      widget.placeholder = "Enter a street address or property name";
      widget.setAttribute("aria-label", "Find your property"); widget.style.width = "100%";
      widget.style.colorScheme = "dark";
      widget.addEventListener("gmp-select", choose); widget.addEventListener("gmp-error", failed); widget.addEventListener("input", edited);
      searchHost.current.replaceChildren(widget); setMaps(api); setStatus("ready");
    }).catch(e => error(e.message));
    return () => {disposed = true; ++requestId.current; if (widget) {widget.removeEventListener("gmp-select", choose); widget.removeEventListener("gmp-error", failed); widget.removeEventListener("input", edited); widget.remove();}};
  }, []);
  React.useEffect(() => {
    if (!maps || !location) return;
    let disposed = false, marker, map, dragListener, clickListener;
    setMapError("");
    Promise.all([maps.importLibrary("maps"), maps.importLibrary("marker")]).then(([{Map}, {AdvancedMarkerElement}]) => {
      if (disposed) return;
      const position = {lat:location.lat, lng:location.lng};
      map = new Map(mapHost.current, {center:position, zoom:18, mapId:"DEMO_MAP_ID", mapTypeId:"satellite", streetViewControl:false, mapTypeControl:true, fullscreenControl:true, gestureHandling:"cooperative"});
      marker = new AdvancedMarkerElement({map, position, title:"Property location — drag to adjust", gmpDraggable:true});
      const move = p => {
        const latest = current.current.location;
        if (!latest || !p) return;
        const lat = typeof p.lat === "function" ? p.lat() : p.lat, lng = typeof p.lng === "function" ? p.lng() : p.lng;
        current.current.onChange(latest.address, {...latest, lat, lng, pinAdjusted:true, gis:null});
      };
      dragListener = marker.addListener("dragend", () => move(marker.position));
      clickListener = map.addListener("click", e => move(e.latLng));
      mapRef.current = map; markerRef.current = marker; setMapReady(n => n + 1);
    }).catch(() => {if (!disposed) setMapError("The map couldn't load. Your address and public records are still available.");});
    return () => {disposed = true; dragListener?.remove(); clickListener?.remove(); if (marker) marker.map = null; if (mapRef.current === map) {mapRef.current = null; markerRef.current = null;}};
    // Pin moves and parcel confirmation reuse the existing billable map instance.
  }, [maps, location?.placeId]);
  React.useEffect(() => {
    if (location && markerRef.current) markerRef.current.position = {lat:location.lat, lng:location.lng};
  }, [location?.lat, location?.lng, mapReady]);
  React.useEffect(() => {
    setSelectedId(null); setZoning({status:"idle", zones:[]});
    if (!location) {setGis({status:"idle", parcels:[]}); return;}
    if (location.gis?.confirmed && retry === 0) {
      setGis({...location.gis, status:"ready", parcels:[location.gis.parcel]}); setSelectedId(location.gis.parcel.id); return;
    }
    const controller = new AbortController(); let disposed = false;
    setGis({status:"loading", parcels:[]});
    const timeout = setTimeout(() => controller.abort(), 12000);
    lookupProvidenceParcels(location, {signal:controller.signal}).then(result => {
      if (disposed) return;
      setGis(result); setSelectedId(result.parcels[0]?.id || null);
    }).catch(e => {if (!disposed) setGis({status:"error", parcels:[], message:e.name === "AbortError" ? "Providence GIS is taking too long. Try again, or continue with your own details." : e.message});}).finally(() => clearTimeout(timeout));
    return () => {disposed = true; clearTimeout(timeout); controller.abort();};
  }, [location?.lat, location?.lng, location?.placeId, retry]);
  React.useEffect(() => {
    if (!selected) return;
    if (confirmed && retry === 0) {setZoning(location.gis.zoning || {status:"error", zones:[]}); return;}
    const controller = new AbortController(); let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 10000);
    setZoning({status:"loading", zones:[]});
    lookupProvidenceZoning(selected, {signal:controller.signal}).then(zones => {if (!disposed) setZoning({status:"ready", zones});}).catch(() => {if (!disposed) setZoning({status:"error", zones:[]});}).finally(() => clearTimeout(timeout));
    return () => {disposed = true; clearTimeout(timeout); controller.abort();};
  }, [selected, retry]);
  React.useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map || !selected || !showBoundary) return;
    const polygon = new maps.Polygon({map, paths:selected.rings.map(r => r.map(([lng,lat]) => ({lat,lng}))), strokeColor:"#F5B84B", strokeWeight:2.5, fillColor:"#F5B84B", fillOpacity:0.12, clickable:false});
    const bounds = new maps.LatLngBounds(); selected.rings.forEach(r => r.forEach(([lng,lat]) => bounds.extend({lat,lng})));
    map.fitBounds(bounds, 50);
    return () => polygon.setMap(null);
  }, [maps, selected, showBoundary, mapReady]);
  const confirmParcel = () => {
    if (!selected || !location) return;
    const confirmedAddress = selected.address ? `${selected.address}, Providence, RI` : address;
    onChange(confirmedAddress, {...location, address:confirmedAddress, gis:{confirmed:true, parcel:selected, zoning, match:gis.match, source:PROVIDENCE_PARCELS, retrievedAt:gis.retrievedAt, confirmedAt:new Date().toISOString()}});
  };
  const number = value => value == null ? "Not reported" : new Intl.NumberFormat("en-US", {maximumFractionDigits:0}).format(value);
  const facts = selected ? [["Lot area", selected.lotSqft ? `${number(selected.lotSqft)} sq ft` : selected.lotAcres ? `${selected.lotAcres} acres` : "Not reported"], ["Gross building area", selected.buildingSqft ? `${number(selected.buildingSqft)} sq ft` : "Not reported"], ["Recorded units", number(selected.units)], ["Year built", selected.yearBuilt || "Not reported"], ["Stories", number(selected.floors)], ["Recorded use", selected.use || "Not reported"]] : [];
  const gisMessage = {idle:"Search for an address to find its parcel and public property records.", loading:"Finding the parcel in Providence’s GIS…", outside:"City records are connected for Providence, RI. You can still map this address and enter its details.", empty:"No parcel found at or within 25 metres of the pin. Click inside the property on the map to try again.", error:gis.message}[gis.status];
  return <section className="lr-property" aria-label="Property location" style={{"--lr-rule":t.rule, "--lr-bg":t.bg, "--lr-surface":t.surface, "--lr-ink":t.ink, "--lr-muted":t.inkSoft, "--lr-accent":t.accent, fontFamily:t.sans}}>
    <div className="lr-property-heading"><div><div className="lr-kicker">01 / PROPERTY DISCOVERY</div><h2>Start with the place.</h2><p>Find the address. Check the parcel. Build from what’s already known.</p></div><span className="lr-coverage"><span/>Providence, RI · GIS connected</span></div>
    <div className="lr-search-row">
      <div style={{flex:1, minWidth:0}}><div ref={searchHost} style={{display:manual ? "none":"block"}} />
        {status === "loading" && <p role="status">Loading address search…</p>}
        {manual && <input className="lr-address-input" aria-label="Property address" placeholder="Street address, city, state, ZIP" value={address} onChange={e => {++requestId.current; onChange(e.target.value,null);}} />}
      </div>
      {maps && <button className="lr-text-button" type="button" onClick={() => {++requestId.current; setManual(!manual); setMessage(""); setStatus("ready"); onChange("",null);}}>{manual ? "Search addresses" : "Enter manually"}</button>}
    </div>
    {(message || status === "resolving") && <p role="status" className="lr-property-message">{message || "Finding your property…"}</p>}
    <div className="lr-property-grid">
      <div className="lr-map-panel">
        <div className="lr-map-toolbar"><span>{location ? "SITE EXPLORER" : "YOUR SITE, IN CONTEXT"}</span>{selected && <button type="button" aria-pressed={showBoundary} onClick={() => setShowBoundary(v => !v)}>{showBoundary ? "Hide parcel boundary" : "Show parcel boundary"}</button>}</div>
        <div ref={mapHost} aria-label="Property map" className="lr-property-map" style={{display:location && maps && !mapError ? "block":"none"}} />
        {(!location || !maps || mapError) && <div className="lr-map-empty"><div className="lr-empty-cross">＋</div><div className="lr-empty-parcel" aria-hidden="true"/><strong>{mapError || (manual && address ? "Address entered · not mapped" : "Every plan starts with a property.")}</strong><p>{mapError ? "You can continue below." : "Choose an address to explore the site and its parcel."}</p></div>}
        <div className="lr-map-caption"><span className="lr-pin-dot"/><div><strong>{address || "No property selected"}</strong><p>{location ? "Click the site or drag the pin to check another parcel." : "Satellite imagery + municipal parcel boundaries"}</p></div></div>
      </div>
      <aside className="lr-facts-panel" aria-label="Public property records">
        <div className="lr-facts-heading"><div className="lr-kicker">PUBLIC PROPERTY RECORD</div><span className={confirmed ? "lr-status confirmed" : "lr-status"}>{confirmed ? "Confirmed" : selected ? "Review match" : "Providence GIS"}</span></div>
        {!selected && <div className="lr-record-empty" role="status"><h3>{gis.status === "loading" ? "Looking up the site" : gis.status === "error" ? "Records unavailable" : "A head start on the details."}</h3><p>{gisMessage}</p>{gis.status === "idle" && <div className="lr-record-preview">Parcel boundary<span>Lot & building area</span><span>Recorded use & zoning</span></div>}{gis.status === "error" && <button className="lr-outline-button" onClick={() => setRetry(n => n+1)}>Retry city lookup</button>}</div>}
        {selected && <>
          {gis.parcels.length > 1 && <label className="lr-parcel-select">{gis.parcels.length} parcel records — choose your site<select aria-label="Parcel record" value={selectedId} onChange={e => {setSelectedId(e.target.value); if (location.gis) onChange(address,{...location,gis:null});}}>{gis.parcels.map(p => <option key={p.id} value={p.id}>{p.address || "Address not reported"} · {p.parcelId || p.id}</option>)}</select></label>}
          <h3>{selected.address || "Address not reported"}</h3><div className="lr-parcel-id">Parcel {selected.parcelId || selected.id}</div>
          <div className="lr-match-note">{gis.match === "nearby" ? "Nearby candidate · within 25 m of the pin. Check the outlined site before confirming." : "The pin intersects this parcel. Check the outline and address before confirming."}</div>
          <dl className="lr-facts-grid">{facts.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <div className="lr-zoning"><div className="lr-kicker">ZONING LAYER</div><strong>{zoning.status === "loading" ? "Checking zoning…" : zoning.status === "error" ? "Layer unavailable" : zoning.zones.map(z => z.code).join(" · ") || "Not reported"}</strong><p>{zoning.status === "ready" && zoning.zones.length > 1 ? "Multiple zones intersect this boundary. Confirm the applicable area with the city." : "GIS designation only. Confirm permitted uses and development limits with the city."}</p></div>
          <button className="lr-confirm-button" disabled={confirmed || zoning.status === "loading"} onClick={confirmParcel}>{confirmed ? "✓ Parcel confirmed" : "Confirm this parcel"}</button>
          <p className="lr-record-footnote">Recorded facts describe the existing property. Your proposed unit count and lease-up assumptions stay separate.</p>
          <div className="lr-record-source">City of Providence · {selected.taxYear ? `${selected.taxYear} tax roll` : "Tax year not reported"}<br/>Retrieved {new Date(gis.retrievedAt).toLocaleDateString("en-US")}<br/><a href={`${PROVIDENCE_PARCELS}/query?f=pjson&objectIds=${encodeURIComponent(selected.id)}&outFields=${encodeURIComponent(PROVIDENCE_FIELDS)}&returnGeometry=false`} target="_blank" rel="noopener noreferrer">View source record ↗</a></div>
        </>}
        <a className="lr-city-link" href={PROVIDENCE_GIS_VIEWER} target="_blank" rel="noopener noreferrer">Open Providence’s GIS viewer ↗</a>
      </aside>
    </div>
  </section>;
};
Object.assign(window, {PropertyLocation, leaseRightPlaceLocation});
