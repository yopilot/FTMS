import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

// One shared password for every manager account.
// This app has no server, so the check only gates the manager screens on this
// device; it is not a security boundary. Override it at build time with
// VITE_MANAGER_PASSWORD.
const MANAGER_PASSWORD = import.meta.env.VITE_MANAGER_PASSWORD || 'ftms2026';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = usePersistentState('session', null);

  const login = useCallback(
    (club, password) => {
      if (!club) return { ok: false, error: 'Choose a club first.' };
      if (String(password || '').trim() !== MANAGER_PASSWORD) {
        return { ok: false, error: 'That password is not right. All managers share the same password.' };
      }
      const next = {
        type: club.type, // 'real' | 'custom'
        clubId: String(club.id),
        clubName: club.name,
        clubShort: club.short || club.name,
        logo: club.logo || null,
        logoDark: club.logoDark || null,
        color: club.color || null,
        altColor: club.altColor || null,
        leagueSlug: club.leagueSlug || null,
        managerName: club.managerName || 'Manager',
        managerImage: club.managerImage || null,
        since: new Date().toISOString(),
      };
      setSession(next);
      return { ok: true, session: next };
    },
    [setSession],
  );

  const logout = useCallback(() => setSession(null), [setSession]);

  const updateSession = useCallback((patch) => setSession((prev) => (prev ? { ...prev, ...patch } : prev)), [setSession]);

  const value = useMemo(() => ({ session, isManager: Boolean(session), login, logout, updateSession }), [session, login, logout, updateSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
