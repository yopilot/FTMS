/* eslint-disable react-refresh/only-export-components */
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, ClipboardList, HeartPulse, UserX } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { FORMATIONS, isAvailable, matchPreset, teamStrength } from '../../lib/formations';
import { OvrBadge, PosBadge } from '../ui/Bits';

export function useMatchdayChecklist() {
  const { state, playersById } = useClub();
  const lineup = Object.values(state.lineup || {}).filter((id) => playersById.has(id));
  const unavailableInXI = lineup.map((id) => playersById.get(id)).filter((p) => p && !isAvailable(p));
  const roles = state.roles || {};
  const items = [
    { key: 'xi', label: `Starting XI picked (${lineup.length}/11)`, done: lineup.length === 11, to: '/manager/tactics' },
    { key: 'fit', label: unavailableInXI.length ? `${unavailableInXI.length} unavailable player(s) in the XI` : 'Everyone in the XI is available', done: lineup.length > 0 && unavailableInXI.length === 0, to: '/manager/tactics' },
    { key: 'bench', label: `Substitutes named (${(state.bench || []).length}/9)`, done: (state.bench || []).length >= 5, to: '/manager/tactics' },
    { key: 'captain', label: 'Captain chosen', done: Boolean(roles.captain), to: '/manager/tactics' },
    { key: 'sp', label: 'Set-piece takers set', done: Boolean(roles.penalties && roles.freeKicks && roles.corners), to: '/manager/tactics' },
    { key: 'plan', label: `Game plan: ${matchPreset(state.tactics)}`, done: Boolean(state.tactics), to: '/manager/tactics' },
  ];
  return { items, done: items.filter((i) => i.done).length };
}

function ProgressRing({ value, total }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <span className="progress-ring" aria-label={`${value} of ${total} done`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / total) }}
          transition={{ duration: 0.8 }}
        />
      </svg>
      <span>
        {value}/{total}
      </span>
    </span>
  );
}

export function ChecklistCard() {
  const { items, done } = useMatchdayChecklist();
  return (
    <div className="card">
      <div className="card-header">
        <span>
          <span className="card-title">Matchday checklist</span>
          <span className="subtle" style={{ fontSize: 12 }}>
            {done === items.length ? 'Ready for kick-off' : `${items.length - done} thing${items.length - done === 1 ? '' : 's'} to sort`}
          </span>
        </span>
        <ProgressRing value={done} total={items.length} />
      </div>
      {items.map((i) => (
        <Link key={i.key} to={i.to} className="checklist-item">
          <span className={`check-dot ${i.done ? 'is-done' : ''}`}>
            <Check size={12} strokeWidth={3} />
          </span>
          <span className="grow" style={{ color: i.done ? 'var(--text-2)' : 'var(--text)' }}>
            {i.label}
          </span>
          {!i.done && <ArrowRight size={14} className="subtle" />}
        </Link>
      ))}
    </div>
  );
}

export function SquadStatusCard() {
  const { players } = useClub();
  const out = players.filter((p) => !isAvailable(p));
  const doubtful = players.filter((p) => p.status === 'doubtful');
  const available = players.length - out.length;
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-header">
        <span className="card-title">
          <HeartPulse size={15} /> Squad status
        </span>
        <Link to="/manager/squad" className="link-quiet">
          Manage
        </Link>
      </div>
      <div className="status-grid">
        <div className="status-cell">
          <strong style={{ color: 'var(--success)' }}>{available}</strong>
          <span>Available</span>
        </div>
        <div className="status-cell">
          <strong style={{ color: 'var(--warning)' }}>{doubtful.length}</strong>
          <span>Doubtful</span>
        </div>
        <div className="status-cell">
          <strong style={{ color: 'var(--danger)' }}>{out.length}</strong>
          <span>Out</span>
        </div>
      </div>
      {out.length > 0 ? (
        out.slice(0, 6).map((p) => (
          <div key={p.id} className="list-row" style={{ paddingTop: 8, paddingBottom: 8 }}>
            <UserX size={15} color="var(--danger)" />
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="truncate" style={{ display: 'block', fontWeight: 600, fontSize: 13.5 }}>
                {p.name}
              </span>
              <span className="subtle truncate" style={{ display: 'block', fontSize: 12 }}>
                {p.injuries?.[0]?.detail || p.injuries?.[0]?.status || p.status}
              </span>
            </span>
            <PosBadge pos={p.pos} />
          </div>
        ))
      ) : (
        <p className="subtle" style={{ padding: '12px 20px 16px', fontSize: 13 }}>
          Full squad available.
        </p>
      )}
    </div>
  );
}

export function LineupSummaryCard() {
  const { state, playersById } = useClub();
  const formation = FORMATIONS[state.formation] ? state.formation : '4-3-3';
  const slots = FORMATIONS[formation];
  const lineup = state.lineup || {};
  const strength = teamStrength(lineup, formation, playersById);
  const lines = ['FWD', 'MID', 'DEF', 'GK'].map((g) => slots.filter((s) => s.group === g).map((s) => ({ slot: s, p: playersById.get(lineup[s.id]) })));

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <ClipboardList size={15} /> Your XI · {formation}
        </span>
        <Link to="/manager/tactics" className="link-quiet">
          Edit
        </Link>
      </div>
      {strength ? (
        <div className="card-body stack gap-3">
          {lines.map((line, i) =>
            line.length ? (
              <div key={i} className="xi-line">
                {line.map(({ slot, p }) => (
                  <span key={slot.id} className={`xi-chip ${p ? '' : 'is-empty'}`}>
                    <span className="xi-role">{slot.role}</span>
                    <span className="truncate">{p ? p.lastName || p.name : '—'}</span>
                    {p && <OvrBadge value={p.ovr} />}
                  </span>
                ))}
              </div>
            ) : null,
          )}
          <div className="row gap-4 subtle" style={{ fontSize: 12.5, marginTop: 4 }}>
            <span>
              Team rating <strong style={{ color: 'var(--text)' }}>{strength.overall}</strong>
            </span>
            <span>
              Attack <strong style={{ color: 'var(--text)' }}>{strength.attack}</strong>
            </span>
            <span>
              Defence <strong style={{ color: 'var(--text)' }}>{strength.defence}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="card-body">
          <p className="muted" style={{ fontSize: 13.5 }}>
            No lineup yet.{' '}
            <Link to="/manager/tactics" className="link">
              Pick your XI
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
