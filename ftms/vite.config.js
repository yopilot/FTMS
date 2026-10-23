import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ftms/',
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks so app updates don't re-download libraries.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/, priority: 30 },
            { name: 'motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
            { name: 'data', test: /node_modules[\\/](@tanstack)[\\/]/, priority: 20 },
            { name: 'dexie', test: /node_modules[\\/]dexie[\\/]/, priority: 20 },
            { name: 'dnd', test: /node_modules[\\/]@dnd-kit[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
});
