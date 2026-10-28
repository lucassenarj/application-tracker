import type { AnyRouter } from '@tanstack/react-router'
import { trackRouteChanges } from '@/lib/track-route-changes'
import { setStoredConsent } from '@/lib/analytics'

describe('trackRouteChanges', () => {
  afterEach(() => {
    localStorage.clear()
    window.dataLayer = undefined
    window.gtag = undefined
  })

  function setUpFakeRouter() {
    let onResolvedHandler:
      | ((event: { toLocation: { pathname: string } }) => void)
      | undefined
    const fakeRouter = {
      subscribe: (eventType: string, fn: typeof onResolvedHandler) => {
        if (eventType === 'onResolved') {
          onResolvedHandler = fn
        }
      },
    }
    return {
      fakeRouter: fakeRouter as unknown as AnyRouter,
      resolveNavigation: (pathname: string) =>
        onResolvedHandler?.({ toLocation: { pathname } }),
    }
  }

  it('tracks a page view when a navigation resolves and consent was accepted', () => {
    setStoredConsent('accepted')
    window.dataLayer = []
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args)
    }
    const { fakeRouter, resolveNavigation } = setUpFakeRouter()

    trackRouteChanges(fakeRouter)
    resolveNavigation('/dashboard')

    expect(window.dataLayer).toContainEqual([
      'event',
      'page_view',
      { page_path: '/dashboard' },
    ])
  })

  it('does not track a page view when consent was not accepted', () => {
    window.dataLayer = []
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args)
    }
    const { fakeRouter, resolveNavigation } = setUpFakeRouter()

    trackRouteChanges(fakeRouter)
    resolveNavigation('/dashboard')

    expect(window.dataLayer).toEqual([])
  })
})
