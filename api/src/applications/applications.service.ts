import { Injectable } from '@nestjs/common';
import { Application } from './domain/application';
import type { ApplicationRepository } from './domain/application.repository';
import type { CompanyRepository } from './domain/company.repository';
import { ApplicationStatus } from './domain/application-status';
import { Contact, InterviewCategory } from './domain/status-change';

interface CreateApplicationInput {
  title: string;
  description?: string;
  externalUrl?: string;
  salary?: number;
  companyName: string;
  userId: string;
}

interface ChangeStatusInput {
  status: ApplicationStatus;
  eventDate: Date;
  notes?: string;
  contact?: Contact;
  interviewCategory?: InterviewCategory;
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  create(input: CreateApplicationInput): Promise<Application> {
    throw new Error('Not implemented');
  }

  findById(id: string): Promise<Application> {
    throw new Error('Not implemented');
  }

  findAllByUser(userId: string): Promise<Application[]> {
    throw new Error('Not implemented');
  }

  changeStatus(applicationId: string, input: ChangeStatusInput): Promise<Application> {
    throw new Error('Not implemented');
  }
}
