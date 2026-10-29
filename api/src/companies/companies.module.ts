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
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PrismaCompanyRepository } from './infrastructure/company.repository.prisma';

@Module({
  imports: [IdentityModule],
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    PrismaService,
    JwtAuthGuard,
    {
      provide: 'CompanyRepository',
      useClass: PrismaCompanyRepository,
    },
  ],
  exports: [CompaniesService],
})
export class CompaniesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(doubleCsrfProtection)
      .forRoutes(
        { path: 'companies', method: RequestMethod.POST },
        { path: 'companies/:id', method: RequestMethod.PATCH },
      );
  }
}
