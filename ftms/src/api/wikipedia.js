// Photos and short bios from Wikipedia's REST summary API (CORS enabled).
// Names are ambiguous, so a result only counts when Wikipedia describes the
// page as a footballer / football manager.

import { readCache, writeCache } from '../lib/storage';

const TTL = 7 * 24 * 60 * 60 * 1000;
const FOOTBALL = /football|soccer|futbol|goalkeeper/i;

async function summary(title, signal) {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}?redirect=true`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * @param {string} name  person's display name
 * @param {'player'|'manager'} kind
 */
export async function fetchPersonSummary(name, kind = 'player', { signal } = {}) {
  if (!name) return null;
  const key = `wp.${kind}.${name.toLowerCase()}`;
  const cached = readCache(key, TTL);
  if (cached !== undefined) return cached;

  const candidates = kind === 'manager' ? [name, `${name} (football manager)`, `${name} (footballer)`] : [name, `${name} (footballer)`, `${name} (soccer)`];

  let result = null;
  try {
    for (const title of candidates) {
      const s = await summary(title, signal);
      if (s && s.type === 'standard' && FOOTBALL.test(s.description || '')) {
        result = {
          title: s.title,
          description: s.description || '',
          extract: s.extract || '',
          image: s.thumbnail?.source || null,
          url: s.content_urls?.desktop?.page || null,
        };
        break;
      }
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return null;
  }
  writeCache(key, result);
  return result;
}
