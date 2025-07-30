import * as Sentry from '@sentry/astro'

Sentry.init({
  dsn: 'https://e86e6ee655971c57ce901f9bcdc94507@o4509712149184512.ingest.de.sentry.io/4509718320513104',
  sendDefaultPii: true,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  tracesSampleRate: 0 // disable performance monitoring
})
