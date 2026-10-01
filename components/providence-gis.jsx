// Public, read-only Providence GIS. No API key or paid data subscription.
const PROVIDENCE_PARCELS = 'https://services6.arcgis.com/wv9mHoqblhTsnqdG/arcgis/rest/services/Parcel_Zoning_FL/FeatureServer/0';
const PROVIDENCE_GIS_VIEWER = 'https://pvdgis.maps.arcgis.com/apps/instant/basic/index.html?appid=9bd5091062574e8abb7b0a9b05e25ee1';
const PROVIDENCE_FIELDS = 'OBJECTID,MAP_PAR_ID,ParcAddress,ZONING,AreaSF,AreaAC,MuniUseCodeDesc,NumUnits,YearBuilt,NumFloors,GrBldgArea,TaxRollYear';
function providenceNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}
function providenceCoverage({lat, lng}) {
  // A request filter, not a municipal boundary or a parcel match.
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 41.75 && lat <= 41.88 && lng >= -71.50 && lng <= -71.35;
}
function providenceParcel(feature) {
  const a = feature.attributes || {};
  const rings = feature.geometry?.rings;
  if (a.OBJECTID == null || !Array.isArray(rings) || !rings.length || !rings.every(r => Array.isArray(r) && r.length >= 4 && r.every(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90))) return null;
  const text = value => value == null || /^(null|n\/a)$/i.test(String(value).trim()) ? '' : String(value).trim();
  return {id: String(a.OBJECTID), parcelId: text(a.MAP_PAR_ID), address: text(a.ParcAddress), zoning: text(a.ZONING), use: text(a.MuniUseCodeDesc), lotSqft: providenceNumber(a.AreaSF), lotAcres: providenceNumber(a.AreaAC), buildingSqft: providenceNumber(a.GrBldgArea), units: providenceNumber(a.NumUnits), yearBuilt: providenceNumber(a.YearBuilt), floors: providenceNumber(a.NumFloors), taxYear: text(a.TaxRollYear), rings};
}
async function lookupProvidenceParcels(location, {signal, fetcher = fetch} = {}) {
  if (!providenceCoverage(location)) return {status: 'outside', parcels: []};
  const query = async nearby => {
    const params = new URLSearchParams({f:'json', geometry:`${location.lng},${location.lat}`, geometryType:'esriGeometryPoint', inSR:'4326', spatialRel:'esriSpatialRelIntersects', outFields:PROVIDENCE_FIELDS, returnGeometry:'true', outSR:'4326', resultRecordCount:'25'});
    if (nearby) { params.set('distance','25'); params.set('units','esriSRUnit_Meter'); }
    const response = await fetcher(`${PROVIDENCE_PARCELS}/query?${params}`, {signal});
    if (!response.ok) throw new Error('Providence GIS is unavailable. You can still complete the property details.');
    const data = await response.json();
    if (data.error || !Array.isArray(data.features)) throw new Error('Providence GIS could not return parcel records. Try again shortly.');
    if (data.exceededTransferLimit) throw new Error('Too many parcel records at this point. Move the pin into the site to narrow the match.');
    const parcels = data.features.map(providenceParcel).filter(Boolean);
    if (data.features.length && !parcels.length) throw new Error('The city returned an incomplete parcel boundary. Open the city viewer to check it.');
    return parcels;
  };
  let parcels = await query(false);
  let match = 'intersects';
  if (!parcels.length) { parcels = await query(true); match = 'nearby'; }
  return {status: parcels.length ? 'ready' : 'empty', parcels, match, retrievedAt: new Date().toISOString(), source: PROVIDENCE_PARCELS};
}
Object.assign(window, {PROVIDENCE_PARCELS, PROVIDENCE_GIS_VIEWER, providenceCoverage, providenceParcel, lookupProvidenceParcels});
async function lookupProvidenceZoning(parcel, {signal, fetcher = fetch} = {}) {
  const params = new URLSearchParams({f:'json', geometry:JSON.stringify({rings:parcel.rings, spatialReference:{wkid:4326}}), geometryType:'esriGeometryPolygon', inSR:'4326', spatialRel:'esriSpatialRelIntersects', outFields:'Code,District', returnGeometry:'false', resultRecordCount:'50'});
  const response = await fetcher(PROVIDENCE_PARCELS.replace(/\/0$/, '/12') + '/query', {method:'POST', body:params, signal});
  if (!response.ok) throw new Error('Zoning layer unavailable');
  const data = await response.json();
  if (data.error || !Array.isArray(data.features) || data.exceededTransferLimit) throw new Error('Zoning layer unavailable');
  return [...new Map(data.features.filter(f => f.attributes?.Code).map(f => [f.attributes.Code, {code:f.attributes.Code, district:f.attributes.District || ''}])).values()];
}
Object.assign(window, {lookupProvidenceZoning});
