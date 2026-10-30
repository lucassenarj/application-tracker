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

  search(query: string): Promise<Company[]> {
    const normalizedQuery = query.toLowerCase();

    const matching = [...this.companies.values()].filter((c) =>
      c.name.toLowerCase().includes(normalizedQuery),
    );

    return Promise.resolve(matching.slice(0, 10));
  }

  findById(id: string): Promise<Company | null> {
    return Promise.resolve(this.companies.get(id) ?? null);
  }
}
