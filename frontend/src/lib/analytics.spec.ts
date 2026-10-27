import {
  getStoredConsent,
  initAnalytics,
  isAnalyticsConfigured,
  setStoredConsent,
  trackPageView,
} from '@/lib/analytics'

describe('isAnalyticsConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns false when VITE_GA_MEASUREMENT_ID is not set', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
    expect(isAnalyticsConfigured()).toBe(false)
  })

  it('returns true when VITE_GA_MEASUREMENT_ID is set', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    expect(isAnalyticsConfigured()).toBe(true)
  })
})

describe('consent storage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns null when no consent decision has been stored', () => {
    expect(getStoredConsent()).toBeNull()
  })

  it('returns the stored decision after setStoredConsent is called', () => {
    setStoredConsent('accepted')
    expect(getStoredConsent()).toBe('accepted')
  })
})

describe('initAnalytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    document.head.innerHTML = ''
    window.dataLayer = undefined
    window.gtag = undefined
  })

  it('injects the gtag.js script tag with the configured measurement ID', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')

    initAnalytics()

    const script = document.head.querySelector('script[src*="gtag/js"]')
    expect(script).not.toBeNull()
    expect(script?.getAttribute('src')).toContain('id=G-TEST123')
  })

  it('configures gtag with the measurement ID', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')

    initAnalytics()

    expect(window.dataLayer).toContainEqual(['config', 'G-TEST123'])
  })

  it('does nothing when VITE_GA_MEASUREMENT_ID is not set', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')

    initAnalytics()

    expect(document.head.querySelector('script[src*="gtag/js"]')).toBeNull()
    expect(window.gtag).toBeUndefined()
  })
})

describe('trackPageView', () => {
  afterEach(() => {
    window.dataLayer = undefined
    window.gtag = undefined
  })

  it('sends a page_view event via gtag with the given path', () => {
    window.dataLayer = []
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args)
    }

    trackPageView('/dashboard')

    expect(window.dataLayer).toContainEqual([
      'event',
      'page_view',
      { page_path: '/dashboard' },
    ])
  })

  it('does nothing when gtag is not initialized', () => {
    expect(() => trackPageView('/dashboard')).not.toThrow()
  })
})
