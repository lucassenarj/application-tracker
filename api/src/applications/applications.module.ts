import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { doubleCsrfProtection } from '../csrf.config';
import { IdentityModule } from '../identity/identity.module';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PrismaApplicationRepository } from './infrastructure/application.repository.prisma';
import { PrismaCompanyRepository } from './infrastructure/company.repository.prisma';

@Module({
  imports: [IdentityModule],
  controllers: [ApplicationsController, CompaniesController],
  providers: [
    ApplicationsService,
    CompaniesService,
    PrismaService,
    JwtAuthGuard,
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
        { path: 'companies', method: RequestMethod.POST },
        { path: 'companies/:id', method: RequestMethod.PATCH },
      );
  }
}
