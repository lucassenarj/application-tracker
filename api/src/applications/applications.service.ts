import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Application } from './domain/application';
import {
  APPLICATION_STATUSES,
  ApplicationStatus,
} from './domain/application-status';
import {
  categorizeStatus,
  type ApplicationStatusCategory,
} from './domain/application-status-category';
import type {
  ApplicationRepository,
  ApplicationWithCompanyName,
  FindAllByUserOptions,
  PaginatedResult,
  RecentActivityItem,
  UpcomingInterview,
} from './domain/application.repository';
import {
  bucketApplicationsByWeek,
  type ApplicationsOverTimeBucket,
} from './domain/applications-over-time';
import { CompaniesService } from '../companies/companies.service';
import type { Company } from '../companies/domain/company';
import type { Tag } from '../tags/domain/tag';
import { TagsService } from '../tags/tags.service';
import { getMonthDateRange } from './domain/month-date-range';
import { Contact, InterviewCategory } from './domain/status-change';

export interface ApplicationStats {
  total: number;
  inProgress: number;
  offers: number;
  rejections: number;
}

interface CreateApplicationInput {
  title: string;
  description?: string;
  externalUrl?: string;
  salary?: number;
  currency?: string;
  companyName: string;
  companyId?: string;
  userId: string;
  tagNames?: string[];
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
    private readonly companiesService: CompaniesService,
    private readonly tagsService: TagsService,
  ) {}

  private async resolveCompany(input: {
    companyId?: string;
    companyName: string;
  }): Promise<Company> {
    if (input.companyId) {
      const existingCompany = await this.companiesService.findById(
        input.companyId,
      );

      if (!existingCompany) {
        throw new NotFoundException('Company not found');
      }

      return existingCompany;
    }

    return this.companiesService.findOrCreate(input.companyName);
  }

  async create(input: CreateApplicationInput): Promise<Application> {
    const company = await this.resolveCompany(input);
    const tagIds = await this.resolveTagIds(input.tagNames);

    const application = Application.create({
      title: input.title,
      description: input.description,
      externalUrl: input.externalUrl,
      salary: input.salary,
      currency: input.currency,
      companyId: company.id,
      userId: input.userId,
      tagIds,
    });

    await this.applicationRepository.save(application);

    return application;
  }

  private async resolveTagIds(tagNames?: string[]): Promise<string[]> {
    if (!tagNames) return [];

    const tags = await Promise.all(
      tagNames.map((name) => this.tagsService.findOrCreate(name)),
    );

    return tags.map((tag) => tag.id);
  }

  async findById(id: string, userId: string): Promise<Application> {
    const application = await this.applicationRepository.findById(id);

    if (!application || application.userId !== userId) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async getDetailById(
    id: string,
    userId: string,
  ): Promise<ApplicationWithCompanyName> {
    const application = await this.findById(id, userId);
    const company = await this.companiesService.findById(application.companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const tags = await this.resolveTagNames(application.tagIds);

    return { application, companyName: company.name, tags };
  }

  private async resolveTagNames(tagIds: readonly string[]): Promise<string[]> {
    const tags = await Promise.all(
      tagIds.map((id) => this.tagsService.findById(id)),
    );

    return tags
      .filter((tag): tag is Tag => tag !== null)
      .map((tag) => tag.name);
  }

  findAllByUser(
    userId: string,
    options: FindAllByUserOptions,
  ): Promise<PaginatedResult<ApplicationWithCompanyName>> {
    return this.applicationRepository.findAllByUser(userId, options);
  }

  async changeStatus(
    applicationId: string,
    userId: string,
    input: ChangeStatusInput,
  ): Promise<Application> {
    const application = await this.findById(applicationId, userId);

    const updatedApplication = application.changeStatus(input);

    await this.applicationRepository.save(updatedApplication);

    return updatedApplication;
  }

  async getStats(userId: string): Promise<ApplicationStats> {
    const counts =
      await this.applicationRepository.countByUserGroupedByStatus(userId);

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return {
      total,
      inProgress: sumByCategory(counts, 'IN_PROGRESS'),
      offers: sumByCategory(counts, 'OFFERS'),
      rejections: sumByCategory(counts, 'REJECTIONS'),
    };
  }

  async getRecentActivity(
    userId: string,
    limit = 10,
    now: Date = new Date(),
  ): Promise<RecentActivityItem[]> {
    return this.applicationRepository.findRecentStatusChangesByUser(
      userId,
      limit,
      now,
    );
  }

  async getApplicationsOverTime(
    userId: string,
  ): Promise<ApplicationsOverTimeBucket[]> {
    const createdDates =
      await this.applicationRepository.findCreatedDatesByUser(userId);

    return bucketApplicationsByWeek(createdDates, 12);
  }

  async getUpcomingInterviews(
    userId: string,
    now: Date = new Date(),
  ): Promise<UpcomingInterview[]> {
    return this.applicationRepository.findUpcomingInterviewsByUser(userId, now);
  }

  async getInterviewsForMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<UpcomingInterview[]> {
    const { start, end } = getMonthDateRange(year, month);
    return this.applicationRepository.findInterviewsByUserInRange(
      userId,
      start,
      end,
    );
  }
}

function sumByCategory(
  counts: Record<ApplicationStatus, number>,
  category: ApplicationStatusCategory,
): number {
  return APPLICATION_STATUSES.filter(
    (status) => categorizeStatus(status) === category,
  ).reduce((sum, status) => sum + counts[status], 0);
}
