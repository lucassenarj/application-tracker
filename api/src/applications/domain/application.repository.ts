import { Application } from './application';
import { ApplicationStatus } from './application-status';
import { ApplicationStatusCategory } from './application-status-category';
import { InterviewCategory } from './status-change';

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

export interface RecentActivityItem {
  statusChangeId: string;
  applicationId: string;
  applicationTitle: string;
  companyName: string;
  status: ApplicationStatus;
  eventDate: Date;
}

export interface UpcomingInterview {
  statusChangeId: string;
  applicationId: string;
  applicationTitle: string;
  companyName: string;
  eventDate: Date;
  interviewCategory?: InterviewCategory;
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
  findRecentStatusChangesByUser(
    userId: string,
    limit: number,
    now: Date,
  ): Promise<RecentActivityItem[]>;
  findCreatedDatesByUser(userId: string): Promise<Date[]>;
  findUpcomingInterviewsByUser(
    userId: string,
    now: Date,
  ): Promise<UpcomingInterview[]>;
  findInterviewsByUserInRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<UpcomingInterview[]>;
}
