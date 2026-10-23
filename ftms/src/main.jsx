import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/match.css';
import './styles/match-center.css';
import './styles/pages.css';
import './styles/manager.css';

import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import MotionRoot from './components/layout/MotionRoot';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
// First launch: create the starter squad for the custom club. Loaded lazily so
// the database library isn't part of the first paint.
const seed = () =>
  import('./db/seedData.js')
    .then((m) => m.seedDatabase())
    .catch((err) => console.error('Could not seed the local database:', err));
if ('requestIdleCallback' in window) window.requestIdleCallback(seed, { timeout: 4000 });
else setTimeout(seed, 1500);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
      staleTime: 30 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <FavoritesProvider>
            <AuthProvider>
              <ToastProvider>
                <MotionRoot>
                  <App />
                </MotionRoot>
              </ToastProvider>
            </AuthProvider>
          </FavoritesProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
