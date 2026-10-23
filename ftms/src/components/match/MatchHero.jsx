import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin, Users, Whistle } from 'lucide-react';
import Crest from '../ui/Crest';
import { LiveDot, StarButton } from '../ui/Bits';
import { countdown, formatLongDay, formatTime } from '../../lib/format';
import { distinctKits } from '../../lib/color';
import { useTheme } from '../../context/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';

function Scorers({ events, side }) {
  const goals = events.filter((e) => (e.kind === 'goal' || e.kind === 'own-goal') && e.side === side);
  if (!goals.length) return null;
  // Group by player: "Evanilson 6', 48'"
  const byPlayer = new Map();
  goals.forEach((g) => {
    const key = `${g.player?.name || 'Goal'}${g.kind === 'own-goal' ? ' (OG)' : ''}`;
    if (!byPlayer.has(key)) byPlayer.set(key, []);
    byPlayer.get(key).push(`${g.minute}${g.penalty ? ' pen' : ''}`);
  });
  return (
    <ul className={`mhero-scorers ${side}`}>
      {[...byPlayer.entries()].map(([name, mins]) => (
        <li key={name}>
          <span className="truncate">{name}</span> <span className="subtle tnum">{mins.join(', ')}</span>
        </li>
      ))}
    </ul>
  );
}

function BigScore({ value }) {
  return (
    <span className="mhero-digit">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: -24, opacity: 0, scale: 1.4 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          style={{ display: 'inline-block' }}
        >
          {value ?? 0}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Team({ team, side }) {
  const { isTeamFav, toggleTeam } = useFavorites();
  return (
    <div className={`mhero-team ${side}`}>
      <Link to={`/team/${team.id}`} className="mhero-team-link">
        <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
          <Crest src={team.logo} srcDark={team.logoDark} name={team.name} color={team.color} size={72} />
        </motion.span>
        <span className="mhero-team-name">{team.name}</span>
      </Link>
      <div className="mhero-team-meta">
        {team.record && <span className="subtle">{team.record}</span>}
        <StarButton on={isTeamFav(team.id)} onToggle={() => toggleTeam(team)} label={team.name} />
      </div>
    </div>
  );
}

export default function MatchHero({ match: m, events = [] }) {
  const { theme } = useTheme();
  const s = m.status;
  const started = s.state !== 'pre' && !s.isPostponed && !s.isCancelled;
  const { home: hc, away: ac } = distinctKits(m.home, m.away, theme);

  return (
    <section className="hero mhero" aria-label="Match summary">
      <div
        className="hero-wash"
        style={{
          background: `radial-gradient(60% 120% at 0% 0%, color-mix(in srgb, ${hc} 22%, transparent), transparent 70%), radial-gradient(60% 120% at 100% 0%, color-mix(in srgb, ${ac} 22%, transparent), transparent 70%)`,
        }}
      />
      <div className="mhero-top">
        {m.league.slug ? (
          <Link to={`/league/${m.league.slug}`} className="mhero-league">
            <Crest src={m.league.logo} srcDark={m.league.logoDark} name={m.league.name} size={18} />
            {m.league.name}
          </Link>
        ) : (
          <span className="mhero-league">{m.league.name}</span>
        )}
        {(m.note || m.round) && <span className="subtle">{m.note || m.round}</span>}
      </div>

      <div className="mhero-main">
        <Team team={m.home} side="home" />
        <div className="mhero-center">
          {started ? (
            <div className={`mhero-score ${s.isLive ? 'is-live' : ''}`} aria-label={`${m.home.score} to ${m.away.score}`}>
              <BigScore value={m.home.score} />
              <span className="mhero-dash">–</span>
              <BigScore value={m.away.score} />
            </div>
          ) : (
            <div className="mhero-kickoff">
              <span className="mhero-time tnum">{s.isPostponed ? 'Postponed' : s.isCancelled ? 'Cancelled' : formatTime(m.date)}</span>
              <span className="subtle">{formatLongDay(m.date)}</span>
            </div>
          )}
          <div className="mhero-status">
            {s.isLive ? (
              <span className="badge badge-live" style={{ height: 24, fontSize: 12 }}>
                <LiveDot /> {s.label}
              </span>
            ) : s.state === 'post' ? (
              <span className="badge" style={{ height: 24, fontSize: 12 }}>
                {s.detail || s.label}
              </span>
            ) : !s.isPostponed && !s.isCancelled ? (
              <span className="badge badge-accent" style={{ height: 24, fontSize: 12 }}>
                Kick-off in {countdown(m.date)}
              </span>
            ) : null}
          </div>
          {m.home.shootout != null && m.away.shootout != null && (
            <div className="subtle tnum" style={{ fontSize: 13, marginTop: 6 }}>
              Penalties {m.home.shootout}–{m.away.shootout}
            </div>
          )}
        </div>
        <Team team={m.away} side="away" />
      </div>

      {started && (
        <div className="mhero-scorer-row">
          <Scorers events={events} side="home" />
          <span className="mhero-scorer-icon" aria-hidden="true" />
          <Scorers events={events} side="away" />
        </div>
      )}

      <div className="mhero-facts">
        {m.venue && (
          <span>
            <MapPin size={13} /> {m.venue}
            {m.city ? `, ${m.city}` : ''}
          </span>
        )}
        {m.attendance > 0 && (
          <span>
            <Users size={13} /> {Number(m.attendance).toLocaleString()}
          </span>
        )}
        {m.referee && (
          <span>
            <Whistle size={13} /> {m.referee}
          </span>
        )}
        {started && <span>{formatLongDay(m.date)}</span>}
      </div>
    </section>
  );
}
