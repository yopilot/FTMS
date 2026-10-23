import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CalendarPlus, Dices, RotateCcw, Scale, Users } from 'lucide-react';
import { useClub, useLocalPlayers } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { attrOvr, positionGroup } from '../../lib/ratings';
import { generateTeams, validateSplit } from '../../lib/teamGen';
import TeamBoard from '../../components/club/TeamBoard';
import MatchFormModal from '../../components/club/MatchFormModal';
import { Segmented } from '../../components/ui/Tabs';
import { OvrBadge, PosBadge } from '../../components/ui/Bits';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/States';

export default function TeamBuilder() {
  const { real } = useClub();
  const players = useLocalPlayers(!real);
  const navigate = useNavigate();
  const { push } = useToast();
  const [board, setBoard] = usePersistentState('builder', { selected: [], n: 2, t: 5, mode: 'balanced', teams: [], extras: [] });
  const [matchOpen, setMatchOpen] = useState(false);

  const byId = useMemo(() => {
    const map = new Map();
    (players.data || []).forEach((p) => {
      const pos = positionGroup(p.position);
      map.set(String(p.id), { id: String(p.id), name: p.name, pos, ovr: attrOvr(p.ratings, pos), number: p.jerseyNumber, status: p.status });
    });
    return map;
  }, [players.data]);

  if (real) return <Navigate to="/manager" replace />;
  if (players.isLoading) return <Skeleton h={420} r={14} />;

  const squad = [...byId.values()].filter((p) => p.status !== 'inactive').sort((a, b) => a.name.localeCompare(b.name));
  const selected = board.selected.filter((id) => byId.has(id));
  const validation = validateSplit(selected.length, board.n, board.t);
  const update = (patch) => setBoard((b) => ({ ...b, ...patch }));
  const toggle = (id) => update({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] });
  const teams = (board.teams || []).map((tm) => ({ ...tm, playerIds: tm.playerIds.filter((id) => byId.has(id)) }));

  const generate = () => {
    if (validation) return push({ kind: 'error', title: 'Not enough players', text: validation });
    const res = generateTeams(selected, board.n, board.t, board.mode, (id) => byId.get(id)?.ovr || 50, teams);
    update({ teams: res.teams, extras: res.extras });
  };

  return (
    <div className="split">
      <div className="stack gap-4" style={{ minWidth: 0 }}>
        <div className="card card-body row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="field" style={{ width: 110 }}>
            <span className="field-label">Teams</span>
            <input className="input" type="number" min="2" max="6" value={board.n} onChange={(e) => update({ n: Math.max(2, Math.min(6, Number(e.target.value) || 2)) })} />
          </label>
          <label className="field" style={{ width: 130 }}>
            <span className="field-label">Per team</span>
            <input className="input" type="number" min="1" max="15" value={board.t} onChange={(e) => update({ t: Math.max(1, Math.min(15, Number(e.target.value) || 1)) })} />
          </label>
          <div className="field">
            <span className="field-label">Method</span>
            <Segmented
              ariaLabel="Method"
              value={board.mode}
              onChange={(v) => update({ mode: v })}
              items={[
                { value: 'balanced', label: 'Balanced', icon: <Scale size={14} /> },
                { value: 'random', label: 'Random', icon: <Dices size={14} /> },
              ]}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={generate} disabled={Boolean(validation)}>
            <Dices size={15} /> {teams.length ? 'Shuffle again' : 'Generate'}
          </button>
          {teams.length > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => update({ teams: [], extras: [] })}>
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <span className={validation ? 'field-error' : 'subtle'} style={{ fontSize: 12.5, flexBasis: '100%' }}>
            {validation ||
              `${selected.length} players → ${board.n} teams of ${board.t}. ${board.mode === 'balanced' ? 'Balanced spreads ratings evenly with a snake draft.' : 'Random is a pure shuffle.'}`}
          </span>
        </div>

        {teams.length ? (
          <>
            <TeamBoard teams={teams} extras={(board.extras || []).filter((id) => byId.has(id))} getPlayer={(id) => byId.get(String(id))} onChange={(next) => update(next)} />
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setMatchOpen(true)}>
              <CalendarPlus size={16} /> Create a match with these teams
            </button>
          </>
        ) : (
          <div className="card">
            <EmptyState icon={Dices} title="Pick players, then generate" text="Choose who is playing on the right, set the number of teams and players per team, and hit Generate." />
          </div>
        )}
      </div>

      <aside>
        <div className="card">
          <div className="card-header">
            <span>
              <span className="card-title">Players</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                {selected.length} of {squad.length} selected
              </span>
            </span>
            <span className="row gap-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ selected: squad.filter((p) => p.status === 'active').map((p) => p.id) })}>
                All fit
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ selected: [] })}>
                None
              </button>
            </span>
          </div>
          {squad.length ? (
            squad.map((p) => (
              <label key={p.id} className="list-row is-link" style={{ cursor: 'pointer', paddingTop: 8, paddingBottom: 8 }}>
                <input type="checkbox" className="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                <span className="grow truncate" style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {p.name}
                  {p.status === 'injured' && (
                    <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                      Inj
                    </span>
                  )}
                </span>
                <PosBadge pos={p.pos} />
                <OvrBadge value={p.ovr} />
              </label>
            ))
          ) : (
            <EmptyState compact icon={Users} title="No players yet" />
          )}
        </div>
      </aside>

      <MatchFormModal
        open={matchOpen}
        onClose={() => setMatchOpen(false)}
        initialTeams={{ teams: teams.map((tm) => ({ ...tm, playerIds: tm.playerIds.map(Number) })), extras: (board.extras || []).map(Number), guests: [] }}
        onSaved={(id) => id && navigate(`/manager/matches/${id}`)}
      />
    </div>
  );
}
