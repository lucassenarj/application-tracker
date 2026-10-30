import { IsNotEmpty, IsString } from 'class-validator';

export class SearchTagsDto {
  @IsString()
  @IsNotEmpty()
  q: string;
}
