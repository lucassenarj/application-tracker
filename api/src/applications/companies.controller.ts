import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { Company } from './domain/company';
import { SearchCompaniesDto } from './dto/search-companies.dto';

export class CompanyResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  website?: string;
}

function toCompanyResponse(company: Company): CompanyResponse {
  return {
    id: company.id,
    name: company.name,
    website: company.website,
  };
}

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('search')
  async search(@Query() query: SearchCompaniesDto): Promise<CompanyResponse[]> {
    const companies = await this.companiesService.search(query.q);
    return companies.map(toCompanyResponse);
  }
}
