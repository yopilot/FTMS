import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CalendarClock, MapPin, Newspaper, Trophy, Users } from 'lucide-react';
import { useNews, useRoster, useStandings, useTeam, useTeamSchedule } from '../api/queries';
import { leagueBySlug } from '../api/leagues';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { visibleTeamColor } from '../lib/color';
import { countdown, formatLongDay, formatTime } from '../lib/format';
import { findStanding, groupSquad, rateSquad } from '../lib/squad';
import { POSITION_PLURAL } from '../lib/ratings';
import { resultFor } from '../lib/matchUtils';
import Crest from '../components/ui/Crest';
import { Tabs } from '../components/ui/Tabs';
import { FollowButton, FormGuide, OvrBadge } from '../components/ui/Bits';
import StandingsTable from '../components/league/StandingsTable';
import FixtureRow from '../components/team/FixtureRow';
import ManagerCard from '../components/team/ManagerCard';
import NewsCard from '../components/news/NewsCard';
import { Skeleton, SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function NextMatch({ match, teamId }) {
  if (!match) return null;
  const isHome = match.home.id === String(teamId);
  const opp = isHome ? match.away : match.home;
  const us = isHome ? match.home : match.away;
  return (
    <Link to={`/match/${match.id}`} className="card card-interactive next-match">
      <div className="card-header" style={{ borderBottom: 0, paddingBottom: 0 }}>
        <span className="eyebrow">{match.status.isLive ? 'Live now' : 'Next match'}</span>
        <span className="subtle" style={{ fontSize: 12 }}>
          {match.league.short}
        </span>
      </div>
      <div className="next-match-body">
        <span className="next-team">
          <Crest src={match.home.logo} srcDark={match.home.logoDark} name={match.home.name} size={48} />
          <span className="truncate">{match.home.short}</span>
        </span>
        <span className="next-center">
          {match.status.state === 'pre' ? (
            <>
              <span className="next-time tnum">{formatTime(match.date)}</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                {formatLongDay(match.date)}
              </span>
              <span className="badge badge-accent" style={{ marginTop: 6 }}>
                in {countdown(match.date)}
              </span>
            </>
          ) : (
            <>
              <span className="next-time tnum">
                {match.home.score}–{match.away.score}
              </span>
              <span className="live-text" style={{ fontSize: 12 }}>
                {match.status.label}
              </span>
            </>
          )}
        </span>
        <span className="next-team">
          <Crest src={match.away.logo} srcDark={match.away.logoDark} name={match.away.name} size={48} />
          <span className="truncate">{match.away.short}</span>
        </span>
      </div>
      <div className="card-footer subtle row gap-2" style={{ fontSize: 12 }}>
        <MapPin size={12} /> {match.venue || (isHome ? 'Home' : 'Away')} · {isHome ? 'Home' : 'Away'} vs {opp.short}
        <span className="sr-only">{us.name}</span>
      </div>
    </Link>
  );
}

function SquadTable({ players, loading }) {
  if (loading)
    return (
      <div className="card">
        <SkeletonRows rows={12} />
      </div>
    );
  if (!players.length)
    return (
      <div className="card">
        <EmptyState icon={Users} title="No squad list" text="ESPN doesn't publish a squad for this team." />
      </div>
    );
  const groups = groupSquad(players);
  return (
    <div className="card">
      <div className="squad-row is-head" style={{ paddingTop: 12 }}>
        <span className="squad-num">#</span>
        <span>Player</span>
        <span className="squad-cell hide-sm">Age</span>
        <span className="squad-cell" title="Appearances">
          Apps
        </span>
        <span className="squad-cell" title="Goals">
          G
        </span>
        <span className="squad-cell hide-sm" title="Assists">
          A
        </span>
        <span className="squad-cell" title="FTMS overall rating">
          OVR
        </span>
      </div>
      {Object.entries(groups).map(([pos, list]) =>
        list.length ? (
          <div key={pos} className="squad-group">
            <div className="squad-group-head">
              <span className="eyebrow">{POSITION_PLURAL[pos]}</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                {list.length}
              </span>
            </div>
            {list.map((p) => (
              <Link key={p.id} to={`/player/${p.id}`} className="squad-row">
                <span className="squad-num">{p.number || '–'}</span>
                <span className="squad-name">
                  {p.flag ? <img className="flag" src={p.flag} alt={p.nationality} title={p.nationality} loading="lazy" /> : <span className="flag" />}
                  <span className="truncate">{p.name}</span>
                  {p.injured && (
                    <span className="badge badge-danger" title={p.injuries[0]?.detail || 'Injured'}>
                      Inj
                    </span>
                  )}
                </span>
                <span className="squad-cell hide-sm">{p.age || '–'}</span>
                <span className="squad-cell">{p.stats.appearances ?? 0}</span>
                <span className="squad-cell">{p.stats.totalGoals ?? 0}</span>
                <span className="squad-cell hide-sm">{p.stats.goalAssists ?? 0}</span>
                <span className="squad-cell">
                  <OvrBadge value={p.ovr} />
                </span>
              </Link>
            ))}
          </div>
        ) : null,
      )}
      <div className="card-footer subtle" style={{ fontSize: 12 }}>
        OVR is an FTMS estimate from this season's ESPN stats, playing time and league position.
      </div>
    </div>
  );
}

export default function Team() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { theme } = useTheme();
  const { isTeamFav, toggleTeam } = useFavorites();
  const team = useTeam(id);
  const t = team.data;
  const slug = t?.slug;
  const league = slug ? leagueBySlug(slug) || t?.league : null;
  const roster = useRoster(slug, id);
  const standings = useStandings(slug);
  const fixtures = useTeamSchedule(id, true);
  const results = { data: t?.results || [], isLoading: team.isLoading };
  const news = useNews({ slug: slug || 'all', team: id, limit: 9 });
  useDocumentTitle(t?.name || 'Team');

  const players = useMemo(
    () => rateSquad(roster.data, { slug, standings: standings.data, teamId: id, teamGames: 0 }),
    [roster.data, slug, standings.data, id],
  );

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'squad', label: 'Squad', badge: players.length || null },
    { value: 'fixtures', label: 'Fixtures' },
    { value: 'results', label: 'Results' },
    { value: 'news', label: 'News' },
  ];
  const tab = tabs.some((x) => x.value === params.get('tab')) ? params.get('tab') : 'overview';

  if (team.isLoading) {
    return (
      <div className="page">
        <div className="hero" style={{ padding: 24 }}>
          <div className="row gap-4">
            <Skeleton w={88} h={88} r={22} />
            <div className="stack gap-2 grow">
              <Skeleton w={120} h={12} />
              <Skeleton w={260} h={28} />
              <Skeleton w={180} h={12} />
            </div>
          </div>
        </div>
        <div className="card">
          <SkeletonRows rows={8} />
        </div>
      </div>
    );
  }
  if (team.isError || !t) {
    return (
      <div className="page">
        <div className="card">
          <ErrorState title="Team not found" error={team.error} onRetry={team.refetch} />
        </div>
      </div>
    );
  }

  const color = visibleTeamColor(t.color, t.altColor, theme);
  const recent = (results.data || []).filter((m) => m.status.state === 'post').slice(-5);
  const form = recent.map((m) => resultFor(m, id)).join('');
  const upcoming = (fixtures.data || []).filter((m) => m.status.state !== 'post');
  const next = upcoming[0];
  const st = findStanding(standings.data, id);
  const tableSlice = (() => {
    if (!st) return [];
    const entries = st.group.entries;
    const i = entries.findIndex((e) => e.team.id === String(id));
    const start = Math.max(0, Math.min(i - 3, entries.length - 7));
    return entries.slice(start, start + 7);
  })();
  const topScorers = [...players].sort((a, b) => (b.stats.totalGoals || 0) - (a.stats.totalGoals || 0)).filter((p) => p.stats.totalGoals > 0).slice(0, 5);
  const avgAge = players.length ? (players.reduce((s, p) => s + (p.age || 0), 0) / players.filter((p) => p.age).length).toFixed(1) : null;
  const nations = new Set(players.map((p) => p.nationality).filter(Boolean)).size;

  return (
    <div className="page" style={{ gap: 'var(--sp-5)' }}>
      <section className="hero">
        <div
          className="hero-wash"
          style={{ background: `radial-gradient(90% 160% at 0% 0%, color-mix(in srgb, ${color} 28%, transparent), transparent 62%)` }}
        />
        <div className="hero-body">
          <span className="hero-crest">
            <Crest src={t.logo} srcDark={t.logoDark} name={t.name} color={t.color} size={64} />
          </span>
          <div className="grow" style={{ minWidth: 0 }}>
            {league ? (
              <Link to={`/league/${league.slug}`} className="eyebrow row gap-2" style={{ width: 'fit-content' }}>
                <Crest src={league.logo} srcDark={league.logoDark} name={league.name} size={14} /> {league.name}
              </Link>
            ) : (
              <p className="eyebrow">{t.isNational ? 'National team' : 'Club'}</p>
            )}
            <h1 className="hero-title" style={{ marginTop: 6 }}>
              {t.name}
            </h1>
            <div className="hero-meta">
              {t.standingSummary && (
                <span>
                  <Trophy size={13} /> {t.standingSummary}
                </span>
              )}
              {t.record && <span className="tnum">W-D-L {t.record}</span>}
              {form && <FormGuide form={form} size="sm" />}
            </div>
          </div>
          <div className="hero-actions">
            <FollowButton on={isTeamFav(id)} onToggle={() => toggleTeam(t)} />
          </div>
        </div>
        <div className="hero-tabs">
          <Tabs items={tabs} value={tab} onChange={(v) => setParams(v === 'overview' ? {} : { tab: v }, { replace: true })} ariaLabel="Team sections" />
        </div>
      </section>

      {tab === 'overview' && (
        <div className="split">
          <div className="stack gap-4" style={{ minWidth: 0 }}>
            {next ? (
              <NextMatch match={next} teamId={id} />
            ) : (
              fixtures.isLoading && <Skeleton h={180} r={14} />
            )}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent results</span>
                <button type="button" className="link-quiet" onClick={() => setParams({ tab: 'results' }, { replace: true })}>
                  All results
                </button>
              </div>
              {results.isLoading ? (
                <SkeletonRows rows={5} />
              ) : recent.length ? (
                [...recent].reverse().map((m) => <FixtureRow key={m.id} m={m} teamId={id} />)
              ) : (
                <EmptyState compact title="No results yet this season" />
              )}
            </div>
            {topScorers.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Top scorers in the squad</span>
                </div>
                {topScorers.map((p) => (
                  <Link key={p.id} to={`/player/${p.id}`} className="list-row">
                    <span className="squad-num" style={{ width: 22 }}>
                      {p.number}
                    </span>
                    <span className="grow truncate" style={{ fontWeight: 600 }}>
                      {p.name}
                    </span>
                    <span className="subtle tnum" style={{ fontSize: 12 }}>
                      {p.stats.appearances} apps · {p.stats.goalAssists || 0} ast
                    </span>
                    <span className="leader-val tnum" style={{ minWidth: 28, textAlign: 'right' }}>
                      {p.stats.totalGoals}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            {news.data?.length > 0 && (
              <div className="section">
                <h3 className="section-title" style={{ fontSize: 15 }}>
                  <Newspaper size={16} /> Latest news
                </h3>
                <div className="grid-3">
                  {news.data.slice(0, 3).map((a) => (
                    <NewsCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside>
            <ManagerCard team={t} women={league?.women} />
            {tableSlice.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">{st.group.name || league?.short || 'Table'}</span>
                  {league && (
                    <Link to={`/league/${league.slug}`} className="link-quiet">
                      Full table
                    </Link>
                  )}
                </div>
                <StandingsTable entries={tableSlice} compact highlight={[id]} showLegend={false} />
              </div>
            )}
            {players.length > 0 && (
              <div className="kv">
                <div className="kv-item">
                  <span className="kv-label">Squad</span>
                  <span className="kv-value">{players.length}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Avg age</span>
                  <span className="kv-value">{avgAge}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Nations</span>
                  <span className="kv-value">{nations}</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === 'squad' && <SquadTable players={players} loading={roster.isLoading || (!slug && team.isFetching)} />}

      {tab === 'fixtures' && (
        <div className="card" style={{ maxWidth: 860 }}>
          {fixtures.isLoading ? (
            <SkeletonRows rows={8} />
          ) : upcoming.length ? (
            upcoming.map((m) => <FixtureRow key={m.id} m={m} teamId={id} />)
          ) : (
            <EmptyState icon={CalendarClock} title="No upcoming fixtures" />
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="card" style={{ maxWidth: 860 }}>
          {results.isLoading ? (
            <SkeletonRows rows={8} />
          ) : results.data?.length ? (
            [...results.data].reverse().map((m) => <FixtureRow key={m.id} m={m} teamId={id} />)
          ) : (
            <EmptyState icon={CalendarClock} title="No results yet" />
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="news-masonry">
          {news.isLoading
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={240} r={14} />)
            : (news.data || []).map((a, i) => <NewsCard key={a.id} article={a} variant={i === 0 ? 'feature' : 'card'} />)}
        </div>
      )}
    </div>
  );
}
