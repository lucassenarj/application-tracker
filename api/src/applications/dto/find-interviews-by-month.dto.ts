import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class FindInterviewsByMonthDto {
  @Type(() => Number)
  @IsInt()
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
