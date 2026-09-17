import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { IdentityModule } from './identity/identity.module';

@Module({
  imports: [ApplicationsModule, IdentityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
