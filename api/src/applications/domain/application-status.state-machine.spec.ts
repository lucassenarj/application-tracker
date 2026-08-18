import { ApplicationStatusStateMachine } from './application-status.state-machine';

describe('ApplicationStatusStateMachine', () => {
  it('rejects any transition back into APPLIED, since it is entry-only', () => {
    expect(
      ApplicationStatusStateMachine.canTransition('WAITING_FEEDBACK', 'APPLIED'),
    ).toBe(false);
  });

  it.todo('rejects any transition out of a terminal status (OFFER_ACCEPTED, OFFER_DECLINED, REJECTED)');

  it.todo('allows movement between distinct statuses within the free-movement group (WAITING_FEEDBACK, ASSIGNMENT, INTERVIEW_SCHEDULED, OFFER)');

  it.todo('allows each free-movement status to transition to itself (self-loop)');

  it.todo('allows any non-terminal status to transition to REJECTED');

  it.todo('rejects OFFER_ACCEPTED/OFFER_DECLINED as a destination from anywhere except OFFER');

  it.todo('allows OFFER_ACCEPTED/OFFER_DECLINED from OFFER');
});
