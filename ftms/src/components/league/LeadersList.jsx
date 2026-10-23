import { memo } from 'react';
import { Link } from 'react-router-dom';
import Crest from '../ui/Crest';

function LeadersList({ items, label = 'Goals', limit = 10 }) {
  return (
    <div>
      {items.slice(0, limit).map((p, i) => (
        <Link key={p.id} to={`/player/${p.id}`} className="list-row">
          <span className="leader-rank tnum">{i + 1}</span>
          <Crest src={p.team.logo} name={p.team.name} size={22} />
          <span className="grow">
            <span className="truncate" style={{ display: 'block', fontWeight: 600 }}>
              {p.name}
            </span>
            <span className="subtle truncate" style={{ display: 'block', fontSize: 12 }}>
              {p.team.name}
              {p.apps ? ` · ${p.apps} apps` : ''}
            </span>
          </span>
          <span className="leader-val tnum" aria-label={`${p.value} ${label}`}>
            {p.value}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default memo(LeadersList);
