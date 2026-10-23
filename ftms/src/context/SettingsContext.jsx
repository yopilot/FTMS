import { createContext, useContext, useMemo } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

const SettingsContext = createContext(null);

const DEFAULTS = {
  liveInterval: 30, // seconds between live refreshes
  goalAlerts: true, // toast when a followed team scores
  reduceMotion: false,
};

export function SettingsProvider({ children }) {
  const [stored, setStored] = usePersistentState('settings', DEFAULTS);
  const settings = useMemo(() => ({ ...DEFAULTS, ...(stored || {}) }), [stored]);

  const value = useMemo(
    () => ({
      ...settings,
      update: (patch) => setStored((prev) => ({ ...DEFAULTS, ...(prev || {}), ...patch })),
    }),
    [settings, setStored],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(SettingsContext);
}
