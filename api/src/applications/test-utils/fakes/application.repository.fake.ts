import type { Application } from '../../domain/application';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '../../domain/application-status';
import type {
  ApplicationRepository,
  ApplicationWithCompanyName,
  FindAllByUserOptions,
  PaginatedResult,
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

  findAllByUser(
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

    const start = (options.page - 1) * options.pageSize;
    const items = matching
      .slice(start, start + options.pageSize)
      .map((application): ApplicationWithCompanyName => {
        const company = this.companyRepository.findById(application.companyId);

        if (!company) {
          throw new Error(
            `No company found for id ${application.companyId} — test setup likely forgot to save it`,
          );
        }

        return { application, companyName: company.name };
      });

    return Promise.resolve({ items, total: matching.length });
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
}
