import sentry from '@sentry/astro'
import svelte from '@astrojs/svelte'
import cloudflare from '@astrojs/cloudflare'
import { loadEnv } from 'vite'
import { defineConfig } from 'astro/config'

const env = loadEnv('', process.cwd(), '')
const SENTRY_AUTH_TOKEN = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    SENTRY_AUTH_TOKEN &&
      sentry({
        dsn: 'https://e86e6ee655971c57ce901f9bcdc94507@o4509712149184512.ingest.de.sentry.io/4509718320513104',
        sourceMapsUploadOptions: {
          project: 'andor2',
          authToken: SENTRY_AUTH_TOKEN
        },
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        tracesSampleRate: 0 // disable performance monitoring
      })
  ].filter(Boolean),
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: false
    }
    /*
    routes: {
      extend: {
        include: [{ pattern: '/api/*' }]
      }
    }
    */
  }),
  vite: {
    build: {
      minify: false
    },
    ssr: {
      external: ['node:buffer']
    }
  },
  prefetch: false
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
})
