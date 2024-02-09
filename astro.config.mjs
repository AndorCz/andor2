import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'
import cloudflare from '@astrojs/cloudflare'

// import { loadEnv } from 'vite'
// const env = loadEnv('', process.cwd(), '')

// https://astro.build/config

export default defineConfig({
  integrations: [svelte()],
  output: 'server',
  adapter: cloudflare()
})
