import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { doubleCsrfProtection } from '../csrf.config';
import { CompaniesModule } from '../companies/companies.module';
import { IdentityModule } from '../identity/identity.module';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { TagsModule } from '../tags/tags.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { PrismaApplicationRepository } from './infrastructure/application.repository.prisma';

@Module({
  imports: [IdentityModule, CompaniesModule, TagsModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    PrismaService,
    JwtAuthGuard,
    {
      provide: 'ApplicationRepository',
      useClass: PrismaApplicationRepository,
    },
  ],
  exports: [ApplicationsService],
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
