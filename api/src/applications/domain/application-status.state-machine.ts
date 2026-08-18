import { ApplicationStatus } from './application-status';

export class ApplicationStatusStateMachine {
  static canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
    if (to === 'APPLIED') {
      return false;
    }

    return true;
  }
}
