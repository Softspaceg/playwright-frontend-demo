import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /playwright-templates/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/playwright-templates/' : '/',
  plugins: [react()],
  server: { port: 5173 },
}));
