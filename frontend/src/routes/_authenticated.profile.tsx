import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/pages/profile-page'

export const Route = createFileRoute('/_authenticated/profile')({
  head: () => ({
    meta: [{ title: 'Profile - Application Tracker' }],
  }),
  component: ProfilePage,
})
