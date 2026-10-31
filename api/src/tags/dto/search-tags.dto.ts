import { IsOptional, IsString } from 'class-validator';

export class SearchTagsDto {
  @IsOptional()
  @IsString()
  q?: string;
}
