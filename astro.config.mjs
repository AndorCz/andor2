import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'
import auth from 'auth-astro'
import vercelStatic from '@astrojs/vercel/static'
import Google from '@auth/core/providers/google'

const env = loadEnv('', process.cwd(), '')

// https://astro.build/config

export default defineConfig({
  integrations: [
    auth({
      secret: env.AUTH_SECRET,
      providers: [
        Google({
          clientId: env.GOOGLE_ID,
          clientSecret: env.GOOGLE_SECRET
        })
      ]
    })
  ],
  output: 'server',
  adapter: vercelStatic()
})