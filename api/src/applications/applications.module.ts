import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const notImplemented = () => {
  throw new Error('Not implemented');
};

@Module({
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    {
      provide: 'ApplicationRepository',
      useValue: {
        save: notImplemented,
        findById: notImplemented,
        findAllByUser: notImplemented,
      },
    },
    {
      provide: 'CompanyRepository',
      useValue: {
        save: notImplemented,
        findByNormalizedName: notImplemented,
        search: notImplemented,
      },
    },
  ],
})
export class ApplicationsModule {}
