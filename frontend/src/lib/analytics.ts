declare global {
  interface Window {
    dataLayer?: unknown[][]
    gtag?: (...args: unknown[]) => void
  }
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GA_MEASUREMENT_ID)
}

export type ConsentDecision = 'accepted' | 'declined'

const CONSENT_STORAGE_KEY = 'analytics-consent'

export function getStoredConsent(): ConsentDecision | null {
  return localStorage.getItem(CONSENT_STORAGE_KEY) as ConsentDecision | null
}

export function setStoredConsent(decision: ConsentDecision): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, decision)
}

export function initAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (!measurementId) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer ?? []
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId)
}

export function trackPageView(path: string): void {
  window.gtag?.('event', 'page_view', { page_path: path })
}
