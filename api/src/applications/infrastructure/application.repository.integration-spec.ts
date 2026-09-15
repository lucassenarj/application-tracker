import { PrismaService } from '../../prisma/prisma.service';
import { Application } from '../domain/application';
import { Company } from '../domain/company';
import { PrismaApplicationRepository } from './application.repository.prisma';
import { PrismaCompanyRepository } from './company.repository.prisma';

describe('PrismaApplicationRepository', () => {
  let prisma: PrismaService;
  let repository: PrismaApplicationRepository;
  let companyRepository: PrismaCompanyRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new PrismaApplicationRepository(prisma);
    companyRepository = new PrismaCompanyRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.statusChange.deleteMany({
      where: { application: { userId: 'user-1' } },
    });
    await prisma.application.deleteMany({ where: { userId: 'user-1' } });
    await prisma.company.deleteMany({ where: { name: 'Acme Corp' } });
  });

  it('saves an Application with its initial StatusChange and finds it back by id', async () => {
    const company = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(company);

    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: company.id,
      userId: 'user-1',
    });
    await repository.save(application);

    const found = await repository.findById(application.id);

    expect(found?.id).toBe(application.id);
    expect(found?.currentStatus).toBe('APPLIED');
    expect(found?.statusHistory).toHaveLength(1);
    expect(found?.statusHistory[0].status).toBe('APPLIED');
  });

  it('returns null when no Application matches the given id', async () => {
    const found = await repository.findById('nonexistent-id');

    expect(found).toBeNull();
  });

  it('updates currentStatus and appends the new StatusChange on save, without duplicating the original one', async () => {
    const company = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(company);

    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: company.id,
      userId: 'user-1',
    });
    await repository.save(application);

    const updated = application.changeStatus({
      status: 'WAITING_FEEDBACK',
      eventDate: new Date(),
    });
    await repository.save(updated);

    const found = await repository.findById(application.id);

    expect(found?.currentStatus).toBe('WAITING_FEEDBACK');
    expect(found?.statusHistory).toHaveLength(2);
    expect(found?.statusHistory[0].status).toBe('APPLIED');
    expect(found?.statusHistory[1].status).toBe('WAITING_FEEDBACK');
  });

  it('persists optional fields (description, externalUrl, salary) and returns them via findById', async () => {
    const company = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(company);

    const application = Application.create({
      title: 'Senior Backend Engineer',
      description: 'Great role',
      externalUrl: 'https://jobs.example/123',
      salary: 120000,
      companyId: company.id,
      userId: 'user-1',
    });
    await repository.save(application);

    const found = await repository.findById(application.id);

    expect(found?.description).toBe('Great role');
    expect(found?.externalUrl).toBe('https://jobs.example/123');
    expect(found?.salary).toBe(120000);
  });

  it('persists Contact and interviewCategory on a StatusChange and returns them via findById', async () => {
    const company = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(company);

    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: company.id,
      userId: 'user-1',
    });
    await repository.save(application);

    const updated = application.changeStatus({
      status: 'INTERVIEW_SCHEDULED',
      eventDate: new Date(),
      interviewCategory: 'TECHNICAL',
      contact: { name: 'Jane Recruiter', email: 'jane@example.com' },
    });
    await repository.save(updated);

    const found = await repository.findById(application.id);
    const statusChange = found?.statusHistory[1];

    expect(statusChange?.interviewCategory).toBe('TECHNICAL');
    expect(statusChange?.contact).toEqual({
      name: 'Jane Recruiter',
      email: 'jane@example.com',
    });
  });
});
