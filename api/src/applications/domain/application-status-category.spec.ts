import type { ApplicationStatus } from './application-status';
import {
  categorizeStatus,
  getStatusesForCategory,
} from './application-status-category';

describe('categorizeStatus', () => {
  it.each<ApplicationStatus>([
    'APPLIED',
    'WAITING_FEEDBACK',
    'ASSIGNMENT',
    'INTERVIEW_SCHEDULED',
  ])('categorizes %s as IN_PROGRESS', (status) => {
    expect(categorizeStatus(status)).toBe('IN_PROGRESS');
  });

  it.each<ApplicationStatus>(['OFFER', 'OFFER_ACCEPTED', 'OFFER_DECLINED'])(
    'categorizes %s as OFFERS',
    (status) => {
      expect(categorizeStatus(status)).toBe('OFFERS');
    },
  );

  it('categorizes REJECTED as REJECTIONS', () => {
    expect(categorizeStatus('REJECTED')).toBe('REJECTIONS');
  });
});

describe('getStatusesForCategory', () => {
  it('returns all statuses categorized as IN_PROGRESS', () => {
    expect(getStatusesForCategory('IN_PROGRESS')).toEqual([
      'APPLIED',
      'WAITING_FEEDBACK',
      'ASSIGNMENT',
      'INTERVIEW_SCHEDULED',
    ]);
  });

  it('returns all statuses categorized as OFFERS', () => {
    expect(getStatusesForCategory('OFFERS')).toEqual([
      'OFFER',
      'OFFER_ACCEPTED',
      'OFFER_DECLINED',
    ]);
  });

  it('returns all statuses categorized as REJECTIONS', () => {
    expect(getStatusesForCategory('REJECTIONS')).toEqual(['REJECTED']);
  });
});
