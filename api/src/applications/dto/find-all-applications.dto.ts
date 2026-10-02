import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { ApplicationStatus } from '../domain/application-status';
import { APPLICATION_STATUSES } from '../domain/application-status';
import type { ApplicationStatusCategory } from '../domain/application-status-category';
import { APPLICATION_STATUS_CATEGORIES } from '../domain/application-status-category';

export class FindAllApplicationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(APPLICATION_STATUSES)
  status?: ApplicationStatus;

  @IsOptional()
  @IsIn(APPLICATION_STATUS_CATEGORIES)
  category?: ApplicationStatusCategory;
}
