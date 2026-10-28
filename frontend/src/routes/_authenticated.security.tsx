import { createFileRoute } from '@tanstack/react-router'
import { SkeletonList } from '@/components/skeleton-list'
import { SecurityPage } from '@/pages/security-page'

export const Route = createFileRoute('/_authenticated/security')({
  head: () => ({
    meta: [{ title: 'Security - Application Tracker' }],
  }),
  pendingComponent: () => <SkeletonList />,
  component: SecurityPage,
})
