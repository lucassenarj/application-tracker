import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from './application-status';

export type ApplicationStatusCategory = 'IN_PROGRESS' | 'OFFERS' | 'REJECTIONS';

export const APPLICATION_STATUS_CATEGORIES: ApplicationStatusCategory[] = [
  'IN_PROGRESS',
  'OFFERS',
  'REJECTIONS',
];

const CATEGORY_BY_STATUS: Record<ApplicationStatus, ApplicationStatusCategory> =
  {
    APPLIED: 'IN_PROGRESS',
    WAITING_FEEDBACK: 'IN_PROGRESS',
    ASSIGNMENT: 'IN_PROGRESS',
    INTERVIEW_SCHEDULED: 'IN_PROGRESS',
    OFFER: 'OFFERS',
    OFFER_ACCEPTED: 'OFFERS',
    OFFER_DECLINED: 'OFFERS',
    REJECTED: 'REJECTIONS',
  };

export function categorizeStatus(
  status: ApplicationStatus,
): ApplicationStatusCategory {
  return CATEGORY_BY_STATUS[status];
}

export function getStatusesForCategory(
  category: ApplicationStatusCategory,
): ApplicationStatus[] {
  return APPLICATION_STATUSES.filter(
    (status) => categorizeStatus(status) === category,
  );
}
