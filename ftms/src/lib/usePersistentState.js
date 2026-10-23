import { useCallback, useEffect, useState } from 'react';
import { readJSON, writeJSON } from './storage';

/**
 * useState that survives reloads (localStorage) and stays in sync across tabs.
 */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => readJSON(key, typeof initial === 'function' ? initial() : initial));

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === `ftms.${key}`) setValue(readJSON(key, typeof initial === 'function' ? initial() : initial));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // initial is intentionally ignored after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        writeJSON(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}
