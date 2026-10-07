import React, { useEffect, useRef, useState } from "react";

/** Parcel outline drawn from the public record. Works with no map service at all. */
export function ParcelSketch({ rings, point }) {
  if (!rings?.length) return null;
  const pts = rings.flat();
  const lat0 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const xs = pts.map((p) => p[0] * kx);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = 360, H = 190, pad = 22;
  const scale = Math.min((W - pad * 2) / (maxX - minX || 1e-9), (H - pad * 2) / (maxY - minY || 1e-9));
  const ox = (W - (maxX - minX) * scale) / 2;
  const oy = (H - (maxY - minY) * scale) / 2;
  const X = (lng) => ox + (lng * kx - minX) * scale;
  const Y = (lat) => H - oy - (lat - minY) * scale;
  const d = rings.map((r) => r.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ") + "Z").join(" ");
  // Scale bar: degrees of latitude to feet.
  const feetPerPx = (1 / scale) * 364000;
  const barFeet = [25, 50, 100, 200, 500, 1000, 2000].find((f) => f / feetPerPx >= 44) || 5000;
  const inside = point && X(point.lng) > 0 && X(point.lng) < W && Y(point.lat) > 0 && Y(point.lat) < H;
  return (
    <svg className="sketch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Parcel outline from the public record">
      <path d={d} fill="rgba(240,169,59,0.10)" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" fillRule="evenodd" />
      {inside && <circle cx={X(point.lng)} cy={Y(point.lat)} r="4" fill="var(--fg)" stroke="var(--bg)" strokeWidth="2" />}
      <g transform={`translate(${W - 14 - barFeet / feetPerPx}, ${H - 12})`}>
        <line x1="0" x2={barFeet / feetPerPx} y1="0" y2="0" stroke="var(--fg-3)" strokeWidth="1.5" />
        <text x={barFeet / feetPerPx / 2} y="-5" textAnchor="middle" fill="var(--fg-3)" fontSize="9.5" fontFamily="var(--mono)">
          {barFeet} ft
        </text>
      </g>
    </svg>
  );
}

let mapsPromise;
function loadMaps() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  const key = document.querySelector('meta[name="leaseright-maps-key"]')?.content?.trim();
  if (!key) return Promise.reject(new Error("no key"));
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => reject(new Error("timeout")), 12000);
      window.__leaseRightMapsReady = () => {
        clearTimeout(timer);
        resolve(window.google.maps);
      };
      // Google reports a rejected key (wrong domain, billing off) after the script has loaded.
      window.gm_authFailure = () => {
        clearTimeout(timer);
        window.__leaseRightMapsFailed = true;
        window.dispatchEvent(new Event("leaseright-maps-failed"));
        reject(new Error("auth"));
      };
      script.src = "https://maps.googleapis.com/maps/api/js?" + new URLSearchParams({ key, loading: "async", callback: "__leaseRightMapsReady", v: "weekly" });
      script.async = true;
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error("load"));
      };
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
}

/**
 * Satellite view with the parcel outline. Optional: shown when a Google Maps key is
 * configured and loads; otherwise the caller falls back to ParcelSketch.
 * Clicking the map moves the pin so a different parcel can be checked.
 */
export function SiteMap({ point, rings, onPick, onUnavailable }) {
  const host = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polyRef = useRef(null);
  const clickRef = useRef(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [maps, setMaps] = useState(null);
  const [mapReady, setMapReady] = useState(0);

  useEffect(() => {
    let off = false;
    const failed = () => !off && onUnavailable?.();
    if (window.__leaseRightMapsFailed) failed();
    window.addEventListener("leaseright-maps-failed", failed);
    loadMaps()
      .then((api) => !off && !window.__leaseRightMapsFailed && setMaps(api))
      .catch(failed);
    return () => {
      off = true;
      window.removeEventListener("leaseright-maps-failed", failed);
    };
  }, []);

  useEffect(() => {
    if (!maps || !point || !host.current) return;
    let off = false;
    (async () => {
      try {
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([maps.importLibrary("maps"), maps.importLibrary("marker")]);
        if (off) return;
        if (!mapRef.current) {
          mapRef.current = new Map(host.current, {
            center: point,
            zoom: 18,
            mapId: "DEMO_MAP_ID",
            mapTypeId: "hybrid",
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            gestureHandling: "cooperative",
          });
          markerRef.current = new AdvancedMarkerElement({ map: mapRef.current, position: point, title: "Property location" });
          clickRef.current = mapRef.current.addListener("click", (e) => pick.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() }));
          setMapReady((n) => n + 1);
        } else {
          markerRef.current.position = point;
          if (!rings) mapRef.current.panTo(point);
        }
      } catch {
        if (!off) onUnavailable?.();
      }
    })();
    return () => {
      off = true;
    };
  }, [maps, point?.lat, point?.lng]);

  useEffect(() => () => clickRef.current?.remove(), []);

  useEffect(() => {
    if (!maps || !mapRef.current) return;
    polyRef.current?.setMap(null);
    polyRef.current = null;
    if (!rings) return;
    polyRef.current = new maps.Polygon({
      map: mapRef.current,
      paths: rings.map((r) => r.map(([lng, lat]) => ({ lat, lng }))),
      strokeColor: "#F0A93B",
      strokeWeight: 2.5,
      fillColor: "#F0A93B",
      fillOpacity: 0.12,
      clickable: false,
    });
    const bounds = new maps.LatLngBounds();
    rings.forEach((r) => r.forEach(([lng, lat]) => bounds.extend({ lat, lng })));
    mapRef.current.fitBounds(bounds, 48);
    return () => polyRef.current?.setMap(null);
  }, [maps, rings, mapReady]);

  return <div ref={host} className="sitemap" aria-label="Satellite view of the property" />;
}
