import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // Vendor-Code in eigene Chunks auslagern, damit der Haupt-Chunk klein bleibt
    // (Seobility meldete >1 MB für assets/index-*.js).
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // Firebase komplett in einen eigenen Chunk (in sich geschlossen,
            // keine zirkulären Chunk-Abhängigkeiten).
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@google/genai') || id.includes('@google/generative-ai')) return 'vendor-genai';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
