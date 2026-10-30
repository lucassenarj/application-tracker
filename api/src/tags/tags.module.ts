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
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { PrismaTagRepository } from './infrastructure/tag.repository.prisma';

@Module({
  imports: [IdentityModule],
  controllers: [TagsController],
  providers: [
    TagsService,
    PrismaService,
    JwtAuthGuard,
    {
      provide: 'TagRepository',
      useClass: PrismaTagRepository,
    },
  ],
  exports: [TagsService],
})
export class TagsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(doubleCsrfProtection)
      .forRoutes(
        { path: 'tags', method: RequestMethod.POST },
        { path: 'tags/:id', method: RequestMethod.PATCH },
      );
  }
}
