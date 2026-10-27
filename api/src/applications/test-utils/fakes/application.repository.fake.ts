import type { Application } from '../../domain/application';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '../../domain/application-status';
import { categorizeStatus } from '../../domain/application-status-category';
import type {
  ApplicationRepository,
  ApplicationWithCompanyName,
  FindAllByUserOptions,
  PaginatedResult,
  RecentActivityItem,
  UpcomingInterview,
} from '../../domain/application.repository';
import type { FakeCompanyRepository } from './company.repository.fake';

export class FakeApplicationRepository implements ApplicationRepository {
  private readonly applications = new Map<string, Application>();

  constructor(private readonly companyRepository: FakeCompanyRepository) {}

  save(application: Application): Promise<void> {
    this.applications.set(application.id, application);
    return Promise.resolve();
  }

  findById(id: string): Promise<Application | null> {
    return Promise.resolve(this.applications.get(id) ?? null);
  }

  async findAllByUser(
    userId: string,
    options: FindAllByUserOptions,
  ): Promise<PaginatedResult<ApplicationWithCompanyName>> {
    let matching = [...this.applications.values()].filter(
      (a) => a.userId === userId,
    );

    if (options.search) {
      const search = options.search.toLowerCase();
      matching = matching.filter((a) => a.title.toLowerCase().includes(search));
    }

    if (options.status) {
      matching = matching.filter((a) => a.currentStatus === options.status);
    }

    if (options.category) {
      matching = matching.filter(
        (a) => categorizeStatus(a.currentStatus) === options.category,
      );
    }

    const start = (options.page - 1) * options.pageSize;
    const items = await Promise.all(
      matching
        .slice(start, start + options.pageSize)
        .map(async (application): Promise<ApplicationWithCompanyName> => {
          const company = await this.companyRepository.findById(
            application.companyId,
          );

          if (!company) {
            throw new Error(
              `No company found for id ${application.companyId} — test setup likely forgot to save it`,
            );
          }

          return { application, companyName: company.name };
        }),
    );

    return { items, total: matching.length };
  }

  countByUserGroupedByStatus(
    userId: string,
  ): Promise<Record<ApplicationStatus, number>> {
    const matching = [...this.applications.values()].filter(
      (a) => a.userId === userId,
    );

    const counts = Object.fromEntries(
      APPLICATION_STATUSES.map((status) => [
        status,
        matching.filter((a) => a.currentStatus === status).length,
      ]),
    ) as Record<ApplicationStatus, number>;

    return Promise.resolve(counts);
  }

  async findRecentStatusChangesByUser(
    userId: string,
    limit: number,
    now: Date,
  ): Promise<RecentActivityItem[]> {
    const matching = [...this.applications.values()].filter(
      (a) => a.userId === userId,
    );

    const items = await Promise.all(
      matching.flatMap((application) =>
        application.statusHistory.map(async (statusChange) => {
          const company = await this.companyRepository.findById(
            application.companyId,
          );

          if (!company) {
            throw new Error(
              `No company found for id ${application.companyId} — test setup likely forgot to save it`,
            );
          }

          return {
            statusChangeId: statusChange.id,
            applicationId: application.id,
            applicationTitle: application.title,
            companyName: company.name,
            status: statusChange.status,
            eventDate: statusChange.eventDate,
          };
        }),
      ),
    );

    return items
      .filter((item) => item.eventDate.getTime() <= now.getTime())
      .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
      .slice(0, limit);
  }

  findCreatedDatesByUser(userId: string): Promise<Date[]> {
    const matching = [...this.applications.values()].filter(
      (a) => a.userId === userId,
    );

    return Promise.resolve(matching.map((a) => a.createdAt));
  }

  async findUpcomingInterviewsByUser(
    userId: string,
    now: Date,
  ): Promise<UpcomingInterview[]> {
    const matching = [...this.applications.values()].filter(
      (a) => a.userId === userId,
    );

    const items = await Promise.all(
      matching.flatMap((application) =>
        application.statusHistory
          .filter(
            (statusChange) =>
              statusChange.status === 'INTERVIEW_SCHEDULED' &&
              statusChange.eventDate.getTime() >= now.getTime(),
          )
          .map(async (statusChange) => {
            const company = await this.companyRepository.findById(
              application.companyId,
            );

            if (!company) {
              throw new Error(
                `No company found for id ${application.companyId} — test setup likely forgot to save it`,
              );
            }

            return {
              statusChangeId: statusChange.id,
              applicationId: application.id,
              applicationTitle: application.title,
              companyName: company.name,
              eventDate: statusChange.eventDate,
              interviewCategory: statusChange.interviewCategory,
            };
          }),
      ),
    );

    return items.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  }
}
