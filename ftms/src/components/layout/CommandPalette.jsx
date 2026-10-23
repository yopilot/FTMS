import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Briefcase, CornerDownLeft, Home, Newspaper, Search, Settings, Trophy, User, Zap } from 'lucide-react';
import { LEAGUES } from '../../api/leagues';
import { useSearch } from '../../api/queries';
import { useFavorites } from '../../context/FavoritesContext';
import { useFocusTrap } from '../../lib/useFocusTrap';
import Crest from '../ui/Crest';

const PAGES = [
  { label: 'Home', to: '/', icon: Home, keywords: 'home start dashboard' },
  { label: 'Live scores', to: '/matches?filter=live', icon: Zap, keywords: 'live now scores in-play' },
  { label: 'All scores', to: '/matches', icon: Zap, keywords: 'scores fixtures results matches today' },
  { label: 'Competitions', to: '/competitions', icon: Trophy, keywords: 'leagues competitions tables standings' },
  { label: 'News', to: '/news', icon: Newspaper, keywords: 'news headlines stories transfers' },
  { label: 'Manager hub', to: '/manager', icon: Briefcase, keywords: 'manager login club tactics squad lineup' },
  { label: 'Settings', to: '/settings', icon: Settings, keywords: 'settings theme backup data preferences' },
];

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function CommandPalette({ open, onClose }) {
  return createPortal(<AnimatePresence>{open && <Palette onClose={onClose} />}</AnimatePresence>, document.body);
}

function Palette({ onClose }) {
  const navigate = useNavigate();
  const ref = useFocusTrap(true, onClose, { initialFocus: '.cmdk-input' });
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebounced(query, 220);
  const { teams: favTeams } = useFavorites();
  const remote = useSearch(debounced);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    const pages = PAGES.filter((p) => !q || p.label.toLowerCase().includes(q) || p.keywords.includes(q));
    if (pages.length) {
      out.push({
        label: q ? 'Pages' : 'Jump to',
        items: pages.map((p) => ({ id: `p-${p.to}`, label: p.label, to: p.to, icon: <p.icon size={15} /> })),
      });
    }
    if (!q && favTeams.length) {
      out.push({
        label: 'Following',
        items: favTeams.slice(0, 5).map((t) => ({ id: `f-${t.id}`, label: t.name, sub: 'Team', to: `/team/${t.id}`, crest: { src: t.logo, name: t.name } })),
      });
    }
    const leagues = (q ? LEAGUES.filter((l) => `${l.name} ${l.short} ${l.country}`.toLowerCase().includes(q)) : LEAGUES.filter((l) => l.top)).slice(0, q ? 6 : 5);
    if (leagues.length) {
      out.push({
        label: 'Competitions',
        items: leagues.map((l) => ({ id: `l-${l.slug}`, label: l.name, sub: l.country, to: `/league/${l.slug}`, crest: { src: l.logo, srcDark: l.logoDark, name: l.name } })),
      });
    }
    if (q.length >= 2 && remote.data) {
      if (remote.data.teams.length) {
        out.push({
          label: 'Teams',
          items: remote.data.teams.map((t) => ({ id: `t-${t.id}`, label: t.name, sub: t.league || 'Team', to: `/team/${t.id}`, crest: { src: t.logo, name: t.name } })),
        });
      }
      if (remote.data.players.length) {
        out.push({
          label: 'Players',
          items: remote.data.players.map((p) => ({
            id: `a-${p.id}`,
            label: p.name,
            sub: [p.team, p.pos].filter(Boolean).join(' · '),
            to: `/player/${p.id}`,
            crest: p.teamLogo ? { src: p.teamLogo, name: p.team } : null,
            icon: <User size={15} />,
          })),
        });
      }
    }
    return out;
  }, [query, favTeams, remote.data]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (item) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(flat[active]);
    }
  };

  let index = -1;
  const searching = debounced.trim().length >= 2 && remote.isFetching;

  return (
    <>
      <motion.div className="overlay" style={{ zIndex: 99 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose} />
      <div className="cmdk-layer">
        <motion.div
          ref={ref}
          className="cmdk"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -4 }}
          transition={{ type: 'spring', stiffness: 520, damping: 38 }}
        >
          <div className="cmdk-input-row">
            <Search size={18} />
            <input
              className="cmdk-input"
              placeholder="Search teams, players, competitions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-list"
              aria-activedescendant={flat[active] ? `cmdk-${flat[active].id}` : undefined}
              autoComplete="off"
              spellCheck="false"
            />
            {searching && <span className="spinner" aria-label="Searching" />}
            <button type="button" className="btn btn-ghost btn-sm only-mobile" onClick={onClose}>
              Cancel
            </button>
          </div>
          <div className="cmdk-list" id="cmdk-list" role="listbox" ref={listRef}>
            {groups.map((g) => (
              <div key={g.label} className="cmdk-group" role="group" aria-label={g.label}>
                <div className="cmdk-group-label">{g.label}</div>
                {g.items.map((item) => {
                  index += 1;
                  const i = index;
                  return (
                    <button
                      key={item.id}
                      id={`cmdk-${item.id}`}
                      type="button"
                      role="option"
                      data-index={i}
                      aria-selected={i === active}
                      className="cmdk-item"
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(item)}
                    >
                      {item.crest ? (
                        <span className="cmdk-item-icon" style={{ background: 'transparent', border: 0 }}>
                          <Crest src={item.crest.src} srcDark={item.crest.srcDark} name={item.crest.name} size={22} />
                        </span>
                      ) : (
                        <span className="cmdk-item-icon">{item.icon}</span>
                      )}
                      <span className="grow">
                        <span className="truncate" style={{ display: 'block' }}>
                          {item.label}
                        </span>
                        {item.sub && <span className="cmdk-item-sub truncate" style={{ display: 'block' }}>{item.sub}</span>}
                      </span>
                      {i === active && (
                        <span className="cmdk-item-end">
                          <ArrowRight size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            {query.trim().length >= 2 && !searching && flat.length === 0 && (
              <div className="empty" style={{ padding: 32 }}>
                <div className="empty-title">No results for “{query.trim()}”</div>
                <p className="empty-text">Try a club name like “Arsenal”, a player like “Saka”, or a league.</p>
              </div>
            )}
          </div>
          <div className="cmdk-foot">
            <span>
              <span className="kbd">↑</span>
              <span className="kbd">↓</span> to move
            </span>
            <span>
              <span className="kbd">
                <CornerDownLeft size={11} />
              </span>{' '}
              to open
            </span>
            <span>
              <span className="kbd">esc</span> to close
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
