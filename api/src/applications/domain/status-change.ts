import { randomUUID } from 'crypto';
import { ApplicationStatus } from './application-status';

export type InterviewCategory = 'TECHNICAL' | 'NON_TECHNICAL';

export interface Contact {
  readonly name: string;
  readonly email: string;
}

export interface CreateStatusChangeProps {
  applicationId: string;
  status: ApplicationStatus;
  eventDate: Date;
  notes?: string;
  contact?: Contact;
  interviewCategory?: InterviewCategory;
}

export class StatusChange {
  readonly id: string;
  readonly applicationId: string;
  readonly status: ApplicationStatus;
  readonly eventDate: Date;
  readonly notes?: string;
  readonly contact?: Contact;
  readonly interviewCategory?: InterviewCategory;
  readonly createdAt: Date;

  private constructor(props: {
    id: string;
    applicationId: string;
    status: ApplicationStatus;
    eventDate: Date;
    notes?: string;
    contact?: Contact;
    interviewCategory?: InterviewCategory;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.applicationId = props.applicationId;
    this.status = props.status;
    this.eventDate = props.eventDate;
    this.notes = props.notes;
    this.contact = props.contact;
    this.interviewCategory = props.interviewCategory;
    this.createdAt = props.createdAt;
  }

  static create(input: CreateStatusChangeProps): StatusChange {
    if (!input.applicationId) {
      throw new Error('applicationId is required');
    }

    if (!input.status) {
      throw new Error('status is required');
    }

    if (!input.eventDate) {
      throw new Error('eventDate is required');
    }

    if (input.status === 'INTERVIEW_SCHEDULED' && !input.interviewCategory) {
      throw new Error(
        'interviewCategory is required when status is INTERVIEW_SCHEDULED',
      );
    }

    return new StatusChange({
      id: randomUUID(),
      applicationId: input.applicationId,
      status: input.status,
      eventDate: input.eventDate,
      notes: input.notes,
      contact: input.contact,
      interviewCategory: input.interviewCategory,
      createdAt: new Date(),
    });
  }
}
