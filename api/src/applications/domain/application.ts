import { randomUUID } from 'crypto';
import { ApplicationStatus } from './application-status';
import { ApplicationStatusStateMachine } from './application-status.state-machine';
import { Contact, InterviewCategory, StatusChange } from './status-change';

export interface CreateApplicationProps {
  title: string;
  description?: string;
  externalUrl?: string;
  salary?: number;
  currency?: string;
  companyId: string;
  userId: string;
}

export class Application {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly externalUrl?: string;
  readonly salary?: number;
  readonly currency?: string;
  readonly companyId: string;
  readonly userId: string;
  readonly currentStatus: ApplicationStatus;
  readonly statusHistory: readonly StatusChange[];
  readonly createdAt: Date;

  private constructor(props: {
    id: string;
    title: string;
    description?: string;
    externalUrl?: string;
    salary?: number;
    currency?: string;
    companyId: string;
    userId: string;
    currentStatus: ApplicationStatus;
    statusHistory: StatusChange[];
    createdAt: Date;
  }) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.externalUrl = props.externalUrl;
    this.salary = props.salary;
    this.currency = props.currency;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.currentStatus = props.currentStatus;
    this.statusHistory = props.statusHistory;
    this.createdAt = props.createdAt;
  }

  get lastStatusChangeAt(): Date {
    return this.statusHistory[this.statusHistory.length - 1].eventDate;
  }

  static create(input: CreateApplicationProps): Application {
    if (!input.title) {
      throw new Error('title is required');
    }

    if (input.title.length > 255) {
      throw new Error('title must be at most 255 characters');
    }

    if (!input.companyId) {
      throw new Error('companyId is required');
    }

    if (!input.userId) {
      throw new Error('userId is required');
    }

    const now = new Date();
    const id = randomUUID();

    const initialStatusChange = StatusChange.create({
      applicationId: id,
      status: 'APPLIED',
      eventDate: now,
    });

    return new Application({
      id,
      title: input.title,
      description: input.description,
      externalUrl: input.externalUrl,
      salary: input.salary,
      currency: input.currency,
      companyId: input.companyId,
      userId: input.userId,
      currentStatus: 'APPLIED',
      statusHistory: [initialStatusChange],
      createdAt: now,
    });
  }

  changeStatus(input: {
    status: ApplicationStatus;
    eventDate: Date;
    notes?: string;
    contact?: Contact;
    interviewCategory?: InterviewCategory;
  }): Application {
    if (
      !ApplicationStatusStateMachine.canTransition(
        this.currentStatus,
        input.status,
      )
    ) {
      throw new Error(
        `cannot transition from ${this.currentStatus} to ${input.status}`,
      );
    }

    const statusChange = StatusChange.create({
      applicationId: this.id,
      status: input.status,
      eventDate: input.eventDate,
      notes: input.notes,
      contact: input.contact,
      interviewCategory: input.interviewCategory,
    });

    return new Application({
      id: this.id,
      title: this.title,
      description: this.description,
      externalUrl: this.externalUrl,
      salary: this.salary,
      currency: this.currency,
      companyId: this.companyId,
      userId: this.userId,
      currentStatus: input.status,
      statusHistory: [...this.statusHistory, statusChange],
      createdAt: this.createdAt,
    });
  }

  static reconstitute(props: {
    id: string;
    title: string;
    description?: string;
    externalUrl?: string;
    salary?: number;
    currency?: string;
    companyId: string;
    userId: string;
    currentStatus: ApplicationStatus;
    statusHistory: StatusChange[];
    createdAt: Date;
  }): Application {
    return new Application(props);
  }
}
