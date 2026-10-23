// React Query hooks: caching, de-duplication and live polling for every data source.

import { useCallback, useMemo } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import {
  fetchAllScoreboard,
  fetchAthlete,
  fetchLeaders,
  fetchLeagueScoreboard,
  fetchMatch,
  fetchNews,
  fetchRoster,
  fetchStandings,
  fetchTeam,
  fetchTeamSchedule,
  fetchTeamsInLeague,
  searchEspn,
} from './espn';
import { fetchManager } from './wikidata';
import { fetchPersonSummary } from './wikipedia';
import { etDateKey, etKeysForLocalDay, inLocalDay } from '../lib/dates';
import { useSettings } from '../context/SettingsContext';

const MIN = 60 * 1000;

/** A match that is live, or due to kick off within a minute, needs fast polling. */
function needsLivePolling(matches) {
  const now = Date.now();
  return (matches || []).some((m) => {
    if (m.status.isLive) return true;
    if (m.status.state !== 'pre') return false;
    const t = new Date(m.date).getTime();
    return t <= now + MIN && t > now - 3 * 60 * MIN;
  });
}

/* ---------- Scores ---------- */

/**
 * Every match on a local calendar day, across all competitions, polled while live.
 * `slow` is used by background observers (the app shell) so they don't drive
 * fast polling on screens that don't show scores.
 */
export function useDayMatches(localKey, { slow = false } = {}) {
  const settings = useSettings();
  const liveInterval = slow ? Math.max(60, settings.liveInterval) : settings.liveInterval;
  const etKeys = useMemo(() => etKeysForLocalDay(localKey), [localKey]);

  const combine = useCallback(
    (results) => {
      const seen = new Set();
      const matches = [];
      results.forEach((r) => {
        (r.data || []).forEach((m) => {
          if (seen.has(m.id) || !inLocalDay(m.date, localKey)) return;
          seen.add(m.id);
          matches.push(m);
        });
      });
      matches.sort((a, b) => new Date(a.date) - new Date(b.date));
      return {
        matches,
        isLoading: results.some((r) => r.isLoading),
        isFetching: results.some((r) => r.isFetching),
        isError: results.length > 0 && results.every((r) => r.isError),
        error: results.find((r) => r.error)?.error || null,
        updatedAt: Math.max(0, ...results.map((r) => r.dataUpdatedAt || 0)),
        refetchers: results.map((r) => r.refetch),
        liveCount: matches.filter((m) => m.status.isLive).length,
      };
    },
    [localKey],
  );

  const combined = useQueries({
    queries: etKeys.map((key) => ({
      queryKey: ['scoreboard', 'all', key],
      queryFn: ({ signal }) => fetchAllScoreboard(key, { signal }),
      staleTime: () => (key >= etDateKey(Date.now()) ? 15 * 1000 : 10 * MIN),
      refetchInterval: (query) => {
        const data = query.state.data;
        if (needsLivePolling(data)) return liveInterval * 1000;
        if (key === etDateKey(Date.now())) return 2 * MIN;
        return false;
      },
      placeholderData: keepPreviousData,
    })),
    combine,
  });

  const { refetchers } = combined;
  const refetch = useCallback(() => Promise.all(refetchers.map((fn) => fn())), [refetchers]);
  return useMemo(() => ({ ...combined, refetch }), [combined, refetch]);
}

export function useLeagueScoreboard(slug, dateKey) {
  const { liveInterval } = useSettings();
  return useQuery({
    queryKey: ['scoreboard', slug, dateKey || 'current'],
    queryFn: ({ signal }) => fetchLeagueScoreboard(slug, dateKey, { signal }),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
    refetchInterval: (q) => (needsLivePolling(q.state.data?.matches) ? liveInterval * 1000 : false),
    placeholderData: keepPreviousData,
  });
}

export function useMatch(id) {
  const { liveInterval } = useSettings();
  return useQuery({
    queryKey: ['match', id],
    queryFn: ({ signal }) => fetchMatch(id, { signal }),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
    refetchInterval: (q) => {
      const m = q.state.data?.match;
      if (!m) return false;
      if (needsLivePolling([m])) return Math.max(15, Math.round(liveInterval * 0.66)) * 1000;
      if (m.status.state === 'pre') return 5 * MIN; // lineups usually drop ~1h before kick-off
      return false;
    },
  });
}

/* ---------- Competitions ---------- */

export function useStandings(slug, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['standings', slug],
    queryFn: ({ signal }) => fetchStandings(slug, { signal }),
    enabled: Boolean(slug) && enabled,
    staleTime: 3 * MIN,
  });
}

export function useLeaders(slug) {
  return useQuery({
    queryKey: ['leaders', slug],
    queryFn: ({ signal }) => fetchLeaders(slug, { signal }),
    enabled: Boolean(slug),
    staleTime: 15 * MIN,
  });
}

export function useTeamsInLeague(slug) {
  return useQuery({
    queryKey: ['teams', slug],
    queryFn: ({ signal }) => fetchTeamsInLeague(slug, { signal }),
    enabled: Boolean(slug),
    staleTime: 60 * MIN,
  });
}

/* ---------- Teams & players ---------- */

export function useTeam(id, slugHint) {
  return useQuery({
    queryKey: ['team', id, slugHint || 'all'],
    queryFn: ({ signal }) => fetchTeam(id, slugHint, { signal }),
    enabled: Boolean(id),
    staleTime: 5 * MIN,
  });
}

export function useRoster(slug, teamId) {
  return useQuery({
    queryKey: ['roster', slug, teamId],
    queryFn: ({ signal }) => fetchRoster(slug, teamId, { signal }),
    enabled: Boolean(slug && teamId),
    staleTime: 15 * MIN,
  });
}

export function useTeamSchedule(teamId, fixtures) {
  return useQuery({
    queryKey: ['schedule', teamId, fixtures ? 'fixtures' : 'results'],
    queryFn: ({ signal }) => fetchTeamSchedule(teamId, { fixtures, signal }),
    enabled: Boolean(teamId),
    staleTime: 5 * MIN,
  });
}

export function useAthlete(id) {
  return useQuery({
    queryKey: ['athlete', id],
    queryFn: ({ signal }) => fetchAthlete(id, { signal }),
    enabled: Boolean(id),
    staleTime: 10 * MIN,
  });
}

/* ---------- News & search ---------- */

export function useNews({ slug = 'all', team, limit = 24 } = {}) {
  return useQuery({
    queryKey: ['news', slug, team || '', limit],
    queryFn: ({ signal }) => fetchNews({ slug, team, limit, signal }),
    staleTime: 5 * MIN,
    refetchInterval: 10 * MIN,
  });
}

export function useSearch(query) {
  const q = query.trim();
  return useQuery({
    queryKey: ['search', q.toLowerCase()],
    queryFn: ({ signal }) => searchEspn(q, { signal }),
    enabled: q.length >= 2,
    staleTime: 5 * MIN,
    placeholderData: keepPreviousData,
  });
}

/* ---------- People ---------- */

export function useManager(team) {
  return useQuery({
    queryKey: ['manager', team?.id],
    queryFn: ({ signal }) => fetchManager(team, { signal }),
    enabled: Boolean(team?.id && team?.name),
    staleTime: 6 * 60 * MIN,
    retry: 1,
  });
}

export function usePersonSummary(name, kind = 'player') {
  return useQuery({
    queryKey: ['wiki', kind, name],
    queryFn: ({ signal }) => fetchPersonSummary(name, kind, { signal }),
    enabled: Boolean(name),
    staleTime: 24 * 60 * MIN,
    retry: 0,
  });
}
