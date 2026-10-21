const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const money = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "–" : usd0.format(v));
export const number = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "–" : int.format(v));

/** $1,288,920 -> $1.29M, $814,620 -> $815K. For tiles where space is tight. */
export function moneyShort(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e4) return `${sign}$${Math.round(a / 1e3)}K`;
  return usd0.format(v);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** '2027-09-22' -> 'Sep 22, 2027' */
export function dateLong(iso) {
  if (!iso) return "–";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** '2026-08' or '2026-08-31' -> 'Aug 2026' */
export function monthLabel(iso) {
  if (!iso) return "–";
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function duration(days) {
  if (days === null || days === undefined) return "–";
  const months = days / 30.4375;
  if (months < 1.5) return `${Math.round(days)} days`;
  return `${months.toFixed(months < 10 ? 1 : 0)} months`;
}


export function bedLabel(beds) {
  if (beds === null || beds === undefined || beds === "") return "Other";
  return Number(beds) === 0 ? "Studio" : `${beds} BR`;
}

export function relativeDay(iso) {
  if (!iso) return "";
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return dateLong(iso.slice(0, 10));
}

/** Today's date in the user's time zone, as YYYY-MM-DD. */
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
