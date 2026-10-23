import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Crest from '../ui/Crest';
import { formatTime } from '../../lib/format';
import { LiveDot } from '../ui/Bits';

function StatusCell({ m }) {
  const s = m.status;
  if (s.isLive) {
    return (
      <span className="mrow-status is-live">
        <LiveDot />
        <span>{s.label}</span>
      </span>
    );
  }
  if (s.state === 'post') return <span className="mrow-status is-done">{s.label || 'FT'}</span>;
  return <span className="mrow-status">{formatTime(m.date)}</span>;
}

function Score({ value, live }) {
  return (
    <span className="score-num">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value ?? '-'}
          initial={live ? { y: -10, opacity: 0, scale: 1.3 } : false}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ display: 'inline-block' }}
        >
          {value ?? '-'}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A score line: status · home · score · away. Stacks into two rows on phones. */
function MatchRow({ m, showLeague = false, trailing }) {
  const s = m.status;
  const started = s.state !== 'pre';
  const total = `${m.home?.score ?? ''}-${m.away?.score ?? ''}`;
  const prevTotal = useRef(total);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevTotal.current !== total && s.isLive) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 2400);
      prevTotal.current = total;
      return () => clearTimeout(t);
    }
    prevTotal.current = total;
    return undefined;
  }, [total, s.isLive]);

  const homeWin = s.state === 'post' && (m.home.winner || (m.home.score > m.away.score && !m.away.winner));
  const awayWin = s.state === 'post' && (m.away.winner || (m.away.score > m.home.score && !m.home.winner));
  const done = s.state === 'post';

  return (
    <Link to={`/match/${m.id}`} className={`mrow ${flash ? 'is-flash' : ''} ${s.isLive ? 'is-live' : ''}`} aria-label={`${m.home.name} vs ${m.away.name}`}>
      <StatusCell m={m} />
      <span className={`mrow-team home ${done && !homeWin ? 'is-loser' : ''} ${homeWin ? 'is-winner' : ''}`}>
        <Crest src={m.home.logo} srcDark={m.home.logoDark} name={m.home.name} color={m.home.color} size={22} />
        <span className="mrow-name">{m.home.short}</span>
      </span>
      <span className={`mrow-score ${started ? '' : 'is-pre'}`}>
        {started && !s.isPostponed && !s.isCancelled ? (
          <>
            <span className={`h ${done && !homeWin ? 'is-loser' : ''}`}>
              <Score value={m.home.score} live={s.isLive} />
            </span>
            <span className="sep">–</span>
            <span className={`a ${done && !awayWin ? 'is-loser' : ''}`}>
              <Score value={m.away.score} live={s.isLive} />
            </span>
          </>
        ) : (
          <span className="vs">{s.isPostponed ? 'PPD' : s.isCancelled ? 'Canc' : 'vs'}</span>
        )}
      </span>
      <span className={`mrow-team away ${done && !awayWin ? 'is-loser' : ''} ${awayWin ? 'is-winner' : ''}`}>
        <Crest src={m.away.logo} srcDark={m.away.logoDark} name={m.away.name} color={m.away.color} size={22} />
        <span className="mrow-name">{m.away.short}</span>
      </span>
      <span className="mrow-end">
        {m.home.shootout != null && m.away.shootout != null && (
          <span className="mrow-note" title="Penalty shoot-out">
            ({m.home.shootout}–{m.away.shootout}p)
          </span>
        )}
        {showLeague && <span className="mrow-note hide-mobile">{m.league.short}</span>}
        {trailing}
      </span>
    </Link>
  );
}

export default memo(MatchRow);
