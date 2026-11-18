import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the ReliefMatch dashboard (frontend only).
// The backend base URL is injected via .env as VITE_API_BASE_URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
