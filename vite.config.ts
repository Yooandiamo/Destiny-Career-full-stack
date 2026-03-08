import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist/client',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('recharts') || id.includes('d3-')) return 'chart-vendor';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-vendor';
          if (id.includes('lunar-javascript')) return 'lunar-vendor';
          return;
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
