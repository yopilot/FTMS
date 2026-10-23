import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

const ThemeContext = createContext(null);

const getSystem = () => (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

export function ThemeProvider({ children }) {
  const [preference, setPreference] = usePersistentState('theme', 'system');
  const [system, setSystem] = useState(getSystem);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return undefined;
    const onChange = () => setSystem(getSystem());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme = preference === 'system' ? system : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f6f7' : '#0b0c0e');
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference,
      toggle: () => setPreference(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
