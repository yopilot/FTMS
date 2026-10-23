// Ratings engine.
// ESPN publishes raw stats, not player ratings. These functions turn those stats
// into two numbers the UI can show:
//   - matchRating(): a 3.0–10.0 score for one match (like the ratings in most score apps)
//   - seasonOvr():   a 45–94 "overall" for a player this season, used in squads and the manager hub
// Both are estimates computed in the browser, and the UI labels them that way.

import { clamp, toNumber } from './format';

/* ---------- Positions ---------- */

const DEF_CODES = new Set(['D', 'CB', 'CD', 'CD-L', 'CD-R', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'WB', 'DF']);
const MID_CODES = new Set(['M', 'DM', 'CDM', 'CM', 'CM-L', 'CM-R', 'AM', 'AM-L', 'AM-R', 'CAM', 'LM', 'RM', 'MF']);
const FWD_CODES = new Set(['F', 'FW', 'FWD', 'CF', 'CF-L', 'CF-R', 'ST', 'LW', 'RW', 'LF', 'RF', 'SS', 'S']);

/** Map any ESPN/free-text position to one of GK, DEF, MID, FWD. */
export function positionGroup(pos) {
  if (!pos) return 'MID';
  const p = String(pos).toUpperCase().trim();
  if (p === 'G' || p === 'GK' || p.startsWith('GOAL')) return 'GK';
  if (DEF_CODES.has(p) || p.startsWith('DEF')) return 'DEF';
  if (MID_CODES.has(p) || p.startsWith('MID')) return 'MID';
  if (FWD_CODES.has(p) || p.startsWith('FOR') || p.startsWith('ATT') || p.startsWith('STR')) return 'FWD';
  return 'MID';
}

export const POSITION_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
export const POSITION_LABEL = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };
export const POSITION_PLURAL = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };

/* ---------- Colour classes ---------- */

export function ratingClass(r) {
  const n = Number(r);
  if (!Number.isFinite(n)) return '';
  if (n >= 8.5) return 'rt-elite';
  if (n >= 7.5) return 'rt-great';
  if (n >= 6.8) return 'rt-good';
  if (n >= 6.0) return 'rt-avg';
  return 'rt-poor';
}

export function tierClass(ovr) {
  const n = Number(ovr);
  if (n >= 75) return 'tier-gold';
  if (n >= 65) return 'tier-silver';
  return 'tier-bronze';
}

/* ---------- Stats helpers ---------- */

/** Flatten ESPN stat arrays (or nested categories) into { name: number }. */
export function statsMap(stats) {
  const out = {};
  const walk = (arr) => {
    (arr || []).forEach((s) => {
      if (!s) return;
      if (Array.isArray(s.stats)) walk(s.stats);
      else if (s.name) out[s.name] = toNumber(s.value ?? s.displayValue, 0);
    });
  };
  if (Array.isArray(stats)) walk(stats);
  else if (stats?.splits?.categories) walk(stats.splits.categories);
  else if (Array.isArray(stats?.categories)) walk(stats.categories);
  return out;
}

/* ---------- Match rating ---------- */

const GOAL_WEIGHT = { GK: 1.2, DEF: 1.15, MID: 1.0, FWD: 0.9 };

/**
 * @param {object} s     flattened match stats for the player
 * @param {object} ctx   { pos, starter, subbedIn, subbedOut, goalsFor, goalsAgainst, state }
 * @returns {number|null}
 */
export function matchRating(s, ctx) {
  const played = ctx.starter || ctx.subbedIn;
  if (!played) return null;

  const pos = ctx.pos || 'MID';
  const sub = !ctx.starter;
  let r = sub ? 6.2 : 6.3;

  const goals = toNumber(s.totalGoals);
  const assists = toNumber(s.goalAssists);
  const sot = toNumber(s.shotsOnTarget);
  const shots = toNumber(s.totalShots);

  r += goals * (GOAL_WEIGHT[pos] ?? 1);
  r += assists * 0.65;
  r += Math.max(0, sot - goals) * 0.12;
  r -= Math.min(6, Math.max(0, shots - sot)) * 0.04;

  if (pos === 'GK') {
    r += toNumber(s.saves) * 0.28;
    r -= toNumber(s.goalsConceded ?? ctx.goalsAgainst) * 0.35;
  }

  const ga = toNumber(ctx.goalsAgainst);
  if ((pos === 'GK' || pos === 'DEF') && ctx.starter) {
    if (ga === 0 && ctx.state === 'post') r += pos === 'GK' ? 0.6 : 0.4;
    if (pos === 'DEF') r -= ga * 0.15;
  }

  r -= toNumber(s.yellowCards) * 0.35;
  r -= toNumber(s.redCards) * 1.5;
  r -= toNumber(s.ownGoals) * 1.2;
  r -= Math.min(5, toNumber(s.foulsCommitted)) * 0.06;
  r += Math.min(6, toNumber(s.foulsSuffered)) * 0.05;
  r -= Math.min(4, toNumber(s.offsides)) * 0.05;

  const gf = toNumber(ctx.goalsFor);
  if (ctx.state === 'post') {
    const swing = gf > ga ? 0.25 : gf < ga ? -0.2 : 0;
    r += sub ? swing / 2 : swing;
  }

  return Math.round(clamp(r, 3, 10) * 10) / 10;
}

/* ---------- Season overall ---------- */

/** Rough relative strength of a competition (1 = strongest). */
const LEAGUE_STRENGTH = {
  'eng.1': 1,
  'esp.1': 0.97,
  'ger.1': 0.95,
  'ita.1': 0.95,
  'fra.1': 0.92,
  'por.1': 0.86,
  'ned.1': 0.86,
  'bra.1': 0.85,
  'eng.2': 0.84,
  'bel.1': 0.83,
  'tur.1': 0.83,
  'arg.1': 0.83,
  'usa.1': 0.82,
  'mex.1': 0.82,
  'ksa.1': 0.82,
  'sco.1': 0.8,
  'esp.2': 0.8,
  'ger.2': 0.8,
  'ita.2': 0.79,
  'fra.2': 0.78,
  'aut.1': 0.79,
  'sui.1': 0.78,
  'den.1': 0.78,
  'gre.1': 0.78,
  'jpn.1': 0.78,
};

export function leagueStrength(slug) {
  if (!slug) return 0.8;
  if (LEAGUE_STRENGTH[slug] != null) return LEAGUE_STRENGTH[slug];
  if (/^uefa\.|^fifa\./.test(slug)) return 0.95;
  return 0.76;
}

/**
 * @param {object} s     flattened season stats
 * @param {object} ctx   { pos, age, league, teamStrength (0..1), teamGames }
 * @returns {{ ovr: number, lowData: boolean }}
 */
export function seasonOvr(s, ctx) {
  const pos = ctx.pos || 'MID';
  const ls = leagueStrength(ctx.league);
  const team = Number.isFinite(ctx.teamStrength) ? ctx.teamStrength : 0.5;

  const apps = toNumber(s.appearances);
  const subIns = toNumber(s.subIns);
  const starts = Math.max(0, toNumber(s.starts, apps - subIns));
  const teamGames = Math.max(toNumber(ctx.teamGames, 0), apps, 1);

  let r = 56 + 14 * ls;
  r += (team - 0.5) * 12;

  if (apps === 0) {
    r -= 6;
    return { ovr: Math.round(clamp(r + ageAdjust(ctx.age), 45, 88)), lowData: true };
  }

  const startShare = clamp(starts / teamGames, 0, 1);
  r += (startShare - 0.5) * 12;

  const sample = Math.min(apps / 6, 1);
  const goals = toNumber(s.totalGoals);
  const assists = toNumber(s.goalAssists);
  const shots = toNumber(s.totalShots);
  const sot = toNumber(s.shotsOnTarget);

  let output;
  if (pos === 'FWD') output = Math.min(((goals + assists * 0.7) / apps) * 14, 10);
  else if (pos === 'MID') output = Math.min(((goals + assists * 0.9) / apps) * 16, 9);
  else if (pos === 'DEF') output = Math.min(((goals + assists) / apps) * 18, 5) + (team - 0.5) * 6;
  else {
    const savesPer = toNumber(s.saves) / apps;
    const concededPer = toNumber(s.goalsConceded) / apps;
    output = Math.min(savesPer * 1.2, 5) - clamp((concededPer - 1.2) * 3, -4, 4) + (team - 0.5) * 6;
  }

  if ((pos === 'FWD' || pos === 'MID') && shots >= 5) {
    output += clamp((sot / shots - 0.35) * 6, -2, 2);
  }

  r += output * sample;
  r -= Math.min(4, toNumber(s.yellowCards) * 0.3 + toNumber(s.redCards) * 1.5);
  r += ageAdjust(ctx.age);

  return { ovr: Math.round(clamp(r, 45, 94)), lowData: apps < 3 };
}

function ageAdjust(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a <= 0) return 0;
  if (a < 20) return -3;
  if (a < 23) return -1;
  if (a <= 30) return 0;
  if (a <= 33) return -1;
  return -3;
}

/** Team strength 0..1 from a league table position. */
export function strengthFromRank(rank, size) {
  const r = Number(rank);
  const n = Number(size);
  if (!Number.isFinite(r) || !Number.isFinite(n) || n < 2) return 0.5;
  return clamp(1 - (r - 1) / (n - 1), 0, 1);
}

/* ---------- Local (custom club) players ---------- */

export const ATTRIBUTES = [
  { key: 'pac', label: 'Pace', short: 'PAC' },
  { key: 'sho', label: 'Shooting', short: 'SHO' },
  { key: 'pas', label: 'Passing', short: 'PAS' },
  { key: 'dri', label: 'Dribbling', short: 'DRI' },
  { key: 'def', label: 'Defending', short: 'DEF' },
  { key: 'phy', label: 'Physical', short: 'PHY' },
];

const ATTR_WEIGHTS = {
  GK: { pac: 0.05, sho: 0, pas: 0.2, dri: 0.05, def: 0.45, phy: 0.25 },
  DEF: { pac: 0.15, sho: 0, pas: 0.1, dri: 0.05, def: 0.5, phy: 0.2 },
  MID: { pac: 0.1, sho: 0.15, pas: 0.35, dri: 0.25, def: 0.1, phy: 0.05 },
  FWD: { pac: 0.2, sho: 0.35, pas: 0.1, dri: 0.25, def: 0, phy: 0.1 },
};

/** Position-weighted overall from six 0–99 attributes. */
export function attrOvr(ratings, pos) {
  if (!ratings) return 50;
  const w = ATTR_WEIGHTS[positionGroup(pos)] || ATTR_WEIGHTS.MID;
  let total = 0;
  Object.entries(w).forEach(([k, weight]) => {
    total += clamp(toNumber(ratings[k], 50), 1, 99) * weight;
  });
  return Math.round(total);
}
