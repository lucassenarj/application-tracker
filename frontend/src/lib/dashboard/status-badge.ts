import type { ApplicationStatus } from '@/lib/dashboard/applications-list'

export function getStatusBadgeStyle(
  status: ApplicationStatus,
): { variant: 'secondary' | 'destructive'; className?: string } {
  switch (status) {
    case 'INTERVIEW_SCHEDULED':
    case 'OFFER':
    case 'OFFER_ACCEPTED':
      return {
        variant: 'secondary',
        className:
          'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400',
      }
    case 'WAITING_FEEDBACK':
      return {
        variant: 'secondary',
        className:
          'bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
      }
    case 'REJECTED':
      return { variant: 'destructive' }
    case 'OFFER_DECLINED':
      return {
        variant: 'secondary',
        className:
          'bg-red-500/10 text-red-500/80 dark:bg-red-500/10 dark:text-red-400/80',
      }
    default:
      return { variant: 'secondary' }
  }
}
