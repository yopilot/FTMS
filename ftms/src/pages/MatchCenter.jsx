import { useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Info, ListOrdered, MessageSquareText, Newspaper } from 'lucide-react';
import { useMatch } from '../api/queries';
import MatchHero from '../components/match/MatchHero';
import Timeline from '../components/match/Timeline';
import LineupPitch from '../components/match/LineupPitch';
import EventIcon from '../components/match/EventIcon';
import StandingsTable from '../components/league/StandingsTable';
import NewsCard from '../components/news/NewsCard';
import Crest from '../components/ui/Crest';
import { Tabs } from '../components/ui/Tabs';
import { FormGuide, RatingBadge, StatCompareRow, PosBadge } from '../components/ui/Bits';
import { Skeleton, SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { formatShortDate } from '../lib/format';
import { distinctKits } from '../lib/color';
import { useTheme } from '../context/ThemeContext';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import UpdatedAgo from '../components/ui/UpdatedAgo';

function TopRated({ lineups, home, away }) {
  const all = [
    ...(lineups.home ? [...lineups.home.starters, ...lineups.home.subs].map((p) => ({ ...p, team: home })) : []),
    ...(lineups.away ? [...lineups.away.starters, ...lineups.away.subs].map((p) => ({ ...p, team: away })) : []),
  ]
    .filter((p) => p.rating != null)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  if (!all.length) return null;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Top rated</span>
        <span className="subtle" style={{ fontSize: 12 }}>
          FTMS ratings
        </span>
      </div>
      {all.map((p, i) => (
        <Link key={`${p.team.id}-${p.id}`} to={`/player/${p.id}`} className="list-row">
          <span className="leader-rank tnum">{i + 1}</span>
          <Crest src={p.team.logo} name={p.team.name} size={20} />
          <span className="grow">
            <span className="truncate" style={{ display: 'block', fontWeight: 600 }}>
              {p.name}
            </span>
            <span className="subtle" style={{ fontSize: 12 }}>
              {p.posName || p.pos}
              {p.goals ? ` · ${p.goals} goal${p.goals > 1 ? 's' : ''}` : ''}
              {p.assists ? ` · ${p.assists} assist${p.assists > 1 ? 's' : ''}` : ''}
            </span>
          </span>
          <RatingBadge value={p.rating} />
        </Link>
      ))}
    </div>
  );
}

function KeyStats({ stats, hc, ac, onMore }) {
  const keys = ['possessionPct', 'totalShots', 'shotsOnTarget', 'wonCorners'];
  const picked = keys.map((k) => stats.find((s) => s.key === k)).filter(Boolean);
  if (!picked.length) return null;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Key stats</span>
        <button type="button" className="link-quiet" onClick={onMore}>
          All stats
        </button>
      </div>
      <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
        {picked.map((s) => (
          <StatCompareRow key={s.key} label={s.label} home={s.home} away={s.away} unit={s.unit || ''} homeColor={hc} awayColor={ac} />
        ))}
      </div>
    </div>
  );
}

function FormCard({ lastFive, home, away }) {
  if (!lastFive?.length) return null;
  const rows = [home, away].map((t) => ({ team: t, data: lastFive.find((x) => x.teamId === t.id) })).filter((r) => r.data?.events?.length);
  if (!rows.length) return null;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Recent form</span>
        <span className="subtle" style={{ fontSize: 12 }}>
          Last 5, newest right
        </span>
      </div>
      {rows.map(({ team, data }) => (
        <Link key={team.id} to={`/team/${team.id}`} className="list-row">
          <Crest src={team.logo} name={team.name} size={22} />
          <span className="grow truncate" style={{ fontWeight: 600 }}>
            {team.short}
          </span>
          <FormGuide form={[...data.events].reverse().map((e) => e.result).join('')} />
        </Link>
      ))}
    </div>
  );
}

function Subs({ lineup, team }) {
  if (!lineup) return null;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Crest src={team.logo} name={team.name} size={20} /> {team.short}
        </span>
        <span className="subtle" style={{ fontSize: 12 }}>
          {lineup.formation}
        </span>
      </div>
      <div className="eyebrow" style={{ padding: '12px 20px 4px' }}>
        Starting XI
      </div>
      {lineup.starters.map((p) => (
        <PlayerLine key={p.id} p={p} />
      ))}
      {lineup.subs.length > 0 && (
        <>
          <div className="eyebrow" style={{ padding: '14px 20px 4px' }}>
            Substitutes
          </div>
          {lineup.subs.map((p) => (
            <PlayerLine key={p.id} p={p} />
          ))}
        </>
      )}
    </div>
  );
}

function PlayerLine({ p }) {
  return (
    <Link to={`/player/${p.id}`} className={`list-row ${!p.starter && !p.subbedIn ? 'is-unused' : ''}`} style={{ paddingTop: 8, paddingBottom: 8 }}>
      <span className="squad-num" style={{ width: 22 }}>
        {p.number}
      </span>
      <span className="grow">
        <span className="truncate" style={{ display: 'block', fontWeight: 600, fontSize: 13.5 }}>
          {p.name}
        </span>
        <span className="subtle" style={{ fontSize: 12 }}>
          {p.posName || p.pos}
          {p.subbedIn && p.subMinute ? ` · on ${p.subMinute}` : ''}
          {p.subbedOut && p.subMinute ? ` · off ${p.subMinute}` : ''}
        </span>
      </span>
      <span className="row gap-1">
        {Array.from({ length: Math.min(p.goals || 0, 3) }, (_, i) => (
          <EventIcon key={i} kind="goal" size={13} />
        ))}
        {p.red ? <EventIcon kind="red" size={13} /> : p.yellow ? <EventIcon kind="yellow" size={13} /> : null}
      </span>
      <PosBadge pos={p.pos} />
      <span style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>
        <RatingBadge value={p.rating} size="sm" />
      </span>
    </Link>
  );
}

function H2H({ data, home, away }) {
  if (!data.h2h.length) return <EmptyState compact icon={Info} title="No recent meetings" text="These teams haven't met recently in ESPN's records." />;
  return (
    <>
      {data.h2hSummary && (
        <div className="card-body" style={{ paddingBottom: 6 }}>
          <span className="muted">{data.h2hSummary}</span>
        </div>
      )}
      {data.h2h.map((g) => (
        <Link key={g.id} to={`/match/${g.id}`} className="h2h-row">
          <span className="fixture-date">{formatShortDate(g.date)}</span>
          <span className={`h2h-team home ${g.home?.winner ? 'is-win' : ''}`}>
            <span className="truncate">{g.home?.short}</span>
            <Crest src={g.home?.logo} name={g.home?.name} size={20} />
          </span>
          <span className="h2h-score tnum">
            {g.home?.score ?? '-'} – {g.away?.score ?? '-'}
          </span>
          <span className={`h2h-team ${g.away?.winner ? 'is-win' : ''}`}>
            <Crest src={g.away?.logo} name={g.away?.name} size={20} />
            <span className="truncate">{g.away?.short}</span>
          </span>
        </Link>
      ))}
      <div className="card-footer subtle" style={{ fontSize: 12 }}>
        {home.short} vs {away.short} · most recent first
      </div>
    </>
  );
}

function Commentary({ items }) {
  if (!items.length) return <EmptyState compact icon={MessageSquareText} title="No commentary yet" text="Play-by-play appears here once the match starts." />;
  return (
    <ol className="commentary">
      {items.map((c) => (
        <li key={c.id} className={`comm-item ${c.kind ? `is-${c.kind}` : ''}`}>
          <span className="comm-min tnum">{c.minute || ''}</span>
          <span className="comm-icon">{c.kind && <EventIcon kind={c.kind} size={14} />}</span>
          <span className="comm-text">{c.text}</span>
        </li>
      ))}
    </ol>
  );
}

function MatchSkeleton() {
  return (
    <div className="page">
      <div className="hero" style={{ padding: 28 }}>
        <Skeleton w={200} h={14} />
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 28 }}>
          <Skeleton w={72} h={72} r={36} />
          <Skeleton w={140} h={48} />
          <Skeleton w={72} h={72} r={36} />
        </div>
      </div>
      <div className="card">
        <SkeletonRows rows={6} />
      </div>
    </div>
  );
}

export default function MatchCenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = useMatch(id);
  const { theme } = useTheme();
  const data = q.data;
  const m = data?.match;
  useDocumentTitle(m ? `${m.home.short} ${m.status.state === 'pre' ? 'v' : `${m.home.score}–${m.away.score}`} ${m.away.short}` : 'Match');

  const tabs = useMemo(() => {
    if (!data) return [];
    const t = [{ value: 'overview', label: 'Overview' }];
    if (data.lineups.home || data.lineups.away) t.push({ value: 'lineups', label: 'Lineups' });
    if (data.stats.length) t.push({ value: 'stats', label: 'Stats' });
    if (data.commentary.length) t.push({ value: 'commentary', label: 'Commentary' });
    if (data.standings.length) t.push({ value: 'table', label: 'Table' });
    t.push({ value: 'h2h', label: 'Head-to-head' });
    return t;
  }, [data]);

  if (q.isLoading) return <MatchSkeleton />;
  if (q.isError || !m) {
    return (
      <div className="page">
        <div className="card">
          <ErrorState title="Match not found" error={q.error} onRetry={q.refetch} />
        </div>
      </div>
    );
  }

  const requested = params.get('tab');
  const tab = tabs.some((t) => t.value === requested) ? requested : 'overview';
  const setTab = (v) => setParams(v === 'overview' ? {} : { tab: v }, { replace: true });
  const { home: hc, away: ac } = distinctKits(m.home, m.away, theme);
  const started = m.status.state !== 'pre';
  const hasLineups = Boolean(data.lineups.home || data.lineups.away);

  return (
    <div className="page" style={{ gap: 'var(--sp-5)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="back-link" style={{ marginBottom: 0 }} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/matches'))}>
          <ArrowLeft size={15} /> Back
        </button>
        {m.status.isLive && <UpdatedAgo at={q.dataUpdatedAt} fetching={q.isFetching} onRefresh={q.refetch} live />}
      </div>

      <MatchHero match={m} events={data.events} />

      <Tabs items={tabs} value={tab} onChange={setTab} ariaLabel="Match sections" />

      {tab === 'overview' && (
        <div className="split">
          <div className="stack gap-4" style={{ minWidth: 0 }}>
            {started && data.events.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Key events</span>
                  {m.status.isLive && <span className="badge badge-live">Updating live</span>}
                </div>
                <Timeline events={data.events} homeName={m.home.short} awayName={m.away.short} />
              </div>
            ) : (
              <div className="card">
                <EmptyState
                  compact
                  icon={started ? ListOrdered : ClipboardList}
                  title={started ? 'No key events yet' : 'Match preview'}
                  text={
                    started
                      ? 'Goals, cards and substitutions show up here as they happen.'
                      : hasLineups
                        ? 'Lineups are in. Open the Lineups tab to see both XIs.'
                        : 'Lineups usually arrive about an hour before kick-off. This page refreshes on its own.'
                  }
                  action={
                    hasLineups && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTab('lineups')}>
                        View lineups
                      </button>
                    )
                  }
                />
              </div>
            )}
            {!started && data.standings.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">{data.standingsTitle || 'Table'}</span>
                </div>
                <StandingsTable entries={data.standings[0].entries} compact highlight={[m.home.id, m.away.id]} showLegend={false} />
              </div>
            )}
            {data.news.length > 0 && (
              <div className="section">
                <h3 className="section-title" style={{ fontSize: 15 }}>
                  <Newspaper size={16} /> Related news
                </h3>
                <div className="grid-2">
                  {data.news.slice(0, 4).map((a) => (
                    <NewsCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside>
            <TopRated lineups={data.lineups} home={m.home} away={m.away} />
            <KeyStats stats={data.stats} hc={hc} ac={ac} onMore={() => setTab('stats')} />
            <FormCard lastFive={data.lastFive} home={m.home} away={m.away} />
          </aside>
        </div>
      )}

      {tab === 'lineups' && (
        <div className="lineups-layout">
          <div className="stack gap-3">
            <LineupPitch lineups={data.lineups} home={m.home} away={m.away} />
            <p className="subtle" style={{ fontSize: 12 }}>
              Ratings are FTMS estimates computed from ESPN match stats (goals, assists, shots, saves, cards and the result). They update live.
            </p>
          </div>
          <div className="stack gap-4">
            <Subs lineup={data.lineups.home} team={m.home} />
            <Subs lineup={data.lineups.away} team={m.away} />
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="card" style={{ maxWidth: 760 }}>
          <div className="card-header">
            <span className="card-title">
              <Crest src={m.home.logo} name={m.home.name} size={20} /> {m.home.short}
            </span>
            <span className="card-title">
              {m.away.short} <Crest src={m.away.logo} name={m.away.name} size={20} />
            </span>
          </div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            {data.stats.map((s) => (
              <StatCompareRow key={s.key} label={s.label} home={s.home} away={s.away} unit={s.unit || ''} homeColor={hc} awayColor={ac} />
            ))}
          </div>
        </div>
      )}

      {tab === 'commentary' && (
        <div className="card" style={{ maxWidth: 860 }}>
          <Commentary items={data.commentary} />
        </div>
      )}

      {tab === 'table' && data.standings.length > 0 && (
        <div className="stack gap-4">
          {data.standings.map((g, i) => (
            <div key={g.name || i} className="card">
              <div className="card-header">
                <span className="card-title">{g.name || data.standingsTitle || 'Table'}</span>
                {m.league.slug && (
                  <Link to={`/league/${m.league.slug}`} className="link-quiet">
                    Competition page
                  </Link>
                )}
              </div>
              <StandingsTable entries={g.entries} highlight={[m.home.id, m.away.id]} showLegend={false} />
            </div>
          ))}
        </div>
      )}

      {tab === 'h2h' && (
        <div className="card" style={{ maxWidth: 760 }}>
          <div className="card-header">
            <span className="card-title">Previous meetings</span>
          </div>
          <H2H data={data} home={m.home} away={m.away} />
        </div>
      )}
    </div>
  );
}
