import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import type { ApplicationStatus } from '../domain/application-status';
import { APPLICATION_STATUSES } from '../domain/application-status';
import type { InterviewCategory } from '../domain/status-change';

export class ChangeStatusDto {
  @IsIn(APPLICATION_STATUSES)
  status: ApplicationStatus;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsIn(['TECHNICAL', 'NON_TECHNICAL'])
  interviewCategory?: InterviewCategory;
}
