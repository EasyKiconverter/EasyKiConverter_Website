import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 600,
    },
  },
});
