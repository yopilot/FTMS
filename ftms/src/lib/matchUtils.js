// Grouping and filtering helpers for match lists.

export function groupByLeague(matches, favLeagues = [], favTeamIds = new Set()) {
  const groups = new Map();
  matches.forEach((m) => {
    const key = m.league?.id || m.league?.name || 'other';
    if (!groups.has(key)) groups.set(key, { league: m.league, matches: [] });
    groups.get(key).matches.push(m);
  });
  const fav = new Set(favLeagues);
  const list = [...groups.values()];
  list.forEach((g) => {
    g.hasFavTeam = g.matches.some((m) => favTeamIds.has(m.home?.id) || favTeamIds.has(m.away?.id));
    g.isFav = Boolean(g.league?.slug && fav.has(g.league.slug));
    g.live = g.matches.filter((m) => m.status.isLive).length;
  });
  list.sort((a, b) => {
    const fa = a.isFav ? 0 : 1;
    const fb = b.isFav ? 0 : 1;
    if (fa !== fb) return fa - fb;
    const pa = a.league?.p ?? 500;
    const pb = b.league?.p ?? 500;
    if (pa !== pb) return pa - pb;
    return (a.league?.name || '').localeCompare(b.league?.name || '');
  });
  return list;
}

export function matchesTeam(m, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    m.home?.name?.toLowerCase().includes(s) ||
    m.away?.name?.toLowerCase().includes(s) ||
    m.league?.name?.toLowerCase().includes(s) ||
    m.league?.country?.toLowerCase().includes(s)
  );
}

export function isTopLeague(league, favLeagues = []) {
  return Boolean(league?.top || (league?.slug && favLeagues.includes(league.slug)));
}

/** Result letter for a team in a finished match. */
export function resultFor(m, teamId) {
  if (m.status.state !== 'post' || m.home.score == null) return null;
  const isHome = m.home.id === String(teamId);
  const us = isHome ? m.home : m.away;
  const them = isHome ? m.away : m.home;
  if (us.winner) return 'W';
  if (them.winner) return 'L';
  if (us.score > them.score) return 'W';
  if (us.score < them.score) return 'L';
  return 'D';
}
