import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Crest from '../ui/Crest';

/**
 * League table. `compact` keeps only P / GD / Pts for side panels.
 * `highlight` is a list of team ids to emphasise (e.g. the two teams in a match).
 */
function StandingsTable({ entries, compact = false, highlight = [], limit, showLegend = true, legend = [] }) {
  const navigate = useNavigate();
  const rows = limit ? entries.slice(0, limit) : entries;
  const hl = new Set(highlight.map(String));

  return (
    <>
      <div className="table-wrap">
        <table className={`table standings ${compact ? 'is-compact' : ''}`}>
          <thead>
            <tr>
              <th className="l" style={{ width: 36 }}>
                #
              </th>
              <th className="l">Team</th>
              <th title="Played">P</th>
              {!compact && (
                <>
                  <th title="Won">W</th>
                  <th title="Drawn">D</th>
                  <th title="Lost">L</th>
                  <th className="hide-mobile" title="Goals for and against">
                    Goals
                  </th>
                </>
              )}
              <th title="Goal difference">GD</th>
              <th title="Points">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                key={e.team.id}
                className={`is-link ${hl.has(e.team.id) ? 'is-highlight' : ''}`}
                onClick={() => navigate(`/team/${e.team.id}`)}
                onKeyDown={(ev) => ev.key === 'Enter' && navigate(`/team/${e.team.id}`)}
                tabIndex={0}
              >
                <td className="l">
                  <span className="rank-cell">
                    <span className="zone" style={{ background: e.note?.color || 'transparent' }} title={e.note?.label} />
                    {e.rank}
                  </span>
                </td>
                <td className="l">
                  <span className="team-cell">
                    <Crest src={e.team.logo} name={e.team.name} size={20} />
                    <span className="truncate">{compact ? e.team.short || e.team.name : e.team.name}</span>
                  </span>
                </td>
                <td className="dim">{e.gp}</td>
                {!compact && (
                  <>
                    <td className="dim">{e.w}</td>
                    <td className="dim">{e.d}</td>
                    <td className="dim">{e.l}</td>
                    <td className="dim hide-mobile">
                      {e.gf}:{e.ga}
                    </td>
                  </>
                )}
                <td className="dim">{e.gd > 0 ? `+${e.gd}` : e.gd}</td>
                <td className="strong">{e.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showLegend && legend.length > 0 && (
        <div className="legend">
          {legend.map((l) => (
            <span key={l.label} className="legend-item">
              <span className="zone" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export default memo(StandingsTable);
