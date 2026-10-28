import type { AnyRouter } from '@tanstack/react-router'
import { getStoredConsent, trackPageView } from './analytics'

export function trackRouteChanges(router: AnyRouter): void {
  router.subscribe('onResolved', ({ toLocation }) => {
    if (getStoredConsent() === 'accepted') {
      trackPageView(toLocation.pathname)
    }
  })
}
