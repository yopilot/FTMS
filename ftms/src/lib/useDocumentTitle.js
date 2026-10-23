import { useEffect } from 'react';

const BASE = 'FTMS';

/** Sets the tab title. Pass null for the default title. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} · Live football scores, tables & manager hub`;
  }, [title]);
}
