import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Pencil, Search, Tag, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useClub, useLocalPlayers } from '../../context/ClubContext';
import { usePersonSummary } from '../../api/queries';
import { useToast } from '../../context/ToastContext';
import { ATTRIBUTES, POSITION_LABEL } from '../../lib/ratings';
import { isAvailable } from '../../lib/formations';
import { playerService } from '../../services/playerService';
import { OvrBadge, PosBadge } from '../../components/ui/Bits';
import { Drawer, ConfirmDialog } from '../../components/ui/Modal';
import { Segmented } from '../../components/ui/Tabs';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/States';
import FutCard from '../../components/manager/FutCard';
import { Morale, RoleSelect, StatusSelect } from '../../components/manager/PlayerControls';
import PlayerFormModal from '../../components/club/PlayerFormModal';
import { useMediaQuery } from '../../lib/useMediaQuery';

const SORTS = {
  ovr: (a, b) => b.ovr - a.ovr,
  name: (a, b) => a.name.localeCompare(b.name),
  age: (a, b) => (a.age || 99) - (b.age || 99),
  number: (a, b) => (Number(a.number) || 999) - (Number(b.number) || 999),
  goals: (a, b) => (b.stats?.totalGoals || 0) - (a.stats?.totalGoals || 0),
};

function realAttrs(p) {
  const s = p.stats || {};
  return [
    { label: 'APP', value: s.appearances ?? 0 },
    { label: 'GLS', value: s.totalGoals ?? 0 },
    { label: 'AST', value: s.goalAssists ?? 0 },
    { label: 'SHT', value: s.totalShots ?? 0 },
    { label: p.pos === 'GK' ? 'SAV' : 'SOT', value: p.pos === 'GK' ? s.saves ?? 0 : s.shotsOnTarget ?? 0 },
    { label: 'AGE', value: p.age ?? '–' },
  ];
}

function localAttrs(p) {
  return ATTRIBUTES.map((a) => ({ label: a.short, value: p.ratings?.[a.key] ?? 50 }));
}

function PlayerPanel({ player, onEdit, onDelete }) {
  const { real, updateMeta } = useClub();
  const wiki = usePersonSummary(real ? player.name : null, 'player');
  const meta = player.meta || {};
  return (
    <div className="stack gap-5">
      <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
        <FutCard player={player} photo={wiki.data?.image} attrs={real ? realAttrs(player) : localAttrs(player)} />
        <div className="stack gap-2" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-0.02em' }}>{player.name}</div>
          <div className="row gap-2 subtle" style={{ fontSize: 13, flexWrap: 'wrap' }}>
            <PosBadge pos={player.pos} /> {POSITION_LABEL[player.pos]}
            {player.number && <span>· #{player.number}</span>}
          </div>
          {player.nationality && (
            <div className="row gap-2 subtle" style={{ fontSize: 13 }}>
              {player.flag && <img className="flag" src={player.flag} alt="" />} {player.nationality}
            </div>
          )}
          {player.age && <div className="subtle" style={{ fontSize: 13 }}>{player.age} years old</div>}
          {player.injured && player.injuries?.[0] && <span className="badge badge-danger">{player.injuries[0].detail || player.injuries[0].status}</span>}
          {real ? (
            <Link to={`/player/${player.id}`} className="link" style={{ marginTop: 6 }}>
              Full profile <ArrowUpRight size={13} />
            </Link>
          ) : (
            <Link to={`/manager/squad/${player.id}`} className="link" style={{ marginTop: 6 }}>
              Player page <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
      </div>

      <div className="stack gap-3">
        <div className="eyebrow">Manager decisions</div>
        <div className="role-row">
          <span className="role-label">Status</span>
          <StatusSelect value={player.status} onChange={(v) => updateMeta(player.id, { status: v })} />
        </div>
        <div className="role-row">
          <span className="role-label">Squad role</span>
          <RoleSelect value={meta.role} onChange={(v) => updateMeta(player.id, { role: v })} />
        </div>
        <div className="role-row">
          <span className="role-label">Morale</span>
          <Morale value={meta.morale || 3} onChange={(v) => updateMeta(player.id, { morale: v })} />
        </div>
        <label className="role-row">
          <span className="role-label">
            <Tag size={14} /> Transfer list
          </span>
          <span>
            <input type="checkbox" className="checkbox" checked={Boolean(meta.listed)} onChange={(e) => updateMeta(player.id, { listed: e.target.checked })} />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Private notes</span>
          <textarea className="textarea" value={meta.note || ''} onChange={(e) => updateMeta(player.id, { note: e.target.value })} placeholder="Training form, conversations, plans…" maxLength={600} />
        </label>
      </div>

      {!real && (
        <div className="row gap-2">
          <button type="button" className="btn btn-secondary grow" onClick={onEdit}>
            <Pencil size={14} /> Edit details
          </button>
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default function Squad() {
  const { players, real, isLoading, error, updateMeta, state, playersById } = useClub();
  const local = useLocalPlayers(!real);
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [q, setQ] = useState('');
  const [pos, setPos] = useState('all');
  const [sort, setSort] = useState('ovr');
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(params.get('add') === '1');
  const [deleting, setDeleting] = useState(null);
  const narrow = useMediaQuery('(max-width: 899px)');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return players.filter((p) => (pos === 'all' || p.pos === pos) && (!s || p.name.toLowerCase().includes(s))).sort(SORTS[sort] || SORTS.ovr);
  }, [players, q, pos, sort]);

  const open = openId ? playersById.get(openId) : null;
  const xi = new Set(Object.values(state.lineup || {}));
  const ages = players.filter((p) => p.age);
  const summary = {
    size: players.length,
    avgAge: ages.length ? (ages.reduce((s, p) => s + p.age, 0) / ages.length).toFixed(1) : '–',
    avgOvr: players.length ? Math.round(players.reduce((s, p) => s + p.ovr, 0) / players.length) : '–',
    available: players.filter(isAvailable).length,
    listed: players.filter((p) => p.meta?.listed).length,
  };

  const rawLocal = (id) => (local.data || []).find((p) => String(p.id) === String(id));

  if (error)
    return (
      <div className="card">
        <ErrorState error={error} />
      </div>
    );

  return (
    <div className="stack gap-4">
      <div className="kv">
        <div className="kv-item">
          <span className="kv-label">Squad</span>
          <span className="kv-value">{summary.size}</span>
        </div>
        <div className="kv-item">
          <span className="kv-label">Available</span>
          <span className="kv-value" style={{ color: 'var(--success)' }}>
            {summary.available}
          </span>
        </div>
        <div className="kv-item">
          <span className="kv-label">Avg OVR</span>
          <span className="kv-value">{summary.avgOvr}</span>
        </div>
        <div className="kv-item">
          <span className="kv-label">Avg age</span>
          <span className="kv-value">{summary.avgAge}</span>
        </div>
        <div className="kv-item">
          <span className="kv-label">Listed</span>
          <span className="kv-value">{summary.listed}</span>
        </div>
      </div>

      <div className="squad-toolbar">
        <label className="input-icon">
          <Search size={15} />
          <input className="input" placeholder="Search the squad" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the squad" />
          {q && (
            <button type="button" className="icon-btn sm" style={{ position: 'absolute', right: 4 }} onClick={() => setQ('')} aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </label>
        <Segmented
          ariaLabel="Position"
          value={pos}
          onChange={setPos}
          items={[
            { value: 'all', label: 'All' },
            { value: 'GK', label: 'GK' },
            { value: 'DEF', label: 'DEF' },
            { value: 'MID', label: 'MID' },
            { value: 'FWD', label: 'FWD' },
          ]}
        />
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="ovr">Sort: Rating</option>
          <option value="name">Sort: Name</option>
          <option value="number">Sort: Number</option>
          <option value="age">Sort: Age</option>
          {real && <option value="goals">Sort: Goals</option>}
        </select>
        {!real && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <UserPlus size={15} /> Add player
          </button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <SkeletonRows rows={10} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Users}
            title={players.length ? 'No players match' : 'No players yet'}
            text={players.length ? 'Try another search or position.' : 'Add your first player to start building the squad.'}
          />
        ) : narrow ? (
          list.map((p) => (
            <button key={p.id} type="button" className="list-row" onClick={() => setOpenId(p.id)}>
              <span className="squad-num" style={{ width: 22 }}>
                {p.number}
              </span>
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="truncate" style={{ display: 'block', fontWeight: 600 }}>
                  {p.name}
                </span>
                <span className="subtle" style={{ fontSize: 12 }}>
                  {xi.has(p.id) ? 'Starting XI · ' : ''}
                  {p.status !== 'available' ? p.status : p.age ? `${p.age} yrs` : POSITION_LABEL[p.pos]}
                </span>
              </span>
              <PosBadge pos={p.pos} />
              <OvrBadge value={p.ovr} />
            </button>
          ))
        ) : (
          <div className="table-wrap">
            <table className="table mrow-table">
              <thead>
                <tr>
                  <th className="l">#</th>
                  <th className="l">Player</th>
                  <th>Pos</th>
                  <th>Age</th>
                  {real && (
                    <>
                      <th title="Appearances">Apps</th>
                      <th title="Goals">G</th>
                      <th title="Assists">A</th>
                    </>
                  )}
                  <th>OVR</th>
                  <th className="l">Status</th>
                  <th>Morale</th>
                  <th className="l">Role</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="is-link" onClick={() => setOpenId(p.id)}>
                    <td className="l dim">{p.number || '–'}</td>
                    <td className="l">
                      <span className="team-cell" style={{ maxWidth: 280 }}>
                        {p.flag && <img className="flag" src={p.flag} alt="" />}
                        <span className="truncate">{p.name}</span>
                        {xi.has(p.id) && <span className="badge badge-accent">XI</span>}
                        {p.meta?.listed && <span className="badge badge-warning">Listed</span>}
                      </span>
                    </td>
                    <td>
                      <PosBadge pos={p.pos} />
                    </td>
                    <td className="dim">{p.age || '–'}</td>
                    {real && (
                      <>
                        <td className="dim">{p.stats?.appearances ?? 0}</td>
                        <td className="dim">{p.stats?.totalGoals ?? 0}</td>
                        <td className="dim">{p.stats?.goalAssists ?? 0}</td>
                      </>
                    )}
                    <td>
                      <OvrBadge value={p.ovr} />
                    </td>
                    <td className="l" onClick={(e) => e.stopPropagation()}>
                      <StatusSelect value={p.status} onChange={(v) => updateMeta(p.id, { status: v })} label={`Status for ${p.name}`} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Morale value={p.meta?.morale || 3} onChange={(v) => updateMeta(p.id, { morale: v })} label={`Morale for ${p.name}`} />
                    </td>
                    <td className="l" onClick={(e) => e.stopPropagation()}>
                      <RoleSelect value={p.meta?.role} onChange={(v) => updateMeta(p.id, { role: v })} label={`Role for ${p.name}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {real && (
          <div className="card-footer subtle" style={{ fontSize: 12 }}>
            Squad and injuries from ESPN. Status, morale, roles and notes are your own decisions and stay on this device.
          </div>
        )}
      </div>

      <Drawer open={Boolean(open)} onClose={() => setOpenId(null)} title="Player">
        {open && (
          <PlayerPanel
            player={open}
            onEdit={() => {
              setEditing(rawLocal(open.id));
              setFormOpen(true);
            }}
            onDelete={() => setDeleting(open)}
          />
        )}
      </Drawer>

      {!real && (
        <PlayerFormModal
          open={formOpen}
          player={editing}
          onClose={() => {
            setFormOpen(false);
            if (params.get('add')) setParams({}, { replace: true });
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        danger
        title={`Remove ${deleting?.name}?`}
        text="They will be removed from your squad and from future lineups. This can't be undone, so export a backup first if you're unsure."
        confirmLabel="Remove player"
        onConfirm={async () => {
          await playerService.remove(deleting.localId);
          await queryClient.invalidateQueries({ queryKey: ['local'] });
          setOpenId(null);
          push({ kind: 'success', title: 'Player removed' });
        }}
      />
    </div>
  );
}
