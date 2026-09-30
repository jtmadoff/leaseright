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
  const searchHost = React.useRef(null);
  const mapHost = React.useRef(null);
  const requestId = React.useRef(0);
  const current = React.useRef({onChange, location});
  current.current = {onChange, location};
  const [status, setStatus] = React.useState("loading");
  const [message, setMessage] = React.useState("");
  const [manual, setManual] = React.useState(false);
  const [maps, setMaps] = React.useState(null);
  const [mapError, setMapError] = React.useState("");
  React.useEffect(() => {
    let disposed = false, widget;
    const error = (text) => { if (!disposed) { setStatus("error"); setMessage(text); setManual(true); } };
    const selected = async ({placePrediction}) => {
      const request = ++requestId.current;
      setStatus("resolving"); setMessage("");
      // Immediately invalidate the old pin while a new selection resolves.
      current.current.onChange("", null);
      try {
        const place = placePrediction.toPlace();
        await place.fetchFields({fields: ["id", "formattedAddress", "location"]});
        if (disposed || request !== requestId.current) return;
        const next = leaseRightPlaceLocation(place);
        current.current.onChange(next.address, next);
        setManual(false); setStatus("ready");
      } catch (e) { if (request === requestId.current) error(e.message || "Couldn't locate that address. Try another result."); }
    };
    const edited = () => { ++requestId.current; current.current.onChange("", null); setStatus("ready"); setMessage(""); };
    const failed = () => { ++requestId.current; error("Address search is unavailable. Please enter the address manually."); };
    loadLeaseRightMaps().then(async api => {
      const {PlaceAutocompleteElement} = await api.importLibrary("places");
      if (disposed) return;
      widget = new PlaceAutocompleteElement();
      widget.placeholder = "Search a street address or building name";
      widget.setAttribute("aria-label", "Find your property");
      widget.style.width = "100%";
      widget.style.colorScheme = "dark";
      widget.addEventListener("gmp-select", selected);
      widget.addEventListener("gmp-error", failed);
      widget.addEventListener("input", edited);
      searchHost.current.replaceChildren(widget);
      setMaps(api); setStatus("ready");
    }).catch(e => error(e.message));
    return () => { disposed = true; ++requestId.current; if (widget) { widget.removeEventListener("gmp-select", selected); widget.removeEventListener("gmp-error", failed); widget.removeEventListener("input", edited); widget.remove(); } };
  }, []);
  React.useEffect(() => {
    if (!maps || !location) return;
    let disposed = false, marker, listener;
    setMapError("");
    Promise.all([maps.importLibrary("maps"), maps.importLibrary("marker")]).then(([{Map}, {AdvancedMarkerElement}]) => {
      if (disposed) return;
      const position = {lat: location.lat, lng: location.lng};
      const map = new Map(mapHost.current, {center: position, zoom: 18, mapId: "DEMO_MAP_ID", mapTypeId: "satellite", streetViewControl: false, mapTypeControl: true, fullscreenControl: true, gestureHandling: "cooperative"});
      marker = new AdvancedMarkerElement({map, position, title: "Property location — drag to adjust", gmpDraggable: true});
      listener = marker.addListener("dragend", () => {
        const p = marker.position;
        const lat = typeof p.lat === "function" ? p.lat() : p.lat;
        const lng = typeof p.lng === "function" ? p.lng() : p.lng;
        const latest = current.current.location;
        if (latest) current.current.onChange(latest.address, {...latest, lat, lng, pinAdjusted: true});
      });
    }).catch(() => { if (!disposed) setMapError("The map couldn't load. Your selected address is still available."); });
    return () => { disposed = true; listener?.remove(); if (marker) marker.map = null; };
    // Adjusting the pin must not create another billable map load.
  }, [maps, location?.placeId]);
  const inputStyle = {width: "100%", boxSizing: "border-box", padding: "14px 16px", background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 6, color: t.ink, font: `14px ${t.sans}`};
  return <section aria-label="Property location" style={{marginBottom: 24}}>
    <div style={{fontFamily: t.sans, color: t.ink, fontSize: 24, fontWeight: 650, letterSpacing: -.5}}>Find your property.</div>
    <p style={{fontFamily: t.sans, color: t.inkSoft, fontSize: 13, margin: "8px 0 18px"}}>Choose an address to bring the building into view. Then add the details for your lease-up plan.</p>
    <div ref={searchHost} style={{display: manual ? "none" : "block", minHeight: status === "loading" ? 46 : 0}} />
    {status === "loading" && <div role="status" style={{color: t.inkMute, fontFamily: t.sans}}>Loading address search…</div>}
    {manual && <label style={{display: "block", fontFamily: t.sans, color: t.inkSoft, fontSize: 12}}>Property address<input aria-label="Property address" placeholder="Street address, city, state, ZIP" value={address} onChange={e => { ++requestId.current; onChange(e.target.value, null); }} style={{...inputStyle, marginTop: 8}} /></label>}
    {message && <p role="status" style={{fontFamily: t.sans, color: t.warn, fontSize: 12}}>{message}</p>}
    {status === "resolving" && <p role="status" style={{color: t.inkSoft}}>Finding your property…</p>}
    {maps && <button type="button" onClick={() => {++requestId.current; setManual(!manual); setMessage(""); setStatus("ready"); onChange("", null);}} style={{margin: "12px 0", padding: 0, background: "none", border: 0, color: t.accent, fontFamily: t.sans, cursor: "pointer"}}>{manual ? "Search for an address" : "Can't find it? Enter an address manually"}</button>}
    <div style={{marginTop: 16, border: `1px solid ${t.rule}`, borderRadius: 8, overflow: "hidden", background: t.bg}}>
      <div ref={mapHost} aria-label="Property map" style={{height: location && maps && !mapError ? 320 : 0, overflow: "hidden"}} />
      {(!location || !maps || mapError) && <div style={{minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 10, color: t.inkMute, fontFamily: t.sans}}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
        <span style={{color: t.inkSoft, fontSize: 14}}>{mapError || (manual && address ? "Address entered · location not mapped" : "Your property will appear here")}</span>
        <span style={{fontSize: 12}}>Select a search result to see the building and surrounding streets.</span>
      </div>}
      {location && <div style={{padding: "14px 18px", borderTop: `1px solid ${t.rule}`, color: t.ink, fontFamily: t.sans}}><div style={{fontSize: 13, fontWeight: 600}}>{address}</div><div style={{fontSize: 11, color: t.inkMute, marginTop: 5}}>{location.pinAdjusted ? "Pin adjusted · address unchanged" : "Check the location. Drag the pin if the entrance or site is elsewhere."}</div></div>}
    </div>
  </section>;
};
Object.assign(window, {PropertyLocation, leaseRightPlaceLocation});
