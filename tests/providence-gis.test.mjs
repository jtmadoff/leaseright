import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source = await readFile(new URL('../components/providence-gis.jsx',import.meta.url),'utf8');
const context = () => {const c={window:{},URLSearchParams,fetch:()=>{throw Error('Unexpected network request');}};runInNewContext(source,c);return c;};
const feature = (overrides={}) => ({attributes:{OBJECTID:1,MAP_PAR_ID:'02000380000',ParcAddress:'25 Dorrance St',AreaSF:'32,078',NumUnits:'1',YearBuilt:'1878',...overrides},geometry:{rings:[[[-71.42,41.82],[-71.41,41.82],[-71.41,41.83],[-71.42,41.82]]]}});
const response = data => ({ok:true,json:async()=>data});
test('municipal nulls and sentinel zeros do not become invented property facts',()=>{
 const c=context(),p=c.providenceParcel(feature({YearBuilt:'0',NumUnits:'',AreaAC:null,GrBldgArea:'NaN'}));
 assert.equal(p.lotSqft,32078); assert.equal(p.units,null); assert.equal(p.yearBuilt,null); assert.equal(p.buildingSqft,null); assert.equal(p.lotAcres,null);
 assert.equal(c.providenceParcel({...feature(),geometry:{rings:[[[1,2]]]}}),null);
});
test('outside coverage sends no GIS request',async()=>{
 const r=await context().lookupProvidenceParcels({lat:40.7,lng:-74});assert.equal(r.status,'outside');
});
test('point intersections preserve multiple candidates without confirming a parcel',async()=>{
 const calls=[];const r=await context().lookupProvidenceParcels({lat:41.824,lng:-71.413},{fetcher:async(url)=>{calls.push(url);return response({features:[feature(),feature({OBJECTID:2})]});}});
 assert.equal(calls.length,1);assert.equal(r.parcels.length,2);assert.equal(r.match,'intersects');assert.equal(r.confirmed,undefined);
 const q=new URL(calls[0]).searchParams;assert.equal(q.get('inSR'),'4326');assert.equal(q.get('outSR'),'4326');assert.equal(q.get('geometry'),'-71.413,41.824');assert.equal(q.get('distance'),null);assert.ok(!q.get('outFields').includes('Owner'));
});
test('nearby search is bounded and explicitly distinguished from intersection',async()=>{
 const calls=[];const r=await context().lookupProvidenceParcels({lat:41.824,lng:-71.413},{fetcher:async(url)=>{calls.push(url);return response({features:calls.length===1?[]:[feature()]});}});
 assert.equal(r.match,'nearby');assert.equal(calls.length,2);assert.equal(new URL(calls[1]).searchParams.get('distance'),'25');
});
test('service errors and truncated results cannot masquerade as an empty or unique match',async()=>{
 for(const data of [{error:{message:'Down'}},{features:[feature()],exceededTransferLimit:true},{features:[{attributes:{OBJECTID:1}}]}]) {
  await assert.rejects(context().lookupProvidenceParcels({lat:41.824,lng:-71.413},{fetcher:async()=>response(data)}));
 }
});
test('zoning queries the whole chosen parcel and preserves multiple zoning designations',async()=>{
 const c=context(),p=c.providenceParcel(feature());let request;
 const zones=await c.lookupProvidenceZoning(p,{fetcher:async(url,options)=>{request={url,options};return response({features:[{attributes:{Code:'D-1',District:'Downtown'}},{attributes:{Code:'C-2'}},{attributes:{Code:'D-1'}}]});}});
 assert.equal(zones.length,2);assert.equal(request.options.method,'POST');assert.equal(request.options.body.get('geometryType'),'esriGeometryPolygon');assert.equal(JSON.parse(request.options.body.get('geometry')).rings.length,1);assert.ok(request.url.includes('/12/query'));
});
test('abort signal is forwarded to GIS requests',async()=>{
 const signal=new AbortController().signal;let observed;
 await context().lookupProvidenceParcels({lat:41.824,lng:-71.413},{signal,fetcher:async(url,opts)=>{observed=opts.signal;return response({features:[feature()]});}});assert.equal(observed,signal);
});
