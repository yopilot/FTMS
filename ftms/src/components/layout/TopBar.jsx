import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, Moon, Search, Settings, Sun, Briefcase } from 'lucide-react';
import BrandMark from './BrandMark';
import Crest from '../ui/Crest';
import { LiveDot } from '../ui/Bits';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useFocusTrap } from '../../lib/useFocusTrap';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export default function TopBar({ onSearch, liveCount }) {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <Link to="/" className="topbar-mobile-brand" aria-label="FTMS home">
        <BrandMark size={28} />
        <span className="brand-name">FTMS</span>
      </Link>

      <button type="button" className="search-trigger" onClick={onSearch} aria-label="Search teams, players and competitions">
        <Search size={16} />
        <span>Search teams, players, competitions</span>
        <span className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</span>
      </button>

      <div className="topbar-actions">
        {liveCount > 0 && (
          <Link to="/matches?filter=live" className="updated-pill hide-mobile" style={{ color: 'var(--live)', fontWeight: 650 }}>
            <LiveDot /> {liveCount} live now
          </Link>
        )}
        <button type="button" className="icon-btn only-mobile" onClick={onSearch} aria-label="Search">
          <Search size={19} />
        </button>
        <button type="button" className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'grid' }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
        <button type="button" className="icon-btn only-mobile" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={19} />
        </button>
      </div>

      {createPortal(<AnimatePresence>{menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}</AnimatePresence>, document.body)}
    </header>
  );
}

function MobileMenu({ onClose }) {
  const ref = useFocusTrap(true, onClose);
  const { session } = useAuth();
  const { teams } = useFavorites();
  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 40 }}
      >
        <div className="sheet-handle" />
        <div className="stack gap-2">
          <Link to="/manager" className="club-chip" onClick={onClose}>
            {session ? (
              <Crest src={session.logo} srcDark={session.logoDark} name={session.clubName} color={session.color} size={32} />
            ) : (
              <span className="cmdk-item-icon">
                <Briefcase size={16} />
              </span>
            )}
            <span className="grow">
              <span className="club-chip-name" style={{ display: 'block' }}>
                {session ? session.clubName : 'Manager login'}
              </span>
              <span className="club-chip-sub" style={{ display: 'block' }}>
                {session ? `Signed in as ${session.managerName}` : 'Pick a club and run it'}
              </span>
            </span>
          </Link>
          <Link to="/settings" className="club-chip" onClick={onClose}>
            <span className="cmdk-item-icon">
              <Settings size={16} />
            </span>
            <span className="club-chip-name">Settings</span>
          </Link>
        </div>
        {teams.length > 0 && (
          <>
            <div className="eyebrow" style={{ margin: '18px 4px 8px' }}>
              Following
            </div>
            <div className="stack">
              {teams.map((t) => (
                <Link key={t.id} to={`/team/${t.id}`} className="nav-follow" onClick={onClose} style={{ height: 44 }}>
                  <Crest src={t.logo} name={t.name} size={22} />
                  <span className="truncate">{t.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
