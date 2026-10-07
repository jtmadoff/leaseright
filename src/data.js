import { useEffect, useState } from "react";

const FILES = { rents: "rents.json", supply: "supply.json", observations: "operator_observations.json" };

/** Harvested market data, published by tools/build_data.py into public/data/. */
export function useMarketData() {
  const [data, setData] = useState({ rents: null, supply: null, observations: null, status: "loading" });
  useEffect(() => {
    let off = false;
    Promise.all(
      Object.entries(FILES).map(([key, file]) =>
        fetch(`${import.meta.env.BASE_URL}data/${file}`, { cache: "no-cache" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
          .then((json) => [key, json]),
      ),
    ).then((entries) => {
      if (off) return;
      const next = Object.fromEntries(entries);
      setData({ ...next, status: next.rents ? "ready" : "missing" });
    });
    return () => {
      off = true;
    };
  }, []);
  return data;
}
