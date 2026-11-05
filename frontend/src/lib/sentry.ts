import * as Sentry from '@sentry/react'
import { scrubSensitiveUrlParams } from './scrub-sensitive-url-params'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    release: __APP_VERSION__,
    beforeBreadcrumb(breadcrumb) {
      if (typeof breadcrumb.data?.url === 'string') {
        breadcrumb.data.url = scrubSensitiveUrlParams(breadcrumb.data.url)
      }
      return breadcrumb
    },
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = scrubSensitiveUrlParams(event.request.url)
      }
      return event
    },
  })
}
