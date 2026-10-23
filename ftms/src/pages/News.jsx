import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { useNews } from '../api/queries';
import { leagueBySlug } from '../api/leagues';
import { useFavorites } from '../context/FavoritesContext';
import NewsCard from '../components/news/NewsCard';
import Crest from '../components/ui/Crest';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import UpdatedAgo from '../components/ui/UpdatedAgo';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const FEEDS = ['all', 'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'uefa.champions', 'usa.1', 'ksa.1', 'eng.w.1'];

export default function News() {
  useDocumentTitle('News');
  const { teams } = useFavorites();
  const [feed, setFeed] = useState({ slug: 'all', team: null });
  const news = useNews({ slug: feed.slug, team: feed.team, limit: 30 });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">News</h1>
          <p className="page-sub">Headlines, transfers and match reports, updated through the day. Stories open on ESPN.</p>
        </div>
        <UpdatedAgo at={news.dataUpdatedAt} fetching={news.isFetching} onRefresh={news.refetch} />
      </header>

      <div className="chip-row" role="tablist" aria-label="News feed">
        {FEEDS.map((slug) => {
          const l = leagueBySlug(slug);
          const active = feed.slug === slug && !feed.team;
          return (
            <button key={slug} type="button" role="tab" aria-selected={active} className={`chip ${active ? 'is-active' : ''}`} onClick={() => setFeed({ slug, team: null })}>
              {l && <Crest src={l.logo} srcDark={l.logoDark} name={l.name} size={16} />}
              {l ? l.short : 'Top stories'}
            </button>
          );
        })}
        {teams.map((t) => {
          const active = feed.team === t.id;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={active} className={`chip ${active ? 'is-active' : ''}`} onClick={() => setFeed({ slug: 'all', team: t.id })}>
              <Crest src={t.logo} name={t.name} size={16} />
              {t.name}
            </button>
          );
        })}
      </div>

      {news.isLoading ? (
        <div className="news-masonry">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} h={i === 0 ? 420 : 250} r={14} style={i === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : undefined} />
          ))}
        </div>
      ) : news.isError ? (
        <div className="card">
          <ErrorState error={news.error} onRetry={news.refetch} />
        </div>
      ) : news.data?.length ? (
        <div className="news-masonry">
          {news.data.map((a, i) => (
            <NewsCard key={a.id} article={a} variant={i === 0 ? 'feature' : 'card'} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={Newspaper} title="No stories in this feed right now" />
        </div>
      )}
    </div>
  );
}
