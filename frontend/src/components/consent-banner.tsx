import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  getStoredConsent,
  initAnalytics,
  isAnalyticsConfigured,
  setStoredConsent,
  type ConsentDecision,
} from '@/lib/analytics'

export function ConsentBanner() {
  const [decision, setDecision] = useState<ConsentDecision | null>(() =>
    getStoredConsent(),
  )

  useEffect(() => {
    if (decision === 'accepted') {
      initAnalytics()
    }
  }, [decision])

  if (!isAnalyticsConfigured() || decision) {
    return null
  }

  const handleAccept = () => {
    setStoredConsent('accepted')
    setDecision('accepted')
  }

  const handleDecline = () => {
    setStoredConsent('declined')
    setDecision('declined')
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-between gap-3 border-t bg-background/95 p-4 backdrop-blur-sm sm:flex-row">
      <p className="text-sm text-muted-foreground">
        This site uses analytics cookies to understand how it's used. You can
        accept or decline.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDecline}>
          Decline
        </Button>
        <Button size="sm" onClick={handleAccept}>
          Accept
        </Button>
      </div>
    </div>
  )
}
