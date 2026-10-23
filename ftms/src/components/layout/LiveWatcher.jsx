import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Crest from '../ui/Crest';

/**
 * Watches today's live scores and raises a toast when a followed team
 * scores, concedes, or finishes a match. Renders nothing.
 */
export default function LiveWatcher({ matches }) {
  const { isTeamFav, teams } = useFavorites();
  const { goalAlerts } = useSettings();
  const { push } = useToast();
  const navigate = useNavigate();
  const prev = useRef(null);

  useEffect(() => {
    if (!matches) return;
    const snapshot = new Map(matches.map((m) => [m.id, { h: m.home?.score, a: m.away?.score, state: m.status.state }]));

    if (prev.current && goalAlerts && teams.length) {
      matches.forEach((m) => {
        const before = prev.current.get(m.id);
        if (!before) return;
        const followed = isTeamFav(m.home?.id) || isTeamFav(m.away?.id);
        if (!followed) return;

        const score = `${m.home.short} ${m.home.score ?? 0}–${m.away.score ?? 0} ${m.away.short}`;
        const homeScored = (m.home.score ?? 0) > (before.h ?? 0);
        const awayScored = (m.away.score ?? 0) > (before.a ?? 0);

        if (m.status.isLive && (homeScored || awayScored)) {
          const scorer = homeScored ? m.home : m.away;
          push({
            id: `goal-${m.id}-${m.home.score}-${m.away.score}`,
            kind: 'goal',
            title: `Goal — ${scorer.short}`,
            text: `${score} · ${m.status.label}`,
            icon: <Crest src={scorer.logo} name={scorer.name} size={22} />,
            duration: 8000,
          });
        } else if (before.state === 'in' && m.status.state === 'post') {
          push({ id: `ft-${m.id}`, kind: 'info', title: 'Full time', text: score, icon: <Crest src={m.home.logo} name={m.home.name} size={22} />, duration: 7000 });
        } else if (before.state === 'pre' && m.status.state === 'in') {
          push({ id: `ko-${m.id}`, kind: 'info', title: 'Kick-off', text: `${m.home.short} v ${m.away.short}`, duration: 5000 });
        }
      });
    }
    prev.current = snapshot;
  }, [matches, goalAlerts, teams.length, isTeamFav, push, navigate]);

  return null;
}
