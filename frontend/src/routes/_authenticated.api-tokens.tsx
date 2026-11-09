import { createFileRoute } from '@tanstack/react-router'
import { SkeletonList } from '@/components/skeleton-list'
import { ApiTokensPage } from '@/pages/api-tokens-page'

export const Route = createFileRoute('/_authenticated/api-tokens')({
  head: () => ({
    meta: [{ title: 'API Tokens - Application Tracker' }],
  }),
  pendingComponent: () => <SkeletonList />,
  component: ApiTokensPage,
})
