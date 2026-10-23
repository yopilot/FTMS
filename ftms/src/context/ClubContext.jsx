import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useRoster, useStandings, useTeam } from '../api/queries';
import { usePersistentState } from '../lib/usePersistentState';
import { rateSquad, findStanding } from '../lib/squad';
import { attrOvr, positionGroup } from '../lib/ratings';
import { FORMATIONS, TACTIC_PRESETS, autoPick } from '../lib/formations';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';

const ClubContext = createContext(null);

const DEFAULT_STATE = {
  formation: '4-3-3',
  lineup: {},
  bench: [],
  roles: {},
  tactics: TACTIC_PRESETS.Balanced,
  meta: {},
  shortlist: [],
  notes: {},
  updatedAt: null,
};

const LOCAL_STATUS = { injured: 'injured', inactive: 'unavailable', active: 'available' };

/** Local (custom club) players from IndexedDB. */
// eslint-disable-next-line react-refresh/only-export-components
export function useLocalPlayers(enabled = true) {
  return useQuery({ queryKey: ['local', 'players'], queryFn: () => playerService.getAll(), enabled, staleTime: Infinity });
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocalMatches(enabled = true) {
  return useQuery({ queryKey: ['local', 'matches'], queryFn: () => matchService.getAll(), enabled, staleTime: Infinity });
}

export function ClubProvider({ children }) {
  const { session, updateSession } = useAuth();
  const real = session?.type === 'real';
  const clubKey = session ? `${session.type}.${session.clubId}` : 'none';

  const team = useTeam(real ? session.clubId : null, real ? session.leagueSlug : undefined);
  const slug = real ? session.leagueSlug || team.data?.slug || null : null;
  const roster = useRoster(slug, real ? session.clubId : null);
  const standings = useStandings(slug);
  const local = useLocalPlayers(Boolean(session) && !real);

  const [stored, setStored] = usePersistentState(`mgr.${clubKey}`, DEFAULT_STATE);
  const state = useMemo(() => ({ ...DEFAULT_STATE, ...(stored || {}) }), [stored]);

  const setState = useCallback(
    (patch) =>
      setStored((prev) => {
        const base = { ...DEFAULT_STATE, ...(prev || {}) };
        const next = typeof patch === 'function' ? patch(base) : { ...base, ...patch };
        return { ...next, updatedAt: new Date().toISOString() };
      }),
    [setStored],
  );

  const players = useMemo(() => {
    const meta = state.meta || {};
    if (real) {
      const rated = rateSquad(roster.data, { slug, standings: standings.data, teamId: session.clubId });
      return rated.map((p) => ({
        ...p,
        status: meta[p.id]?.status || (p.injured ? 'injured' : 'available'),
        meta: meta[p.id] || {},
      }));
    }
    return (local.data || []).map((p) => {
      const id = String(p.id);
      const pos = positionGroup(p.position);
      return {
        id,
        localId: p.id,
        name: p.name,
        short: p.name,
        lastName: p.name.split(' ').slice(-1)[0],
        number: p.jerseyNumber ?? '',
        pos,
        age: p.age || null,
        ovr: attrOvr(p.ratings, pos),
        ratings: p.ratings,
        foot: p.preferredFoot,
        notes: p.notes,
        nationality: '',
        flag: null,
        stats: {},
        injured: p.status === 'injured',
        status: meta[id]?.status || LOCAL_STATUS[p.status] || 'available',
        meta: meta[id] || {},
        local: true,
      };
    });
  }, [real, roster.data, slug, standings.data, session, local.data, state.meta]);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const loading = real ? roster.isLoading || team.isLoading || standings.isLoading : local.isLoading;

  // First time a club is opened: start from the strongest XI so every screen has a lineup.
  useEffect(() => {
    if (!loading && players.length >= 11 && !state.initialized) {
      const formation = FORMATIONS[state.formation] ? state.formation : '4-3-3';
      const pick = autoPick(players, formation, 9);
      setState((s) => ({ ...s, ...pick, formation, initialized: true }));
    }
  }, [loading, players, state.initialized, state.formation, setState]);

  const updateMeta = useCallback(
    (playerId, patch) =>
      setState((s) => ({
        ...s,
        meta: { ...s.meta, [playerId]: { ...(s.meta?.[playerId] || {}), ...patch } },
      })),
    [setState],
  );

  const value = useMemo(
    () => ({
      session,
      updateSession,
      real,
      clubKey,
      team: team.data || null,
      slug,
      standing: findStanding(standings.data, session?.clubId),
      standings: standings.data,
      players,
      playersById,
      isLoading: loading,
      error: real ? roster.error || team.error : local.error,
      state,
      setState,
      updateMeta,
    }),
    [session, updateSession, real, clubKey, team.data, team.error, slug, standings.data, players, playersById, loading, roster.error, local.error, state, setState, updateMeta],
  );

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClub() {
  return useContext(ClubContext);
}
