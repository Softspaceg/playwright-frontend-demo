import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Typed locally so the app tsconfig needs no @types/node.
declare const process: { env: Record<string, string | undefined> };

// GitHub Pages serves the site from /playwright-frontend-demo/ (override with VITE_BASE).
const BASE = process.env.VITE_BASE ?? '/playwright-frontend-demo/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [react()],
  server: { port: 5173 },
}));
