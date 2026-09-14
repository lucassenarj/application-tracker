import { ApplicationStatus } from './application-status';

const TERMINAL_STATUS: ApplicationStatus[] = [
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'REJECTED',
];

const ONLY_REACHABLE_FROM_OFFER: ApplicationStatus[] = [
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
];

export class ApplicationStatusStateMachine {
  static canTransition(
    from: ApplicationStatus,
    to: ApplicationStatus,
  ): boolean {
    if (to === 'APPLIED') {
      return false;
    }

    if (TERMINAL_STATUS.includes(from)) {
      return false;
    }

    if (ONLY_REACHABLE_FROM_OFFER.includes(to) && from !== 'OFFER') {
      return false;
    }

    return true;
  }
}
