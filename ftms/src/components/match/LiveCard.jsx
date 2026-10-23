import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Crest from '../ui/Crest';
import { LiveDot } from '../ui/Bits';
import { countdown, formatTime, relativeDayLabel } from '../../lib/format';

function minuteProgress(m) {
  const s = m.status;
  if (s.isHalftime) return 50;
  if (s.state === 'post') return 100;
  const n = parseInt(String(s.clock).replace(/[^0-9+]/g, '').split('+')[0], 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, (n / 90) * 100);
}

function TeamLine({ team, score, showScore, loser }) {
  return (
    <div className={`lcard-team ${loser ? 'is-loser' : ''}`}>
      <Crest src={team.logo} srcDark={team.logoDark} name={team.name} color={team.color} size={24} />
      <span className="lcard-name truncate">{team.short}</span>
      {showScore && <span className="lcard-score tnum">{score ?? 0}</span>}
    </div>
  );
}

/** Compact card for the "Live now" / "Up next" rails. */
function LiveCard({ m, index = 0 }) {
  const s = m.status;
  const started = s.state !== 'pre';
  const progress = minuteProgress(m);
  const done = s.state === 'post';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}>
      <Link to={`/match/${m.id}`} className={`lcard card card-interactive ${s.isLive ? 'is-live' : ''}`}>
        <div className="lcard-top">
          <span className="lcard-league truncate">
            <Crest src={m.league.logo} srcDark={m.league.logoDark} name={m.league.name} size={14} />
            <span className="truncate">{m.league.short}</span>
          </span>
          {s.isLive ? (
            <span className="lcard-status live-text">
              <LiveDot /> {s.label}
            </span>
          ) : done ? (
            <span className="lcard-status subtle">{s.label}</span>
          ) : (
            <span className="lcard-status subtle">
              {relativeDayLabel(m.date) === 'Today' ? formatTime(m.date) : `${relativeDayLabel(m.date)} ${formatTime(m.date)}`}
            </span>
          )}
        </div>
        <TeamLine team={m.home} score={m.home.score} showScore={started} loser={done && m.home.score < m.away.score} />
        <TeamLine team={m.away} score={m.away.score} showScore={started} loser={done && m.away.score < m.home.score} />
        <div className="lcard-foot">
          {s.isLive ? (
            <div className="lcard-progress" aria-hidden="true">
              <motion.span initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
            </div>
          ) : !started ? (
            <span className="subtle" style={{ fontSize: 12 }}>
              Kick-off in {countdown(m.date)}
            </span>
          ) : (
            <span className="subtle" style={{ fontSize: 12 }}>
              {m.venue || 'Full time'}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(LiveCard);
