// ESPN public soccer API: endpoints + normalisers.
// The raw payloads are large and inconsistent between endpoints, so every
// response is mapped into small, predictable objects before it reaches the UI.

import { getJSON } from './http';
import { leagueById, leagueBySlug, nameFromSeasonSlug } from './leagues';
import { inchesToCm, lbsToKg, toNumber } from '../lib/format';
import { matchRating, positionGroup, statsMap } from '../lib/ratings';

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const SITE_V2 = 'https://site.api.espn.com/apis/v2/sports/soccer';
const WEB = 'https://site.web.api.espn.com/apis';
const CORE = 'https://sports.core.api.espn.com/v2/sports/soccer';

/* ---------- Images ---------- */

/** Resize any ESPN CDN image through their image combiner. */
export function espnImage(url, w, h) {
  if (!url) return null;
  try {
    const u = new URL(url.replace(/^http:/, 'https:'));
    if (!u.hostname.endsWith('espncdn.com')) return url;
    if (u.pathname.startsWith('/combiner/')) return u.toString();
    const params = new URLSearchParams({ img: u.pathname, w: String(w) });
    if (h) params.set('h', String(h));
    return `https://a.espncdn.com/combiner/i?${params.toString()}`;
  } catch {
    return url;
  }
}

export const teamLogo = (id, dark = false) =>
  id ? `https://a.espncdn.com/i/teamlogos/soccer/${dark ? '500-dark' : '500'}/${id}.png` : null;

function pickLogo(logos, fallbackId) {
  if (Array.isArray(logos) && logos.length) {
    const def = logos.find((l) => l.rel?.includes('default')) || logos[0];
    const dark = logos.find((l) => l.rel?.includes('dark'));
    return { logo: def?.href || teamLogo(fallbackId), logoDark: dark?.href || null };
  }
  return { logo: teamLogo(fallbackId), logoDark: null };
}

/* ---------- Leagues ---------- */

function leagueFromUid(uid) {
  const m = /~l:(\d+)/.exec(uid || '');
  return m ? m[1] : null;
}

function resolveLeague({ id, slug, name, abbreviation, seasonSlug, logos }) {
  const known = (slug && leagueBySlug(slug)) || (id && leagueById(id));
  if (known) return known;
  const logo = Array.isArray(logos) ? logos[0]?.href : null;
  return {
    slug: slug || null,
    id: id ? String(id) : `x-${seasonSlug || name || 'other'}`,
    name: name || nameFromSeasonSlug(seasonSlug),
    short: abbreviation || name || nameFromSeasonSlug(seasonSlug),
    region: 'Other',
    country: '',
    p: 500,
    logo: logo || null,
    logoDark: null,
    top: false,
  };
}

/* ---------- Status ---------- */

const FINISHED_LABEL = {
  STATUS_FULL_TIME: 'FT',
  STATUS_FINAL: 'FT',
  STATUS_FINAL_AET: 'AET',
  STATUS_FINAL_PEN: 'Pens',
  STATUS_FINAL_AGT: 'AGT',
  STATUS_ABANDONED: 'Abd',
  STATUS_CANCELED: 'Canc',
  STATUS_POSTPONED: 'PPD',
  STATUS_FORFEIT: 'FF',
};

export function normalizeStatus(status) {
  const t = status?.type || {};
  const name = t.name || '';
  const state = t.state || 'pre';
  const isHalftime = name === 'STATUS_HALFTIME';
  const isPostponed = name === 'STATUS_POSTPONED';
  const isCancelled = name === 'STATUS_CANCELED' || name === 'STATUS_ABANDONED';
  let label;
  if (state === 'in') {
    if (isHalftime) label = 'HT';
    else if (name === 'STATUS_SHOOTOUT') label = 'Pens';
    else if (name === 'STATUS_END_OF_REGULATION' || name === 'STATUS_END_OF_EXTRATIME') label = 'Break';
    else label = status?.displayClock || t.shortDetail || 'Live';
  } else if (state === 'post') {
    label = FINISHED_LABEL[name] || t.shortDetail || 'FT';
  } else {
    label = isPostponed ? 'PPD' : isCancelled ? 'Canc' : null;
  }
  return {
    state: isPostponed || isCancelled ? 'post' : state,
    name,
    label,
    detail: t.detail || t.description || '',
    clock: status?.displayClock || '',
    period: status?.period || 0,
    completed: Boolean(t.completed),
    isHalftime,
    isPostponed,
    isCancelled,
    isLive: state === 'in',
  };
}

/* ---------- Teams inside events ---------- */

function scoreValue(score) {
  if (score == null) return null;
  if (typeof score === 'object') return score.displayValue != null ? toNumber(score.displayValue, null) : toNumber(score.value, null);
  if (score === '') return null;
  return toNumber(score, null);
}

function normalizeCompetitor(c) {
  if (!c) return null;
  const t = c.team || {};
  const { logo, logoDark } = pickLogo(t.logos, t.id);
  const records = Array.isArray(c.records) ? c.records : Array.isArray(c.record) ? c.record : [];
  return {
    id: String(t.id || c.id || ''),
    name: t.displayName || t.name || 'TBD',
    short: t.shortDisplayName || t.displayName || t.name || 'TBD',
    abbr: t.abbreviation || '',
    logo: t.logo || logo,
    logoDark,
    color: t.color || null,
    altColor: t.alternateColor || null,
    score: scoreValue(c.score),
    shootout: c.shootoutScore != null ? toNumber(c.shootoutScore, null) : null,
    winner: Boolean(c.winner),
    form: c.form || '',
    record: records.find((r) => r.type === 'total')?.summary || records[0]?.summary || '',
    isNational: Boolean(t.isNational),
  };
}

/* ---------- Matches ---------- */

export function normalizeEvent(ev, leagueHint) {
  const comp = ev?.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
  const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];

  // altGameNote looks like "Women's FA Cup, First Round": competition, then stage.
  const [altLeague = '', ...altStage] = String(comp.altGameNote || '').split(',');

  const league =
    leagueHint ||
    resolveLeague({
      id: ev?.league?.id || leagueFromUid(ev?.uid),
      slug: ev?.league?.slug,
      name: ev?.league?.name || altLeague.trim() || undefined,
      abbreviation: ev?.league?.abbreviation,
      seasonSlug: ev?.season?.slug,
      logos: ev?.league?.logos,
    });

  const status = normalizeStatus(comp.status || ev?.status);
  const notes = (comp.notes || []).map((n) => n.headline).filter(Boolean);
  if (!notes.length && altStage.length) notes.push(altStage.join(',').trim());

  return {
    id: String(ev?.id || comp.id),
    date: comp.date || ev?.date,
    name: ev?.name || '',
    league,
    status,
    home: normalizeCompetitor(home),
    away: normalizeCompetitor(away),
    venue: comp.venue?.fullName || '',
    city: comp.venue?.address?.city || '',
    broadcast: (comp.broadcasts || []).flatMap((b) => b.names || []).join(', '),
    note: notes[0] || '',
  };
}

function sortEvents(a, b) {
  return new Date(a.date) - new Date(b.date) || a.home.name.localeCompare(b.home.name);
}

/* ---------- Scoreboards ---------- */

/** Every match ESPN has for one US-Eastern date, across all competitions. */
export async function fetchAllScoreboard(etKey, { signal } = {}) {
  const data = await getJSON(`${SITE}/all/scoreboard?dates=${etKey}&limit=900`, { signal, timeout: 20000 });
  return (data.events || []).map((ev) => normalizeEvent(ev)).sort(sortEvents);
}

/** One competition's scoreboard (optionally for a date). Also returns the league calendar. */
export async function fetchLeagueScoreboard(slug, dateKey, { signal } = {}) {
  const q = dateKey ? `?dates=${dateKey}` : '';
  const data = await getJSON(`${SITE}/${slug}/scoreboard${q}`, { signal });
  const raw = data.leagues?.[0] || {};
  const league = resolveLeague({ id: raw.id, slug, name: raw.name, abbreviation: raw.abbreviation, logos: raw.logos });
  return {
    league: { ...league, season: raw.season?.displayName || '' },
    calendar: Array.isArray(raw.calendar) ? raw.calendar.map((d) => (typeof d === 'string' ? d : d?.startDate)).filter(Boolean) : [],
    matches: (data.events || []).map((ev) => normalizeEvent(ev, league)).sort(sortEvents),
  };
}

/* ---------- Match summary ---------- */

const STAT_DEFS = [
  { key: 'possessionPct', label: 'Possession', unit: '%' },
  { key: 'totalShots', label: 'Shots' },
  { key: 'shotsOnTarget', label: 'Shots on target' },
  { key: 'blockedShots', label: 'Blocked shots' },
  { key: 'wonCorners', label: 'Corners' },
  { key: 'accuratePasses', label: 'Accurate passes' },
  { key: 'passPct', label: 'Pass accuracy', unit: '%', pct: true },
  { key: 'accurateCrosses', label: 'Accurate crosses' },
  { key: 'totalLongBalls', label: 'Long balls' },
  { key: 'totalTackles', label: 'Tackles' },
  { key: 'interceptions', label: 'Interceptions' },
  { key: 'effectiveClearance', label: 'Clearances' },
  { key: 'saves', label: 'Saves' },
  { key: 'foulsCommitted', label: 'Fouls' },
  { key: 'offsides', label: 'Offsides' },
  { key: 'yellowCards', label: 'Yellow cards' },
  { key: 'redCards', label: 'Red cards' },
];

function boxStats(boxscore, homeId) {
  const teams = boxscore?.teams || [];
  if (teams.length < 2) return [];
  const homeT = teams.find((t) => String(t.team?.id) === homeId) || teams[0];
  const awayT = teams.find((t) => t !== homeT) || teams[1];
  const toMap = (t) => {
    const m = {};
    (t.statistics || []).forEach((s) => {
      m[s.name] = s.displayValue;
    });
    return m;
  };
  const h = toMap(homeT);
  const a = toMap(awayT);
  return STAT_DEFS.filter((d) => h[d.key] != null && a[d.key] != null)
    .map((d) => {
      let hv = toNumber(h[d.key], 0);
      let av = toNumber(a[d.key], 0);
      if (d.pct && hv <= 1 && av <= 1) {
        hv = Math.round(hv * 100);
        av = Math.round(av * 100);
      }
      return { ...d, home: hv, away: av };
    })
    .filter((d) => d.home + d.away > 0 || d.key === 'possessionPct');
}

const EVENT_KIND = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('own-goal') || t === 'own goal') return 'own-goal';
  if (t.startsWith('goal') || t === 'penalty---scored' || t === 'penalty-scored') return 'goal';
  if (t.includes('penalty') && t.includes('miss')) return 'pen-miss';
  if (t.includes('penalty') && t.includes('save')) return 'pen-miss';
  if (t === 'yellow-card') return 'yellow';
  if (t === 'red-card' || t === 'second-yellow-card' || t.includes('red')) return 'red';
  if (t === 'substitution') return 'sub';
  if (t === 'halftime') return 'ht';
  if (t.includes('var')) return 'var';
  return null;
};

function normalizeKeyEvents(keyEvents, home, away) {
  const sideOf = (team) => {
    if (!team) return null;
    const id = team.id != null ? String(team.id) : null;
    if (id && id === home?.id) return 'home';
    if (id && id === away?.id) return 'away';
    if (team.displayName === home?.name) return 'home';
    if (team.displayName === away?.name) return 'away';
    return null;
  };
  return (keyEvents || [])
    .map((k) => {
      const kind = EVENT_KIND(k.type?.type || k.type?.text);
      if (!kind) return null;
      const side = sideOf(k.team);
      const people = (k.participants || []).map((p) => ({ id: String(p.athlete?.id || ''), name: p.athlete?.displayName || '' }));
      const typeText = (k.type?.type || '').toLowerCase();
      return {
        id: String(k.id),
        kind,
        side,
        minute: k.clock?.displayValue || '',
        seconds: toNumber(k.clock?.value, 0),
        period: k.period?.number || 0,
        // For substitutions ESPN lists [player on, player off]
        player: people[0] || null,
        other: people[1] || null,
        penalty: typeText.includes('penalty'),
        header: typeText.includes('header'),
        text: k.text || k.shortText || '',
        shootout: Boolean(k.shootout),
      };
    })
    .filter(Boolean)
    .filter((e) => !e.shootout)
    .sort((a, b) => a.seconds - b.seconds || a.period - b.period);
}

function lineupFromRoster(roster, ctx) {
  if (!roster) return null;
  const players = (roster.roster || []).map((p) => {
    const s = statsMap(p.stats);
    const pos = positionGroup(p.position?.abbreviation);
    const plays = p.plays || [];
    const goals = plays.filter((x) => x.scoringPlay && !x.didAssist && !x.ownGoal).length || s.totalGoals || 0;
    const rating = matchRating(s, {
      pos,
      starter: p.starter,
      subbedIn: p.subbedIn,
      subbedOut: p.subbedOut,
      goalsFor: ctx.goalsFor,
      goalsAgainst: ctx.goalsAgainst,
      state: ctx.state,
    });
    return {
      id: String(p.athlete?.id || ''),
      name: p.athlete?.displayName || '',
      short: p.athlete?.shortName || p.athlete?.displayName || '',
      lastName: p.athlete?.lastName || (p.athlete?.displayName || '').split(' ').slice(-1)[0],
      number: p.jersey || '',
      posCode: p.position?.abbreviation || '',
      posName: p.position?.displayName || '',
      pos,
      starter: Boolean(p.starter),
      formationPlace: toNumber(p.formationPlace, 0),
      subbedIn: Boolean(p.subbedIn),
      subbedOut: Boolean(p.subbedOut),
      subMinute: plays.find((x) => x.substitution)?.clock?.displayValue || '',
      goals,
      assists: s.goalAssists || 0,
      yellow: plays.some((x) => x.yellowCard) || s.yellowCards > 0,
      red: plays.some((x) => x.redCard) || s.redCards > 0,
      ownGoals: s.ownGoals || 0,
      stats: s,
      rating,
    };
  });
  return {
    side: roster.homeAway,
    teamId: String(roster.team?.id || ''),
    formation: roster.formation || '',
    starters: players.filter((p) => p.starter),
    subs: players.filter((p) => !p.starter),
  };
}

function normalizeStandingsGroups(groups) {
  return (groups || [])
    .map((g) => ({
      name: g.header || g.name || '',
      entries: (g.standings?.entries || g.entries || []).map((e, i) => normalizeStandingEntry(e, i)),
    }))
    .filter((g) => g.entries.length);
}

export async function fetchMatch(eventId, { signal } = {}) {
  const d = await getJSON(`${SITE}/all/summary?event=${eventId}`, { signal, timeout: 20000 });
  const header = d.header || {};
  const comp = header.competitions?.[0] || {};
  const league = resolveLeague({
    id: header.league?.id,
    slug: header.league?.slug,
    name: header.league?.name,
    abbreviation: header.league?.abbreviation,
    seasonSlug: header.season?.slug,
    logos: header.league?.logos,
  });
  const match = normalizeEvent({ ...header, competitions: [comp], id: header.id }, league);
  match.leagueSeason = header.season?.name || '';
  match.attendance = d.gameInfo?.attendance || null;
  match.venue = d.gameInfo?.venue?.fullName || match.venue;
  match.city = d.gameInfo?.venue?.address?.city || match.city;
  match.referee = (d.gameInfo?.officials || []).find((o) => /referee/i.test(o.position?.name || o.position?.displayName || ''))?.displayName || '';

  const events = normalizeKeyEvents(d.keyEvents, match.home, match.away);

  const ctxFor = (side) => ({
    goalsFor: side === 'home' ? match.home?.score : match.away?.score,
    goalsAgainst: side === 'home' ? match.away?.score : match.home?.score,
    state: match.status.state,
  });
  const rosters = (d.rosters || []).map((r) => lineupFromRoster(r, ctxFor(r.homeAway)));
  const lineups = {
    home: rosters.find((r) => r?.side === 'home') || null,
    away: rosters.find((r) => r?.side === 'away') || null,
  };

  const commentary = (d.commentary || [])
    .map((c) => ({
      id: String(c.sequence),
      minute: c.time?.displayValue || '',
      text: c.text || '',
      kind: EVENT_KIND(c.play?.type?.type || ''),
      seq: toNumber(c.sequence, 0),
    }))
    .filter((c) => c.text)
    .sort((a, b) => b.seq - a.seq);

  const series = d.seasonseries?.[0];
  const h2h = (series?.events || []).map((e) => ({
    id: String(e.id),
    date: e.date,
    home: normalizeCompetitor(e.competitors?.find((c) => c.homeAway === 'home')),
    away: normalizeCompetitor(e.competitors?.find((c) => c.homeAway === 'away')),
    state: e.statusType?.state || e.status || 'post',
    label: FINISHED_LABEL[e.statusType?.name] || e.statusType?.shortDetail || 'FT',
  }));

  const lastFive = (d.lastFiveGames || []).map((t) => ({
    teamId: String(t.team?.id || ''),
    events: (t.events || []).map((e) => ({
      id: String(e.id),
      date: e.gameDate,
      result: e.gameResult,
      score: e.score,
      opponent: { id: String(e.opponent?.id || ''), name: e.opponent?.displayName || '', logo: e.opponentLogo || teamLogo(e.opponent?.id) },
      atVs: e.atVs,
      league: e.leagueAbbreviation || e.leagueName || '',
    })),
  }));

  return {
    match,
    events,
    stats: boxStats(d.boxscore, match.home?.id),
    lineups,
    commentary,
    h2h,
    h2hSummary: series?.summary || '',
    lastFive,
    standings: normalizeStandingsGroups(d.standings?.groups),
    standingsTitle: d.standings?.header || '',
    news: (d.news?.articles || []).slice(0, 6).map(normalizeArticle),
  };
}

/* ---------- Standings ---------- */

function cleanColor(c) {
  if (!c) return null;
  const hex = String(c).replace(/[^0-9a-f]/gi, '');
  return hex.length === 6 ? `#${hex}` : null;
}

function normalizeStandingEntry(e, i) {
  const stats = {};
  (e.stats || []).forEach((s) => {
    stats[s.name] = s.value ?? toNumber(s.displayValue, 0);
    if (s.name === 'overall') stats.overall = s.displayValue || s.summary;
  });
  const t = e.team || {};
  const teamObj = typeof t === 'string' ? { displayName: t, id: e.id } : t;
  const { logo } = pickLogo(teamObj.logos, teamObj.id || e.id);
  return {
    rank: toNumber(stats.rank, i + 1) || i + 1,
    team: {
      id: String(teamObj.id || e.id || ''),
      name: teamObj.displayName || teamObj.name || '',
      short: teamObj.shortDisplayName || teamObj.displayName || '',
      abbr: teamObj.abbreviation || '',
      logo,
    },
    gp: toNumber(stats.gamesPlayed),
    w: toNumber(stats.wins),
    d: toNumber(stats.ties),
    l: toNumber(stats.losses),
    gf: toNumber(stats.pointsFor),
    ga: toNumber(stats.pointsAgainst),
    gd: toNumber(stats.pointDifferential),
    pts: toNumber(stats.points),
    deductions: toNumber(stats.deductions),
    note: e.note ? { color: cleanColor(e.note.color), label: e.note.description || '' } : null,
  };
}

export async function fetchStandings(slug, { signal } = {}) {
  const d = await getJSON(`${SITE_V2}/${slug}/standings`, { signal });
  const groups = (d.children || [])
    .map((c) => ({
      name: c.name || '',
      entries: (c.standings?.entries || []).map((e, i) => normalizeStandingEntry(e, i)).sort((a, b) => a.rank - b.rank),
    }))
    .filter((g) => g.entries.length);
  if (!groups.length && d.standings?.entries) {
    groups.push({ name: d.name || '', entries: d.standings.entries.map((e, i) => normalizeStandingEntry(e, i)) });
  }
  const legend = [];
  const seen = new Set();
  groups.forEach((g) =>
    g.entries.forEach((e) => {
      if (e.note?.label && !seen.has(e.note.label)) {
        seen.add(e.note.label);
        legend.push(e.note);
      }
    }),
  );
  return { season: d.children?.[0]?.standings?.seasonDisplayName || d.seasons?.[0]?.displayName || '', groups, legend };
}

/* ---------- Leaders ---------- */

export async function fetchLeaders(slug, { signal } = {}) {
  const d = await getJSON(`${WEB}/site/v2/sports/soccer/${slug}/statistics`, { signal });
  const pick = (name) =>
    (d.stats || [])
      .find((s) => s.name === name)
      ?.leaders?.slice(0, 20)
      .map((l) => {
        const s = statsMap(l.athlete?.statistics);
        const team = l.athlete?.team || {};
        return {
          id: String(l.athlete?.id || ''),
          name: l.athlete?.displayName || '',
          short: l.athlete?.shortName || '',
          value: toNumber(l.value),
          apps: s.appearances || 0,
          team: { id: String(team.id || ''), name: team.displayName || team.name || '', abbr: team.abbreviation || '', logo: pickLogo(team.logos, team.id).logo },
        };
      }) || [];
  return { goals: pick('goalsLeaders'), assists: pick('assistsLeaders') };
}

/* ---------- Teams ---------- */

function scheduleEvents(d) {
  return (d?.events || [])
    .map((ev) =>
      normalizeEvent(
        ev,
        ev.league
          ? resolveLeague({ id: ev.league.id, slug: ev.league.slug, name: ev.league.name, abbreviation: ev.league.abbreviation, logos: ev.league.logos })
          : undefined,
      ),
    )
    .sort(sortEvents);
}

/**
 * Team profile. ESPN's site "team" endpoint doesn't send CORS headers, so this
 * combines the core API (league, colours, logos) with the schedule endpoint
 * (record, league position and this season's results).
 */
export async function fetchTeam(teamId, slugHint, { signal } = {}) {
  const [core, sched] = await Promise.all([
    getJSON(`${CORE}/teams/${teamId}`, { signal }),
    getJSON(`${SITE}/all/teams/${teamId}/schedule`, { signal }).catch(() => null),
  ]);
  const st = sched?.team || {};
  const { logo, logoDark } = pickLogo(core.logos, core.id || teamId);
  const refSlug = /\/leagues\/([^/?#]+)/.exec(core.defaultLeague?.$ref || '')?.[1] || null;
  const slug = slugHint && slugHint !== 'all' ? slugHint : refSlug;
  const league = slug ? leagueBySlug(slug) || resolveLeague({ slug, name: nameFromSeasonSlug(sched?.season?.name) }) : null;
  return {
    id: String(core.id || teamId),
    name: core.displayName || st.displayName || core.name,
    short: core.shortDisplayName || core.displayName,
    nickname: core.nickname || '',
    abbr: core.abbreviation || st.abbreviation || '',
    location: core.location || '',
    logo: logo || st.logo,
    logoDark,
    color: core.color || st.color || null,
    altColor: core.alternateColor || null,
    venue: core.venue?.fullName || '',
    city: core.venue?.address?.city || '',
    standingSummary: st.standingSummary || '',
    record: st.recordSummary || '',
    isNational: Boolean(core.isNational ?? st.isNational),
    slug,
    league,
    results: scheduleEvents(sched),
  };
}

/**
 * Clubs in a league, built from the standings feed (ESPN's /teams list has no
 * CORS headers). Includes each club's league position.
 */
export async function fetchTeamsInLeague(slug, { signal } = {}) {
  const st = await fetchStandings(slug, { signal });
  const seen = new Set();
  const teams = [];
  st.groups.forEach((g) =>
    g.entries.forEach((e) => {
      if (seen.has(e.team.id)) return;
      seen.add(e.team.id);
      teams.push({ ...e.team, rank: e.rank, pts: e.pts, gp: e.gp, group: st.groups.length > 1 ? g.name : '' });
    }),
  );
  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeAthlete(a) {
  const pos = positionGroup(a.position?.abbreviation || a.position?.name);
  const injuries = (a.injuries || []).map((i) => ({
    status: i.status || i.type?.description || 'Injured',
    detail: i.details?.detail || i.longComment || i.shortComment || '',
    returnDate: i.details?.returnDate || null,
  }));
  return {
    id: String(a.id),
    name: a.displayName || a.fullName || '',
    short: a.shortName || a.displayName || '',
    firstName: a.firstName || '',
    lastName: a.lastName || '',
    number: a.jersey || '',
    posCode: a.position?.abbreviation || '',
    posName: a.position?.displayName || a.position?.name || '',
    pos,
    age: a.age || null,
    dob: a.dateOfBirth || null,
    nationality: a.citizenship || a.flag?.alt || '',
    flag: a.flag?.href || null,
    height: inchesToCm(a.height),
    weight: lbsToKg(a.weight),
    injuries,
    injured: injuries.length > 0,
    stats: statsMap(a.statistics),
  };
}

export async function fetchRoster(slug, teamId, { signal } = {}) {
  const d = await getJSON(`${SITE}/${slug}/teams/${teamId}/roster`, { signal });
  return (d.athletes || []).map(normalizeAthlete);
}

export async function fetchTeamSchedule(teamId, { fixtures = false, signal } = {}) {
  const d = await getJSON(`${SITE}/all/teams/${teamId}/schedule${fixtures ? '?fixture=true' : ''}`, { signal });
  return scheduleEvents(d);
}

/* ---------- Players ---------- */

// ESPN sends imperial strings like 5' 10" and 141 lbs.
function metricHeight(text) {
  const m = /(\d+)'\s*(\d+)?/.exec(text || '');
  if (!m) return text || '';
  const cm = inchesToCm(Number(m[1]) * 12 + Number(m[2] || 0));
  return cm ? `${cm} cm` : text;
}

function metricWeight(text) {
  const m = /(\d+(?:\.\d+)?)\s*lbs?/i.exec(text || '');
  if (!m) return text || '';
  const kg = lbsToKg(m[1]);
  return kg ? `${kg} kg` : text;
}

export async function fetchAthlete(id, { signal } = {}) {
  const [profile, overview] = await Promise.all([
    getJSON(`${WEB}/common/v3/sports/soccer/athletes/${id}`, { signal }),
    getJSON(`${WEB}/common/v3/sports/soccer/athletes/${id}/overview`, { signal }).catch(() => null),
  ]);
  const a = profile.athlete || {};
  const team = a.team || {};
  const { logo } = pickLogo(team.logos, team.id);

  const statsBlock = overview?.statistics;
  const splits = (statsBlock?.splits || []).map((s) => {
    const row = {};
    (statsBlock.names || []).forEach((n, i) => {
      row[n] = toNumber(s.stats?.[i], 0);
    });
    return { name: s.displayName, leagueSlug: s.leagueSlug, teamId: s.teamId, stats: row };
  });

  const log = overview?.gameLog?.statistics?.[0];
  const logEvents = overview?.gameLog?.events || {};
  const gameLog = (log?.events || []).map((e) => {
    const meta = logEvents[e.eventId] || {};
    const row = {};
    (log.names || []).forEach((n, i) => {
      row[n] = e.stats?.[i];
    });
    return {
      id: String(e.eventId),
      date: meta.gameDate || null,
      result: meta.gameResult || '',
      score: meta.score || '',
      atVs: meta.atVs || '',
      opponent: meta.opponent ? { id: String(meta.opponent.id), name: meta.opponent.displayName, logo: meta.opponentLogo || teamLogo(meta.opponent.id) } : null,
      league: meta.leagueAbbreviation || meta.leagueName || '',
      stats: row,
    };
  });

  return {
    id: String(a.id),
    name: a.displayName || a.fullName,
    firstName: a.firstName || '',
    lastName: a.lastName || '',
    number: a.jersey || '',
    posCode: a.position?.abbreviation || '',
    posName: a.position?.displayName || a.position?.name || '',
    pos: positionGroup(a.position?.abbreviation || a.position?.name),
    age: a.age || null,
    dob: a.displayDOB || null,
    nationality: a.citizenship || a.flag?.alt || '',
    flag: a.flag?.href || null,
    heightText: metricHeight(a.displayHeight),
    weightText: metricWeight(a.displayWeight),
    status: a.status?.name || '',
    team: team.id
      ? { id: String(team.id), name: team.displayName || team.name, abbr: team.abbreviation, logo, color: team.color, altColor: team.alternateColor }
      : null,
    summary: (a.statsSummary?.statistics || []).map((s) => ({ label: s.displayName || s.shortDisplayName, value: s.displayValue })),
    splits,
    splitLabels: { names: statsBlock?.names || [], labels: statsBlock?.labels || [], display: statsBlock?.displayNames || [] },
    gameLog,
    news: (overview?.news || []).slice(0, 6).map(normalizeArticle),
  };
}

/* ---------- News ---------- */

export function normalizeArticle(a) {
  const img = a.images?.find((i) => i.type === 'header' || i.type === 'Media') || a.images?.[0];
  return {
    id: String(a.id || a.dataSourceIdentifier || a.headline),
    headline: a.headline || a.title || '',
    description: a.description || '',
    published: a.published || a.lastModified || null,
    image: img?.url ? espnImage(img.url, 720) : null,
    imageAlt: img?.caption || img?.alt || a.headline || '',
    link: a.links?.web?.href || a.links?.mobile?.href || null,
    byline: a.byline || '',
    type: a.type || '',
    premium: Boolean(a.premium),
    teams: (a.categories || []).filter((c) => c.type === 'team').map((c) => ({ id: String(c.teamId || c.team?.id || ''), name: c.description })),
  };
}

export async function fetchNews({ slug = 'all', team, limit = 24, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (team) params.set('team', team);
  const d = await getJSON(`${SITE}/${slug}/news?${params.toString()}`, { signal });
  return (d.articles || [])
    .filter((a) => a.type !== 'Media' || a.images?.length)
    .map(normalizeArticle)
    .filter((a) => a.headline);
}

/* ---------- Search ---------- */

export async function searchEspn(query, { signal } = {}) {
  const q = encodeURIComponent(query.trim());
  const [teams, players] = await Promise.all([
    getJSON(`${WEB}/common/v3/search?query=${q}&limit=8&type=team&sport=soccer`, { signal }).catch(() => ({ items: [] })),
    getJSON(`${WEB}/common/v3/search?query=${q}&limit=8&type=player&sport=soccer`, { signal }).catch(() => ({ items: [] })),
  ]);
  return {
    teams: (teams.items || []).map((t) => ({
      id: String(t.id),
      name: t.displayName,
      abbr: t.abbreviation,
      logo: pickLogo(t.logos, t.id).logo,
      leagueSlug: t.defaultLeagueSlug || t.league || null,
      league: leagueBySlug(t.defaultLeagueSlug)?.short || '',
    })),
    players: (players.items || []).map((p) => {
      const rel = p.teamRelationships?.[0];
      const core = rel?.core || {};
      return {
        id: String(p.id),
        name: p.displayName,
        team: core.displayName || (rel?.displayName || '').replace(/\s*\(.*\)$/, ''),
        teamId: core.id ? String(core.id) : null,
        teamLogo: core.id ? pickLogo(core.logos, core.id).logo : null,
        pos: p.position?.abbreviation || p.position?.name || '',
        flag: p.flag?.href || null,
      };
    }),
  };
}
