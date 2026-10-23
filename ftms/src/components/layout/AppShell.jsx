import { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';
import LiveWatcher from './LiveWatcher';
import ErrorBoundary from '../ui/ErrorBoundary';
import { Skeleton } from '../ui/Skeleton';
import { useDayMatches } from '../../api/queries';
import { todayKey } from '../../lib/dates';

function PageFallback() {
  return (
    <div className="page" aria-busy="true">
      <div className="stack gap-2">
        <Skeleton w={220} h={28} />
        <Skeleton w={320} h={14} />
      </div>
      <Skeleton h={220} r={14} />
      <Skeleton h={320} r={14} />
    </div>
  );
}

export default function AppShell() {
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Today's scores feed the live badge and goal alerts everywhere in the app.
  // The shell polls slowly; the Scores page speeds it up while it is open.
  const today = useDayMatches(todayKey(), { slow: true });

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Top-level section key, so tab changes inside a page don't replay the entrance.
  const sectionKey = location.pathname.split('/').slice(0, 3).join('/');

  return (
    <div className="shell">
      <Sidebar liveCount={today.liveCount} />
      <div className="shell-main">
        <TopBar onSearch={openPalette} liveCount={today.liveCount} />
        <main id="main" className="content">
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<PageFallback />}>
              <motion.div key={sectionKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                <Outlet />
              </motion.div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav liveCount={today.liveCount} />
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <LiveWatcher matches={today.matches} />
      <ScrollRestoration getKey={(loc) => loc.pathname} />
    </div>
  );
}
