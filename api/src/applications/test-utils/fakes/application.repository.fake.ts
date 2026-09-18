import type { Application } from '../../domain/application';
import type {
  ApplicationRepository,
  FindAllByUserOptions,
  PaginatedResult,
} from '../../domain/application.repository';

export class FakeApplicationRepository implements ApplicationRepository {
  private readonly applications = new Map<string, Application>();

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
  ): Promise<PaginatedResult<Application>> {
    const matching = [...this.applications.values()].filter(
      (a) => a.userId === userId,
    );

    const start = (options.page - 1) * options.pageSize;
    const items = matching.slice(start, start + options.pageSize);

    return Promise.resolve({ items, total: matching.length });
  }
}
