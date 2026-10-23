import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Star, Trophy, X } from 'lucide-react';
import { LEAGUES, REGIONS } from '../api/leagues';
import { useFavorites } from '../context/FavoritesContext';
import Crest from '../components/ui/Crest';
import { StarButton } from '../components/ui/Bits';
import { EmptyState } from '../components/ui/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function CompItem({ l, i }) {
  const { isLeagueFav, toggleLeague } = useFavorites();
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 16) * 0.015 }}>
      <Link to={`/league/${l.slug}`} className="comp-item">
        <span className="comp-logo">
          <Crest src={l.logo} srcDark={l.logoDark} name={l.name} size={28} />
        </span>
        <span className="grow">
          <span className="comp-name truncate">{l.name}</span>
          <span className="comp-country truncate">{l.country}</span>
        </span>
        <StarButton on={isLeagueFav(l.slug)} onToggle={() => toggleLeague(l.slug)} label={l.name} />
      </Link>
    </motion.div>
  );
}

export default function Competitions() {
  useDocumentTitle('Competitions');
  const [q, setQ] = useState('');
  const { leagues: favs } = useFavorites();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return LEAGUES.filter((l) => !s || `${l.name} ${l.short} ${l.country} ${l.region}`.toLowerCase().includes(s));
  }, [q]);

  const followed = LEAGUES.filter((l) => favs.includes(l.slug));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Competitions</h1>
          <p className="page-sub">{LEAGUES.length} leagues and cups with live scores, tables and squads. Star the ones you care about and they move to the top everywhere.</p>
        </div>
        <label className="input-icon" style={{ width: 'min(320px, 100%)' }}>
          <Search size={15} />
          <input className="input" placeholder="Find a competition or country" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a competition" />
          {q && (
            <button type="button" className="icon-btn sm" style={{ position: 'absolute', right: 4 }} onClick={() => setQ('')} aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </label>
      </header>

      {!q && followed.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <Star size={16} fill="currentColor" color="var(--warning)" /> Following
          </h2>
          <div className="comp-grid">
            {followed.map((l, i) => (
              <CompItem key={l.slug} l={l} i={i} />
            ))}
          </div>
        </section>
      )}

      {REGIONS.map((region) => {
        const items = filtered.filter((l) => l.region === region).sort((a, b) => a.p - b.p);
        if (!items.length) return null;
        return (
          <section key={region} className="section">
            <h2 className="section-title">{region}</h2>
            <div className="comp-grid">
              {items.map((l, i) => (
                <CompItem key={l.slug} l={l} i={i} />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <div className="card">
          <EmptyState icon={Trophy} title={`No competition matches “${q}”`} text="Try a country name, like “Spain” or “Brazil”." />
        </div>
      )}
    </div>
  );
}
