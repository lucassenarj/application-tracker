import { createFileRoute } from '@tanstack/react-router'
import { ApplicationDetailPage } from '@/pages/application-detail-page'

export const Route = createFileRoute('/_authenticated/applications_/$id')({
  component: ApplicationDetailPage,
})
