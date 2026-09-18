import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '../domain/company';
import { PrismaCompanyRepository } from './company.repository.prisma';

describe('PrismaCompanyRepository', () => {
  let prisma: PrismaService;
  let companyRepository: PrismaCompanyRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    companyRepository = new PrismaCompanyRepository(prisma);
  });

  afterAll(async () => {
    await prisma.company.deleteMany({ where: { name: 'Acme Corp' } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.company.deleteMany({ where: { name: 'Acme Corp' } });
  });

  describe('save', () => {
    it('saves a Company and finds it back by its normalized name', async () => {
      const company = Company.create({ name: 'Acme Corp' });

      await companyRepository.save(company);
      const foundCompany =
        await companyRepository.findByNormalizedName('Acme Corp');

      expect(foundCompany?.id).toBe(company.id);
      expect(foundCompany?.name).toBe('Acme Corp');
    });

    it('updates the existing row instead of creating a duplicate when saving with a name that already exists', async () => {
      const firstCompany = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(firstCompany);

      const secondCompany = Company.create({
        name: 'Acme Corp',
        website: 'https://acme.example',
      });
      await companyRepository.save(secondCompany);

      const foundCompany =
        await companyRepository.findByNormalizedName('Acme Corp');

      expect(foundCompany?.id).toBe(firstCompany.id);
      expect(foundCompany?.id).not.toBe(secondCompany.id);
      expect(foundCompany?.website).toBe('https://acme.example');
    });

    it('persists a non-empty website and returns it via findByNormalizedName', async () => {
      const company = Company.create({
        name: 'Acme Corp',
        website: 'https://acme.example',
      });

      await companyRepository.save(company);
      const foundCompany =
        await companyRepository.findByNormalizedName('Acme Corp');

      expect(foundCompany?.website).toBe('https://acme.example');
    });
  });

  describe('findByNormalizedName', () => {
    it('returns null when no Company matches the given normalized name', async () => {
      const foundCompany =
        await companyRepository.findByNormalizedName('Nonexistent Co');

      expect(foundCompany).toBeNull();
    });
  });

  describe('search', () => {
    let acme: Company;

    beforeAll(async () => {
      acme = Company.create({ name: 'Search Test Acme Corp' });
      await companyRepository.save(acme);
      await companyRepository.save(
        Company.create({ name: 'Search Test Globex Inc' }),
      );

      for (let i = 0; i < 15; i++) {
        await companyRepository.save(
          Company.create({ name: `Search Test Widget Co ${i}` }),
        );
      }
    });

    afterAll(async () => {
      await prisma.company.deleteMany({
        where: { name: { startsWith: 'Search Test' } },
      });
    });

    it('returns Companies whose name matches the search term', async () => {
      const results = await companyRepository.search('acme');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(acme.id);
    });

    it('matches on a partial/prefix word, for autocomplete-style typing', async () => {
      const results = await companyRepository.search('glob');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Search Test Globex Inc');
    });

    it('returns an empty array when no Company matches', async () => {
      const results = await companyRepository.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('limits results to at most 10 companies', async () => {
      const results = await companyRepository.search('widget');

      expect(results).toHaveLength(10);
    });
  });
});
