import { Inject, Injectable } from '@nestjs/common';
import type { Company } from './domain/company';
import type { CompanyRepository } from './domain/company.repository';

@Injectable()
export class CompaniesService {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  search(query: string): Promise<Company[]> {
    return this.companyRepository.search(query);
  }
}
