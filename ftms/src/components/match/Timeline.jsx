import { motion } from 'motion/react';
import EventIcon from './EventIcon';

function describe(e) {
  switch (e.kind) {
    case 'goal':
      return { title: e.player?.name || 'Goal', sub: [e.penalty ? 'Penalty' : e.header ? 'Header' : null, e.other?.name ? `Assist: ${e.other.name}` : null].filter(Boolean).join(' · ') };
    case 'own-goal':
      return { title: e.player?.name || 'Own goal', sub: 'Own goal' };
    case 'yellow':
      return { title: e.player?.name || 'Yellow card', sub: 'Yellow card' };
    case 'red':
      return { title: e.player?.name || 'Red card', sub: 'Red card' };
    case 'sub':
      return { title: e.player?.name || 'Substitution', sub: e.other?.name ? `Off: ${e.other.name}` : 'Substitution', subOn: true };
    case 'pen-miss':
      return { title: e.player?.name || 'Penalty missed', sub: 'Penalty missed' };
    case 'var':
      return { title: 'VAR check', sub: e.text };
    default:
      return { title: e.text, sub: '' };
  }
}

/** Key events down a centre line: home on the left, away on the right. */
export default function Timeline({ events, homeName, awayName }) {
  // Running score after each event. Goals count for the side ESPN attaches to the event.
  const rows = events.reduce((acc, e) => {
    const prev = acc.length ? acc[acc.length - 1].tally : [0, 0];
    const isGoal = e.kind === 'goal' || e.kind === 'own-goal';
    const tally = [prev[0] + (isGoal && e.side === 'home' ? 1 : 0), prev[1] + (isGoal && e.side === 'away' ? 1 : 0)];
    const text = `${tally[0]}–${tally[1]}`;
    acc.push({ ...e, tally, running: isGoal ? text : null, htScore: e.kind === 'ht' ? text : null });
    return acc;
  }, []);

  if (!rows.length) return null;

  return (
    <div className="timeline" role="list">
      <div className="timeline-teams">
        <span>{homeName}</span>
        <span>{awayName}</span>
      </div>
      {rows.map((e, i) => {
        if (e.kind === 'ht') {
          return (
            <div key={e.id} className="timeline-break" role="listitem">
              <span>Half-time · {e.htScore}</span>
            </div>
          );
        }
        const d = describe(e);
        const content = (
          <div className={`tl-event ${e.kind}`}>
            <EventIcon kind={e.kind} size={15} />
            <div className="tl-text">
              <span className="tl-title">
                {d.title}
                {e.running && <span className="tl-running tnum">{e.running}</span>}
              </span>
              {d.sub && <span className="tl-sub">{d.sub}</span>}
            </div>
          </div>
        );
        return (
          <motion.div
            key={e.id}
            className={`timeline-row ${e.kind === 'goal' || e.kind === 'own-goal' ? 'is-goal' : ''}`}
            role="listitem"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 20) * 0.025 }}
          >
            <div className="tl-side home">{e.side === 'home' && content}</div>
            <span className="tl-minute tnum">{e.minute || '–'}</span>
            <div className="tl-side away">{e.side === 'away' && content}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
