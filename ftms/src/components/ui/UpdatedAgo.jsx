import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

function label(ts) {
  if (!ts) return '';
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return 'Updated just now';
  if (s < 60) return `Updated ${s}s ago`;
  const m = Math.round(s / 60);
  return `Updated ${m}m ago`;
}

/** "Updated 12s ago" with a manual refresh button. */
export default function UpdatedAgo({ at, fetching, onRefresh, live }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="refresh-meta" aria-live="off">
      {live && <span className="badge badge-live">Auto-refresh on</span>}
      <span>{label(at)}</span>
      <button type="button" className="icon-btn sm" onClick={onRefresh} aria-label="Refresh now" disabled={fetching}>
        <RefreshCw size={14} className={fetching ? 'spin' : ''} />
      </button>
    </span>
  );
}
