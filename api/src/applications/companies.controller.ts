import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { Company } from './domain/company';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SearchCompaniesDto } from './dto/search-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

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

  @Post()
  async create(@Body() dto: CreateCompanyDto): Promise<CompanyResponse> {
    const company = await this.companiesService.create(dto.name, dto.website);
    return toCompanyResponse(company);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyResponse> {
    const company = await this.companiesService.update(id, dto.name);
    return toCompanyResponse(company);
  }
}
