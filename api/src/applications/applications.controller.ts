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
import type { Request } from 'express';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { Application } from './domain/application';
import type { ApplicationStatus } from './domain/application-status';
import type {
  ApplicationWithCompanyName,
  PaginatedResult,
} from './domain/application.repository';
import type { Contact, InterviewCategory } from './domain/status-change';
import {
  ApplicationsService,
  type ApplicationStats,
} from './applications.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { FindAllApplicationsDto } from './dto/find-all-applications.dto';

export interface ApplicationListItemResponse {
  id: string;
  title: string;
  companyName: string;
  currentStatus: ApplicationStatus;
  createdAt: Date;
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
    createdAt: application.createdAt,
  };
}

export interface StatusChangeResponse {
  id: string;
  status: ApplicationStatus;
  eventDate: Date;
  notes?: string;
  contact?: Contact;
  interviewCategory?: InterviewCategory;
  createdAt: Date;
}

export interface ApplicationDetailResponse {
  id: string;
  title: string;
  description?: string;
  externalUrl?: string;
  salary?: number;
  companyName: string;
  currentStatus: ApplicationStatus;
  statusHistory: StatusChangeResponse[];
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
    companyName,
    currentStatus: application.currentStatus,
    statusHistory: application.statusHistory.map((change) => ({
      id: change.id,
      status: change.status,
      eventDate: change.eventDate,
      notes: change.notes,
      contact: change.contact,
      interviewCategory: change.interviewCategory,
      createdAt: change.createdAt,
    })),
    createdAt: application.createdAt,
  };
}

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(
    @Body() dto: CreateApplicationDto,
    @Req() request: Request,
  ): Promise<Application> {
    return this.applicationsService.create({
      title: dto.title,
      description: dto.description,
      externalUrl: dto.externalUrl,
      salary: dto.salary,
      companyName: dto.companyName,
      companyId: dto.companyId,
      userId: request.user!.id,
    });
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
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @Req() request: Request,
  ): Promise<Application> {
    const contact =
      dto.contactName || dto.contactEmail
        ? { name: dto.contactName ?? '', email: dto.contactEmail ?? '' }
        : undefined;

    return this.applicationsService.changeStatus(id, request.user!.id, {
      status: dto.status,
      eventDate: new Date(dto.eventDate),
      notes: dto.notes,
      contact,
      interviewCategory: dto.interviewCategory,
    });
  }
}
