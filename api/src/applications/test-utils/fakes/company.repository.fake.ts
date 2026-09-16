import type { Company } from '../../domain/company';
import type { CompanyRepository } from '../../domain/company.repository';

export class FakeCompanyRepository implements CompanyRepository {
  private readonly companies = new Map<string, Company>();

  save(company: Company): Promise<void> {
    this.companies.set(company.id, company);
    return Promise.resolve();
  }

  findByNormalizedName(name: string): Promise<Company | null> {
    return Promise.resolve(
      [...this.companies.values()].find((c) => c.name === name) ?? null,
    );
  }

  search(): Promise<Company[]> {
    throw new Error('Not implemented');
  }
}
