import { useSyncExternalStore } from 'react';

/** Reactive media query, e.g. useMediaQuery('(max-width: 899px)'). */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
