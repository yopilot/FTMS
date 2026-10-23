import { lazy } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

const Home = lazy(() => import('./pages/Home'));
const Matches = lazy(() => import('./pages/Matches'));
const MatchCenter = lazy(() => import('./pages/MatchCenter'));
const Competitions = lazy(() => import('./pages/Competitions'));
const League = lazy(() => import('./pages/League'));
const Team = lazy(() => import('./pages/Team'));
const Player = lazy(() => import('./pages/Player'));
const News = lazy(() => import('./pages/News'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const ManagerGate = lazy(() => import('./pages/manager/ManagerGate'));
const Dugout = lazy(() => import('./pages/manager/Dugout'));
const Squad = lazy(() => import('./pages/manager/Squad'));
const Tactics = lazy(() => import('./pages/manager/Tactics'));
const Fixtures = lazy(() => import('./pages/manager/Fixtures'));
const Scouting = lazy(() => import('./pages/manager/Scouting'));
const ClubPlayer = lazy(() => import('./pages/club/ClubPlayer'));
const ClubMatches = lazy(() => import('./pages/club/ClubMatches'));
const ClubMatch = lazy(() => import('./pages/club/ClubMatch'));
const TeamBuilder = lazy(() => import('./pages/club/TeamBuilder'));
const ClubStats = lazy(() => import('./pages/club/ClubStats'));

const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <Home /> },
        { path: 'matches', element: <Matches /> },
        { path: 'match/:id', element: <MatchCenter /> },
        { path: 'competitions', element: <Competitions /> },
        { path: 'league/:slug', element: <League /> },
        { path: 'team/:id', element: <Team /> },
        { path: 'player/:id', element: <Player /> },
        { path: 'news', element: <News /> },
        { path: 'settings', element: <Settings /> },
        {
          path: 'manager',
          element: <ManagerGate />,
          children: [
            { index: true, element: <Dugout /> },
            { path: 'squad', element: <Squad /> },
            { path: 'squad/:playerId', element: <ClubPlayer /> },
            { path: 'tactics', element: <Tactics /> },
            { path: 'fixtures', element: <Fixtures /> },
            { path: 'scouting', element: <Scouting /> },
            { path: 'matches', element: <ClubMatches /> },
            { path: 'matches/:matchId', element: <ClubMatch /> },
            { path: 'builder', element: <TeamBuilder /> },
            { path: 'stats', element: <ClubStats /> },
          ],
        },
        // Old routes from the first version of the app
        { path: 'players', element: <Navigate to="/manager/squad" replace /> },
        { path: 'players/:id', element: <Navigate to="/manager/squad" replace /> },
        { path: 'teams', element: <Navigate to="/manager/builder" replace /> },
        { path: 'team-generator', element: <Navigate to="/manager/builder" replace /> },
        { path: 'stats', element: <Navigate to="/manager/stats" replace /> },
        { path: 'backup', element: <Navigate to="/settings" replace /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
);

export default function App() {
  return <RouterProvider router={router} />;
}
