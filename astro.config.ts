import { defineConfig } from 'astro/config';

const environment = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};
const site = environment.SITE_URL ?? 'https://easykiconverter.org.cn';
const base = environment.SITE_BASE ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      // The isolated /lab/ route loads a measured ~720 KB Three.js runtime on demand.
      chunkSizeWarningLimit: 750,
    },
  },
});
