import React, { useEffect, useMemo, useState } from "react";
import { Chip, Drawer, Icon } from "../ui/atoms.jsx";
import { Sparkline } from "../ui/charts.jsx";
import { rentIndex, bedMarket, observedRange, supplyNear, listingBuildings, sourceById, publishedRents } from "../core/market.js";
import { similarBuildings, subjectProfile, COMP_RULES } from "../core/similarity.js";
import { nearbyApartments } from "../ri/arcgis.js";
import { getTown, neighbors } from "../ri/towns.js";
import { normalizeMix } from "../core/model.js";
import { money, monthLabel, bedLabel, dateLong, number } from "../core/format.js";

const RADIUS = 3;
const cache = new Map();

/** Apartment buildings near the subject, from the town's parcel layer and any neighbor that records unit counts. */
export function useNearbyBuildings(project) {
  const loc = project.location;
  const town = getTown(project.town);
  const [state, setState] = useState({ status: "idle", parcels: [], towns: [] });
  useEffect(() => {
    if (!loc || !town) {
      setState({ status: town ? "nolocation" : "idle", parcels: [], towns: [] });
      return;
    }
    const sources = [town, ...neighbors(loc, { radius: 5, exclude: town.name })].filter((t) => t.parcel?.apartmentWhere && t.parcel.fields.units).slice(0, 4);
    if (!sources.length) {
      setState({ status: "unsupported", parcels: [], towns: [] });
      return;
    }
    const key = `${sources.map((t) => t.name).join(",")}|${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
    if (cache.has(key)) {
      setState(cache.get(key));
      return;
    }
    let off = false;
    const controller = new AbortController();
    setState({ status: "loading", parcels: [], towns: sources.map((t) => t.name) });
    Promise.allSettled(sources.map((t) => nearbyApartments(t.name, loc, RADIUS, { signal: controller.signal }))).then((results) => {
      if (off) return;
      const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const next = {
        status: ok.length ? "ready" : "error",
        parcels: ok.flatMap((r) => r.parcels),
        towns: ok.map((r) => r.town),
        stale: ok.filter((r) => getTown(r.town).parcel.stale).map((r) => `${r.town} (${r.dataYear})`),
      };
      if (next.status === "ready") cache.set(key, next); // a failed lookup is retried next time
      setState(next);
    });
    return () => {
      off = true;
      controller.abort();
    };
  }, [loc?.lat, loc?.lng, town?.name]);
  return state;
}

export function useMarket(project, data) {
  const nearby = useNearbyBuildings(project);
  return useMemo(() => {
    const index = rentIndex(data.rents, project.town, project.zip);
    const beds = [...new Set(normalizeMix(project.unitMix).map((r) => r.beds).filter((b) => b !== null && !Number.isNaN(b)))].sort();
    const byBed = (beds.length ? beds : [0, 1, 2]).map((b) => ({ beds: b, ...bedMarket(data, project.town, b) }));
    const subject = subjectProfile(project);
    const exclude = project.parcel?.parcelId;
    const similar = similarBuildings(
      subject,
      nearby.parcels.filter((p) => p.parcelId !== exclude && p.address.toLowerCase() !== String(project.address).toLowerCase()),
      { radius: RADIUS },
    );
    const supply = supplyNear(data.supply, project.town, project.location);
    const observed = (data.observations?.properties || []).filter((p) => p.town === project.town);
    return { index, byBed, similar, subject, nearby, supply, observed, listings: data.rents?.listings || null, listingBuildings: listingBuildings(data.rents, project.town) };
  }, [project.town, project.zip, project.unitMix, project.totalUnits, project.projectType, project.parcel?.parcelId, project.location, nearby, data]);
}

function IndexTile({ index }) {
  if (!index) return <p className="muted">No rent index is published for this town.</p>;
  const p = index.primary;
  return (
    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4 }}>{money(p.rent)}</div>
        <div className="muted small">
          {p.scope} · {monthLabel(p.asOf)}
          {p.yoyPct !== undefined ? ` · ${p.yoyPct > 0 ? "+" : ""}${p.yoyPct}% in a year` : ""}
        </div>
      </div>
      <Sparkline series={p.series} label={`Rent index for ${p.scope}, last twelve months`} />
    </div>
  );
}

export function SimilarTable({ market, compact, data }) {
  const { similar, nearby, subject } = market;
  if (nearby.status === "idle" || nearby.status === "nolocation") return <p className="muted">Pin the property to an address to match buildings near it.</p>;
  if (nearby.status === "loading") return <p className="muted" role="status">Matching apartment buildings near the site.</p>;
  if (nearby.status === "unsupported")
    return <p className="muted">No town within five miles publishes unit counts for apartment buildings, so buildings cannot be matched by size here. Listing-based comps cover this once the feed is connected.</p>;
  if (nearby.status === "error") return <p className="muted">Parcel records are not responding. Try again shortly.</p>;
  if (!similar.buildings.length)
    return (
      <p className="muted">
        {similar.withUnits
          ? `No close match. ${similar.withUnits} apartment building${similar.withUnits === 1 ? "" : "s"} of ${COMP_RULES.minUnits}+ units within ${RADIUS} miles, none similar enough in size${subject.type ? ", era" : ""} and distance to count as a comp.`
          : `No apartment building of ${COMP_RULES.minUnits}+ units on record within ${RADIUS} miles.`}
      </p>
    );
  // The rents column only appears when at least one matched building has published rents.
  const showRents = !compact && similar.buildings.slice(0, 6).some((b) => publishedRents(data, b.town, b.address));
  return (
    <>
      <div className="tablewrap">
        <table className="t">
          <thead>
            <tr>
              <th>Building</th>
              <th className="n">Units</th>
              <th className="n">Built</th>
              <th className="n">Miles</th>
              <th className="n">Match</th>
              {showRents && <th>Published rents</th>}
            </tr>
          </thead>
          <tbody>
            {similar.buildings.slice(0, compact ? 4 : 6).map((b) => {
              const pub = showRents ? publishedRents(data, b.town, b.address) : null;
              return (
              <tr key={`${b.town}-${b.parcelId}`}>
                <td className="strong">
                  {b.address || "Address not recorded"}
                  <span className="sub">{b.town}</span>
                </td>
                <td className="n">{number(b.units)}</td>
                <td className="n">{b.yearBuilt || "–"}</td>
                <td className="n">{b.distance.toFixed(1)}</td>
                <td className="n">{b.score}%</td>
                {showRents && (
                  <td>
                    {pub
                      ? Object.entries(pub.byBed)
                          .map(([bed, price]) => `${bedLabel(bed)} ${money(price)}`)
                          .join(" · ")
                      : "–"}
                    {pub && <span className="sub">{pub.source === "listings" ? "Listing medians" : `${pub.name}, operator page`}</span>}
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!compact && (
        <p className="muted small" style={{ marginTop: 10 }}>
          {similar.considered} apartment parcels within {RADIUS} miles in {nearby.towns.join(", ")}. {similar.withUnits} have {COMP_RULES.minUnits}+ units
          {subject.units ? `, ${similar.inSizeBand} are between ${Math.ceil(subject.units / COMP_RULES.maxSizeRatio)} and ${subject.units * COMP_RULES.maxSizeRatio} units` : ""}. Ranked by size
          {subject.type ? ", building era" : ""} and distance; the top {Math.min(6, similar.buildings.length)} are shown.
          {!subject.units && " Add the unit count to match by size."}
          {!subject.type && " Choose a project type to match by building era."}
          {nearby.stale?.length ? ` Older records: ${nearby.stale.join(", ")}.` : ""}
        </p>
      )}
    </>
  );
}

export function BedTable({ market, project }) {
  const mix = normalizeMix(project.unitMix);
  const yours = (beds) => {
    const rows = mix.filter((r) => r.beds === beds && r.rent);
    const units = rows.reduce((n, r) => n + r.count, 0);
    return units ? rows.reduce((s, r) => s + r.rent * r.count, 0) / units : null;
  };
  const hasHud = market.byBed.some((b) => b.hud);
  return (
    <div className="tablewrap">
      <table className="t">
        <thead>
          <tr>
            <th>Type</th>
            <th className="n">Listings median</th>
            {hasHud && <th className="n">HUD FMR</th>}
            <th className="n">Operator pages</th>
            <th className="n">Your rent</th>
          </tr>
        </thead>
        <tbody>
          {market.byBed.map((b) => {
            const range = observedRange(b.observed);
            return (
              <tr key={b.beds}>
                <td className="strong">{bedLabel(b.beds)}</td>
                <td className="n">
                  {b.listings ? money(b.listings.median) : "–"}
                  {b.listings && <span className="sub">{b.listings.n} listings{b.listings.lowSample ? ", low sample" : ""}</span>}
                </td>
                {hasHud && <td className="n">{b.hud ? money(b.hud) : "–"}</td>}
                <td className="n">
                  {range ? (range.min === range.max ? money(range.min) : `${money(range.min)} to ${money(range.max)}`) : "–"}
                  {range && <span className="sub">{range.properties} propert{range.properties === 1 ? "y" : "ies"}</span>}
                </td>
                <td className="n">{money(yours(b.beds))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SupplyList({ market, limit }) {
  const rows = market.supply.projects;
  if (!rows.length) return <p className="muted">No multifamily filings of 10+ units in this town or the towns around it.</p>;
  return (
    <div className="tablewrap">
      <table className="t">
        <thead>
          <tr>
            <th>Project</th>
            <th className="n">Units</th>
            <th>Review stage</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit || rows.length).map((p) => (
            <tr key={p.id}>
              <td className="strong">
                {p.agendaUrl ? (
                  <a href={p.agendaUrl} target="_blank" rel="noreferrer">
                    {p.name}
                  </a>
                ) : (
                  p.name
                )}
                <span className="sub">
                  {p.town}
                  {p.applicant ? ` · ${p.applicant}` : ""}
                </span>
              </td>
              <td className="n">{number(p.units)}</td>
              <td>
                {p.stage}
                <span className="sub">{dateLong(p.sourceDate)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListingFeedNote({ listings }) {
  if (listings)
    return (
      <p className="muted small">
        Medians from {number(listings.usedCount)} active apartment listings pulled {dateLong(listings.pulledAt)}. Asking rents; concessions are not captured.
      </p>
    );
  return (
    <div className="notice quiet">
      Bedroom-level medians and per-building asking rents fill in automatically once the listing feed is connected (one API key, set once; the monthly harvest does the rest). Until then the town index and the dated operator prices below are the reference.
    </div>
  );
}

export function MarketBody({ project, data, market }) {
  const zori = sourceById(data.rents, "zori");
  return (
    <>
      <div className="sect">Town rent index</div>
      <div className="card">
        <IndexTile index={market.index} />
        {market.index && (
          <div className="chips" style={{ marginTop: 12 }}>
            {market.index.all.slice(1).map((x) => (
              <Chip key={x.scope}>
                {x.scope} {money(x.rent)}
              </Chip>
            ))}
            {market.index.metroMultifamily && <Chip>Providence metro, apartments only {money(market.index.metroMultifamily.rent)}</Chip>}
          </div>
        )}
        <p className="muted small" style={{ marginTop: 10 }}>{zori?.attribution} One index per place, all bedroom counts together.</p>
      </div>

      <div className="sect">Asking rents by unit type</div>
      <div className="card">
        <BedTable market={market} project={project} />
        <div style={{ marginTop: 12 }}>
          <ListingFeedNote listings={market.listings} />
          {(data.rents?.notes || []).map((n) => (
            <div className="notice" key={n}>
              {n}
            </div>
          ))}
        </div>
      </div>

      {market.listingBuildings.length > 0 && (
        <>
          <div className="sect">Buildings with active listings</div>
          <div className="card">
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Building</th>
                    <th className="n">Listings</th>
                    {market.byBed.map((b) => (
                      <th className="n" key={b.beds}>{bedLabel(b.beds)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {market.listingBuildings.slice(0, 12).map((b) => (
                    <tr key={b.address + b.zip}>
                      <td className="strong">
                        {b.address}
                        <span className="sub">{b.yearBuilt ? `Built ${b.yearBuilt}` : ""}</span>
                      </td>
                      <td className="n">{b.listings}</td>
                      {market.byBed.map((x) => (
                        <td className="n" key={x.beds}>{b.byBed[x.beds] ? money(b.byBed[x.beds].median) : "–"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="sect">Similar buildings nearby</div>
      <div className="card">
        <SimilarTable market={market} data={data} />
      </div>

      {market.observed.length > 0 && (
        <>
          <div className="sect">
            <span>Operator-published prices</span>
            <Chip>Observed {dateLong(data.observations.observedOn)}</Chip>
          </div>
          <div className="card">
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Plans and starting prices</th>
                  </tr>
                </thead>
                <tbody>
                  {market.observed.map((p) => (
                    <tr key={p.id}>
                      <td className="strong">
                        <a href={p.source} target="_blank" rel="noreferrer">
                          {p.name}
                        </a>
                        <span className="sub">
                          {p.address} · {p.buildingType}
                        </span>
                      </td>
                      <td>
                        {p.plans.filter((x) => x.price).length
                          ? p.plans
                              .filter((x) => x.price)
                              .map((x) => `${bedLabel(x.beds)} ${money(x.price)}${x.status !== "advertised" ? ` (${x.status})` : ""}`)
                              .join(" · ")
                          : p.buildingRange
                            ? `${money(p.buildingRange[0])} to ${money(p.buildingRange[1])} building-wide`
                            : "No price published"}
                        <span className="sub">{p.priceBasis === "monthly-total" ? "Monthly total, fees included" : p.priceBasis === "advertised-rent" ? "Advertised rent, fees not confirmed" : ""}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>{data.observations.note}</p>
          </div>
        </>
      )}

      <div className="sect">
        <span>Market activity: proposed multifamily</span>
        {data.supply?.source?.asOf && <Chip>Agendas through {dateLong(data.supply.source.asOf)}</Chip>}
      </div>
      <div className="card">
        <SupplyList market={market} />
        <p className="muted small" style={{ marginTop: 10 }}>
          From Rhode Island planning and zoning agendas in {project.town} and towns within six miles. Proposed units, not deliveries; most are a year or more from leasing.
        </p>
      </div>
    </>
  );
}

export function MarketDrawer({ project, data, market, onClose }) {
  return (
    <Drawer eyebrow={`${project.town || "Rhode Island"} market`} title="Rents, comparable buildings and market activity" onClose={onClose}>
      <MarketBody project={project} data={data} market={market} />
    </Drawer>
  );
}

/** Compact market context shown beside the unit mix. */
export function MarketPanel({ project, data }) {
  const market = useMarket(project, data);
  const [open, setOpen] = useState(false);
  if (!project.town)
    return (
      <aside className="aside" aria-label="Market">
        <div className="sect">Market</div>
        <p className="muted">Set the property address in step 1 and the local rent index, comparable buildings and market activity appear here.</p>
      </aside>
    );
  return (
    <aside className="aside" aria-label="Market">
      <div className="sect">
        <span>{project.town} market</span>
        <button className="btn small" onClick={() => setOpen(true)}>
          Full view <Icon.arrow size={13} />
        </button>
      </div>
      <div className="card">
        <div className="sect">Rent index</div>
        <IndexTile index={market.index} />
      </div>
      <div className="card">
        <div className="sect">Similar buildings</div>
        <SimilarTable market={market} compact />
      </div>
      <div className="card">
        <div className="sect">
          <span>Market activity nearby</span>
          <span className="mono">{market.supply.projects.length ? `${number(market.supply.units)} units` : ""}</span>
        </div>
        <SupplyList market={market} limit={3} />
        {market.supply.projects.length > 3 && (
          <button className="linkbtn small" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
            {market.supply.projects.length - 3} more
          </button>
        )}
      </div>
      {!market.listings && <p className="muted small">Listing-based rents by unit type are not connected yet. Open the full view for what is available today.</p>}
      {open && <MarketDrawer project={project} data={data} market={market} onClose={() => setOpen(false)} />}
    </aside>
  );
}

/** Market drawer on its own, opened from any step. */
export function MarketOverlay({ project, data, onClose }) {
  const market = useMarket(project, data);
  return <MarketDrawer project={project} data={data} market={market} onClose={onClose} />;
}
