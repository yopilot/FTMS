import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronDown, ClipboardList, Eye, NotebookPen } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { useTeamSchedule } from '../../api/queries';
import { countdown, formatShortDate, formatTime, formatWeekday, ordinal } from '../../lib/format';
import { resultFor } from '../../lib/matchUtils';
import Crest from '../../components/ui/Crest';
import { FormGuide } from '../../components/ui/Bits';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/States';
import { Segmented } from '../../components/ui/Tabs';
import FixtureRow from '../../components/team/FixtureRow';

const FDR_LABEL = ['', 'Very easy', 'Easy', 'Even', 'Hard', 'Very hard'];

/** Fixture difficulty 1–5 from the opponent's league position and venue. */
function difficulty(match, clubId, standings) {
  const isHome = match.home.id === String(clubId);
  const opp = isHome ? match.away : match.home;
  let entry = null;
  let size = 0;
  for (const g of standings?.groups || []) {
    const e = g.entries.find((x) => x.team.id === opp.id);
    if (e) {
      entry = e;
      size = g.entries.length;
    }
  }
  let base;
  if (entry && size > 1) base = 1 + (1 - (entry.rank - 1) / (size - 1)) * 4;
  else base = /champions|uefa/i.test(match.league.name) ? 4 : 3;
  const score = Math.max(1, Math.min(5, Math.round(base + (isHome ? -0.3 : 0.3))));
  return { score, rank: entry?.rank || null };
}

function FixtureCard({ m, clubId, standings, note, onNote }) {
  const [open, setOpen] = useState(false);
  const isHome = m.home.id === String(clubId);
  const opp = isHome ? m.away : m.home;
  const fdr = difficulty(m, clubId, standings);
  return (
    <div className={`fx-card ${open ? 'is-open' : ''}`}>
      <button type="button" className="fx-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="fixture-date">
          {formatWeekday(m.date)} {formatShortDate(m.date)}
          <br />
          {formatTime(m.date)}
        </span>
        <Crest src={opp.logo} srcDark={opp.logoDark} name={opp.name} size={30} />
        <span className="fixture-opp" style={{ textAlign: 'left' }}>
          <span className="truncate" style={{ display: 'block' }}>
            <span className="subtle" style={{ fontWeight: 500 }}>
              {isHome ? 'vs' : '@'}
            </span>{' '}
            {opp.name}
          </span>
          <span className="fixture-comp">
            {m.league.short}
            {fdr.rank ? ` · ${ordinal(fdr.rank)} in table` : ''}
            {note ? ' · has notes' : ''}
          </span>
        </span>
        <span className={`fdr fdr-${fdr.score}`} title={`Difficulty: ${FDR_LABEL[fdr.score]}`}>
          {fdr.score}
        </span>
        <ChevronDown size={16} className="fx-chev" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div className="fx-body">
              <div className="row gap-3 subtle" style={{ fontSize: 12.5, flexWrap: 'wrap' }}>
                <span>Kick-off in {countdown(m.date)}</span>
                <span>{FDR_LABEL[fdr.score]} on paper</span>
                {m.venue && <span>{m.venue}</span>}
              </div>
              <label className="field">
                <span className="field-label">
                  <NotebookPen size={13} style={{ verticalAlign: -2 }} /> Game plan notes
                </span>
                <textarea className="textarea" value={note || ''} onChange={(e) => onNote(e.target.value)} placeholder={`How do we beat ${opp.short}? Key threats, set pieces, who to press…`} maxLength={1000} />
              </label>
              <div className="row gap-2">
                <Link to={`/match/${m.id}`} className="btn btn-secondary btn-sm">
                  <Eye size={14} /> Match preview
                </Link>
                <Link to="/manager/tactics" className="btn btn-primary btn-sm">
                  <ClipboardList size={14} /> Set lineup
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Fixtures() {
  const { session, team, standings, state, setState } = useClub();
  const fixtures = useTeamSchedule(session.clubId, true);
  const [view, setView] = useState('upcoming');
  const upcoming = (fixtures.data || []).filter((m) => m.status.state !== 'post');
  const results = (team?.results || []).filter((m) => m.status.state === 'post');
  const form = results
    .slice(-10)
    .map((m) => resultFor(m, session.clubId))
    .join('');
  const record = results.reduce(
    (acc, m) => {
      const r = resultFor(m, session.clubId);
      if (r) acc[r] += 1;
      return acc;
    },
    { W: 0, D: 0, L: 0 },
  );

  const setNote = (id, text) => setState((s) => ({ ...s, notes: { ...(s.notes || {}), [id]: text } }));

  return (
    <div className="stack gap-4" style={{ maxWidth: 900 }}>
      <div className="row gap-3" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Segmented
          ariaLabel="Fixtures or results"
          value={view}
          onChange={setView}
          items={[
            { value: 'upcoming', label: 'Upcoming', badge: upcoming.length },
            { value: 'results', label: 'Results', badge: results.length },
          ]}
        />
        {view === 'results' && results.length > 0 && (
          <span className="row gap-3 subtle" style={{ fontSize: 13 }}>
            <span className="tnum">
              W{record.W} D{record.D} L{record.L}
            </span>
            <FormGuide form={form} size="sm" max={10} />
          </span>
        )}
        {view === 'upcoming' && (
          <span className="row gap-2 subtle" style={{ fontSize: 12 }}>
            Difficulty
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`fdr fdr-${n}`} style={{ width: 20, height: 20, fontSize: 10 }}>
                {n}
              </span>
            ))}
          </span>
        )}
      </div>

      {view === 'upcoming' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          {fixtures.isLoading ? (
            <SkeletonRows rows={8} />
          ) : upcoming.length ? (
            upcoming.map((m) => <FixtureCard key={m.id} m={m} clubId={session.clubId} standings={standings} note={state.notes?.[m.id]} onNote={(t) => setNote(m.id, t)} />)
          ) : (
            <EmptyState icon={CalendarDays} title="No fixtures scheduled" text="New fixtures appear here as soon as they're announced." />
          )}
        </div>
      ) : (
        <div className="card">
          {!team ? <SkeletonRows rows={8} /> : results.length ? [...results].reverse().map((m) => <FixtureRow key={m.id} m={m} teamId={session.clubId} />) : <EmptyState title="No results yet" />}
        </div>
      )}
    </div>
  );
}
