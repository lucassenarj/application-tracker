import { ApplicationStatusStateMachine } from './application-status.state-machine';

describe('ApplicationStatusStateMachine', () => {
  it('rejects any transition back into APPLIED, since it is entry-only', () => {
    expect(
      ApplicationStatusStateMachine.canTransition('WAITING_FEEDBACK', 'APPLIED'),
    ).toBe(false);
  });
});
