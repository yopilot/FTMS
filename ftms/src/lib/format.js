// Formatting helpers. All times are shown in the viewer's local time zone.

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const longDayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const shortDateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const fullDateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

export const formatTime = (d) => (d ? timeFmt.format(new Date(d)) : '');
export const formatDay = (d) => (d ? dayFmt.format(new Date(d)) : '');
export const formatLongDay = (d) => (d ? longDayFmt.format(new Date(d)) : '');
export const formatShortDate = (d) => (d ? shortDateFmt.format(new Date(d)) : '');
export const formatFullDate = (d) => (d ? fullDateFmt.format(new Date(d)) : '');
export const formatWeekday = (d) => (d ? weekdayFmt.format(new Date(d)) : '');

export function isSameLocalDay(a, b) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/** "Today", "Tomorrow", "Yesterday" or a short day label. */
export function relativeDayLabel(d) {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.round((startOfDay(date) - startOfDay(today)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return formatDay(date);
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** "3m ago", "2h ago", "Mon 12 Oct" */
export function timeAgo(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 45) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 86400 * 6) return `${Math.round(diff / 86400)}d ago`;
  return formatShortDate(d);
}

/** Countdown such as "2d 4h", "3h 12m", "8m" */
export function countdown(d) {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return 'now';
  const m = Math.floor(ms / 60000);
  const days = Math.floor(m / 1440);
  const hours = Math.floor((m % 1440) / 60);
  const mins = m % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function ordinal(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const m = v % 100;
  return v + (s[(m - 20) % 10] || s[m] || s[0]);
}

export function initials(name = '') {
  return String(name)
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function pluralize(n, word, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`;
}

export function inchesToCm(inches) {
  const n = Number(inches);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 2.54) : null;
}

export function lbsToKg(lbs) {
  const n = Number(lbs);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 0.4536) : null;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
