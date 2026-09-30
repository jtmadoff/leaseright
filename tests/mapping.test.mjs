import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source = await readFile(new URL('../components/property-location.jsx', import.meta.url), 'utf8');
const helpers = source.slice(0, source.indexOf('const PropertyLocation ='));
const makeContext = (extra = {}) => ({window: {}, document: {querySelector: () => null}, ...extra});
test('missing Maps key makes no requests and gives a manual-entry fallback', async () => {
  const ctx = makeContext();
  runInNewContext(helpers, ctx);
  await assert.rejects(ctx.loadLeaseRightMaps(), /not connected/);
});
test('place selection preserves address, ID and coordinates without invented property facts', () => {
  const ctx = makeContext(); runInNewContext(helpers, ctx);
  const result = ctx.leaseRightPlaceLocation({id:'p1', formattedAddress:'10 Test Street', location:{lat:()=>41.5,lng:()=>-71.4}});
  assert.equal(result.address,'10 Test Street'); assert.equal(result.placeId,'p1'); assert.equal(result.lat,41.5); assert.equal(result.lng,-71.4); assert.equal(result.pinAdjusted,false);
  assert.equal(result.unitCount,undefined);
});
test('incomplete and invalid geocoding results cannot create a property pin', () => {
  const ctx = makeContext(); runInNewContext(helpers, ctx);
  for (const place of [{}, {formattedAddress:'Test'}, {formattedAddress:'Test',location:{lat:()=>NaN,lng:()=>1}}, {formattedAddress:'Test',location:{lat:()=>91,lng:()=>1}}]) assert.throws(()=>ctx.leaseRightPlaceLocation(place), /usable street location/);
});
