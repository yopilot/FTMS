// ESPN groups scoreboards by US Eastern date. Viewers can be anywhere, so a
// local day can span two ESPN dates. These helpers map one onto the other.

const etFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYYMMDD in US Eastern time for an instant. */
export function etDateKey(instant) {
  return etFmt.format(new Date(instant)).replaceAll('-', '');
}

/** YYYYMMDD for a local calendar date. */
export function localDateKey(d = new Date()) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** Parse a local YYYYMMDD key into a Date at local midnight. */
export function parseLocalKey(key) {
  if (!/^\d{8}$/.test(key || '')) return null;
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(4, 6)) - 1;
  const d = Number(key.slice(6, 8));
  const date = new Date(y, m, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** The ESPN date keys needed to cover one local day. */
export function etKeysForLocalDay(localKey) {
  const start = parseLocalKey(localKey) || new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  const keys = new Set([etDateKey(start), etDateKey(end)]);
  return [...keys];
}

/** Is an instant inside the given local day? */
export function inLocalDay(instant, localKey) {
  return localDateKey(new Date(instant)) === localKey;
}

export const todayKey = () => localDateKey(new Date());
