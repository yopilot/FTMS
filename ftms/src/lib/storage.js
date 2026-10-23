// Safe localStorage helpers. Private windows or blocked storage must never crash the app.

const PREFIX = 'ftms.';

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** All app keys (without prefix) — used by backup/export. */
export function listKeys() {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
    }
    return keys;
  } catch {
    return [];
  }
}

/** Cached value with expiry. */
export function readCache(key, maxAgeMs) {
  const entry = readJSON(`cache.${key}`, null);
  if (!entry || typeof entry !== 'object') return undefined;
  if (Date.now() - entry.t > maxAgeMs) return undefined;
  return entry.v;
}

export function writeCache(key, value) {
  writeJSON(`cache.${key}`, { t: Date.now(), v: value });
}

export function clearCaches() {
  listKeys()
    .filter((k) => k.startsWith('cache.'))
    .forEach((k) => removeKey(k));
}
