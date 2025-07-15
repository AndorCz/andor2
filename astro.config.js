import svelte from '@astrojs/svelte'
import cloudflare from '@astrojs/cloudflare'
import { defineConfig } from 'astro/config'

// import { loadEnv } from 'vite'
// const env = loadEnv('', process.cwd(), '')

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
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
