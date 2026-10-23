import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ExternalLink, Newspaper, Ruler, Shirt, Weight } from 'lucide-react';
import { useAthlete, usePersonSummary, useStandings } from '../api/queries';
import { leagueBySlug } from '../api/leagues';
import { useTheme } from '../context/ThemeContext';
import { visibleTeamColor } from '../lib/color';
import { POSITION_LABEL, seasonOvr, strengthFromRank, tierClass } from '../lib/ratings';
import { findStanding } from '../lib/squad';
import { formatShortDate, initials } from '../lib/format';
import Crest from '../components/ui/Crest';
import Radar from '../components/ui/Radar';
import NewsCard from '../components/news/NewsCard';
import { Skeleton, SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { PosBadge } from '../components/ui/Bits';

const DOMESTIC = (slug) => slug && !/^(uefa|fifa|conmebol|concacaf|afc|caf)\./.test(slug) && !/cup|pokal|coppa|copa|coupe|fa$|charity|friendly/.test(slug);

function OvrRing({ value, lowData }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, (value - 40) / 59));
  const tier = tierClass(value);
  const color = tier === 'tier-gold' ? 'var(--tier-gold)' : tier === 'tier-silver' ? 'var(--tier-silver)' : 'var(--tier-bronze)';
  return (
    <div className="ovr-ring" title={lowData ? 'Based on very few appearances this season' : 'FTMS overall rating'}>
      <svg viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
        <motion.circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="ovr-ring-val">
        <div>
          <strong style={{ color }}>{value}</strong>
          <span>OVR{lowData ? '*' : ''}</span>
        </div>
      </div>
    </div>
  );
}

function pickSplit(splits, teamId) {
  const own = splits.filter((s) => s.teamId === teamId);
  return own.find((s) => DOMESTIC(s.leagueSlug)) || own[0] || splits.find((s) => DOMESTIC(s.leagueSlug)) || splits[0] || null;
}

function profileAxes(stats, pos) {
  const starts = Math.max(1, stats.starts || 0);
  const per = (v) => (v || 0) / starts;
  const scale = (v, max) => Math.round(Math.max(0, Math.min(1, v / max)) * 100);
  const accuracy = stats.totalShots >= 3 ? stats.shotsOnTarget / stats.totalShots : 0;
  const discipline = Math.max(0, 100 - ((stats.yellowCards || 0) * 12 + (stats.redCards || 0) * 35) * (6 / starts));
  return [
    { label: 'Scoring', value: scale(per(stats.totalGoals), pos === 'FWD' ? 0.8 : 0.5), display: (stats.totalGoals || 0).toString() },
    { label: 'Creating', value: scale(per(stats.goalAssists), 0.45), display: (stats.goalAssists || 0).toString() },
    { label: 'Shooting', value: scale(per(stats.totalShots), 4), display: (stats.totalShots || 0).toString() },
    { label: 'Accuracy', value: Math.round(accuracy * 100), display: stats.totalShots >= 3 ? `${Math.round(accuracy * 100)}%` : '–' },
    { label: 'Won fouls', value: scale(per(stats.foulsSuffered), 3), display: (stats.foulsSuffered || 0).toString() },
    { label: 'Discipline', value: Math.round(Math.min(100, discipline)), display: `${stats.yellowCards || 0}Y ${stats.redCards || 0}R` },
  ];
}

export default function Player() {
  const { id } = useParams();
  const { theme } = useTheme();
  const q = useAthlete(id);
  const a = q.data;
  const wiki = usePersonSummary(a?.name, 'player');
  useDocumentTitle(a?.name || 'Player');

  const split = useMemo(() => (a ? pickSplit(a.splits, a.team?.id) : null), [a]);
  const standings = useStandings(split?.leagueSlug && DOMESTIC(split.leagueSlug) ? split.leagueSlug : null);

  const rating = useMemo(() => {
    if (!a || !split) return null;
    const st = findStanding(standings.data, a.team?.id);
    const s = { ...split.stats, appearances: split.stats.starts || 0, starts: split.stats.starts || 0 };
    return seasonOvr(s, {
      pos: a.pos,
      age: a.age,
      league: split.leagueSlug,
      teamStrength: st ? strengthFromRank(st.entry.rank, st.size) : 0.5,
      teamGames: st?.entry.gp,
    });
  }, [a, split, standings.data]);

  if (q.isLoading) {
    return (
      <div className="page">
        <div className="hero" style={{ padding: 24 }}>
          <div className="row gap-4">
            <Skeleton w={112} h={112} r={24} />
            <div className="stack gap-2 grow">
              <Skeleton w={140} h={12} />
              <Skeleton w={280} h={30} />
              <Skeleton w={200} h={12} />
            </div>
          </div>
        </div>
        <div className="card">
          <SkeletonRows rows={6} />
        </div>
      </div>
    );
  }
  if (q.isError || !a) {
    return (
      <div className="page">
        <div className="card">
          <ErrorState title="Player not found" error={q.error} onRetry={q.refetch} />
        </div>
      </div>
    );
  }

  const color = visibleTeamColor(a.team?.color, a.team?.altColor, theme);
  const photo = wiki.data?.image;
  const labels = a.splitLabels;

  return (
    <div className="page" style={{ gap: 'var(--sp-5)' }}>
      <section className="hero">
        <div className="hero-wash" style={{ background: `radial-gradient(90% 160% at 0% 0%, color-mix(in srgb, ${color} 26%, transparent), transparent 62%)` }} />
        <div className="hero-body">
          <span className="player-hero-photo">{photo ? <img src={photo} alt={a.name} /> : initials(a.name)}</span>
          <div className="grow" style={{ minWidth: 0 }}>
            {a.team ? (
              <Link to={`/team/${a.team.id}`} className="eyebrow row gap-2" style={{ width: 'fit-content' }}>
                <Crest src={a.team.logo} name={a.team.name} size={14} /> {a.team.name}
              </Link>
            ) : (
              <p className="eyebrow">Player</p>
            )}
            <h1 className="hero-title" style={{ marginTop: 6 }}>
              {a.name}
            </h1>
            <div className="hero-meta">
              <span>
                <PosBadge pos={a.pos} /> {a.posName || POSITION_LABEL[a.pos]}
              </span>
              {a.number && (
                <span>
                  <Shirt size={13} /> #{a.number}
                </span>
              )}
              {a.nationality && (
                <span>
                  {a.flag && <img className="flag" src={a.flag} alt="" />} {a.nationality}
                </span>
              )}
              {a.age && <span>{a.age} yrs</span>}
              {a.heightText && (
                <span>
                  <Ruler size={13} /> {a.heightText}
                </span>
              )}
              {a.weightText && (
                <span>
                  <Weight size={13} /> {a.weightText}
                </span>
              )}
            </div>
          </div>
          {rating && (
            <div className="hero-actions" style={{ marginLeft: 'auto', width: 'auto' }}>
              <OvrRing value={rating.ovr} lowData={rating.lowData} />
            </div>
          )}
        </div>
      </section>

      <div className="split">
        <div className="stack gap-4" style={{ minWidth: 0 }}>
          {a.summary.length > 0 && (
            <div className="kv">
              {a.summary.map((s) => (
                <div key={s.label} className="kv-item">
                  <span className="kv-label">{s.label.replace('Starts-Substitute Appearances', 'Starts (sub)')}</span>
                  <span className="kv-value">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">Season by competition</span>
            </div>
            {a.splits.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="l" style={{ paddingLeft: 20 }}>
                        Competition
                      </th>
                      {labels.names.map((n, i) => (
                        <th key={n} title={labels.display[i]} className={['foulsCommitted', 'foulsSuffered', 'offsides'].includes(n) ? 'hide-mobile' : ''}>
                          {labels.labels[i]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a.splits.map((s) => {
                      const lg = leagueBySlug(s.leagueSlug);
                      return (
                        <tr key={`${s.name}-${s.teamId}`}>
                          <td className="l" style={{ paddingLeft: 20 }}>
                            <span className="team-cell" style={{ fontWeight: 550 }}>
                              {lg && <Crest src={lg.logo} srcDark={lg.logoDark} name={lg.name} size={18} />}
                              <span className="truncate">{lg?.short || s.name.replace(/^\d{4}(-\d{2})?\s/, '')}</span>
                            </span>
                          </td>
                          {labels.names.map((n) => (
                            <td key={n} className={`${['totalGoals', 'goalAssists'].includes(n) ? 'strong' : 'dim'} ${['foulsCommitted', 'foulsSuffered', 'offsides'].includes(n) ? 'hide-mobile' : ''}`}>
                              {s.stats[n] ?? 0}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState compact title="No stats this season" />
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Last matches</span>
            </div>
            {a.gameLog.length ? (
              a.gameLog.map((g) => (
                <Link key={g.id} to={`/match/${g.id}`} className="fixture-row">
                  <span className="fixture-date">{formatShortDate(g.date)}</span>
                  <Crest src={g.opponent?.logo} name={g.opponent?.name} size={22} />
                  <span className="fixture-opp">
                    <span className="truncate" style={{ display: 'block' }}>
                      <span className="subtle" style={{ fontWeight: 500 }}>
                        {g.atVs === '@' ? '@' : 'vs'}
                      </span>{' '}
                      {g.opponent?.name}
                    </span>
                    <span className="fixture-comp">
                      {g.stats.appearances === 'Started' ? 'Started' : g.stats.appearances || ''}
                      {Number(g.stats.totalGoals) > 0 ? ` · ${g.stats.totalGoals} goal${g.stats.totalGoals > 1 ? 's' : ''}` : ''}
                      {Number(g.stats.goalAssists) > 0 ? ` · ${g.stats.goalAssists} assist${g.stats.goalAssists > 1 ? 's' : ''}` : ''}
                    </span>
                  </span>
                  <span className="result-pill">
                    {g.score}
                    {g.result && <span className={`form-pip ${g.result}`}>{g.result}</span>}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState compact title="No recent matches" />
            )}
          </div>

          {a.news.length > 0 && (
            <div className="section">
              <h3 className="section-title" style={{ fontSize: 15 }}>
                <Newspaper size={16} /> In the news
              </h3>
              <div className="grid-2">
                {a.news.slice(0, 4).map((n) => (
                  <NewsCard key={n.id} article={n} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          {split && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Season profile</span>
                <span className="subtle truncate" style={{ fontSize: 12, maxWidth: 160 }}>
                  {leagueBySlug(split.leagueSlug)?.short || split.name}
                </span>
              </div>
              <div className="card-body">
                <Radar axes={profileAxes(split.stats, a.pos)} color={color} />
                <p className="subtle" style={{ fontSize: 12, marginTop: 10 }}>
                  Per-start output compared with typical top-flight numbers. Totals shown under each label.
                </p>
              </div>
            </div>
          )}
          {wiki.data?.extract && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">About</span>
                <span className="subtle" style={{ fontSize: 11 }}>
                  Wikipedia
                </span>
              </div>
              <div className="card-body">
                <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                  {wiki.data.extract}
                </p>
                {wiki.data.url && (
                  <a href={wiki.data.url} target="_blank" rel="noopener noreferrer" className="link" style={{ marginTop: 10 }}>
                    Read more <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
          {rating && (
            <p className="subtle" style={{ fontSize: 12 }}>
              OVR is an FTMS estimate from this season&apos;s ESPN stats, starts, league strength and team position.
              {rating.lowData && ' * Very few appearances so far, so treat it as provisional.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
