import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { lineupRows } from '../../lib/formation';
import { distinctKits, normalizeHex, readableOn } from '../../lib/color';
import { useTheme } from '../../context/ThemeContext';
import { RatingBadge } from '../ui/Bits';
import { BallIcon, CardIcon } from './EventIcon';
import { ArrowDown } from 'lucide-react';

function PitchPlayer({ p, color, style, delay }) {
  const bg = normalizeHex(color);
  return (
    <motion.div className="pp" style={style} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, type: 'spring', stiffness: 380, damping: 24 }}>
      <Link to={`/player/${p.id}`} className="pp-link" title={p.name}>
        <span className="pp-shirt" style={{ background: bg, color: readableOn(bg) }}>
          {p.number || ''}
          {p.rating != null && (
            <span className="pp-rating">
              <RatingBadge value={p.rating} size="sm" />
            </span>
          )}
          <span className="pp-icons">
            {Array.from({ length: Math.min(p.goals || 0, 3) }, (_, i) => (
              <BallIcon key={i} size={12} />
            ))}
            {p.red ? <CardIcon color="red" size={11} /> : p.yellow ? <CardIcon size={11} /> : null}
          </span>
          {p.subbedOut && (
            <span className="pp-subout" title={`Subbed off ${p.subMinute}`}>
              <ArrowDown size={10} strokeWidth={3} />
            </span>
          )}
        </span>
        <span className="pp-name">{p.lastName || p.short}</span>
      </Link>
    </motion.div>
  );
}

function teamPositions(lineup, half) {
  const rows = lineupRows(lineup.starters, lineup.formation);
  const n = rows.length;
  const out = [];
  rows.forEach((row, ri) => {
    // home: GK near bottom (y≈94%) to attack near halfway (y≈56%); away mirrored
    const t = n > 1 ? ri / (n - 1) : 0;
    const yHome = 94.5 - t * 40.5;
    const y = half === 'home' ? yHome : 100 - yHome;
    row.forEach((p, i) => {
      const xTeam = ((i + 1) / (row.length + 1)) * 100;
      const x = half === 'home' ? xTeam : 100 - xTeam;
      out.push({ p, x, y });
    });
  });
  return out;
}

/** Both starting XIs on one vertical pitch. Away team attacks downwards from the top. */
function LineupPitch({ lineups, home, away }) {
  const { theme } = useTheme();
  const kits = distinctKits(home, away, 'dark');
  const players = [
    ...(lineups.away ? teamPositions(lineups.away, 'away').map((x) => ({ ...x, color: kits.away, side: 'away' })) : []),
    ...(lineups.home ? teamPositions(lineups.home, 'home').map((x) => ({ ...x, color: kits.home, side: 'home' })) : []),
  ];

  return (
    <div className={`pitch ${theme}`}>
      <div className="pitch-label top">
        <span>{away.short}</span>
        {lineups.away?.formation && <span className="pitch-formation">{lineups.away.formation}</span>}
      </div>
      <svg className="pitch-lines" viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true">
        <rect x="1" y="1" width="66" height="103" fill="none" />
        <line x1="1" y1="52.5" x2="67" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" fill="none" />
        <circle cx="34" cy="52.5" r="0.6" />
        <rect x="13.85" y="1" width="40.3" height="16.5" fill="none" />
        <rect x="24.85" y="1" width="18.3" height="5.5" fill="none" />
        <rect x="13.85" y="87.5" width="40.3" height="16.5" fill="none" />
        <rect x="24.85" y="98.5" width="18.3" height="5.5" fill="none" />
        <path d="M26.7 17.5 A9.15 9.15 0 0 0 41.3 17.5" fill="none" />
        <path d="M26.7 87.5 A9.15 9.15 0 0 1 41.3 87.5" fill="none" />
      </svg>
      {players.map(({ p, x, y, color, side }, i) => (
        <PitchPlayer key={`${side}-${p.id}`} p={p} color={color} style={{ left: `${x}%`, top: `${y}%` }} delay={0.05 + i * 0.02} />
      ))}
      <div className="pitch-label bottom">
        <span>{home.short}</span>
        {lineups.home?.formation && <span className="pitch-formation">{lineups.home.formation}</span>}
      </div>
    </div>
  );
}

export default memo(LineupPitch);
