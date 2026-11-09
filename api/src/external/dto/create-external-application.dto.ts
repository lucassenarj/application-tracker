import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateExternalApplicationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  externalUrl: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsString({ each: true })
  skills?: string[];
}
