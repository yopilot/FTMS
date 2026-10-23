import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Binoculars, Bookmark, BookmarkCheck, Search, Trash2, X } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { useAthlete, usePersonSummary, useSearch, useStandings } from '../../api/queries';
import { useToast } from '../../context/ToastContext';
import { leagueBySlug } from '../../api/leagues';
import { POSITION_LABEL, seasonOvr, strengthFromRank } from '../../lib/ratings';
import { findStanding } from '../../lib/squad';
import { formatShortDate } from '../../lib/format';
import Crest from '../../components/ui/Crest';
import { OvrBadge, PosBadge } from '../../components/ui/Bits';
import { Drawer } from '../../components/ui/Modal';
import { Skeleton, SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/States';
import FutCard from '../../components/manager/FutCard';

const DOMESTIC = (slug) => slug && !/^(uefa|fifa|conmebol|concacaf|afc|caf)\./.test(slug) && !/cup|pokal|coppa|copa|coupe|fa$|charity|friendly/.test(slug);
const PRIORITY = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-info' };

function useDebounced(v, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function useScoutRating(athlete) {
  const split = useMemo(() => {
    if (!athlete) return null;
    const own = athlete.splits.filter((s) => s.teamId === athlete.team?.id);
    return own.find((s) => DOMESTIC(s.leagueSlug)) || own[0] || athlete.splits[0] || null;
  }, [athlete]);
  const standings = useStandings(split && DOMESTIC(split.leagueSlug) ? split.leagueSlug : null);
  return useMemo(() => {
    if (!athlete || !split) return { split, rating: null };
    const st = findStanding(standings.data, athlete.team?.id);
    const s = { ...split.stats, appearances: split.stats.starts || 0, starts: split.stats.starts || 0 };
    return {
      split,
      rating: seasonOvr(s, { pos: athlete.pos, age: athlete.age, league: split.leagueSlug, teamStrength: st ? strengthFromRank(st.entry.rank, st.size) : 0.5, teamGames: st?.entry.gp }),
    };
  }, [athlete, split, standings.data]);
}

function ScoutReport({ playerId, onAdd, shortlisted }) {
  const { players } = useClub();
  const q = useAthlete(playerId);
  const a = q.data;
  const wiki = usePersonSummary(a?.name, 'player');
  const { split, rating } = useScoutRating(a);
  const [priority, setPriority] = useState('medium');
  const [note, setNote] = useState('');

  if (q.isLoading)
    return (
      <div className="stack gap-3">
        <Skeleton h={220} w={168} r={16} />
        <Skeleton h={14} w="60%" />
        <Skeleton h={14} w="40%" />
      </div>
    );
  if (!a) return <EmptyState title="Couldn't load this player" />;

  const ovr = rating?.ovr ?? 60;
  const mine = players.filter((p) => p.pos === a.pos).sort((x, y) => y.ovr - x.ovr);
  const best = mine[0];
  const s = split?.stats || {};
  const attrs = [
    { label: 'STR', value: s.starts ?? 0 },
    { label: 'GLS', value: s.totalGoals ?? 0 },
    { label: 'AST', value: s.goalAssists ?? 0 },
    { label: 'SHT', value: s.totalShots ?? 0 },
    { label: 'SOT', value: s.shotsOnTarget ?? 0 },
    { label: 'AGE', value: a.age ?? '–' },
  ];
  const diff = best ? ovr - best.ovr : null;

  return (
    <div className="stack gap-5">
      <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
        <FutCard player={{ ...a, ovr, lastName: a.lastName || a.name }} photo={wiki.data?.image} attrs={attrs} />
        <div className="stack gap-2" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 750 }}>{a.name}</div>
          <div className="row gap-2 subtle" style={{ fontSize: 13 }}>
            <PosBadge pos={a.pos} /> {a.posName || POSITION_LABEL[a.pos]}
          </div>
          {a.team && (
            <Link to={`/team/${a.team.id}`} className="row gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
              <Crest src={a.team.logo} name={a.team.name} size={16} /> {a.team.name}
            </Link>
          )}
          <div className="subtle" style={{ fontSize: 13 }}>
            {[a.nationality, a.age && `${a.age} yrs`, a.heightText].filter(Boolean).join(' · ')}
          </div>
          <Link to={`/player/${a.id}`} className="link" style={{ marginTop: 4 }}>
            Full profile <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {best && (
        <div className="notice">
          <Binoculars size={16} />
          <span>
            Your best {POSITION_LABEL[a.pos].toLowerCase()} is <strong>{best.name}</strong> ({best.ovr}).{' '}
            {diff > 2 ? `${a.name.split(' ').slice(-1)[0]} would be an upgrade of ${diff} points.` : diff < -2 ? `This would be a squad option, ${-diff} points lower.` : 'They are about level.'}
          </span>
        </div>
      )}

      <div className="stack gap-3">
        <div className="eyebrow">{split ? `${leagueBySlug(split.leagueSlug)?.short || split.name} this season` : 'This season'}</div>
        <div className="kv">
          {attrs.slice(0, 5).map((x) => (
            <div key={x.label} className="kv-item">
              <span className="kv-label">{x.label}</span>
              <span className="kv-value">{x.value}</span>
            </div>
          ))}
        </div>
      </div>

      {shortlisted ? (
        <div className="notice">
          <BookmarkCheck size={16} color="var(--success)" /> On your shortlist.
        </div>
      ) : (
        <div className="stack gap-3">
          <div className="eyebrow">Add to shortlist</div>
          <div className="role-row">
            <span className="role-label">Priority</span>
            <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this player? Fit, price, contract…" maxLength={400} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              onAdd({
                id: a.id,
                name: a.name,
                team: a.team?.name || '',
                teamId: a.team?.id || null,
                teamLogo: a.team?.logo || null,
                pos: a.pos,
                flag: a.flag,
                ovr,
                priority,
                note,
                addedAt: new Date().toISOString(),
              })
            }
          >
            <Bookmark size={15} /> Add to shortlist
          </button>
        </div>
      )}
    </div>
  );
}

export default function Scouting() {
  const { state, setState } = useClub();
  const { push } = useToast();
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const search = useSearch(debounced);
  const [openId, setOpenId] = useState(null);
  const shortlist = state.shortlist || [];
  const listed = new Set(shortlist.map((s) => s.id));

  const add = (item) => {
    setState((s) => ({ ...s, shortlist: [item, ...(s.shortlist || []).filter((x) => x.id !== item.id)] }));
    push({ kind: 'success', title: 'Added to shortlist', text: item.name });
  };
  const remove = (id) => setState((s) => ({ ...s, shortlist: (s.shortlist || []).filter((x) => x.id !== id) }));

  return (
    <div className="split">
      <div className="stack gap-4" style={{ minWidth: 0 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Binoculars size={15} /> Scout a player
            </span>
          </div>
          <div className="card-body" style={{ paddingBottom: 8 }}>
            <label className="input-icon">
              <Search size={15} />
              <input className="input" placeholder="Search any player in the world" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search players" autoFocus />
              {q && (
                <button type="button" className="icon-btn sm" style={{ position: 'absolute', right: 4 }} onClick={() => setQ('')} aria-label="Clear">
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
          {debounced.trim().length < 2 ? (
            <EmptyState compact icon={Search} title="Find your next signing" text="Type at least two letters of a player's name. You'll get a scouting report with an FTMS rating and a comparison with your squad." />
          ) : search.isLoading ? (
            <SkeletonRows rows={5} />
          ) : search.data?.players?.length ? (
            search.data.players.map((p) => (
              <button key={p.id} type="button" className="list-row" onClick={() => setOpenId(p.id)}>
                {p.teamLogo ? <Crest src={p.teamLogo} name={p.team} size={24} /> : <span style={{ width: 24 }} />}
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="truncate" style={{ display: 'block', fontWeight: 600 }}>
                    {p.name}
                  </span>
                  <span className="subtle truncate" style={{ display: 'block', fontSize: 12 }}>
                    {[p.team, p.pos].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {listed.has(p.id) && <BookmarkCheck size={16} color="var(--success)" />}
                {p.flag && <img className="flag" src={p.flag} alt="" />}
              </button>
            ))
          ) : (
            <EmptyState compact title={`No players found for “${debounced}”`} />
          )}
        </div>
      </div>

      <aside>
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Bookmark size={15} /> Shortlist
            </span>
            <span className="subtle" style={{ fontSize: 12 }}>
              {shortlist.length} player{shortlist.length === 1 ? '' : 's'}
            </span>
          </div>
          {shortlist.length ? (
            shortlist.map((s) => (
              <div key={s.id} className="list-row is-link" style={{ alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setOpenId(s.id)}>
                <Crest src={s.teamLogo} name={s.team} size={24} />
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="row gap-2" style={{ minWidth: 0 }}>
                    <span className="truncate" style={{ fontWeight: 650 }}>
                      {s.name}
                    </span>
                    <span className={`badge ${PRIORITY[s.priority] || ''}`}>{s.priority}</span>
                  </span>
                  <span className="subtle truncate" style={{ display: 'block', fontSize: 12 }}>
                    {s.team} · added {formatShortDate(s.addedAt)}
                  </span>
                  {s.note && (
                    <span className="muted" style={{ display: 'block', fontSize: 12.5, marginTop: 4 }}>
                      {s.note}
                    </span>
                  )}
                </span>
                <OvrBadge value={s.ovr} />
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(s.id);
                  }}
                  aria-label={`Remove ${s.name} from shortlist`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <EmptyState compact icon={Bookmark} title="No targets yet" text="Search for players and add them here with a priority and notes." />
          )}
        </div>
      </aside>

      <Drawer open={Boolean(openId)} onClose={() => setOpenId(null)} title="Scouting report">
        {openId && <ScoutReport playerId={openId} shortlisted={listed.has(openId)} onAdd={add} />}
      </Drawer>
    </div>
  );
}
