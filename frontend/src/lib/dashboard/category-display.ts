import type { ApplicationStatusCategory } from '@/lib/applications/applications-list'

export const CATEGORY_LABELS: Record<ApplicationStatusCategory, string> = {
  IN_PROGRESS: 'In Progress',
  OFFERS: 'Offers',
  REJECTIONS: 'Rejections',
}

export const CATEGORY_COLORS: Record<ApplicationStatusCategory, string> = {
  IN_PROGRESS: 'var(--emerald-light)',
  OFFERS: 'var(--chart-3)',
  REJECTIONS: 'var(--chart-4)',
}
