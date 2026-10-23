import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarPlus, ClipboardList, Newspaper, Shuffle, Trophy, UserPlus } from 'lucide-react';
import { useClub, useLocalMatches } from '../../context/ClubContext';
import { useMatch, useNews, useTeamSchedule, useManager } from '../../api/queries';
import { formatLongDay, formatTime, ordinal } from '../../lib/format';
import { resultFor } from '../../lib/matchUtils';
import Crest from '../../components/ui/Crest';
import Avatar from '../../components/ui/Avatar';
import { FormGuide, OvrBadge } from '../../components/ui/Bits';
import { Skeleton, SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/States';
import StandingsTable from '../../components/league/StandingsTable';
import FixtureRow from '../../components/team/FixtureRow';
import NewsCard from '../../components/news/NewsCard';
import Countdown from '../../components/manager/Countdown';
import { ChecklistCard, LineupSummaryCard, SquadStatusCard } from '../../components/manager/DugoutWidgets';

function NextUp({ match, clubId }) {
  const detail = useMatch(match?.id);
  if (!match) return null;
  const isHome = match.home.id === String(clubId);
  const opp = isHome ? match.away : match.home;
  const oppForm = detail.data?.lastFive?.find((t) => t.teamId === opp.id);
  const oppStanding = detail.data?.standings?.[0]?.entries?.find((e) => e.team.id === opp.id);
  const live = match.status.isLive;

  return (
    <div className="card nextup">
      <div className="card-header">
        <span className="card-title">{live ? 'Playing now' : 'Next match'}</span>
        <span className="subtle" style={{ fontSize: 12 }}>
          {match.league.short} · {isHome ? 'Home' : 'Away'}
        </span>
      </div>
      <div className="nextup-body">
        <div className="nextup-team">
          <Crest src={match.home.logo} srcDark={match.home.logoDark} name={match.home.name} size={60} />
          <span className="truncate" style={{ maxWidth: '100%' }}>
            {match.home.short}
          </span>
        </div>
        <div className="nextup-center">
          {live ? (
            <>
              <span style={{ fontSize: 34, fontWeight: 800 }} className="tnum">
                {match.home.score}–{match.away.score}
              </span>
              <span className="badge badge-live">{match.status.label}</span>
            </>
          ) : (
            <>
              <Countdown to={match.date} />
              <span className="nextup-meta" style={{ marginTop: 8 }}>
                {formatLongDay(match.date)} · {formatTime(match.date)}
              </span>
            </>
          )}
        </div>
        <div className="nextup-team">
          <Crest src={match.away.logo} srcDark={match.away.logoDark} name={match.away.name} size={60} />
          <span className="truncate" style={{ maxWidth: '100%' }}>
            {match.away.short}
          </span>
        </div>
      </div>
      <div className="card-footer row gap-3" style={{ flexWrap: 'wrap' }}>
        <span className="grow row gap-3 subtle" style={{ fontSize: 12.5, flexWrap: 'wrap' }}>
          <span>
            Opponent: <strong style={{ color: 'var(--text)' }}>{opp.short}</strong>
          </span>
          {oppStanding && <span>{ordinal(oppStanding.rank)} in the table</span>}
          {oppForm?.events?.length > 0 && <FormGuide form={[...oppForm.events].reverse().map((e) => e.result).join('')} size="sm" />}
        </span>
        <Link to={`/match/${match.id}`} className="btn btn-ghost btn-sm">
          Preview
        </Link>
        <Link to="/manager/tactics" className="btn btn-primary btn-sm">
          <ClipboardList size={14} /> Prepare lineup
        </Link>
      </div>
    </div>
  );
}

function ManagerProfile() {
  const { session, team } = useClub();
  const mgr = useManager(team ? { id: team.id, name: team.name } : null);
  return (
    <div className="card card-body person-card">
      <Avatar src={session.managerImage || mgr.data?.image} name={session.managerName} size={52} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="eyebrow">Manager</div>
        <div className="person-name truncate">{session.managerName}</div>
        <div className="subtle" style={{ fontSize: 12 }}>
          {mgr.data?.since ? `At the club since ${new Date(mgr.data.since).getFullYear()}` : session.clubName}
        </div>
      </div>
    </div>
  );
}

function RealDugout() {
  const { session, team, standing, players } = useClub();
  const fixtures = useTeamSchedule(session.clubId, true);
  const news = useNews({ slug: session.leagueSlug || 'all', team: session.clubId, limit: 6 });
  const next = fixtures.data?.find((m) => m.status.state !== 'post');
  const results = (team?.results || []).filter((m) => m.status.state === 'post');
  const recent = results.slice(-5).reverse();
  const form = results
    .slice(-5)
    .map((m) => resultFor(m, session.clubId))
    .join('');

  const tableSlice = useMemo(() => {
    if (!standing) return [];
    const entries = standing.group.entries;
    const i = entries.findIndex((e) => e.team.id === session.clubId);
    const start = Math.max(0, Math.min(i - 2, entries.length - 5));
    return entries.slice(start, start + 5);
  }, [standing, session.clubId]);

  const scorers = [...players]
    .filter((p) => p.stats?.totalGoals || p.stats?.goalAssists)
    .sort((a, b) => (b.stats.totalGoals || 0) * 2 + (b.stats.goalAssists || 0) - ((a.stats.totalGoals || 0) * 2 + (a.stats.goalAssists || 0)))
    .slice(0, 5);

  return (
    <div className="dugout">
      <div className="dugout-main">
        {fixtures.isLoading ? <Skeleton h={230} r={14} /> : next ? <NextUp match={next} clubId={session.clubId} /> : <div className="card"><EmptyState compact title="No upcoming fixtures" /></div>}
        <LineupSummaryCard />
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent results</span>
            {form && <FormGuide form={form} size="sm" />}
          </div>
          {!team ? <SkeletonRows rows={5} /> : recent.length ? recent.map((m) => <FixtureRow key={m.id} m={m} teamId={session.clubId} />) : <EmptyState compact title="No results yet" />}
        </div>
        {news.data?.length > 0 && (
          <div className="section">
            <h3 className="section-title" style={{ fontSize: 15 }}>
              <Newspaper size={16} /> Club news
            </h3>
            <div className="grid-2">
              {news.data.slice(0, 4).map((a) => (
                <NewsCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="dugout-side">
        <ManagerProfile />
        <ChecklistCard />
        <SquadStatusCard />
        {tableSlice.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">League position</span>
              <Link to={`/league/${session.leagueSlug}`} className="link-quiet">
                Table
              </Link>
            </div>
            <StandingsTable entries={tableSlice} compact highlight={[session.clubId]} showLegend={false} />
          </div>
        )}
        {scorers.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top performers</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                G · A
              </span>
            </div>
            {scorers.map((p) => (
              <Link key={p.id} to={`/player/${p.id}`} className="list-row" style={{ paddingTop: 8, paddingBottom: 8 }}>
                <span className="grow truncate" style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {p.name}
                </span>
                <span className="tnum" style={{ fontWeight: 700 }}>
                  {p.stats.totalGoals || 0} · {p.stats.goalAssists || 0}
                </span>
                <OvrBadge value={p.ovr} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomDugout() {
  const { session, players } = useClub();
  const matches = useLocalMatches();
  const upcoming = (matches.data || []).filter((m) => m.status === 'upcoming').sort((a, b) => new Date(a.date) - new Date(b.date));
  const completed = (matches.data || []).filter((m) => m.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date));
  const next = upcoming[0];
  const top = [...players].sort((a, b) => b.ovr - a.ovr).slice(0, 5);

  return (
    <div className="dugout">
      <div className="dugout-main">
        <div className="card nextup">
          <div className="card-header">
            <span className="card-title">Next match</span>
            <Link to="/manager/matches" className="link-quiet">
              All matches
            </Link>
          </div>
          {next ? (
            <div className="card-body row gap-4" style={{ flexWrap: 'wrap' }}>
              <div className="grow" style={{ minWidth: 200 }}>
                <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-0.02em' }}>{next.title}</div>
                <div className="subtle" style={{ fontSize: 13, marginTop: 4 }}>
                  {formatLongDay(next.date)} {next.time ? `· ${next.time}` : ''} {next.venue ? `· ${next.venue}` : ''}
                </div>
                <div className="subtle" style={{ fontSize: 13 }}>
                  {next.selectedPlayerIds?.length || 0} players selected
                </div>
              </div>
              <Countdown to={`${next.date}T${next.time || '12:00'}`} />
              <div className="row gap-2" style={{ width: '100%' }}>
                <Link to={`/manager/matches/${next.id}`} className="btn btn-primary btn-sm">
                  Open match <ArrowRight size={14} />
                </Link>
                <Link to="/manager/builder" className="btn btn-secondary btn-sm">
                  <Shuffle size={14} /> Generate teams
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              icon={CalendarPlus}
              title="No match scheduled"
              text="Schedule your next game to pick a squad and split teams."
              action={
                <Link to="/manager/matches" className="btn btn-primary btn-sm">
                  Schedule a match
                </Link>
              }
            />
          )}
        </div>
        <LineupSummaryCard />
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Trophy size={15} /> Recent results
            </span>
          </div>
          {completed.length ? (
            completed.slice(0, 5).map((m) => (
              <Link key={m.id} to={`/manager/matches/${m.id}`} className="list-row">
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="truncate" style={{ display: 'block', fontWeight: 600 }}>
                    {m.title}
                  </span>
                  <span className="subtle" style={{ fontSize: 12 }}>
                    {formatLongDay(m.date)}
                  </span>
                </span>
                {m.score && (
                  <span className="result-pill tnum">
                    {m.score.home}–{m.score.away}
                  </span>
                )}
              </Link>
            ))
          ) : (
            <EmptyState compact title="No results logged yet" />
          )}
        </div>
      </div>
      <div className="dugout-side">
        <div className="card card-body stack gap-2">
          <div className="eyebrow">Quick actions</div>
          <Link to="/manager/squad?add=1" className="btn btn-secondary">
            <UserPlus size={15} /> Add a player
          </Link>
          <Link to="/manager/matches?new=1" className="btn btn-secondary">
            <CalendarPlus size={15} /> Schedule a match
          </Link>
          <Link to="/manager/builder" className="btn btn-secondary">
            <Shuffle size={15} /> Team builder
          </Link>
        </div>
        <ChecklistCard />
        <SquadStatusCard />
        <div className="card">
          <div className="card-header">
            <span className="card-title">Best players</span>
            <span className="subtle" style={{ fontSize: 12 }}>
              {session.clubName}
            </span>
          </div>
          {top.map((p) => (
            <Link key={p.id} to={`/manager/squad/${p.id}`} className="list-row" style={{ paddingTop: 8, paddingBottom: 8 }}>
              <span className="squad-num" style={{ width: 22 }}>
                {p.number}
              </span>
              <span className="grow truncate" style={{ fontWeight: 600 }}>
                {p.name}
              </span>
              <OvrBadge value={p.ovr} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dugout() {
  const { real } = useClub();
  return real ? <RealDugout /> : <CustomDugout />;
}
