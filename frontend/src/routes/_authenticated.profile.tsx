import { createFileRoute } from '@tanstack/react-router'
import { SkeletonList } from '@/components/skeleton-list'
import { ProfilePage } from '@/pages/profile-page'

export const Route = createFileRoute('/_authenticated/profile')({
  head: () => ({
    meta: [{ title: 'Profile - Application Tracker' }],
  }),
  pendingComponent: () => <SkeletonList />,
  component: ProfilePage,
})
