import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { doubleCsrfProtection } from '../csrf.config';
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
export class ApplicationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(doubleCsrfProtection)
      .forRoutes(
        { path: 'applications', method: RequestMethod.POST },
        { path: 'applications/:id/status', method: RequestMethod.PATCH },
      );
  }
}
