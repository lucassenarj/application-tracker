import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { Company } from './domain/company';
import { SearchCompaniesDto } from './dto/search-companies.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('search')
  search(@Query() query: SearchCompaniesDto): Promise<Company[]> {
    return this.companiesService.search(query.q);
  }
}
