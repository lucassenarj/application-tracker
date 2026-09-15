import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '../domain/company';
import { PrismaCompanyRepository } from './company.repository.prisma';

describe('PrismaCompanyRepository', () => {
  let prisma: PrismaService;
  let repository: PrismaCompanyRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new PrismaCompanyRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.company.deleteMany({ where: { name: 'Acme Corp' } });
  });

  it('saves a Company and finds it back by its normalized name', async () => {
    const company = Company.create({ name: 'Acme Corp' });

    await repository.save(company);
    const found = await repository.findByNormalizedName('Acme Corp');

    expect(found?.id).toBe(company.id);
    expect(found?.name).toBe('Acme Corp');
  });

  it('returns null when no Company matches the given normalized name', async () => {
    const found = await repository.findByNormalizedName('Nonexistent Co');

    expect(found).toBeNull();
  });

  it('updates the existing row instead of creating a duplicate when saving with a name that already exists', async () => {
    const first = Company.create({ name: 'Acme Corp' });
    await repository.save(first);

    const second = Company.create({
      name: 'Acme Corp',
      website: 'https://acme.example',
    });
    await repository.save(second);

    const found = await repository.findByNormalizedName('Acme Corp');

    expect(found?.id).toBe(first.id);
    expect(found?.id).not.toBe(second.id);
    expect(found?.website).toBe('https://acme.example');
  });

  it('persists a non-empty website and returns it via findByNormalizedName', async () => {
    const company = Company.create({
      name: 'Acme Corp',
      website: 'https://acme.example',
    });

    await repository.save(company);
    const found = await repository.findByNormalizedName('Acme Corp');

    expect(found?.website).toBe('https://acme.example');
  });
});
