import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { BarChart3, Pencil, Plus, Trash2 } from 'lucide-react';
import { useClub, useLocalMatches, useLocalPlayers } from '../../context/ClubContext';
import { statsService } from '../../services/statsService';
import db from '../../db/database';
import StatDefinitionModal from '../../components/club/StatDefinitionModal';
import { ConfirmDialog } from '../../components/ui/Modal';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/States';

function Leaderboard({ def, rows, playersById }) {
  // Percentages are averaged per player; counts are summed.
  const isAvg = def.unit === '%';
  const sums = new Map();
  rows.forEach((r) => {
    const cur = sums.get(r.playerId) || { total: 0, n: 0 };
    sums.set(r.playerId, { total: cur.total + (Number(r.value) || 0), n: cur.n + 1 });
  });
  const list = [...sums.entries()]
    .map(([pid, s]) => ({ pid, v: isAvg ? Math.round(s.total / s.n) : s.total, p: playersById.get(pid) }))
    .filter((x) => x.p && x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 8);
  const max = isAvg ? 100 : list[0]?.v || 1;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{def.name}</span>
        <span className="subtle" style={{ fontSize: 12 }}>
          {isAvg ? 'Average' : 'Total'}
        </span>
      </div>
      {list.length ? (
        <div className="card-body stack gap-3">
          {list.map((x, i) => (
            <Link key={x.pid} to={`/manager/squad/${x.pid}`} className="lb-row" title={`${x.p.name}: ${x.v}${def.unit || ''}`}>
              <span className="lb-name truncate">{x.p.name}</span>
              <span className="lb-track">
                <motion.span className="lb-bar" initial={{ width: 0 }} animate={{ width: `${(x.v / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }} />
              </span>
              <span className="lb-val tnum">
                {x.v}
                {def.unit || ''}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState compact title="No entries yet" text="Record stats from a completed match." />
      )}
    </div>
  );
}

function Distribution({ def, rows }) {
  const choices = def.choices || [];
  const counts = choices.map((c) => ({ c, n: rows.filter((r) => r.value === c).length }));
  const total = counts.reduce((s, x) => s + x.n, 0) || 1;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{def.name}</span>
        <span className="subtle" style={{ fontSize: 12 }}>
          {rows.length} ratings
        </span>
      </div>
      <div className="card-body stack gap-3">
        {counts.map((x, i) => (
          <div key={x.c} className="lb-row" title={`${x.c}: ${x.n}`}>
            <span className="lb-name">{x.c}</span>
            <span className="lb-track">
              {/* one hue, light → dark from worst to best */}
              <motion.span className="lb-bar" style={{ opacity: 0.35 + (0.65 * (i + 1)) / choices.length }} initial={{ width: 0 }} animate={{ width: `${(x.n / total) * 100}%` }} transition={{ duration: 0.6 }} />
            </span>
            <span className="lb-val tnum">{x.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClubStats() {
  const { real } = useClub();
  const queryClient = useQueryClient();
  const defs = useQuery({ queryKey: ['local', 'statDefs'], queryFn: () => statsService.getAllDefinitions(), enabled: !real });
  const allStats = useQuery({ queryKey: ['local', 'allStats'], queryFn: () => db.playerStats.toArray(), enabled: !real });
  const players = useLocalPlayers(!real);
  const matches = useLocalMatches(!real);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const playersById = useMemo(() => new Map((players.data || []).map((p) => [p.id, p])), [players.data]);

  if (real) return <Navigate to="/manager" replace />;

  const completed = (matches.data || []).filter((m) => m.status === 'completed');
  const record = completed.reduce((acc, m) => {
    if (!m.score) return acc;
    acc.goals += (m.score.home || 0) + (m.score.away || 0);
    return acc;
  }, { goals: 0 });
  const list = defs.data || [];

  return (
    <div className="stack gap-5">
      <div className="kv">
        <div className="kv-item">
          <span className="kv-label">Matches played</span>
          <span className="kv-value">{completed.length}</span>
        </div>
        <div className="kv-item">
          <span className="kv-label">Goals scored</span>
          <span className="kv-value">{record.goals}</span>
        </div>
        <div className="kv-item">
          <span className="kv-label">Players</span>
          <span className="kv-value">{players.data?.length ?? 0}</span>
        </div>
        <div className="kv-item">
          <span className="kv-label">Stat entries</span>
          <span className="kv-value">{allStats.data?.length ?? 0}</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">
            <BarChart3 size={16} /> Leaderboards
          </h2>
        </div>
        {defs.isLoading || allStats.isLoading ? (
          <div className="card">
            <SkeletonRows rows={5} />
          </div>
        ) : list.filter((d) => d.inChart).length ? (
          <div className="grid-2">
            {list
              .filter((d) => d.inChart)
              .map((d) => {
                const rows = (allStats.data || []).filter((s) => s.statDefId === d.id);
                return d.type === 'qualitative' ? <Distribution key={d.id} def={d} rows={rows} /> : <Leaderboard key={d.id} def={d} rows={rows} playersById={playersById} />;
              })}
          </div>
        ) : (
          <div className="card">
            <EmptyState compact icon={BarChart3} title="No leaderboards switched on" text="Edit a stat field and tick “Show on the stats page leaderboards”." />
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Stat fields</h2>
            <p className="section-sub">What you record for each player after a match.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={14} /> New field
          </button>
        </div>
        <div className="card">
          {list.length ? (
            list.map((d) => (
              <div key={d.id} className="list-row">
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="row gap-2">
                    <span style={{ fontWeight: 650 }}>{d.name}</span>
                    <span className="badge">{d.category || 'General'}</span>
                    <span className="badge badge-info">{d.type === 'qualitative' ? 'Choice' : `Number${d.unit ? ` · ${d.unit}` : ''}`}</span>
                    {d.inChart ? <span className="badge badge-accent">On leaderboard</span> : null}
                  </span>
                  {d.description && (
                    <span className="subtle truncate" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                      {d.description}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={() => {
                    setEditing(d);
                    setFormOpen(true);
                  }}
                  aria-label={`Edit ${d.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button type="button" className="icon-btn sm" onClick={() => setDeleting(d)} aria-label={`Delete ${d.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <EmptyState compact title="No stat fields" text="Create fields like Goals, Assists or Work rate." />
          )}
        </div>
      </section>

      <StatDefinitionModal open={formOpen} onClose={() => setFormOpen(false)} def={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        danger
        title={`Delete “${deleting?.name}”?`}
        text="All values recorded for this field will be deleted too."
        confirmLabel="Delete field"
        onConfirm={async () => {
          await statsService.removeDefinition(deleting.id);
          queryClient.invalidateQueries({ queryKey: ['local'] });
        }}
      />
    </div>
  );
}
