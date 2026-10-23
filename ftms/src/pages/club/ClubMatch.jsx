import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Dices, Lock, Pencil, Scale, Trash2, UserPlus, Users } from 'lucide-react';
import { useClub, useLocalPlayers } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { matchService } from '../../services/matchService';
import { statsService } from '../../services/statsService';
import { attrOvr, positionGroup } from '../../lib/ratings';
import { generateTeams, validateSplit } from '../../lib/teamGen';
import { formatLongDay } from '../../lib/format';
import TeamBoard from '../../components/club/TeamBoard';
import MatchFormModal from '../../components/club/MatchFormModal';
import { Tabs, Segmented } from '../../components/ui/Tabs';
import { OvrBadge, PosBadge } from '../../components/ui/Bits';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/States';

function GuestModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [pos, setPos] = useState('MID');
  const [ovr, setOvr] = useState(60);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Add a guest player"
      description="Guests play in this match only and aren't added to your squad."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ id: `guest-${Date.now()}`, name: name.trim(), position: pos, rating: Number(ovr), jerseyNumber: 'G' });
              setName('');
              onClose();
            }}
          >
            Add guest
          </button>
        </>
      }
    >
      <div className="stack gap-4">
        <label className="field">
          <span className="field-label">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
        </label>
        <label className="field">
          <span className="field-label">Position</span>
          <select className="select" value={pos} onChange={(e) => setPos(e.target.value)}>
            <option value="GK">Goalkeeper</option>
            <option value="DEF">Defender</option>
            <option value="MID">Midfielder</option>
            <option value="FWD">Forward</option>
          </select>
        </label>
        <label className="slider-field">
          <span className="slider-head">
            <span className="slider-label">Rough rating</span>
            <span className="tnum" style={{ fontWeight: 700 }}>
              {ovr}
            </span>
          </span>
          <input type="range" className="range" min="30" max="95" value={ovr} onChange={(e) => setOvr(e.target.value)} style={{ '--val': `${((ovr - 30) / 65) * 100}%` }} />
        </label>
      </div>
    </Modal>
  );
}

function StatsTable({ match, playing, getPlayer }) {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const defs = useQuery({ queryKey: ['local', 'statDefs'], queryFn: () => statsService.getAllDefinitions() });
  const saved = useQuery({ queryKey: ['local', 'matchStats', match.id], queryFn: () => statsService.getStatsForMatch(match.id) });
  const [values, setValues] = useState({});

  useEffect(() => {
    const v = {};
    (saved.data || []).forEach((s) => {
      v[`${s.playerId}|${s.statDefId}`] = s.value;
    });
    setValues(v);
  }, [saved.data]);

  if (defs.isLoading || saved.isLoading) return <Skeleton h={200} r={12} />;
  const list = defs.data || [];
  if (!list.length) return <EmptyState compact title="No stat fields yet" text="Create stat fields like Goals or Assists on the Stats page." />;
  const squadOnly = playing.filter((id) => !String(id).startsWith('guest-'));

  const save = async () => {
    const rows = [];
    Object.entries(values).forEach(([key, value]) => {
      if (value === '' || value == null) return;
      const [pid, defId] = key.split('|');
      rows.push({ playerId: Number(pid), statDefId: Number(defId), value });
    });
    await statsService.saveMatchStats(match.id, rows);
    await queryClient.invalidateQueries({ queryKey: ['local'] });
    push({ kind: 'success', title: 'Stats saved', text: `${rows.length} entries recorded.` });
  };

  return (
    <div className="stack gap-3">
      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr>
              <th className="l" style={{ paddingLeft: 18 }}>
                Player
              </th>
              {list.map((d) => (
                <th key={d.id} title={d.description}>
                  {d.name}
                  {d.unit ? ` (${d.unit})` : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {squadOnly.map((pid) => {
              const p = getPlayer(pid);
              if (!p) return null;
              return (
                <tr key={pid}>
                  <td className="l" style={{ paddingLeft: 18, fontWeight: 600 }}>
                    {p.name}
                  </td>
                  {list.map((d) => {
                    const key = `${pid}|${d.id}`;
                    return (
                      <td key={d.id}>
                        {d.type === 'qualitative' ? (
                          <select className="select mini-select" style={{ minWidth: 104 }} value={values[key] || ''} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}>
                            <option value="">–</option>
                            {(d.choices || []).map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="input"
                            style={{ width: 72, height: 30, textAlign: 'center', padding: '0 6px' }}
                            type="number"
                            min="0"
                            value={values[key] ?? ''}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                            aria-label={`${d.name} for ${p.name}`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="row gap-2">
        <button type="button" className="btn btn-primary" onClick={save}>
          Save stats
        </button>
        <span className="subtle" style={{ fontSize: 12 }}>
          Guests aren&apos;t tracked in stats.
        </span>
      </div>
    </div>
  );
}

export default function ClubMatch() {
  const { matchId } = useParams();
  const { real } = useClub();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const players = useLocalPlayers(!real);
  const matchQ = useQuery({ queryKey: ['local', 'match', matchId], queryFn: () => matchService.getById(matchId), enabled: !real });
  const [tab, setTab] = useState('squad');
  const [n, setN] = useState(2);
  const [t, setT] = useState(5);
  const [mode, setMode] = useState('random');
  const [guestOpen, setGuestOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [notes, setNotes] = useState('');

  const m = matchQ.data;
  const done = m?.status === 'completed';

  const guests = useMemo(() => m?.guestPlayers || [], [m]);
  const byId = useMemo(() => {
    const map = new Map();
    (players.data || []).forEach((p) => {
      const pos = positionGroup(p.position);
      map.set(String(p.id), { id: p.id, name: p.name, pos, ovr: attrOvr(p.ratings, pos), number: p.jerseyNumber, status: p.status });
    });
    guests.forEach((g) => map.set(String(g.id), { id: g.id, name: g.name, pos: positionGroup(g.position), ovr: g.rating || 60, number: 'G', isGuest: true }));
    return map;
  }, [players.data, guests]);
  const getPlayer = (id) => byId.get(String(id));

  const selected = useMemo(() => (m?.selectedPlayerIds || []).map(String), [m]);
  const teams = useMemo(() => (m?.teams || []).map((tm) => ({ ...tm, playerIds: tm.playerIds.map(String) })), [m]);
  const inTeams = new Set(teams.flatMap((tm) => tm.playerIds));
  const extras = selected.filter((id) => !inTeams.has(id));

  useEffect(() => {
    if (!m) return;
    if (m.teams?.length) setN(m.teams.length);
    const count = (m.selectedPlayerIds || []).length;
    if (count) setT(Math.max(1, Math.floor(count / Math.max(2, m.teams?.length || 2))));
    if (m.score) setScore(m.score);
    setNotes(m.notes || '');
    if (m.status === 'completed') setTab('result');
  }, [m]);

  if (real) return <Navigate to="/manager" replace />;
  if (matchQ.isLoading || players.isLoading) return <Skeleton h={420} r={14} />;
  if (!m) return <div className="card"><ErrorState title="Match not found" /></div>;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['local'] });
  // IndexedDB stores squad ids as numbers and guest ids as "guest-…" strings.
  const toStored = (tm) => ({ ...tm, playerIds: tm.playerIds.map((id) => (String(id).startsWith('guest-') ? id : Number(id))) });

  const saveSelection = async (ids, nextGuests = guests) => {
    try {
      const keep = new Set(ids);
      const cleanedTeams = teams.map((tm) => ({ ...tm, playerIds: tm.playerIds.filter((id) => keep.has(id)) }));
      await matchService.update(m.id, { selectedPlayerIds: ids.map((id) => (id.startsWith('guest-') ? id : Number(id))), guestPlayers: nextGuests, teams: cleanedTeams.map(toStored) });
      refresh();
    } catch (e) {
      push({ kind: 'error', title: 'Could not update', text: e.message });
    }
  };

  const saveBoard = async ({ teams: nextTeams, extras: nextExtras }) => {
    try {
      await matchService.saveTeams(m.id, nextTeams.map(toStored), guests);
      await matchService.update(m.id, { bench: nextExtras.map((id) => (id.startsWith('guest-') ? id : Number(id))) });
      refresh();
    } catch (e) {
      push({ kind: 'error', title: 'Could not save teams', text: e.message });
    }
  };

  const toggle = (id) => saveSelection(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const activeSquad = (players.data || []).filter((p) => p.status !== 'inactive');
  const validation = validateSplit(selected.length, n, t);

  const generate = async () => {
    if (validation) return push({ kind: 'error', title: 'Not enough players', text: validation });
    const res = generateTeams(selected, n, t, mode, (id) => getPlayer(id)?.ovr || 50, teams);
    await saveBoard({ teams: res.teams, extras: res.extras });
    push({ kind: 'success', title: mode === 'balanced' ? 'Balanced teams ready' : 'Teams shuffled', text: res.extras.length ? `${res.extras.length} extra player(s) on the bench.` : `${n} teams of ${t}.` });
  };

  const complete = async () => {
    await matchService.completeMatch(m.id, { home: Number(score.home) || 0, away: Number(score.away) || 0 }, notes);
    refresh();
    push({ kind: 'success', title: 'Match completed', text: 'Now record player stats below.' });
  };

  const tabs = [
    { value: 'squad', label: 'Squad', badge: selected.length },
    { value: 'teams', label: 'Teams', badge: teams.length || null },
    { value: 'result', label: done ? 'Result & stats' : 'Result' },
  ];

  return (
    <div className="stack gap-4">
      <Link to="/manager/matches" className="back-link" style={{ marginBottom: 0 }}>
        <ArrowLeft size={15} /> Matches
      </Link>
      <div className="card card-body row gap-4" style={{ flexWrap: 'wrap' }}>
        <div className="grow" style={{ minWidth: 220 }}>
          <div className="row gap-2">
            <span className={`badge ${done ? 'badge-success' : 'badge-accent'}`}>{done ? 'Completed' : 'Upcoming'}</span>
            <span className="subtle" style={{ fontSize: 12 }}>
              {m.matchType}
            </span>
          </div>
          <h2 style={{ fontSize: 22, marginTop: 8, letterSpacing: '-0.02em' }}>{m.title}</h2>
          <div className="subtle" style={{ fontSize: 13, marginTop: 4 }}>
            {formatLongDay(`${m.date}T12:00`)}
            {m.time ? ` · ${m.time}` : ''}
            {m.venue ? ` · ${m.venue}` : ''}
            {m.opponent ? ` · vs ${m.opponent}` : ''}
          </div>
        </div>
        {done && m.score && teams.length >= 2 && (
          <div className="row gap-3" style={{ fontSize: 30, fontWeight: 800 }}>
            <span className="subtle" style={{ fontSize: 14, fontWeight: 600 }}>
              {teams[0].name}
            </span>
            <span className="tnum">
              {m.score.home}–{m.score.away}
            </span>
            <span className="subtle" style={{ fontSize: 14, fontWeight: 600 }}>
              {teams[1].name}
            </span>
          </div>
        )}
        {!done && (
          <div className="row gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditOpen(true)}>
              <Pencil size={14} /> Edit
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} ariaLabel="Match steps" />

      {tab === 'squad' && (
        <div className="card">
          <div className="card-header">
            <span>
              <span className="card-title">Who&apos;s available?</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                {selected.length} selected · only selected players go into teams
              </span>
            </span>
            {!done && (
              <span className="row gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveSelection(activeSquad.filter((p) => p.status === 'active').map((p) => String(p.id)).concat(guests.map((g) => g.id)))}>
                  Select all fit
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveSelection([])}>
                  Clear
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setGuestOpen(true)}>
                  <UserPlus size={14} /> Guest
                </button>
              </span>
            )}
          </div>
          {done && (
            <div className="notice" style={{ margin: 16 }}>
              <Lock size={15} /> This match is completed, so the squad is locked.
            </div>
          )}
          {[...activeSquad.map((p) => ({ id: String(p.id), raw: p })), ...guests.map((g) => ({ id: g.id, guest: g }))].map(({ id, raw, guest }) => {
            const p = getPlayer(id);
            const on = selected.includes(id);
            return (
              <label key={id} className={`list-row ${done ? '' : 'is-link'}`} style={{ cursor: done ? 'default' : 'pointer', paddingTop: 9, paddingBottom: 9 }}>
                <input type="checkbox" className="checkbox" checked={on} disabled={done} onChange={() => toggle(id)} />
                <span className="squad-num" style={{ width: 22 }}>
                  {p?.number ?? ''}
                </span>
                <span className="grow truncate" style={{ fontWeight: 600 }}>
                  {p?.name}
                  {guest && (
                    <span className="badge" style={{ marginLeft: 8 }}>
                      Guest
                    </span>
                  )}
                  {raw?.status === 'injured' && (
                    <span className="badge badge-danger" style={{ marginLeft: 8 }}>
                      Injured
                    </span>
                  )}
                </span>
                <PosBadge pos={p?.pos} />
                <OvrBadge value={p?.ovr} />
              </label>
            );
          })}
          {activeSquad.length === 0 && <EmptyState compact icon={Users} title="No players in your squad" text="Add players on the Squad page first." />}
        </div>
      )}

      {tab === 'teams' && (
        <div className="stack gap-4">
          {!done && (
            <div className="card card-body row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label className="field" style={{ width: 120 }}>
                <span className="field-label">Teams</span>
                <input className="input" type="number" min="2" max="6" value={n} onChange={(e) => setN(Math.max(2, Math.min(6, Number(e.target.value) || 2)))} />
              </label>
              <label className="field" style={{ width: 140 }}>
                <span className="field-label">Players per team</span>
                <input className="input" type="number" min="1" max="15" value={t} onChange={(e) => setT(Math.max(1, Math.min(15, Number(e.target.value) || 1)))} />
              </label>
              <div className="field">
                <span className="field-label">Method</span>
                <Segmented
                  ariaLabel="Generation method"
                  value={mode}
                  onChange={setMode}
                  items={[
                    { value: 'random', label: 'Random', icon: <Dices size={14} /> },
                    { value: 'balanced', label: 'Balanced', icon: <Scale size={14} /> },
                  ]}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={generate} disabled={Boolean(validation)}>
                <Dices size={15} /> {teams.length ? 'Regenerate' : 'Generate teams'}
              </button>
              <span className={validation ? 'field-error' : 'subtle'} style={{ fontSize: 12.5, flexBasis: '100%' }}>
                {validation || `${selected.length} selected → ${n} teams of ${t}${selected.length - n * t > 0 ? `, ${selected.length - n * t} extra on the bench` : ''}. Drag players to adjust.`}
              </span>
            </div>
          )}
          {teams.length ? (
            <TeamBoard teams={teams} extras={extras} getPlayer={getPlayer} onChange={saveBoard} readOnly={done} />
          ) : (
            <div className="card">
              <EmptyState compact icon={Dices} title="No teams yet" text="Pick the squad, choose how many teams, then generate." />
            </div>
          )}
        </div>
      )}

      {tab === 'result' && (
        <div className="stack gap-4">
          {!done ? (
            teams.length >= 2 ? (
              <div className="card card-body stack gap-4" style={{ maxWidth: 620 }}>
                <div className="row gap-4" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['home', 'away'].map((side, i) => (
                    <label key={side} className="field" style={{ alignItems: 'center' }}>
                      <span className="field-label">{teams[i].name}</span>
                      <input
                        className="input tnum"
                        type="number"
                        min="0"
                        value={score[side]}
                        onChange={(e) => setScore((s) => ({ ...s, [side]: e.target.value }))}
                        style={{ width: 96, height: 64, fontSize: 32, fontWeight: 800, textAlign: 'center' }}
                      />
                    </label>
                  ))}
                </div>
                {teams.length > 2 && <p className="subtle" style={{ fontSize: 12.5 }}>The score records the first two teams. Use notes for the others.</p>}
                <label className="field">
                  <span className="field-label">Match notes</span>
                  <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
                </label>
                <button type="button" className="btn btn-primary btn-lg" onClick={complete}>
                  <CheckCircle2 size={16} /> Complete match
                </button>
                <p className="subtle" style={{ fontSize: 12 }}>
                  Completing locks the squad and teams. You can still record stats afterwards.
                </p>
              </div>
            ) : (
              <div className="card">
                <EmptyState compact title="Set up teams first" text="Generate at least two teams before logging a result." />
              </div>
            )
          ) : (
            <>
              {m.notes && <div className="notice">{m.notes}</div>}
              <h3 className="section-title" style={{ fontSize: 15 }}>
                Player stats
              </h3>
              <StatsTable match={m} playing={teams.flatMap((tm) => tm.playerIds)} getPlayer={getPlayer} />
            </>
          )}
        </div>
      )}

      <GuestModal open={guestOpen} onClose={() => setGuestOpen(false)} onAdd={(g) => saveSelection([...selected, g.id], [...guests, g])} />
      <MatchFormModal open={editOpen} onClose={() => setEditOpen(false)} match={m} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title="Delete this match?"
        text="The match, its teams and any recorded stats will be removed."
        confirmLabel="Delete match"
        onConfirm={async () => {
          await matchService.remove(m.id);
          await refresh();
          navigate('/manager/matches');
        }}
      />
    </div>
  );
}
