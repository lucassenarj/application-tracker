import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePersonalAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
