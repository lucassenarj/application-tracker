import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Application } from './domain/application';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@Body() _body: unknown): Promise<Application> {
    throw new Error('Not implemented');
  }

  @Get()
  findAll(): Promise<Application[]> {
    throw new Error('Not implemented');
  }

  @Get(':id')
  findOne(@Param('id') _id: string): Promise<Application> {
    throw new Error('Not implemented');
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') _id: string,
    @Body() _body: unknown,
  ): Promise<Application> {
    throw new Error('Not implemented');
  }
}
