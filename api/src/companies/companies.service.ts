import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Company } from './domain/company';
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

  async create(name: string, website?: string): Promise<Company> {
    const normalizedName = Company.normalizeName(name);
    const existing =
      await this.companyRepository.findByNormalizedName(normalizedName);

    if (existing) {
      throw new ConflictException('a Company with this name already exists');
    }

    const company = Company.create({ name, website });
    await this.companyRepository.save(company);

    return company;
  }

  async findOrCreate(name: string): Promise<Company> {
    const normalizedName = Company.normalizeName(name);
    const existing =
      await this.companyRepository.findByNormalizedName(normalizedName);

    if (existing) {
      return existing;
    }

    return this.create(name);
  }

  findById(id: string): Promise<Company | null> {
    return this.companyRepository.findById(id);
  }

  async update(id: string, name: string): Promise<Company> {
    const existing = await this.companyRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    const normalizedName = Company.normalizeName(name);
    const collision =
      await this.companyRepository.findByNormalizedName(normalizedName);

    if (collision && collision.id !== id) {
      throw new ConflictException('a Company with this name already exists');
    }

    const renamed = existing.rename(name);
    await this.companyRepository.save(renamed);

    return renamed;
  }
}
