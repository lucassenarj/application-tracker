import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApplicationsService } from '../applications/applications.service';
import { ApiTokenGuard } from '../identity/guards/api-token.guard';
import { CreateExternalApplicationDto } from './dto/create-external-application.dto';

@Controller('external')
@UseGuards(ApiTokenGuard)
export class ExternalController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('applications')
  async createApplication(
    @Body() dto: CreateExternalApplicationDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const existingApplication =
      await this.applicationsService.findByExternalUrlForUser(
        dto.externalUrl,
        request.user!.id,
      );

    if (existingApplication) {
      response.status(200);
      return existingApplication;
    }

    return this.applicationsService.create({
      title: dto.title,
      description: dto.description,
      externalUrl: dto.externalUrl,
      companyName: dto.companyName,
      tagNames: dto.skills,
      userId: request.user!.id,
    });
  }
}
