import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { ExternalModule } from './external/external.module';
import { IdentityModule } from './identity/identity.module';
import { LoggingInterceptor } from './observability/logging.interceptor';
import { TagsModule } from './tags/tags.module';
import {
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  HOURLY_THROTTLE_LIMIT,
  HOURLY_THROTTLE_TTL_MS,
} from './throttle.config';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: DEFAULT_THROTTLE_TTL_MS,
        limit: DEFAULT_THROTTLE_LIMIT,
      },
      {
        name: 'hourly',
        ttl: HOURLY_THROTTLE_TTL_MS,
        limit: HOURLY_THROTTLE_LIMIT,
      },
    ]),
    ApplicationsModule,
    ExternalModule,
    IdentityModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
