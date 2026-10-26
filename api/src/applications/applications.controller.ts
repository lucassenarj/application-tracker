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
} from './domain/application.repository';
import type { InterviewCategory, StatusChange } from './domain/status-change';
import {
  ApplicationsService,
  type ApplicationStats,
} from './applications.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { FindAllApplicationsDto } from './dto/find-all-applications.dto';

export class ApplicationListItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  companyName: string;

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
}: ApplicationWithCompanyName): ApplicationListItemResponse {
  return {
    id: application.id,
    title: application.title,
    companyName,
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
}: ApplicationWithCompanyName): ApplicationDetailResponse {
  return {
    id: application.id,
    title: application.title,
    description: application.description,
    externalUrl: application.externalUrl,
    salary: application.salary,
    currency: application.currency,
    companyName,
    currentStatus: application.currentStatus,
    availableTransitions: ApplicationStatusStateMachine.getAvailableTransitions(
      application.currentStatus,
    ),
    statusHistory: application.statusHistory.map(toStatusChangeResponse),
    createdAt: application.createdAt,
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
      },
    );

    return { items: result.items.map(toListItemResponse), total: result.total };
  }

  @Get('stats')
  getStats(@Req() request: Request): Promise<ApplicationStats> {
    return this.applicationsService.getStats(request.user!.id);
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
