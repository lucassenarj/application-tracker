import { Company } from './domain/company';
import { CompaniesService } from './companies.service';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('CompaniesService', () => {
  let companiesService: CompaniesService;
  let companyRepository: FakeCompanyRepository;
  let acme: Company;

  beforeAll(async () => {
    companyRepository = new FakeCompanyRepository();
    companiesService = new CompaniesService(companyRepository);

    acme = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(acme);
    await companyRepository.save(Company.create({ name: 'Globex Inc' }));

    for (let i = 0; i < 15; i++) {
      await companyRepository.save(Company.create({ name: `Widget Co ${i}` }));
    }
  });

  describe('search', () => {
    it('returns Companies whose name matches the given query', async () => {
      const results = await companiesService.search('acme');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(acme.id);
    });

    it('returns an empty array when no Company matches the query', async () => {
      const results = await companiesService.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('limits results to at most 10 companies', async () => {
      const results = await companiesService.search('widget');

      expect(results).toHaveLength(10);
    });
  });
});
