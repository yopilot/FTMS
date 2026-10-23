import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ListOrdered, Newspaper, Users } from 'lucide-react';
import { leagueBySlug } from '../api/leagues';
import { useLeaders, useLeagueScoreboard, useNews, useStandings } from '../api/queries';
import { etDateKey } from '../lib/dates';
import { formatLongDay } from '../lib/format';
import { useFavorites } from '../context/FavoritesContext';
import Crest from '../components/ui/Crest';
import { Tabs } from '../components/ui/Tabs';
import { FollowButton } from '../components/ui/Bits';
import StandingsTable from '../components/league/StandingsTable';
import LeadersList from '../components/league/LeadersList';
import MatchRow from '../components/match/MatchRow';
import NewsCard from '../components/news/NewsCard';
import { SkeletonRows, Skeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function TableTab({ slug }) {
  const st = useStandings(slug);
  if (st.isLoading)
    return (
      <div className="card">
        <SkeletonRows rows={12} height={44} />
      </div>
    );
  if (st.isError)
    return (
      <div className="card">
        <ErrorState error={st.error} onRetry={st.refetch} />
      </div>
    );
  const groups = st.data?.groups || [];
  if (!groups.length)
    return (
      <div className="card">
        <EmptyState icon={ListOrdered} title="No table for this competition" text="Knockout cups don't have a league table. Check the Matches tab for fixtures and results." />
      </div>
    );
  return (
    <div className="stack gap-4">
      {groups.map((g, i) => (
        <div key={g.name || i} className="card">
          {(groups.length > 1 || g.name) && (
            <div className="card-header">
              <span className="card-title">{g.name}</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                {g.entries.length} teams
              </span>
            </div>
          )}
          <StandingsTable entries={g.entries} legend={i === groups.length - 1 ? st.data.legend : []} />
        </div>
      ))}
    </div>
  );
}

function nearestIndex(calendar) {
  if (!calendar.length) return -1;
  const now = Date.now();
  const today = etDateKey(now);
  const idx = calendar.findIndex((d) => etDateKey(d) >= today);
  return idx === -1 ? calendar.length - 1 : idx;
}

function MatchesTab({ slug }) {
  const base = useLeagueScoreboard(slug);
  const calendar = useMemo(() => base.data?.calendar || [], [base.data]);
  const [index, setIndex] = useState(null);
  const current = index ?? nearestIndex(calendar);
  const dateKey = current >= 0 && calendar[current] ? etDateKey(calendar[current]) : null;
  const day = useLeagueScoreboard(dateKey ? slug : null, dateKey);
  const matches = (dateKey ? day.data?.matches : base.data?.matches) || [];
  const loading = base.isLoading || (dateKey && day.isLoading);

  return (
    <div className="card" style={{ maxWidth: 860 }}>
      <div className="card-header">
        <button type="button" className="icon-btn sm" onClick={() => setIndex(Math.max(0, current - 1))} disabled={current <= 0} aria-label="Previous matchday">
          <ChevronLeft size={16} />
        </button>
        <span className="card-title">
          <CalendarDays size={15} />
          {calendar[current] ? formatLongDay(calendar[current]) : 'Current matches'}
        </span>
        <button
          type="button"
          className="icon-btn sm"
          onClick={() => setIndex(Math.min(calendar.length - 1, current + 1))}
          disabled={current >= calendar.length - 1}
          aria-label="Next matchday"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {loading ? (
        <SkeletonRows rows={6} />
      ) : matches.length ? (
        matches.map((m) => <MatchRow key={m.id} m={m} />)
      ) : (
        <EmptyState compact icon={CalendarDays} title="No matches on this day" text="Use the arrows to move between matchdays." />
      )}
    </div>
  );
}

function PlayersTab({ slug }) {
  const ld = useLeaders(slug);
  if (ld.isLoading)
    return (
      <div className="grid-2">
        <div className="card">
          <SkeletonRows rows={8} />
        </div>
        <div className="card">
          <SkeletonRows rows={8} />
        </div>
      </div>
    );
  if (!ld.data?.goals?.length && !ld.data?.assists?.length)
    return (
      <div className="card">
        <EmptyState icon={Users} title="No player stats yet" text="ESPN publishes scorer tables for most leagues once the season starts." />
      </div>
    );
  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Goals</span>
        </div>
        <LeadersList items={ld.data.goals} label="goals" limit={15} />
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Assists</span>
        </div>
        <LeadersList items={ld.data.assists} label="assists" limit={15} />
      </div>
    </div>
  );
}

function NewsTab({ slug }) {
  const news = useNews({ slug, limit: 18 });
  if (news.isLoading)
    return (
      <div className="news-masonry">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} h={240} r={14} />
        ))}
      </div>
    );
  if (!news.data?.length)
    return (
      <div className="card">
        <EmptyState icon={Newspaper} title="No stories right now" />
      </div>
    );
  return (
    <div className="news-masonry">
      {news.data.map((a, i) => (
        <NewsCard key={a.id} article={a} variant={i === 0 ? 'feature' : 'card'} />
      ))}
    </div>
  );
}

export default function League() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const league = leagueBySlug(slug);
  const { isLeagueFav, toggleLeague } = useFavorites();
  const sb = useLeagueScoreboard(slug);
  const meta = sb.data?.league;
  const name = league?.name || meta?.name || slug;
  useDocumentTitle(name);

  const tabs = [
    { value: 'table', label: 'Table' },
    { value: 'matches', label: 'Matches' },
    { value: 'players', label: 'Top players' },
    { value: 'news', label: 'News' },
  ];
  const tab = tabs.some((t) => t.value === params.get('tab')) ? params.get('tab') : league?.cup ? 'matches' : 'table';

  if (!league && sb.isError) {
    return (
      <div className="page">
        <div className="card">
          <ErrorState title="Competition not found" error={sb.error} onRetry={sb.refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ gap: 'var(--sp-5)' }}>
      <section className="hero">
        <div className="hero-wash" style={{ background: 'radial-gradient(80% 140% at 0% 0%, var(--accent-soft), transparent 60%)' }} />
        <div className="hero-body">
          <span className="hero-crest">
            <Crest src={league?.logo || meta?.logo} srcDark={league?.logoDark} name={name} size={60} />
          </span>
          <div className="grow">
            <p className="eyebrow">{league?.country || 'Competition'}</p>
            <h1 className="hero-title" style={{ marginTop: 6 }}>
              {name}
            </h1>
            <div className="hero-meta">{meta?.season && <span>{meta.season}</span>}</div>
          </div>
          <div className="hero-actions">
            <FollowButton on={isLeagueFav(slug)} onToggle={() => toggleLeague(slug)} />
          </div>
        </div>
        <div className="hero-tabs">
          <Tabs items={tabs} value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} ariaLabel="Competition sections" />
        </div>
      </section>

      {tab === 'table' && <TableTab slug={slug} />}
      {tab === 'matches' && <MatchesTab slug={slug} />}
      {tab === 'players' && <PlayersTab slug={slug} />}
      {tab === 'news' && <NewsTab slug={slug} />}
    </div>
  );
}
