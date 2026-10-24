import { createFileRoute } from '@tanstack/react-router'
import { SkeletonList } from '@/components/skeleton-list'
import { ApplicationDetailPage } from '@/pages/application-detail-page'

export const Route = createFileRoute('/_authenticated/applications_/$id')({
  pendingComponent: () => <SkeletonList />,
  component: ApplicationDetailPage,
})
