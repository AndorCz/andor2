import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel/serverless'

// import { loadEnv } from 'vite'
// const env = loadEnv('', process.cwd(), '')

// https://astro.build/config

export default defineConfig({
  output: 'server',
  adapter: vercel()
})