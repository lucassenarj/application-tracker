import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { Application } from './domain/application';
import { ApplicationsService } from './applications.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';

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
      userId: request.user!.id,
    });
  }

  @Get()
  findAll(@Req() request: Request): Promise<Application[]> {
    return this.applicationsService.findAllByUser(request.user!.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<Application> {
    return this.applicationsService.findById(id, request.user!.id);
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
