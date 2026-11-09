import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { ApiTokenGuard } from '../identity/guards/api-token.guard';
import { IdentityModule } from '../identity/identity.module';
import { ExternalController } from './external.controller';

@Module({
  imports: [IdentityModule, ApplicationsModule],
  controllers: [ExternalController],
  providers: [ApiTokenGuard],
})
export class ExternalModule {}
