import { IsNotEmpty, IsString } from 'class-validator';

export class SearchCompaniesDto {
  @IsString()
  @IsNotEmpty()
  q: string;
}
