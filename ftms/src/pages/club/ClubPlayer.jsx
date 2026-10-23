import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useClub, useLocalMatches, useLocalPlayers } from '../../context/ClubContext';
import { statsService } from '../../services/statsService';
import { ATTRIBUTES, POSITION_LABEL } from '../../lib/ratings';
import { formatShortDate } from '../../lib/format';
import FutCard from '../../components/manager/FutCard';
import Radar from '../../components/ui/Radar';
import PlayerFormModal from '../../components/club/PlayerFormModal';
import { Morale, RoleSelect, StatusSelect } from '../../components/manager/PlayerControls';
import { PosBadge } from '../../components/ui/Bits';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/States';

export default function ClubPlayer() {
  const { playerId } = useParams();
  const { real, playersById, updateMeta } = useClub();
  const raw = useLocalPlayers(!real);
  const matches = useLocalMatches(!real);
  const summary = useQuery({ queryKey: ['local', 'playerStats', playerId], queryFn: () => statsService.getPlayerStatsSummary(Number(playerId)), enabled: !real });
  const [editOpen, setEditOpen] = useState(false);

  const p = playersById.get(String(playerId));
  const rawPlayer = (raw.data || []).find((x) => String(x.id) === String(playerId));
  const played = useMemo(
    () =>
      (matches.data || [])
        .filter((m) => (m.selectedPlayerIds || []).map(String).includes(String(playerId)))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [matches.data, playerId],
  );

  if (real) return <Navigate to="/manager/squad" replace />;
  if (raw.isLoading) return <Skeleton h={400} r={14} />;
  if (!p || !rawPlayer)
    return (
      <div className="card">
        <ErrorState title="Player not found" />
      </div>
    );

  const attrs = ATTRIBUTES.map((a) => ({ label: a.short, value: p.ratings?.[a.key] ?? 50 }));
  const stats = Object.values(summary.data || {});

  return (
    <div className="stack gap-4">
      <Link to="/manager/squad" className="back-link" style={{ marginBottom: 0 }}>
        <ArrowLeft size={15} /> Squad
      </Link>
      <div className="split">
        <div className="stack gap-4" style={{ minWidth: 0 }}>
          <div className="card card-body row gap-5" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <FutCard player={p} attrs={attrs} />
            <div className="stack gap-3 grow" style={{ minWidth: 220 }}>
              <div>
                <h2 style={{ fontSize: 26, letterSpacing: '-0.025em' }}>{p.name}</h2>
                <div className="row gap-2 subtle" style={{ fontSize: 13, marginTop: 6, flexWrap: 'wrap' }}>
                  <PosBadge pos={p.pos} /> {POSITION_LABEL[p.pos]}
                  {p.number !== '' && <span>· #{p.number}</span>}
                  {p.age && <span>· {p.age} yrs</span>}
                  {rawPlayer.preferredFoot && <span>· {rawPlayer.preferredFoot} foot</span>}
                  {rawPlayer.height && <span>· {rawPlayer.height} cm</span>}
                  {rawPlayer.weight && <span>· {rawPlayer.weight} kg</span>}
                </div>
              </div>
              {rawPlayer.notes && <p className="muted" style={{ fontSize: 14 }}>{rawPlayer.notes}</p>}
              <div className="stack gap-3" style={{ maxWidth: 420 }}>
                <div className="role-row">
                  <span className="role-label">Status</span>
                  <StatusSelect value={p.status} onChange={(v) => updateMeta(p.id, { status: v })} />
                </div>
                <div className="role-row">
                  <span className="role-label">Squad role</span>
                  <RoleSelect value={p.meta?.role} onChange={(v) => updateMeta(p.id, { role: v })} />
                </div>
                <div className="role-row">
                  <span className="role-label">Morale</span>
                  <Morale value={p.meta?.morale || 3} onChange={(v) => updateMeta(p.id, { morale: v })} />
                </div>
              </div>
              <div>
                <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(true)}>
                  <Pencil size={14} /> Edit player
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Recorded stats</span>
            </div>
            {stats.length ? (
              <div className="kv" style={{ margin: 16 }}>
                {stats.map(({ def, values }) => {
                  const nums = values.map((v) => Number(v.value)).filter((n) => Number.isFinite(n));
                  const display =
                    def.type === 'qualitative'
                      ? values[values.length - 1]?.value || '–'
                      : def.unit === '%'
                        ? `${Math.round(nums.reduce((s, n) => s + n, 0) / (nums.length || 1))}%`
                        : nums.reduce((s, n) => s + n, 0);
                  return (
                    <div key={def.id} className="kv-item">
                      <span className="kv-label">{def.name}</span>
                      <span className="kv-value">{display}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState compact title="No stats recorded yet" text="Stats appear after you record them on a completed match." />
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Matches</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                {played.length} selected
              </span>
            </div>
            {played.length ? (
              played.map((m) => {
                const team = (m.teams || []).find((t) => t.playerIds.map(String).includes(String(playerId)));
                return (
                  <Link key={m.id} to={`/manager/matches/${m.id}`} className="list-row">
                    <span className="fixture-date" style={{ width: 60 }}>
                      {formatShortDate(`${m.date}T12:00`)}
                    </span>
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="truncate" style={{ display: 'block', fontWeight: 600 }}>
                        {m.title}
                      </span>
                      <span className="subtle" style={{ fontSize: 12 }}>
                        {team ? team.name : m.status === 'completed' ? 'Bench' : 'Selected'}
                      </span>
                    </span>
                    {m.score && (
                      <span className="result-pill tnum">
                        {m.score.home}–{m.score.away}
                      </span>
                    )}
                  </Link>
                );
              })
            ) : (
              <EmptyState compact title="Not selected for a match yet" />
            )}
          </div>
        </div>
        <aside>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Attributes</span>
            </div>
            <div className="card-body">
              <Radar axes={ATTRIBUTES.map((a) => ({ label: a.label, value: p.ratings?.[a.key] ?? 50 }))} />
              <div className="stack gap-2" style={{ marginTop: 16 }}>
                {ATTRIBUTES.map((a) => (
                  <div key={a.key} className="strength-row">
                    <span className="strength-label">{a.label}</span>
                    <div className="meter grow">
                      <div className="meter-fill" style={{ width: `${p.ratings?.[a.key] ?? 50}%` }} />
                    </div>
                    <span className="tnum strength-val">{p.ratings?.[a.key] ?? 50}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      <PlayerFormModal open={editOpen} onClose={() => setEditOpen(false)} player={rawPlayer} />
    </div>
  );
}
