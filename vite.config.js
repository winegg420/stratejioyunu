import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { injectBuildMeta } from './vite-plugins/injectBuildMeta.js';

/** PWA / Service Worker kapalı — eski önbellek kaynaklı çökme riski yok */
export default defineConfig({
  plugins: [
    react(),
    injectBuildMeta(),
  ],
});
