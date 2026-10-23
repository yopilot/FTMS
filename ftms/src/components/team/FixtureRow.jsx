import { memo } from 'react';
import { Link } from 'react-router-dom';
import Crest from '../ui/Crest';
import { LiveDot } from '../ui/Bits';
import { formatShortDate, formatTime, formatWeekday } from '../../lib/format';
import { resultFor } from '../../lib/matchUtils';

/** One fixture or result from a team's point of view. */
function FixtureRow({ m, teamId }) {
  const isHome = m.home.id === String(teamId);
  const opp = isHome ? m.away : m.home;
  const us = isHome ? m.home : m.away;
  const res = resultFor(m, teamId);
  const s = m.status;
  return (
    <Link to={`/match/${m.id}`} className="fixture-row">
      <span className="fixture-date">
        {formatWeekday(m.date)} {formatShortDate(m.date)}
        <br />
        <span>{s.state === 'pre' ? formatTime(m.date) : s.isLive ? '' : s.label}</span>
      </span>
      <Crest src={opp.logo} srcDark={opp.logoDark} name={opp.name} color={opp.color} size={24} />
      <span className="fixture-opp">
        <span className="truncate" style={{ display: 'block' }}>
          <span className="subtle" style={{ fontWeight: 500 }}>
            {isHome ? 'vs' : '@'}
          </span>{' '}
          {opp.name}
        </span>
        <span className="fixture-comp truncate">{m.league.short}</span>
      </span>
      {s.state === 'pre' ? (
        <span className="badge">{s.isPostponed ? 'PPD' : formatTime(m.date)}</span>
      ) : s.isLive ? (
        <span className="result-pill live-text">
          <LiveDot /> {us.score}–{opp.score} <span style={{ fontSize: 12 }}>{s.label}</span>
        </span>
      ) : (
        <span className="result-pill">
          {us.score}–{opp.score}
          {res && <span className={`form-pip ${res}`}>{res}</span>}
        </span>
      )}
    </Link>
  );
}

export default memo(FixtureRow);
