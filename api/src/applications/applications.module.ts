import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { PrismaApplicationRepository } from './infrastructure/application.repository.prisma';
import { PrismaCompanyRepository } from './infrastructure/company.repository.prisma';

@Module({
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    PrismaService,
    {
      provide: 'ApplicationRepository',
      useClass: PrismaApplicationRepository,
    },
    {
      provide: 'CompanyRepository',
      useClass: PrismaCompanyRepository,
    },
  ],
})
export class ApplicationsModule {}
