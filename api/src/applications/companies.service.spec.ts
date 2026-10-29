import { ConflictException, NotFoundException } from '@nestjs/common';
import { Company } from './domain/company';
import { CompaniesService } from './companies.service';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('CompaniesService', () => {
  let companiesService: CompaniesService;
  let companyRepository: FakeCompanyRepository;
  let acme: Company;
  let globex: Company;

  beforeEach(async () => {
    companyRepository = new FakeCompanyRepository();
    companiesService = new CompaniesService(companyRepository);
    acme = await companiesService.create('Acme Corp');
    globex = await companiesService.create('Globex Inc');
  });

  describe('create', () => {
    it('creates a Company with the given name', async () => {
      const company = await companiesService.create('Stripe Inc');

      expect(company.name).toBe('Stripe Inc');

      const saved = await companyRepository.findById(company.id);
      expect(saved?.id).toBe(company.id);
    });

    it('creates a Company with an optional website', async () => {
      const company = await companiesService.create(
        'Stripe Inc',
        'https://stripe.example',
      );

      expect(company.website).toBe('https://stripe.example');
    });

    it('throws a ConflictException when a Company with the given name already exists', async () => {
      await expect(companiesService.create('Acme Corp')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws a ConflictException when a Company with the given name already exists in a different case', async () => {
      await expect(companiesService.create('ACME CORP')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOrCreate', () => {
    it('returns the existing Company when one already exists with the given name', async () => {
      const result = await companiesService.findOrCreate('Acme Corp');

      expect(result.id).toBe(acme.id);
    });

    it('returns the existing Company matching case-insensitively', async () => {
      const result = await companiesService.findOrCreate('ACME CORP');

      expect(result.id).toBe(acme.id);
    });

    it('creates a new Company when none exists with the given name', async () => {
      const result = await companiesService.findOrCreate('Stripe Inc');

      expect(result.name).toBe('Stripe Inc');

      const saved = await companyRepository.findById(result.id);
      expect(saved?.id).toBe(result.id);
    });
  });

  describe('findById', () => {
    it('returns the Company matching the given id', async () => {
      const result = await companiesService.findById(acme.id);

      expect(result?.id).toBe(acme.id);
    });

    it('returns null when no Company matches the given id', async () => {
      const result = await companiesService.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('renames a Company and returns the updated Company', async () => {
      const result = await companiesService.update(acme.id, 'Acme Corporation');

      expect(result.id).toBe(acme.id);
      expect(result.name).toBe('Acme Corporation');

      const saved = await companyRepository.findById(acme.id);
      expect(saved?.name).toBe('Acme Corporation');
    });

    it('throws a NotFoundException when the given id does not match any existing Company', async () => {
      await expect(
        companiesService.update('nonexistent-id', 'New Name'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws a ConflictException when renaming to a name that collides with a different Company', async () => {
      await expect(
        companiesService.update(globex.id, 'Acme Corp'),
      ).rejects.toThrow(ConflictException);
    });

    it('does not throw when renaming a Company to its own current name', async () => {
      await expect(
        companiesService.update(acme.id, 'Acme Corp'),
      ).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      for (let i = 0; i < 15; i++) {
        await companyRepository.save(
          Company.create({ name: `Widget Co ${i}` }),
        );
      }
    });

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
