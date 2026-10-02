import { Application } from './application';
import { ApplicationStatus } from './application-status';
import { ApplicationStatusCategory } from './application-status-category';

export interface FindAllByUserOptions {
  page: number;
  pageSize: number;
  search?: string;
  status?: ApplicationStatus;
  category?: ApplicationStatusCategory;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ApplicationWithCompanyName {
  application: Application;
  companyName: string;
}

export interface ApplicationRepository {
  save(application: Application): Promise<void>;
  findById(id: string): Promise<Application | null>;
  findAllByUser(
    userId: string,
    options: FindAllByUserOptions,
  ): Promise<PaginatedResult<ApplicationWithCompanyName>>;
  countByUserGroupedByStatus(
    userId: string,
  ): Promise<Record<ApplicationStatus, number>>;
}
