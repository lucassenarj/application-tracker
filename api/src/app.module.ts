import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { IdentityModule } from './identity/identity.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [ApplicationsModule, IdentityModule, TagsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
