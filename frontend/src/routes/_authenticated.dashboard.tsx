import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/pages/dashboard-page'

export const Route = createFileRoute('/_authenticated/dashboard')({
  head: () => ({
    meta: [{ title: 'Dashboard - Application Tracker' }],
  }),
  component: DashboardPage,
})
