import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarPlus, ChevronRight, MapPin, Trophy, Users } from 'lucide-react';
import { useClub, useLocalMatches } from '../../context/ClubContext';
import { formatDay, relativeDayLabel } from '../../lib/format';
import { Segmented } from '../../components/ui/Tabs';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/States';
import MatchFormModal from '../../components/club/MatchFormModal';

function MatchItem({ m }) {
  const done = m.status === 'completed';
  return (
    <Link to={`/manager/matches/${m.id}`} className="list-row" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <span className="club-date">
        <strong className="tnum">{new Date(`${m.date}T12:00`).getDate()}</strong>
        <span>{new Date(`${m.date}T12:00`).toLocaleDateString(undefined, { month: 'short' })}</span>
      </span>
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="truncate" style={{ display: 'block', fontWeight: 650 }}>
          {m.title}
        </span>
        <span className="subtle row gap-3" style={{ fontSize: 12, flexWrap: 'wrap' }}>
          <span>
            {relativeDayLabel(`${m.date}T12:00`)} {m.time ? `· ${m.time}` : ''}
          </span>
          {m.venue && (
            <span className="row gap-1">
              <MapPin size={11} /> {m.venue}
            </span>
          )}
          <span className="row gap-1">
            <Users size={11} /> {m.selectedPlayerIds?.length || 0}
            {m.teams?.length ? ` · ${m.teams.length} teams` : ''}
          </span>
        </span>
      </span>
      {done && m.score ? (
        <span className="result-pill tnum">
          {m.score.home}–{m.score.away}
        </span>
      ) : (
        <span className="badge badge-accent">{m.teams?.length ? 'Teams set' : 'Upcoming'}</span>
      )}
      <ChevronRight size={16} className="subtle" />
    </Link>
  );
}

export default function ClubMatches() {
  const { real } = useClub();
  const matches = useLocalMatches(!real);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [view, setView] = useState('upcoming');
  const [formOpen, setFormOpen] = useState(params.get('new') === '1');
  if (real) return <Navigate to="/manager" replace />;

  const all = matches.data || [];
  const upcoming = all.filter((m) => m.status !== 'completed').sort((a, b) => new Date(a.date) - new Date(b.date));
  const completed = all.filter((m) => m.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date));
  const list = view === 'upcoming' ? upcoming : completed;

  return (
    <div className="stack gap-4" style={{ maxWidth: 900 }}>
      <div className="row gap-3" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Segmented
          ariaLabel="Matches"
          value={view}
          onChange={setView}
          items={[
            { value: 'upcoming', label: 'Upcoming', badge: upcoming.length },
            { value: 'completed', label: 'Results', badge: completed.length },
          ]}
        />
        <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
          <CalendarPlus size={15} /> Schedule match
        </button>
      </div>
      <div className="card">
        {matches.isLoading ? (
          <SkeletonRows rows={5} />
        ) : list.length ? (
          list.map((m) => <MatchItem key={m.id} m={m} />)
        ) : (
          <EmptyState
            icon={view === 'upcoming' ? CalendarPlus : Trophy}
            title={view === 'upcoming' ? 'Nothing scheduled' : 'No results yet'}
            text={view === 'upcoming' ? 'Schedule a match, pick who is available and split them into teams.' : 'Completed matches and their scores show up here.'}
          />
        )}
      </div>
      <p className="subtle" style={{ fontSize: 12 }}>
        Last played {completed[0] ? formatDay(`${completed[0].date}T12:00`) : 'never'}.
      </p>
      <MatchFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          if (params.get('new')) setParams({}, { replace: true });
        }}
        onSaved={(id) => id && navigate(`/manager/matches/${id}`)}
      />
    </div>
  );
}
