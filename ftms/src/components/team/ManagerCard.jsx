import { ExternalLink, UserRound } from 'lucide-react';
import { useManager, usePersonSummary } from '../../api/queries';
import Avatar from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { formatFullDate } from '../../lib/format';

/** Current head coach (Wikidata) with photo (Wikidata/Wikipedia). */
export default function ManagerCard({ team, women }) {
  const mgr = useManager(team ? { id: team.id, name: team.name, isNational: team.isNational, women } : null);
  const wiki = usePersonSummary(mgr.data?.name, 'manager');
  const photo = mgr.data?.image || wiki.data?.image;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <UserRound size={15} /> Manager
        </span>
        <span className="subtle" style={{ fontSize: 11 }}>
          Wikidata
        </span>
      </div>
      <div className="card-body">
        {mgr.isLoading ? (
          <div className="person-card">
            <Skeleton w={56} h={56} r={28} />
            <div className="stack gap-2 grow">
              <Skeleton w="60%" h={14} />
              <Skeleton w="40%" h={12} />
            </div>
          </div>
        ) : mgr.data ? (
          <div className="person-card">
            <Avatar src={photo} name={mgr.data.name} size={56} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="person-name truncate">{mgr.data.name}</div>
              <div className="subtle" style={{ fontSize: 12.5 }}>
                {mgr.data.since ? `In charge since ${formatFullDate(mgr.data.since)}` : 'Head coach'}
              </div>
              {wiki.data?.url && (
                <a href={wiki.data.url} target="_blank" rel="noopener noreferrer" className="link-quiet" style={{ fontSize: 12, marginTop: 4 }}>
                  Wikipedia <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="subtle" style={{ fontSize: 13 }}>
            No current manager is listed for this team on Wikidata.
          </p>
        )}
      </div>
    </div>
  );
}
