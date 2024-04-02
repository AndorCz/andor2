import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'
import cloudflare from '@astrojs/cloudflare'

// import { loadEnv } from 'vite'
// const env = loadEnv('', process.cwd(), '')

import sentry from '@sentry/astro'

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    sentry(
      {
        dsn: 'https://66ac9aee9a3f24ea74156bc743b2d5e9@o4507019414142976.ingest.us.sentry.io/4507019416764416',
        sourceMapsUploadOptions: { project: 'andor2', authToken: process.env.SENTRY_AUTH_TOKEN }
      }
    )
  ],
  output: 'server',
  adapter: cloudflare()
  /* disabled because of issues with cloudflare cache, had to clear it manually
  vite: {
    build: {
      rollupOptions: {
          Disable random file hashes so that new version names are not breaking dynamic imports after every deploy. Still might not be optimal, better error handling would be preferable.
          See these issues:
          - vite (still open): https://github.com/vitejs/vite/issues/11804
          - sveltekit (not using): https://github.com/sveltejs/kit/pull/3412
          output: {
            entryFileNames: 'entry.mjs',
            chunkFileNames: 'chunks/chunk.mjs',
            assetFileNames: 'assets/asset.[extname]'
          }
        }
      }
    }
  */
});