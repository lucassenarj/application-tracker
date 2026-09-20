import { Application } from './application';
import { ApplicationStatus } from './application-status';

export interface FindAllByUserOptions {
  page: number;
  pageSize: number;
  search?: string;
  status?: ApplicationStatus;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ApplicationRepository {
  save(application: Application): Promise<void>;
  findById(id: string): Promise<Application | null>;
  findAllByUser(
    userId: string,
    options: FindAllByUserOptions,
  ): Promise<PaginatedResult<Application>>;
  countByUserGroupedByStatus(
    userId: string,
  ): Promise<Record<ApplicationStatus, number>>;
}
