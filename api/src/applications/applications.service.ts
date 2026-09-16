import { Inject, Injectable } from '@nestjs/common';
import { Application } from './domain/application';
import type { ApplicationRepository } from './domain/application.repository';
import { Company } from './domain/company';
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
    @Inject('ApplicationRepository')
    private readonly applicationRepository: ApplicationRepository,
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  async create(input: CreateApplicationInput): Promise<Application> {
    const normalizedName = Company.normalizeName(input.companyName);
    let company =
      await this.companyRepository.findByNormalizedName(normalizedName);

    if (!company) {
      company = Company.create({ name: input.companyName });
      await this.companyRepository.save(company);
    }

    const application = Application.create({
      title: input.title,
      description: input.description,
      externalUrl: input.externalUrl,
      salary: input.salary,
      companyId: company.id,
      userId: input.userId,
    });

    await this.applicationRepository.save(application);

    return application;
  }

  findById(_id: string): Promise<Application> {
    throw new Error('Not implemented');
  }

  findAllByUser(_userId: string): Promise<Application[]> {
    throw new Error('Not implemented');
  }

  changeStatus(
    _applicationId: string,
    _input: ChangeStatusInput,
  ): Promise<Application> {
    throw new Error('Not implemented');
  }
}
