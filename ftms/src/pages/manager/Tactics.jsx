import { useCallback, useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { LayoutGroup, motion } from 'motion/react';
import { Check, Crown, Eraser, Info, Sparkles, Target, Wand2, X } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import {
  FORMATIONS,
  FORMATION_IDS,
  TACTIC_PRESETS,
  TACTIC_SLIDERS,
  autoPick,
  isAvailable,
  matchPreset,
  remapLineup,
  tacticNotes,
  teamStrength,
} from '../../lib/formations';
import { POSITION_PLURAL } from '../../lib/ratings';
import { visibleTeamColor } from '../../lib/color';
import { timeAgo } from '../../lib/format';
import TacticsPitch, { BenchZone, PlayerToken, ReserveRow, ReserveZone } from '../../components/manager/LineupPitch';
import { OvrBadge, PosBadge } from '../../components/ui/Bits';
import { Segmented, Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/States';

const BENCH_MAX = 9;
const ROLE_FIELDS = [
  { key: 'captain', label: 'Captain', icon: Crown },
  { key: 'vice', label: 'Vice-captain', icon: Crown },
  { key: 'penalties', label: 'Penalties', icon: Target },
  { key: 'freeKicks', label: 'Free kicks', icon: Target },
  { key: 'corners', label: 'Corners', icon: Target },
];

function StrengthBars({ strength }) {
  const rows = [
    { key: 'attack', label: 'Attack' },
    { key: 'midfield', label: 'Midfield' },
    { key: 'defence', label: 'Defence' },
  ];
  return (
    <div className="card strength">
      <div className="strength-top">
        <div>
          <div className="eyebrow">Team rating</div>
          <motion.div key={strength?.overall} className="strength-big tnum" initial={{ scale: 1.15, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}>
            {strength?.overall ?? '–'}
          </motion.div>
        </div>
        <div className="strength-meta">
          <span>
            <strong className="tnum">{strength?.fit ?? 0}%</strong> position fit
          </span>
          <span>
            <strong className="tnum">{strength?.avgAge ?? '–'}</strong> avg age
          </span>
          <span>
            <strong className="tnum">{strength?.filled ?? 0}/11</strong> picked
          </span>
        </div>
      </div>
      <div className="stack gap-3" style={{ marginTop: 14 }}>
        {rows.map((r) => (
          <div key={r.key} className="strength-row">
            <span className="strength-label">{r.label}</span>
            <div className="meter grow">
              <motion.div className="meter-fill" animate={{ width: `${Math.max(0, Math.min(100, ((strength?.[r.key] || 40) - 40) / 0.55))}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
            <span className="tnum strength-val">{strength?.[r.key] ?? '–'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesPanel({ xi, roles, onChange, onSuggest }) {
  return (
    <div className="stack gap-3" style={{ padding: 16 }}>
      {ROLE_FIELDS.map((f) => (
        <label key={f.key} className="role-row">
          <span className="role-label">
            <f.icon size={14} /> {f.label}
          </span>
          <select className="select" value={roles[f.key] || ''} onChange={(e) => onChange({ ...roles, [f.key]: e.target.value || undefined })}>
            <option value="">Not set</option>
            {xi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.number ? `${p.number} · ` : ''}
                {p.name} ({p.ovr})
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type="button" className="btn btn-secondary" onClick={onSuggest} disabled={xi.length < 3}>
        <Sparkles size={14} /> Suggest takers
      </button>
    </div>
  );
}

function InstructionsPanel({ tactics, onChange, notes }) {
  const preset = matchPreset(tactics);
  return (
    <div className="stack gap-4" style={{ padding: 16 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Style
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {Object.keys(TACTIC_PRESETS).map((name) => (
            <button key={name} type="button" className={`chip ${preset === name ? 'is-active' : ''}`} onClick={() => onChange(TACTIC_PRESETS[name])}>
              {name}
            </button>
          ))}
          {preset === 'Custom' && <span className="chip is-active">Custom</span>}
        </div>
      </div>
      {TACTIC_SLIDERS.map((s) => (
        <label key={s.key} className="slider-field">
          <span className="slider-head">
            <span className="slider-label">{s.label}</span>
            <span className="tnum subtle" style={{ fontSize: 12 }}>
              {tactics[s.key] ?? 50}
            </span>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            className="range"
            value={tactics[s.key] ?? 50}
            onChange={(e) => onChange({ ...tactics, [s.key]: Number(e.target.value) })}
            style={{ '--val': `${tactics[s.key] ?? 50}%` }}
          />
          <span className="slider-ends">
            <span>{s.low}</span>
            <span>{s.high}</span>
          </span>
        </label>
      ))}
      <div className="stack gap-2">
        <div className="eyebrow">Assistant&apos;s notes</div>
        {notes.map((n, i) => (
          <div key={i} className={`notice ${n.tone === 'warn' ? 'warn' : ''}`}>
            {n.tone === 'good' ? <Check size={15} color="var(--success)" /> : <Info size={15} />}
            <span>{n.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Tactics() {
  const { players, playersById, isLoading, error, state, setState, session } = useClub();
  const { push } = useToast();
  const [selected, setSelected] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [panel, setPanel] = useState('squad');
  const [filter, setFilter] = useState('available');

  const formation = FORMATIONS[state.formation] ? state.formation : '4-3-3';
  const slots = FORMATIONS[formation];
  const lineup = useMemo(() => {
    // Drop ids that are no longer in the squad
    const out = {};
    Object.entries(state.lineup || {}).forEach(([slot, id]) => {
      if (playersById.has(id)) out[slot] = id;
    });
    return out;
  }, [state.lineup, playersById]);
  const bench = useMemo(() => (state.bench || []).filter((id) => playersById.has(id)), [state.bench, playersById]);
  const roles = useMemo(() => state.roles || {}, [state.roles]);
  const tactics = useMemo(() => ({ ...TACTIC_PRESETS.Balanced, ...(state.tactics || {}) }), [state.tactics]);
  const color = visibleTeamColor(session.color, session.altColor, 'dark');

  const inXI = useMemo(() => new Set(Object.values(lineup)), [lineup]);
  const onBench = useMemo(() => new Set(bench), [bench]);
  const xiPlayers = useMemo(() => [...inXI].map((id) => playersById.get(id)).filter(Boolean), [inXI, playersById]);
  const strength = useMemo(() => teamStrength(lineup, formation, playersById), [lineup, formation, playersById]);
  const notes = useMemo(() => tacticNotes(tactics, strength, xiPlayers), [tactics, strength, xiPlayers]);

  const commit = useCallback(
    (nextLineup, nextBench) => {
      const xi = new Set(Object.values(nextLineup));
      const cleanRoles = Object.fromEntries(Object.entries(roles).filter(([, id]) => xi.has(id)));
      setState((s) => ({ ...s, lineup: nextLineup, bench: nextBench, roles: cleanRoles, initialized: true }));
    },
    [roles, setState],
  );

  const locate = useCallback(
    (pid) => {
      const slot = Object.keys(lineup).find((k) => lineup[k] === pid);
      if (slot) return { type: 'slot', id: slot };
      if (onBench.has(pid)) return { type: 'bench' };
      return { type: 'reserve' };
    },
    [lineup, onBench],
  );

  const move = useCallback(
    (pid, target) => {
      const from = locate(pid);
      const L = { ...lineup };
      let B = [...bench];
      if (from.type === 'slot') delete L[from.id];
      if (from.type === 'bench') B = B.filter((x) => x !== pid);

      if (target.type === 'slot') {
        const occupant = lineup[target.id];
        L[target.id] = pid;
        if (occupant && occupant !== pid) {
          if (from.type === 'slot') L[from.id] = occupant;
          else if (from.type === 'bench') B.push(occupant);
        }
      } else if (target.type === 'bench') {
        if (!B.includes(pid)) {
          if (B.length >= BENCH_MAX) {
            push({ kind: 'error', title: 'Bench is full', text: `You can name up to ${BENCH_MAX} substitutes.` });
            return;
          }
          B.push(pid);
        }
      }
      const p = playersById.get(pid);
      if (target.type === 'slot' && p && !isAvailable(p)) {
        push({ kind: 'info', title: `${p.name} is ${p.status}`, text: 'Picked anyway. Change their status on the Squad page.' });
      }
      commit(L, B);
    },
    [locate, lineup, bench, commit, playersById, push],
  );

  const onTapPlayer = (pid) => {
    if (selected === pid) setSelected(null);
    else if (selected) {
      // Second tap on another player: swap them
      const target = locate(pid);
      move(selected, target.type === 'slot' ? target : target.type === 'bench' ? { type: 'bench' } : { type: 'reserve' });
      setSelected(null);
    } else setSelected(pid);
  };

  const onTapSlot = (slotId) => {
    if (!selected) return;
    move(selected, { type: 'slot', id: slotId });
    setSelected(null);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 6 } }));

  const onDragEnd = ({ active, over }) => {
    setActiveDrag(null);
    if (!over) return;
    const pid = active.data.current?.playerId;
    if (!pid) return;
    const oid = String(over.id);
    if (oid.startsWith('slot:')) move(pid, { type: 'slot', id: oid.slice(5) });
    else if (oid === 'zone:bench') move(pid, { type: 'bench' });
    else if (oid === 'zone:reserve') move(pid, { type: 'reserve' });
    setSelected(null);
  };

  const changeFormation = (id) => {
    if (id === formation) return;
    const { lineup: L, leftovers } = remapLineup(lineup, formation, id);
    const B = [...bench];
    leftovers.forEach((pid) => {
      if (B.length < BENCH_MAX && !B.includes(pid)) B.push(pid);
    });
    setState((s) => ({ ...s, formation: id, lineup: L, bench: B, initialized: true }));
  };

  const runAutoPick = () => {
    const pick = autoPick(players, formation, BENCH_MAX);
    commit(pick.lineup, pick.bench);
    push({ kind: 'success', title: 'Best XI selected', text: 'Picked by rating and natural position, skipping unavailable players.' });
  };

  const suggestRoles = () => {
    const byOvr = [...xiPlayers].sort((a, b) => b.ovr - a.ovr);
    const outfield = byOvr.filter((p) => p.pos !== 'GK');
    const fwd = outfield.filter((p) => p.pos === 'FWD');
    const mid = outfield.filter((p) => p.pos === 'MID');
    const next = {
      captain: outfield[0]?.id,
      vice: outfield[1]?.id,
      penalties: (fwd[0] || outfield[0])?.id,
      freeKicks: (mid[0] || outfield[0])?.id,
      corners: (mid[1] || mid[0] || outfield[1])?.id,
    };
    setState((s) => ({ ...s, roles: next }));
  };

  if (isLoading) {
    return (
      <div className="tactics">
        <Skeleton h={640} r={18} />
        <Skeleton h={640} r={14} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="card">
        <ErrorState error={error} />
      </div>
    );
  }
  if (players.length < 11) {
    return (
      <div className="card">
        <EmptyState icon={Info} title="Not enough players" text={`A lineup needs 11 players. Your squad has ${players.length}. Add players on the Squad page.`} />
      </div>
    );
  }

  const reserves = players.filter((p) => !inXI.has(p.id) && !onBench.has(p.id));
  const listed = filter === 'available' ? reserves : players;
  const groups = ['GK', 'DEF', 'MID', 'FWD'].map((g) => ({ g, list: listed.filter((p) => p.pos === g).sort((a, b) => b.ovr - a.ovr) }));
  const dragPlayer = activeDrag ? playersById.get(activeDrag) : null;

  return (
    <DndContext sensors={sensors} onDragStart={({ active }) => setActiveDrag(active.data.current?.playerId)} onDragEnd={onDragEnd} onDragCancel={() => setActiveDrag(null)}>
      <LayoutGroup>
        <div className="tactics">
          <div className="tactics-main">
            <div className="tactics-toolbar">
              <div className="chip-row" role="radiogroup" aria-label="Formation">
                {FORMATION_IDS.map((f) => (
                  <button key={f} type="button" role="radio" aria-checked={f === formation} className={`chip ${f === formation ? 'is-active' : ''}`} onClick={() => changeFormation(f)}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="row gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={runAutoPick}>
                  <Wand2 size={14} /> Auto-pick
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => commit({}, [])} title="Clear lineup">
                  <Eraser size={14} /> Clear
                </button>
                {state.updatedAt && (
                  <span className="saved-pill" title={new Date(state.updatedAt).toLocaleString()}>
                    <Check size={12} /> Saved {timeAgo(state.updatedAt)}
                  </span>
                )}
              </div>
            </div>

            {selected && (
              <motion.div className="notice" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <Info size={15} />
                <span className="grow">
                  <strong>{playersById.get(selected)?.name}</strong> selected. Tap a position, a player to swap, or the bench.
                </span>
                <button type="button" className="icon-btn sm" onClick={() => setSelected(null)} aria-label="Cancel selection">
                  <X size={14} />
                </button>
              </motion.div>
            )}

            <TacticsPitch slots={slots} lineup={lineup} playersById={playersById} color={color} roles={roles} selectedId={selected} onTapPlayer={onTapPlayer} onTapSlot={onTapSlot} />

            <BenchZone
              bench={bench}
              playersById={playersById}
              color={color}
              roles={roles}
              selectedId={selected}
              onTapPlayer={onTapPlayer}
              onTapBench={() => {
                if (selected) {
                  move(selected, { type: 'bench' });
                  setSelected(null);
                }
              }}
              max={BENCH_MAX}
            />
          </div>

          <aside className="tactics-side">
            <StrengthBars strength={strength} />
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '0 8px' }}>
                <Tabs
                  value={panel}
                  onChange={setPanel}
                  ariaLabel="Tactics panels"
                  items={[
                    { value: 'squad', label: 'Squad', badge: reserves.length },
                    { value: 'roles', label: 'Roles' },
                    { value: 'instructions', label: 'Instructions' },
                  ]}
                />
              </div>
              {panel === 'squad' && (
                <div>
                  <div style={{ padding: '12px 16px 4px' }}>
                    <Segmented
                      size="sm"
                      ariaLabel="Show players"
                      value={filter}
                      onChange={setFilter}
                      items={[
                        { value: 'available', label: 'Not selected' },
                        { value: 'all', label: 'Whole squad' },
                      ]}
                    />
                  </div>
                  <ReserveZone>
                    {groups.map(({ g, list }) =>
                      list.length ? (
                        <div key={g}>
                          <div className="eyebrow" style={{ padding: '12px 16px 4px' }}>
                            {POSITION_PLURAL[g]}
                          </div>
                          {list.map((p) => (
                            <ReserveRow key={p.id} player={p} selected={selected === p.id} onTap={() => onTapPlayer(p.id)}>
                              <span className="squad-num" style={{ width: 22 }}>
                                {p.number}
                              </span>
                              <span className="grow" style={{ minWidth: 0, textAlign: 'left' }}>
                                <span className="truncate" style={{ display: 'block', fontWeight: 600, fontSize: 13.5 }}>
                                  {p.name}
                                </span>
                                <span className="subtle" style={{ fontSize: 11.5 }}>
                                  {inXI.has(p.id) ? 'In the XI' : onBench.has(p.id) ? 'On the bench' : p.age ? `${p.age} yrs` : ' '}
                                </span>
                              </span>
                              {!isAvailable(p) && <span className={`badge ${p.status === 'injured' ? 'badge-danger' : 'badge-warning'}`}>{p.status}</span>}
                              <PosBadge pos={p.pos} />
                              <OvrBadge value={p.ovr} />
                            </ReserveRow>
                          ))}
                        </div>
                      ) : null,
                    )}
                    {listed.length === 0 && <EmptyState compact title="Everyone is selected" text="All squad players are in the XI or on the bench." />}
                  </ReserveZone>
                  <p className="subtle" style={{ fontSize: 12, padding: '10px 16px 14px' }}>
                    Drag players onto the pitch, or tap a player and then a position. Drag a player back here to leave them out of the matchday squad.
                  </p>
                </div>
              )}
              {panel === 'roles' && <RolesPanel xi={[...xiPlayers].sort((a, b) => b.ovr - a.ovr)} roles={roles} onChange={(r) => setState((s) => ({ ...s, roles: r }))} onSuggest={suggestRoles} />}
              {panel === 'instructions' && <InstructionsPanel tactics={tactics} onChange={(t) => setState((s) => ({ ...s, tactics: t }))} notes={notes} />}
            </div>
          </aside>
        </div>
      </LayoutGroup>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {dragPlayer ? <PlayerToken player={dragPlayer} color={color} roles={roles} dragging /> : null}
      </DragOverlay>
      <span className="sr-only" aria-live="polite">
        {strength ? `Team rating ${strength.overall}` : ''}
      </span>
    </DndContext>
  );
}
