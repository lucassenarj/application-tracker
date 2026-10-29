import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './domain/company';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('CompaniesController', () => {
  let companiesController: CompaniesController;
  let companiesService: CompaniesService;
  let acme: Company;

  beforeEach(async () => {
    const companyRepository = new FakeCompanyRepository();
    companiesService = new CompaniesService(companyRepository);
    companiesController = new CompaniesController(companiesService);

    acme = await companiesService.create('Acme Corp');
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

  describe('create', () => {
    it('creates a Company and returns it', async () => {
      const result = await companiesController.create({ name: 'Globex Inc' });

      expect(result.name).toBe('Globex Inc');
      expect(result.id).toEqual(expect.any(String));
    });

    it('creates a Company with an optional website', async () => {
      const result = await companiesController.create({
        name: 'Globex Inc',
        website: 'https://globex.example',
      });

      expect(result.website).toBe('https://globex.example');
    });

    it('throws a ConflictException when a Company with the given name already exists', async () => {
      await expect(
        companiesController.create({ name: 'Acme Corp' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('renames a Company and returns the updated Company', async () => {
      const result = await companiesController.update(acme.id, {
        name: 'Acme Corporation',
      });

      expect(result.id).toBe(acme.id);
      expect(result.name).toBe('Acme Corporation');
    });

    it('throws a NotFoundException when the given id does not match any existing Company', async () => {
      await expect(
        companiesController.update('nonexistent-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
