import { NavLink, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import BrandMark from './BrandMark';
import Crest from '../ui/Crest';
import { MAIN_NAV, MANAGER_NAV, SETTINGS_NAV } from './navItems';
import { useFavorites } from '../../context/FavoritesContext';
import { useAuth } from '../../context/AuthContext';
import { LiveDot } from '../ui/Bits';

function NavItem({ item, liveCount }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`} title={item.label}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
          <Icon size={18} strokeWidth={2} />
          <span className="nav-text">{item.label}</span>
          {item.live && liveCount > 0 && (
            <span className="nav-count" aria-label={`${liveCount} live matches`}>
              <LiveDot />
              <span className="nav-count-num">{liveCount}</span>
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ liveCount }) {
  const { teams } = useFavorites();
  const { session } = useAuth();

  return (
    <aside className="sidebar" aria-label="Primary">
      <Link to="/" className="brand" aria-label="FTMS home">
        <BrandMark />
        <span className="brand-text">
          <span className="brand-name">FTMS</span>
          <span className="brand-tag" style={{ display: 'block' }}>
            Football, live
          </span>
        </span>
      </Link>

      <nav className="nav-group" aria-label="Main">
        {MAIN_NAV.map((item) => (
          <NavItem key={item.to} item={item} liveCount={liveCount} />
        ))}
      </nav>

      <div className="nav-group">
        <div className="nav-label">Manage</div>
        <NavItem item={MANAGER_NAV} />
      </div>

      {teams.length > 0 && (
        <div className="nav-group nav-follows">
          <div className="nav-label">Following</div>
          {teams.slice(0, 8).map((t) => (
            <Link key={t.id} to={`/team/${t.id}`} className="nav-follow">
              <Crest src={t.logo} name={t.name} size={18} />
              <span className="truncate">{t.name}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="sidebar-foot">
        <NavItem item={SETTINGS_NAV} />
        {session ? (
          <Link to="/manager" className="club-chip" title={`${session.clubName} — manager hub`}>
            <Crest src={session.logo} srcDark={session.logoDark} name={session.clubName} color={session.color} size={28} />
            <span className="club-chip-text grow">
              <span className="club-chip-name truncate" style={{ display: 'block' }}>
                {session.clubShort || session.clubName}
              </span>
              <span className="club-chip-sub truncate" style={{ display: 'block' }}>
                {session.managerName}
              </span>
            </span>
          </Link>
        ) : (
          <Link to="/manager" className="club-chip" title="Manager login">
            <span className="cmdk-item-icon" style={{ width: 28, height: 28 }}>
              <LogIn size={15} />
            </span>
            <span className="club-chip-text grow">
              <span className="club-chip-name" style={{ display: 'block' }}>
                Manager login
              </span>
              <span className="club-chip-sub" style={{ display: 'block' }}>
                Run a real club
              </span>
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
