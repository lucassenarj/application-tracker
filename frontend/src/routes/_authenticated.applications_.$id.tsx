import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/applications_/$id')({
  component: ApplicationDetailPage,
})

function ApplicationDetailPage() {
  return <h1>Application Detail</h1>
}
