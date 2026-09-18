import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './domain/company';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('CompaniesController', () => {
  let companiesController: CompaniesController;
  let acme: Company;

  beforeAll(async () => {
    const companyRepository = new FakeCompanyRepository();
    const companiesService = new CompaniesService(companyRepository);
    companiesController = new CompaniesController(companiesService);

    acme = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(acme);
  });

  describe('search', () => {
    it('returns Companies matching the query', async () => {
      const results = await companiesController.search({ q: 'acme' });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(acme.id);
    });

    it('returns an empty array when no Company matches the query', async () => {
      const results = await companiesController.search({ q: 'nonexistent' });

      expect(results).toEqual([]);
    });
  });
});
