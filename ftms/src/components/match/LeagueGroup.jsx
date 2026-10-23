import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Crest from '../ui/Crest';
import MatchRow from './MatchRow';
import { StarButton, LiveDot } from '../ui/Bits';
import { useFavorites } from '../../context/FavoritesContext';

function LeagueGroup({ league, matches }) {
  const { isLeagueFav, toggleLeague } = useFavorites();
  const live = matches.filter((m) => m.status.isLive).length;
  const linkable = Boolean(league.slug);
  const head = (
    <>
      <Crest src={league.logo} srcDark={league.logoDark} name={league.name} size={20} />
      <span className="grow">
        <span className="lgroup-name truncate">{league.name}</span>
        {league.country && <span className="lgroup-country truncate">{league.country}</span>}
      </span>
    </>
  );

  return (
    <section className="card lgroup" aria-label={league.name}>
      <header className="lgroup-head">
        {linkable ? (
          <Link to={`/league/${league.slug}`} className="lgroup-link">
            {head}
          </Link>
        ) : (
          <span className="lgroup-link">{head}</span>
        )}
        {live > 0 && (
          <span className="badge badge-live">
            <LiveDot /> {live} live
          </span>
        )}
        {linkable && <StarButton on={isLeagueFav(league.slug)} onToggle={() => toggleLeague(league.slug)} label={league.name} />}
        {linkable && (
          <Link to={`/league/${league.slug}`} className="icon-btn sm hide-mobile" aria-label={`${league.name} table and fixtures`}>
            <ChevronRight size={16} />
          </Link>
        )}
      </header>
      <div>
        {matches.map((m) => (
          <MatchRow key={m.id} m={m} />
        ))}
      </div>
    </section>
  );
}

export default memo(LeagueGroup);
