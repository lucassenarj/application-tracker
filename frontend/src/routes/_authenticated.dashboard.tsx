import { createFileRoute } from '@tanstack/react-router'
import { SkeletonList } from '@/components/skeleton-list'
import { DashboardPage } from '@/pages/dashboard-page'

export const Route = createFileRoute('/_authenticated/dashboard')({
  head: () => ({
    meta: [{ title: 'Dashboard - Application Tracker' }],
  }),
  pendingComponent: () => <SkeletonList />,
  component: DashboardPage,
})
