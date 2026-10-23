import { Briefcase, Home, Newspaper, Settings, Trophy, Zap } from 'lucide-react';

export const MAIN_NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/matches', label: 'Scores', icon: Zap, live: true },
  { to: '/competitions', label: 'Competitions', short: 'Leagues', icon: Trophy },
  { to: '/news', label: 'News', icon: Newspaper },
];

export const MANAGER_NAV = { to: '/manager', label: 'Manager', icon: Briefcase };
export const SETTINGS_NAV = { to: '/settings', label: 'Settings', icon: Settings };
