import { ApplicationStatus } from './application-status';
import { ApplicationStatusStateMachine } from './application-status.state-machine';

describe('ApplicationStatusStateMachine', () => {
  it('rejects any transition back into APPLIED, since it is entry-only', () => {
    expect(
      ApplicationStatusStateMachine.canTransition(
        'WAITING_FEEDBACK',
        'APPLIED',
      ),
    ).toBe(false);
  });

  it.each<ApplicationStatus>(['OFFER_ACCEPTED', 'OFFER_DECLINED', 'REJECTED'])(
    'rejects any transition out of a terminal status (%s)',
    (from) => {
      expect(
        ApplicationStatusStateMachine.canTransition(from, 'WAITING_FEEDBACK'),
      ).toBe(false);
    },
  );

  it.each<[ApplicationStatus, ApplicationStatus]>([
    ['WAITING_FEEDBACK', 'ASSIGNMENT'],
    ['ASSIGNMENT', 'INTERVIEW_SCHEDULED'],
    ['INTERVIEW_SCHEDULED', 'OFFER'],
  ])(
    'allows movement from %s to %s within the free-movement group',
    (from, to) => {
      expect(ApplicationStatusStateMachine.canTransition(from, to)).toBe(true);
    },
  );

  it.each<ApplicationStatus>(['INTERVIEW_SCHEDULED', 'OFFER'])(
    'allow %s to transition to itself (self-loop)',
    (status) => {
      expect(ApplicationStatusStateMachine.canTransition(status, status)).toBe(
        true,
      );
    },
  );

  it.each<ApplicationStatus>(['APPLIED', 'OFFER'])(
    'allows %s to transition to REJECTED',
    (from) => {
      expect(
        ApplicationStatusStateMachine.canTransition(from, 'REJECTED'),
      ).toBe(true);
    },
  );

  it.each<[ApplicationStatus, ApplicationStatus]>([
    ['APPLIED', 'OFFER_ACCEPTED'],
    ['APPLIED', 'OFFER_DECLINED'],
    ['WAITING_FEEDBACK', 'OFFER_ACCEPTED'],
    ['INTERVIEW_SCHEDULED', 'OFFER_DECLINED'],
  ])(
    'rejects transition from %s to %s, since OFFER_ACCEPTED/OFFER_DECLINED are only reachable from OFFER',
    (from, to) => {
      expect(ApplicationStatusStateMachine.canTransition(from, to)).toBe(false);
    },
  );

  it.each<ApplicationStatus>(['OFFER_ACCEPTED', 'OFFER_DECLINED'])(
    'allows transition from OFFER to %s',
    (to) => {
      expect(ApplicationStatusStateMachine.canTransition('OFFER', to)).toBe(
        true,
      );
    },
  );
});
