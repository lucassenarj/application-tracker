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
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.company.deleteMany({ where: { name: 'Acme Corp' } });
  });

  it('saves a Company and finds it back by its normalized name', async () => {
    const company = Company.create({ name: 'Acme Corp' });

    await companyRepository.save(company);
    const foundCompany =
      await companyRepository.findByNormalizedName('Acme Corp');

    expect(foundCompany?.id).toBe(company.id);
    expect(foundCompany?.name).toBe('Acme Corp');
  });

  it('returns null when no Company matches the given normalized name', async () => {
    const foundCompany =
      await companyRepository.findByNormalizedName('Nonexistent Co');

    expect(foundCompany).toBeNull();
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
