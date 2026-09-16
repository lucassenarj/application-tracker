import type { Application } from '../../domain/application';
import type { ApplicationRepository } from '../../domain/application.repository';

export class FakeApplicationRepository implements ApplicationRepository {
  private readonly applications = new Map<string, Application>();

  save(application: Application): Promise<void> {
    this.applications.set(application.id, application);
    return Promise.resolve();
  }

  findById(id: string): Promise<Application | null> {
    return Promise.resolve(this.applications.get(id) ?? null);
  }

  findAllByUser(userId: string): Promise<Application[]> {
    return Promise.resolve(
      [...this.applications.values()].filter((a) => a.userId === userId),
    );
  }
}
