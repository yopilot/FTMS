import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Newspaper, Zap } from 'lucide-react';
import { useDayMatches, useLeaders, useNews, useStandings } from '../api/queries';
import { HOME_TABLE_LEAGUES, leagueBySlug } from '../api/leagues';
import { todayKey } from '../lib/dates';
import { formatLongDay, pluralize } from '../lib/format';
import { groupByLeague, isTopLeague } from '../lib/matchUtils';
import { useFavorites } from '../context/FavoritesContext';
import LiveCard from '../components/match/LiveCard';
import LeagueGroup from '../components/match/LeagueGroup';
import NewsCard from '../components/news/NewsCard';
import StandingsTable from '../components/league/StandingsTable';
import LeadersList from '../components/league/LeadersList';
import ManagerWidget from '../components/manager/ManagerWidget';
import Crest from '../components/ui/Crest';
import { Skeleton, SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { LiveDot } from '../components/ui/Bits';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useNow } from '../lib/useNow';

function LiveRail({ day }) {
  const now = useNow(60000);
  const live = day.matches.filter((m) => m.status.isLive);
  const upcoming = day.matches.filter((m) => m.status.state === 'pre' && new Date(m.date).getTime() > now - 60000);
  const { leagues } = useFavorites();
  const showingLive = live.length > 0;
  const prioritise = (list) =>
    [...list].sort((a, b) => {
      const ta = isTopLeague(a.league, leagues) ? 0 : 1;
      const tb = isTopLeague(b.league, leagues) ? 0 : 1;
      return ta - tb || (a.league.p ?? 500) - (b.league.p ?? 500) || new Date(a.date) - new Date(b.date);
    });
  const items = prioritise(showingLive ? live : upcoming).slice(0, 14);

  return (
    <section className="section" aria-labelledby="live-title">
      <div className="section-head">
        <div>
          <h2 id="live-title" className="section-title">
            {showingLive ? (
              <>
                <LiveDot /> Live now
              </>
            ) : (
              <>
                <CalendarClock size={17} /> Up next
              </>
            )}
          </h2>
          <p className="section-sub">
            {showingLive ? `${pluralize(live.length, 'match', 'matches')} in play worldwide` : 'Next kick-offs today'}
          </p>
        </div>
        <Link to={showingLive ? '/matches?filter=live' : '/matches'} className="link">
          {showingLive ? 'All live' : 'All scores'} <ArrowRight size={14} />
        </Link>
      </div>
      {day.isLoading ? (
        <div className="rail">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card" style={{ height: 132, padding: 16 }}>
              <Skeleton w="50%" h={10} />
              <Skeleton w="80%" h={14} style={{ marginTop: 18 }} />
              <Skeleton w="70%" h={14} style={{ marginTop: 12 }} />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="rail">
          {items.map((m, i) => (
            <LiveCard key={m.id} m={m} index={i} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState compact icon={Zap} title="Nothing live right now" text="Check the scores page for today's results and tomorrow's fixtures." />
        </div>
      )}
    </section>
  );
}

function TopStories() {
  const news = useNews({ limit: 9 });
  const items = news.data || [];
  return (
    <section className="section" aria-labelledby="news-title">
      <div className="section-head">
        <div>
          <h2 id="news-title" className="section-title">
            Top stories
          </h2>
          <p className="section-sub">Latest from around the game</p>
        </div>
        <Link to="/news" className="link">
          More news <ArrowRight size={14} />
        </Link>
      </div>
      {news.isLoading ? (
        <div className="news-grid">
          <Skeleton h={300} r={14} />
          <div className="stack gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} h={64} r={10} />
            ))}
          </div>
        </div>
      ) : news.isError ? (
        <div className="card">
          <ErrorState compact error={news.error} onRetry={news.refetch} />
        </div>
      ) : items.length ? (
        <div className="news-grid">
          <NewsCard article={items[0]} variant="feature" />
          <div className="card news-list">
            {items.slice(1, 6).map((a) => (
              <NewsCard key={a.id} article={a} variant="row" />
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState compact icon={Newspaper} title="No stories yet" />
        </div>
      )}
    </section>
  );
}

function TodayMatches({ day }) {
  const { leagues, teams } = useFavorites();
  const favIds = useMemo(() => new Set(teams.map((t) => t.id)), [teams]);
  const groups = useMemo(() => {
    const all = groupByLeague(day.matches, leagues, favIds);
    return all.filter((g) => g.isFav || g.league.top || g.hasFavTeam).slice(0, 8);
  }, [day.matches, leagues, favIds]);

  return (
    <section className="section" aria-labelledby="today-title">
      <div className="section-head">
        <div>
          <h2 id="today-title" className="section-title">
            Today's top matches
          </h2>
          <p className="section-sub">Your competitions first. Follow a league with the star.</p>
        </div>
        <Link to="/matches" className="link">
          All {day.matches.length || ''} matches <ArrowRight size={14} />
        </Link>
      </div>
      {day.isLoading ? (
        <div className="card">
          <SkeletonRows rows={6} />
        </div>
      ) : day.isError ? (
        <div className="card">
          <ErrorState compact error={day.error} onRetry={day.refetch} />
        </div>
      ) : groups.length ? (
        <div className="lgroup-list">
          {groups.map((g) => (
            <LeagueGroup key={g.league.id} league={g.league} matches={g.matches} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            compact
            icon={CalendarClock}
            title="No top-flight matches today"
            text="Smaller competitions are still playing."
            action={
              <Link to="/matches" className="btn btn-secondary btn-sm">
                See all scores
              </Link>
            }
          />
        </div>
      )}
    </section>
  );
}

function LeagueSwitch({ value, onChange }) {
  return (
    <div className="chip-row" role="tablist" aria-label="Choose competition">
      {HOME_TABLE_LEAGUES.map((slug) => {
        const l = leagueBySlug(slug);
        return (
          <button key={slug} type="button" role="tab" aria-selected={value === slug} className={`chip ${value === slug ? 'is-active' : ''}`} onClick={() => onChange(slug)}>
            <Crest src={l.logo} srcDark={l.logoDark} name={l.name} size={16} />
            {l.short}
          </button>
        );
      })}
    </div>
  );
}

function TableWidget({ slug }) {
  const st = useStandings(slug);
  const group = st.data?.groups?.[0];
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Table</span>
        <Link to={`/league/${slug}`} className="link-quiet">
          Full table <ArrowRight size={13} />
        </Link>
      </div>
      {st.isLoading ? (
        <SkeletonRows rows={8} height={40} />
      ) : group ? (
        <StandingsTable entries={group.entries} compact limit={10} showLegend={false} />
      ) : (
        <EmptyState compact title="No table available" />
      )}
    </div>
  );
}

function ScorersWidget({ slug }) {
  const ld = useLeaders(slug);
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Top scorers</span>
        <Link to={`/league/${slug}?tab=players`} className="link-quiet">
          All <ArrowRight size={13} />
        </Link>
      </div>
      {ld.isLoading ? <SkeletonRows rows={5} height={52} /> : ld.data?.goals?.length ? <LeadersList items={ld.data.goals} limit={5} /> : <EmptyState compact title="No scorers yet" />}
    </div>
  );
}

export default function Home() {
  useDocumentTitle(null);
  const day = useDayMatches(todayKey());
  const [slug, setSlug] = useState(HOME_TABLE_LEAGUES[0]);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{formatLongDay(new Date())}</p>
          <h1 className="page-title" style={{ marginTop: 6 }}>
            Matchday
          </h1>
        </div>
        {!day.isLoading && day.matches.length > 0 && (
          <div className="home-stats">
            <span>
              <strong className="tnum">{day.liveCount}</strong> live
            </span>
            <span>
              <strong className="tnum">{day.matches.filter((m) => m.status.state === 'post').length}</strong> finished
            </span>
            <span>
              <strong className="tnum">{day.matches.filter((m) => m.status.state === 'pre').length}</strong> to come
            </span>
          </div>
        )}
      </header>

      <div className="home-grid">
        <div className="home-main">
          <LiveRail day={day} />
          <TopStories />
          <TodayMatches day={day} />
        </div>
        <aside className="home-side">
          <ManagerWidget />
          <div className="section">
            <LeagueSwitch value={slug} onChange={setSlug} />
            <TableWidget slug={slug} />
          </div>
          <ScorersWidget slug={slug} />
        </aside>
      </div>
    </div>
  );
}
