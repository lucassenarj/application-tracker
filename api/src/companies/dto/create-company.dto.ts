import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}
