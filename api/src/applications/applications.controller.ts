import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { Application } from './domain/application';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from './domain/application-status';
import { ApplicationStatusStateMachine } from './domain/application-status.state-machine';
import type {
  ApplicationWithCompanyName,
  PaginatedResult,
  RecentActivityItem,
  UpcomingInterview,
} from './domain/application.repository';
import type { ApplicationsOverTimeBucket } from './domain/applications-over-time';
import type { InterviewCategory, StatusChange } from './domain/status-change';
import {
  ApplicationsService,
  type ApplicationStats,
} from './applications.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { FindAllApplicationsDto } from './dto/find-all-applications.dto';
import { FindInterviewsByMonthDto } from './dto/find-interviews-by-month.dto';
import { FindRecentActivityDto } from './dto/find-recent-activity.dto';

export class ApplicationListItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ type: String, isArray: true })
  tags: string[];

  @ApiProperty({ enum: APPLICATION_STATUSES })
  currentStatus: ApplicationStatus;

  @ApiProperty({ enum: APPLICATION_STATUSES, isArray: true })
  availableTransitions: ApplicationStatus[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

function toListItemResponse({
  application,
  companyName,
  tags,
}: ApplicationWithCompanyName): ApplicationListItemResponse {
  return {
    id: application.id,
    title: application.title,
    companyName,
    tags,
    currentStatus: application.currentStatus,
    availableTransitions: ApplicationStatusStateMachine.getAvailableTransitions(
      application.currentStatus,
    ),
    createdAt: application.createdAt,
    updatedAt: application.lastStatusChangeAt,
  };
}

export class ContactResponse {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class StatusChangeResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: APPLICATION_STATUSES })
  status: ApplicationStatus;

  @ApiProperty()
  eventDate: Date;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ type: ContactResponse, required: false })
  contact?: ContactResponse;

  @ApiProperty({ enum: ['TECHNICAL', 'NON_TECHNICAL'], required: false })
  interviewCategory?: InterviewCategory;

  @ApiProperty()
  createdAt: Date;
}

function toStatusChangeResponse(change: StatusChange): StatusChangeResponse {
  return {
    id: change.id,
    status: change.status,
    eventDate: change.eventDate,
    notes: change.notes,
    contact: change.contact,
    interviewCategory: change.interviewCategory,
    createdAt: change.createdAt,
  };
}

export class ApplicationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  externalUrl?: string;

  @ApiProperty({ required: false })
  salary?: number;

  @ApiProperty({ required: false })
  currency?: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty({ type: String, isArray: true })
  tagIds: string[];

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: APPLICATION_STATUSES })
  currentStatus: ApplicationStatus;

  @ApiProperty({ type: StatusChangeResponse, isArray: true })
  statusHistory: StatusChangeResponse[];

  @ApiProperty()
  createdAt: Date;
}

function toApplicationResponse(application: Application): ApplicationResponse {
  return {
    id: application.id,
    title: application.title,
    description: application.description,
    externalUrl: application.externalUrl,
    salary: application.salary,
    currency: application.currency,
    companyId: application.companyId,
    tagIds: [...application.tagIds],
    userId: application.userId,
    currentStatus: application.currentStatus,
    statusHistory: application.statusHistory.map(toStatusChangeResponse),
    createdAt: application.createdAt,
  };
}

export class ApplicationDetailResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  externalUrl?: string;

  @ApiProperty({ required: false })
  salary?: number;

  @ApiProperty({ required: false })
  currency?: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ type: String, isArray: true })
  tags: string[];

  @ApiProperty({ enum: APPLICATION_STATUSES })
  currentStatus: ApplicationStatus;

  @ApiProperty({ enum: APPLICATION_STATUSES, isArray: true })
  availableTransitions: ApplicationStatus[];

  @ApiProperty({ type: StatusChangeResponse, isArray: true })
  statusHistory: StatusChangeResponse[];

  @ApiProperty()
  createdAt: Date;
}

function toDetailResponse({
  application,
  companyName,
  tags,
}: ApplicationWithCompanyName): ApplicationDetailResponse {
  return {
    id: application.id,
    title: application.title,
    description: application.description,
    externalUrl: application.externalUrl,
    salary: application.salary,
    currency: application.currency,
    companyName,
    tags,
    currentStatus: application.currentStatus,
    availableTransitions: ApplicationStatusStateMachine.getAvailableTransitions(
      application.currentStatus,
    ),
    statusHistory: application.statusHistory.map(toStatusChangeResponse),
    createdAt: application.createdAt,
  };
}

export class RecentActivityItemResponse {
  @ApiProperty()
  statusChangeId: string;

  @ApiProperty()
  applicationId: string;

  @ApiProperty()
  applicationTitle: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ enum: APPLICATION_STATUSES })
  status: ApplicationStatus;

  @ApiProperty()
  eventDate: Date;
}

function toRecentActivityResponse(
  item: RecentActivityItem,
): RecentActivityItemResponse {
  return {
    statusChangeId: item.statusChangeId,
    applicationId: item.applicationId,
    applicationTitle: item.applicationTitle,
    companyName: item.companyName,
    status: item.status,
    eventDate: item.eventDate,
  };
}

export class OverTimeBucketResponse {
  @ApiProperty()
  weekStart: string;

  @ApiProperty()
  count: number;
}

function toOverTimeBucketResponse(
  bucket: ApplicationsOverTimeBucket,
): OverTimeBucketResponse {
  return { weekStart: bucket.weekStart, count: bucket.count };
}

export class UpcomingInterviewResponse {
  @ApiProperty()
  statusChangeId: string;

  @ApiProperty()
  applicationId: string;

  @ApiProperty()
  applicationTitle: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  eventDate: Date;

  @ApiProperty({ required: false, enum: ['TECHNICAL', 'NON_TECHNICAL'] })
  interviewCategory?: InterviewCategory;
}

function toUpcomingInterviewResponse(
  interview: UpcomingInterview,
): UpcomingInterviewResponse {
  return {
    statusChangeId: interview.statusChangeId,
    applicationId: interview.applicationId,
    applicationTitle: interview.applicationTitle,
    companyName: interview.companyName,
    eventDate: interview.eventDate,
    interviewCategory: interview.interviewCategory,
  };
}

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  async create(
    @Body() dto: CreateApplicationDto,
    @Req() request: Request,
  ): Promise<ApplicationResponse> {
    const application = await this.applicationsService.create({
      title: dto.title,
      description: dto.description,
      externalUrl: dto.externalUrl,
      salary: dto.salary,
      currency: dto.currency,
      companyName: dto.companyName,
      companyId: dto.companyId,
      userId: request.user!.id,
      tagNames: dto.tagNames,
    });
    return toApplicationResponse(application);
  }

  @Get()
  async findAll(
    @Query() query: FindAllApplicationsDto,
    @Req() request: Request,
  ): Promise<PaginatedResult<ApplicationListItemResponse>> {
    const result = await this.applicationsService.findAllByUser(
      request.user!.id,
      {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10,
        search: query.search,
        status: query.status,
        category: query.category,
        tag: query.tag,
      },
    );

    return { items: result.items.map(toListItemResponse), total: result.total };
  }

  @Get('stats')
  getStats(@Req() request: Request): Promise<ApplicationStats> {
    return this.applicationsService.getStats(request.user!.id);
  }

  @Get('recent-activity')
  async getRecentActivity(
    @Query() query: FindRecentActivityDto,
    @Req() request: Request,
  ): Promise<RecentActivityItemResponse[]> {
    const activity = await this.applicationsService.getRecentActivity(
      request.user!.id,
      query.limit,
    );
    return activity.map(toRecentActivityResponse);
  }

  @Get('over-time')
  async getApplicationsOverTime(
    @Req() request: Request,
  ): Promise<OverTimeBucketResponse[]> {
    const buckets = await this.applicationsService.getApplicationsOverTime(
      request.user!.id,
    );
    return buckets.map(toOverTimeBucketResponse);
  }

  @Get('interviews/upcoming')
  async getUpcomingInterviews(
    @Req() request: Request,
  ): Promise<UpcomingInterviewResponse[]> {
    const interviews = await this.applicationsService.getUpcomingInterviews(
      request.user!.id,
    );
    return interviews.map(toUpcomingInterviewResponse);
  }

  @Get('interviews')
  async getInterviewsForMonth(
    @Query() query: FindInterviewsByMonthDto,
    @Req() request: Request,
  ): Promise<UpcomingInterviewResponse[]> {
    const interviews = await this.applicationsService.getInterviewsForMonth(
      request.user!.id,
      query.year,
      query.month,
    );
    return interviews.map(toUpcomingInterviewResponse);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ApplicationDetailResponse> {
    const detail = await this.applicationsService.getDetailById(
      id,
      request.user!.id,
    );
    return toDetailResponse(detail);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @Req() request: Request,
  ): Promise<ApplicationResponse> {
    const contact =
      dto.contactName || dto.contactEmail
        ? { name: dto.contactName ?? '', email: dto.contactEmail ?? '' }
        : undefined;

    const application = await this.applicationsService.changeStatus(
      id,
      request.user!.id,
      {
        status: dto.status,
        eventDate: new Date(dto.eventDate),
        notes: dto.notes,
        contact,
        interviewCategory: dto.interviewCategory,
      },
    );
    return toApplicationResponse(application);
  }
}
