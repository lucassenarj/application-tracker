import type { ApplicationStatus } from './application-status';
import { categorizeStatus } from './application-status-category';

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
