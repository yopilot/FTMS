// Current head coaches from Wikidata (CC0, community maintained and usually
// updated within hours of an appointment). ESPN's own coach field is stale,
// so this is the source of truth for managers across the app.

import { readCache, writeCache } from '../lib/storage';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const TTL = 3 * 24 * 60 * 60 * 1000; // 3 days

// Football club / team classes on Wikidata
const TEAM_TYPES = [
  'wd:Q476028', // association football club
  'wd:Q103229495', // men's association football team
  'wd:Q6979593', // national association football team
  'wd:Q135408445', // men's national association football team
  'wd:Q20639856', // professional sports team
  'wd:Q847017', // sports club
].join(' ');

/* A tiny queue: the Wikidata Query Service allows a handful of parallel queries per client. */
const MAX_PARALLEL = 3;
let active = 0;
const waiting = [];

function schedule(task) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      active += 1;
      try {
        resolve(await task());
      } catch (e) {
        reject(e);
      } finally {
        active -= 1;
        const next = waiting.shift();
        if (next) next();
      }
    };
    if (active < MAX_PARALLEL) run();
    else waiting.push(run);
  });
}

async function sparql(query, signal) {
  return schedule(async () => {
    const res = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/sparql-results+json' },
      signal,
    });
    if (!res.ok) throw new Error(`Wikidata ${res.status}`);
    const json = await res.json();
    return json?.results?.bindings || [];
  });
}

const esc = (s) => String(s).replace(/["\\]/g, ' ').trim();

function commonsThumb(url, width = 320) {
  if (!url) return null;
  return `${url.replace(/^http:/, 'https:')}?width=${width}`;
}

function pickRow(rows) {
  if (!rows.length) return null;
  // Rows arrive ordered by search rank; within the best-ranked club prefer the latest appointment.
  const bestItem = rows[0].item?.value;
  const sameClub = rows.filter((r) => r.item?.value === bestItem);
  sameClub.sort((a, b) => new Date(b.start?.value || 0) - new Date(a.start?.value || 0));
  const r = sameClub[0];
  return {
    name: r.coachLabel?.value || '',
    wikidata: r.coach?.value?.split('/').pop() || null,
    since: r.start?.value || null,
    image: commonsThumb(r.img?.value),
    club: r.itemLabel?.value || '',
  };
}

const COACH_FIELDS = `
  ?item p:P286 ?st . ?st ps:P286 ?coach .
  FILTER NOT EXISTS { ?st pq:P582 ?end }
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?coach wdt:P18 ?img }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }`;

async function byEspnId(espnId, signal) {
  const q = `SELECT ?item ?itemLabel ?coach ?coachLabel ?start ?img WHERE {
    ?item wdt:P13590 "${esc(espnId)}" . ${COACH_FIELDS}
  } LIMIT 5`;
  return pickRow(await sparql(q, signal));
}

async function byName(name, signal) {
  const q = `SELECT ?item ?itemLabel ?coach ?coachLabel ?start ?img ?num WHERE {
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
        mwapi:search "${esc(name)}"; mwapi:language "en"; mwapi:limit "12" .
      ?item wikibase:apiOutputItem mwapi:item . ?num wikibase:apiOrdinal true .
    }
    VALUES ?type { ${TEAM_TYPES} }
    ?item wdt:P31 ?type . ${COACH_FIELDS}
  } ORDER BY ?num DESC(?start) LIMIT 8`;
  return pickRow(await sparql(q, signal));
}

/**
 * Current manager for an ESPN team.
 * @param {{ id: string, name: string, isNational?: boolean, women?: boolean }} team
 * @returns {Promise<{name, wikidata, since, image, club} | null>}
 */
export async function fetchManager(team, { signal } = {}) {
  if (!team?.id || !team?.name) return null;
  const key = `mgr.${team.id}`;
  const cached = readCache(key, TTL);
  if (cached !== undefined) return cached;

  let result;
  try {
    result = await byEspnId(team.id, signal);
    if (!result && !team.women) {
      const query = team.isNational ? `${team.name} national football team` : team.name;
      result = await byName(query, signal);
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return null; // don't cache failures
  }
  writeCache(key, result);
  return result;
}
