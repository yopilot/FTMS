import { POSITION_ORDER, seasonOvr, strengthFromRank } from './ratings';

/** Find a team's row in standings groups. */
export function findStanding(standings, teamId) {
  for (const g of standings?.groups || []) {
    const e = g.entries.find((x) => x.team.id === String(teamId));
    if (e) return { entry: e, size: g.entries.length, group: g };
  }
  return null;
}

/**
 * Adds `ovr` / `lowData` to every roster player using season stats and the
 * team's league position.
 */
export function rateSquad(roster, { slug, standings, teamId, teamGames }) {
  const st = findStanding(standings, teamId);
  const teamStrength = st ? strengthFromRank(st.entry.rank, st.size) : 0.5;
  const games = teamGames || st?.entry.gp || 0;
  return (roster || []).map((p) => {
    const { ovr, lowData } = seasonOvr(p.stats, { pos: p.pos, age: p.age, league: slug, teamStrength, teamGames: games });
    return { ...p, ovr, lowData };
  });
}

export function sortSquad(players) {
  return [...players].sort((a, b) => POSITION_ORDER[a.pos] - POSITION_ORDER[b.pos] || (b.ovr || 0) - (a.ovr || 0));
}

export function groupSquad(players) {
  const groups = { GK: [], DEF: [], MID: [], FWD: [] };
  players.forEach((p) => (groups[p.pos] || groups.MID).push(p));
  Object.values(groups).forEach((g) => g.sort((a, b) => (b.ovr || 0) - (a.ovr || 0)));
  return groups;
}
