import { ApplicationStatus } from './application-status';

export type InterviewCategory = 'TECHNICAL' | 'NON_TECHNICAL';

export interface Contact {
  readonly name: string;
  readonly email: string;
}

export interface StatusChange {
  readonly id: string;
  readonly applicationId: string;
  readonly status: ApplicationStatus;
  readonly eventDate: Date;
  readonly notes?: string;
  readonly contact?: Contact;
  readonly interviewCategory?: InterviewCategory;
  readonly createdAt: Date;
}
