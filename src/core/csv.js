import { bedsFromLabel } from "./model.js";

/** Parse a unit schedule CSV: label,count,sqft,rent,leased,availableDate (header order free). */
export function parseUnitCSV(text) {
  if (text.length > 500000) throw new Error("Use a unit schedule smaller than 500 KB.");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else if (c !== "\r") cell += c;
  }
  if (quoted) throw new Error("The CSV has an unclosed quote.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() || []).map((h) => h.replace(/^﻿/, "").toLowerCase().replace(/[^a-z]/g, ""));
  const need = ["label", "count", "rent"];
  const missing = need.filter((h) => !headers.includes(h));
  if (missing.length) throw new Error(`CSV needs these columns: label, count, rent (optional: sqft, leased, availableDate). Missing: ${missing.join(", ")}.`);
  const data = rows.filter((r) => r.some(Boolean));
  if (!data.length || data.length > 200) throw new Error("Import between 1 and 200 rows.");
  const col = (r, name) => (headers.includes(name) ? r[headers.indexOf(name)] || "" : "");
  return data.map((r, i) => {
    if (r.length !== headers.length) throw new Error(`Row ${i + 2} has a different number of columns than the header.`);
    const label = col(r, "label");
    const beds = bedsFromLabel(label);
    return {
      label,
      beds: beds === null ? "" : beds,
      count: col(r, "count").replace(/,/g, ""),
      sqft: col(r, "sqft").replace(/,/g, ""),
      rent: col(r, "rent").replace(/[$,]/g, ""),
      leased: col(r, "leased") || "0",
      availableDate: col(r, "availabledate"),
    };
  });
}

export const CSV_TEMPLATE = "label,count,sqft,rent,leased,availableDate\nStudio,20,520,1900,0,\n1 bedroom,50,700,2300,0,\n2 bedroom,30,1050,3100,0,\n";
