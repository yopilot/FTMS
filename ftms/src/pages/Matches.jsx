import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Star, X, Zap } from 'lucide-react';
import { useDayMatches } from '../api/queries';
import { todayKey, parseLocalKey } from '../lib/dates';
import { formatLongDay, pluralize } from '../lib/format';
import { groupByLeague, matchesTeam } from '../lib/matchUtils';
import { useFavorites } from '../context/FavoritesContext';
import DateStrip from '../components/match/DateStrip';
import LeagueGroup from '../components/match/LeagueGroup';
import MatchRow from '../components/match/MatchRow';
import { Segmented } from '../components/ui/Tabs';
import UpdatedAgo from '../components/ui/UpdatedAgo';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { LiveDot } from '../components/ui/Bits';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const PAGE = 18;

export default function Matches() {
  const [params, setParams] = useSearchParams();
  const date = /^\d{8}$/.test(params.get('date') || '') ? params.get('date') : todayKey();
  const filter = params.get('filter') || 'all';
  const scope = params.get('scope') || 'all';
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE);
  const { leagues: favLeagues, teams } = useFavorites();
  const favIds = useMemo(() => new Set(teams.map((t) => t.id)), [teams]);
  const isToday = date === todayKey();

  useDocumentTitle(filter === 'live' ? 'Live scores' : 'Scores');
  const day = useDayMatches(date);

  const setParam = (key, value, fallback) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
    setVisible(PAGE);
  };

  const counts = useMemo(
    () => ({
      live: day.matches.filter((m) => m.status.isLive).length,
      finished: day.matches.filter((m) => m.status.state === 'post').length,
      upcoming: day.matches.filter((m) => m.status.state === 'pre').length,
    }),
    [day.matches],
  );

  const filtered = useMemo(() => {
    return day.matches.filter((m) => {
      if (filter === 'live' && !m.status.isLive) return false;
      if (filter === 'finished' && m.status.state !== 'post') return false;
      if (filter === 'upcoming' && m.status.state !== 'pre') return false;
      if (scope === 'top' && !(m.league.top || favLeagues.includes(m.league.slug) || favIds.has(m.home.id) || favIds.has(m.away.id))) return false;
      return matchesTeam(m, q.trim());
    });
  }, [day.matches, filter, scope, q, favLeagues, favIds]);

  const groups = useMemo(() => groupByLeague(filtered, favLeagues, favIds), [filtered, favLeagues, favIds]);
  const yourMatches = useMemo(() => filtered.filter((m) => favIds.has(m.home.id) || favIds.has(m.away.id)), [filtered, favIds]);

  const dayLabel = isToday ? 'Today' : formatLongDay(parseLocalKey(date));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Scores</h1>
          <p className="page-sub">
            {dayLabel} · {day.isLoading ? 'Loading matches…' : `${pluralize(day.matches.length, 'match', 'matches')} across ${groupByLeague(day.matches).length} competitions`}
          </p>
        </div>
      </header>

      <div className="scores-toolbar">
        <DateStrip value={date} onChange={(k) => setParam('date', k, todayKey())} />
        <div className="scores-filters">
          <Segmented
            ariaLabel="Match status"
            value={filter}
            onChange={(v) => setParam('filter', v, 'all')}
            items={[
              { value: 'all', label: 'All' },
              { value: 'live', label: 'Live', icon: counts.live ? <LiveDot /> : null, badge: counts.live || null },
              { value: 'finished', label: 'Finished' },
              { value: 'upcoming', label: 'Upcoming' },
            ]}
          />
          <Segmented
            ariaLabel="Competitions"
            value={scope}
            onChange={(v) => setParam('scope', v, 'all')}
            items={[
              { value: 'all', label: 'All competitions' },
              { value: 'top', label: 'Top & followed', icon: <Star size={13} /> },
            ]}
          />
          <label className="input-icon">
            <Search size={15} />
            <input className="input" placeholder="Filter by team or competition" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter matches" />
            {q && (
              <button type="button" className="icon-btn sm" style={{ position: 'absolute', right: 4 }} onClick={() => setQ('')} aria-label="Clear filter">
                <X size={14} />
              </button>
            )}
          </label>
          <UpdatedAgo at={day.updatedAt} fetching={day.isFetching} onRefresh={day.refetch} live={counts.live > 0} />
        </div>
      </div>

      {day.isLoading ? (
        <div className="lgroup-list">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card">
              <SkeletonRows rows={4} />
            </div>
          ))}
        </div>
      ) : day.isError ? (
        <div className="card">
          <ErrorState error={day.error} onRetry={day.refetch} />
        </div>
      ) : groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Zap}
            title={filter === 'live' ? 'No matches are live right now' : q ? `Nothing matches “${q}”` : 'No matches on this day'}
            text={filter === 'live' ? 'Live games appear here automatically. Scores refresh on their own.' : 'Try another day or clear the filters.'}
            action={
              (filter !== 'all' || scope !== 'all' || q) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setQ('');
                    setParams(date === todayKey() ? {} : { date }, { replace: true });
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="lgroup-list">
          {yourMatches.length > 0 && (
            <section className="card lgroup" aria-label="Your teams">
              <header className="lgroup-head">
                <span className="lgroup-link">
                  <span className="cmdk-item-icon" style={{ width: 22, height: 22, borderRadius: 6 }}>
                    <Star size={12} fill="currentColor" color="var(--warning)" />
                  </span>
                  <span className="lgroup-name">Your teams</span>
                </span>
                <Link to="/settings" className="link-quiet" style={{ fontSize: 12 }}>
                  Manage
                </Link>
              </header>
              {yourMatches.map((m) => (
                <MatchRow key={m.id} m={m} showLeague />
              ))}
            </section>
          )}
          {groups.slice(0, visible).map((g) => (
            <LeagueGroup key={g.league.id} league={g.league} matches={g.matches} />
          ))}
          {groups.length > visible && (
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setVisible((v) => v + PAGE * 2)}>
              Show {Math.min(PAGE * 2, groups.length - visible)} more competitions
              <span className="subtle">({groups.length - visible} left)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
