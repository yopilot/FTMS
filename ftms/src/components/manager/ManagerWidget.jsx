import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTeamSchedule } from '../../api/queries';
import Crest from '../ui/Crest';
import Avatar from '../ui/Avatar';
import { countdown, formatDay, formatTime } from '../../lib/format';

function MiniPitch() {
  // Small 4-3-3 illustration
  const dots = [
    [50, 90],
    [18, 70],
    [39, 74],
    [61, 74],
    [82, 70],
    [28, 48],
    [50, 52],
    [72, 48],
    [22, 22],
    [50, 16],
    [78, 22],
  ];
  return (
    <svg viewBox="0 0 100 100" className="mini-pitch" aria-hidden="true">
      <rect x="2" y="2" width="96" height="96" rx="6" fill="none" stroke="var(--pitch-line)" />
      <line x1="2" y1="50" x2="98" y2="50" stroke="var(--pitch-line)" />
      <circle cx="50" cy="50" r="10" fill="none" stroke="var(--pitch-line)" />
      <rect x="30" y="80" width="40" height="18" fill="none" stroke="var(--pitch-line)" />
      <rect x="30" y="2" width="40" height="18" fill="none" stroke="var(--pitch-line)" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.6" fill="var(--accent)" />
      ))}
    </svg>
  );
}

export default function ManagerWidget() {
  const { session } = useAuth();
  const real = session?.type === 'real';
  const fixtures = useTeamSchedule(real ? session.clubId : null, true);

  if (!session) {
    return (
      <div className="card mgr-widget">
        <div className="mgr-widget-art">
          <MiniPitch />
        </div>
        <div className="card-body" style={{ paddingTop: 16 }}>
          <div className="eyebrow">Manager mode</div>
          <h3 style={{ fontSize: 17, marginTop: 6 }}>Take charge of a real club</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            Pick any club from 15 leagues. You get its real squad and fixtures, and you set the XI, tactics and set-piece takers.
          </p>
          <Link to="/manager" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
            Manager login <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const next = fixtures.data?.find((m) => m.status.state !== 'post');
  const opp = next ? (next.home.id === session.clubId ? next.away : next.home) : null;
  const home = next ? next.home.id === session.clubId : false;

  return (
    <div className="card">
      <div className="card-header">
        <span className="row gap-3" style={{ minWidth: 0 }}>
          <Crest src={session.logo} srcDark={session.logoDark} name={session.clubName} color={session.color} size={28} />
          <span style={{ minWidth: 0 }}>
            <span className="card-title truncate">{session.clubName}</span>
            <span className="subtle truncate" style={{ fontSize: 12, display: 'block' }}>
              Your club
            </span>
          </span>
        </span>
        <Avatar src={session.managerImage} name={session.managerName} size={30} />
      </div>
      {real && next && opp && (
        <Link to={`/match/${next.id}`} className="list-row" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <Crest src={opp.logo} name={opp.name} size={30} />
          <span className="grow">
            <span className="eyebrow">Next match · {home ? 'Home' : 'Away'}</span>
            <span className="truncate" style={{ display: 'block', fontWeight: 650, marginTop: 2 }}>
              {home ? 'vs' : '@'} {opp.name}
            </span>
            <span className="subtle" style={{ fontSize: 12 }}>
              {formatDay(next.date)} · {formatTime(next.date)} · {next.league.short}
            </span>
          </span>
          <span className="badge badge-accent">{countdown(next.date)}</span>
        </Link>
      )}
      <div className="card-footer row gap-2">
        <Link to="/manager" className="btn btn-secondary btn-sm grow">
          <LayoutGrid size={14} /> Dugout
        </Link>
        <Link to="/manager/tactics" className="btn btn-primary btn-sm grow">
          <ClipboardList size={14} /> Set lineup
        </Link>
      </div>
    </div>
  );
}
