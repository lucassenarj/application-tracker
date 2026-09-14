import { randomUUID } from 'crypto';
import { ApplicationStatus } from './application-status';
import { StatusChange } from './status-change';

export interface CreateApplicationProps {
  title: string;
  description?: string;
  externalUrl?: string;
  salary?: number;
  companyId: string;
  userId: string;
}

export class Application {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly externalUrl?: string;
  readonly salary?: number;
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
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.currentStatus = props.currentStatus;
    this.statusHistory = props.statusHistory;
    this.createdAt = props.createdAt;
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
      companyId: input.companyId,
      userId: input.userId,
      currentStatus: 'APPLIED',
      statusHistory: [initialStatusChange],
      createdAt: now,
    });
  }
}
