import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

const FavoritesContext = createContext(null);

const DEFAULT = { teams: [], leagues: ['eng.1', 'uefa.champions'] };

export function FavoritesProvider({ children }) {
  const [favs, setFavs] = usePersistentState('favorites', DEFAULT);

  const teams = useMemo(() => favs?.teams || [], [favs]);
  const leagues = useMemo(() => favs?.leagues || [], [favs]);
  const teamIds = useMemo(() => new Set(teams.map((t) => String(t.id))), [teams]);
  const leagueSet = useMemo(() => new Set(leagues), [leagues]);

  const toggleTeam = useCallback(
    (team) => {
      if (!team?.id) return;
      setFavs((prev) => {
        const list = prev?.teams || [];
        const exists = list.some((t) => String(t.id) === String(team.id));
        const next = exists
          ? list.filter((t) => String(t.id) !== String(team.id))
          : [...list, { id: String(team.id), name: team.name, logo: team.logo || null, abbr: team.abbr || '' }];
        return { ...DEFAULT, ...prev, teams: next };
      });
    },
    [setFavs],
  );

  const toggleLeague = useCallback(
    (slug) => {
      if (!slug) return;
      setFavs((prev) => {
        const list = prev?.leagues || [];
        const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
        return { ...DEFAULT, ...prev, leagues: next };
      });
    },
    [setFavs],
  );

  const value = useMemo(
    () => ({
      teams,
      leagues,
      isTeamFav: (id) => teamIds.has(String(id)),
      isLeagueFav: (slug) => leagueSet.has(slug),
      toggleTeam,
      toggleLeague,
    }),
    [teams, leagues, teamIds, leagueSet, toggleTeam, toggleLeague],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  return useContext(FavoritesContext);
}
