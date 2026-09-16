import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Application } from './domain/application';
import { ApplicationsService } from './applications.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';

// TODO: replace with the authenticated user's id once auth/Identity is implemented
const PLACEHOLDER_USER_ID = 'placeholder-user-id';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@Body() dto: CreateApplicationDto): Promise<Application> {
    return this.applicationsService.create({
      title: dto.title,
      description: dto.description,
      externalUrl: dto.externalUrl,
      salary: dto.salary,
      companyName: dto.companyName,
      userId: PLACEHOLDER_USER_ID,
    });
  }

  @Get()
  findAll(): Promise<Application[]> {
    return this.applicationsService.findAllByUser(PLACEHOLDER_USER_ID);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Application> {
    return this.applicationsService.findById(id);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ): Promise<Application> {
    const contact =
      dto.contactName || dto.contactEmail
        ? { name: dto.contactName ?? '', email: dto.contactEmail ?? '' }
        : undefined;

    return this.applicationsService.changeStatus(id, {
      status: dto.status,
      eventDate: new Date(dto.eventDate),
      notes: dto.notes,
      contact,
      interviewCategory: dto.interviewCategory,
    });
  }
}
