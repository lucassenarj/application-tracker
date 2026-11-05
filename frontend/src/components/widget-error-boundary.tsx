import * as Sentry from '@sentry/react'
import type { ReactNode } from 'react'
import { ErrorFallback } from '@/components/error-fallback'

interface WidgetErrorBoundaryProps {
  children: ReactNode
}

export function WidgetErrorBoundary({ children }: WidgetErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
