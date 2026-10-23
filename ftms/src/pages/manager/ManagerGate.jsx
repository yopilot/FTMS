import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BarChart3, Binoculars, CalendarDays, ClipboardList, LayoutGrid, LogOut, Repeat, Shuffle, Trophy, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClubProvider, useClub } from '../../context/ClubContext';
import { useTheme } from '../../context/ThemeContext';
import ManagerLogin from '../../components/manager/ManagerLogin';
import Crest from '../../components/ui/Crest';
import Avatar from '../../components/ui/Avatar';
import { visibleTeamColor } from '../../lib/color';
import { ordinal } from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const REAL_NAV = [
  { to: '/manager', label: 'Dugout', icon: LayoutGrid, end: true },
  { to: '/manager/squad', label: 'Squad', icon: Users },
  { to: '/manager/tactics', label: 'Tactics', icon: ClipboardList },
  { to: '/manager/fixtures', label: 'Fixtures', icon: CalendarDays },
  { to: '/manager/scouting', label: 'Scouting', icon: Binoculars },
];

const CUSTOM_NAV = [
  { to: '/manager', label: 'Dugout', icon: LayoutGrid, end: true },
  { to: '/manager/squad', label: 'Squad', icon: Users },
  { to: '/manager/tactics', label: 'Tactics', icon: ClipboardList },
  { to: '/manager/matches', label: 'Matches', icon: Trophy },
  { to: '/manager/builder', label: 'Team builder', icon: Shuffle },
  { to: '/manager/stats', label: 'Stats', icon: BarChart3 },
];

function HubHeader() {
  const { session, logout } = useAuth();
  const { standing, real } = useClub();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const color = visibleTeamColor(session.color, session.altColor, theme);
  const nav = real ? REAL_NAV : CUSTOM_NAV;

  return (
    <section className="hero mhub-head">
      <div className="hero-wash" style={{ background: `radial-gradient(70% 160% at 0% 0%, color-mix(in srgb, ${color} 24%, transparent), transparent 64%)` }} />
      <div className="mhub-top">
        <span className="hero-crest" style={{ width: 64, height: 64, borderRadius: 18 }}>
          {real ? (
            <Crest src={session.logo} srcDark={session.logoDark} name={session.clubName} color={session.color} size={44} />
          ) : (
            <span className="crest-fallback" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              {session.clubName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <p className="eyebrow">{real ? 'Manager hub' : 'Your club'}</p>
          <h1 className="mhub-title truncate">{session.clubName}</h1>
          <div className="hero-meta" style={{ marginTop: 4 }}>
            {standing && (
              <span>
                {ordinal(standing.entry.rank)} · {standing.entry.pts} pts from {standing.entry.gp}
              </span>
            )}
            <span>
              <Avatar src={session.managerImage} name={session.managerName} size={20} /> {session.managerName}
            </span>
          </div>
        </div>
        <div className="row gap-2 mhub-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              logout();
              navigate('/manager');
            }}
            title="Switch to another club"
          >
            <Repeat size={14} /> <span className="hide-mobile">Switch club</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout} title="Sign out">
            <LogOut size={14} /> <span className="hide-mobile">Sign out</span>
          </button>
        </div>
      </div>
      <nav className="mhub-nav" aria-label="Manager sections">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `mhub-link ${isActive ? 'is-active' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="mhub-pill" className="mhub-pill" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                  <Icon size={15} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </section>
  );
}

export default function ManagerGate() {
  const { session } = useAuth();
  useDocumentTitle(session ? `${session.clubName} · Manager` : 'Manager login');
  if (!session) return <ManagerLogin />;
  return (
    <ClubProvider key={`${session.type}.${session.clubId}`}>
      <div className="page" style={{ gap: 'var(--sp-5)' }}>
        <HubHeader />
        <Outlet />
      </div>
    </ClubProvider>
  );
}
