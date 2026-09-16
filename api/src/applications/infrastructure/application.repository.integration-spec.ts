import { PrismaService } from '../../prisma/prisma.service';
import { Application } from '../domain/application';
import { Company } from '../domain/company';
import { PrismaApplicationRepository } from './application.repository.prisma';
import { PrismaCompanyRepository } from './company.repository.prisma';

describe('PrismaApplicationRepository', () => {
  let prisma: PrismaService;
  let applicationRepository: PrismaApplicationRepository;
  let companyRepository: PrismaCompanyRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    applicationRepository = new PrismaApplicationRepository(prisma);
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
    await applicationRepository.save(application);

    const foundApplication = await applicationRepository.findById(
      application.id,
    );

    expect(foundApplication?.id).toBe(application.id);
    expect(foundApplication?.currentStatus).toBe('APPLIED');
    expect(foundApplication?.statusHistory).toHaveLength(1);
    expect(foundApplication?.statusHistory[0].status).toBe('APPLIED');
  });

  it('returns null when no Application matches the given id', async () => {
    const foundApplication =
      await applicationRepository.findById('nonexistent-id');

    expect(foundApplication).toBeNull();
  });

  it('updates currentStatus and appends the new StatusChange on save, without duplicating the original one', async () => {
    const company = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(company);

    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: company.id,
      userId: 'user-1',
    });
    await applicationRepository.save(application);

    const updatedApplication = application.changeStatus({
      status: 'WAITING_FEEDBACK',
      eventDate: new Date(),
    });
    await applicationRepository.save(updatedApplication);

    const foundApplication = await applicationRepository.findById(
      application.id,
    );

    expect(foundApplication?.currentStatus).toBe('WAITING_FEEDBACK');
    expect(foundApplication?.statusHistory).toHaveLength(2);
    expect(foundApplication?.statusHistory[0].status).toBe('APPLIED');
    expect(foundApplication?.statusHistory[1].status).toBe(
      'WAITING_FEEDBACK',
    );
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
    await applicationRepository.save(application);

    const foundApplication = await applicationRepository.findById(
      application.id,
    );

    expect(foundApplication?.description).toBe('Great role');
    expect(foundApplication?.externalUrl).toBe('https://jobs.example/123');
    expect(foundApplication?.salary).toBe(120000);
  });

  it('persists Contact and interviewCategory on a StatusChange and returns them via findById', async () => {
    const company = Company.create({ name: 'Acme Corp' });
    await companyRepository.save(company);

    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: company.id,
      userId: 'user-1',
    });
    await applicationRepository.save(application);

    const updatedApplication = application.changeStatus({
      status: 'INTERVIEW_SCHEDULED',
      eventDate: new Date(),
      interviewCategory: 'TECHNICAL',
      contact: { name: 'Jane Recruiter', email: 'jane@example.com' },
    });
    await applicationRepository.save(updatedApplication);

    const foundApplication = await applicationRepository.findById(
      application.id,
    );
    const statusChange = foundApplication?.statusHistory[1];

    expect(statusChange?.interviewCategory).toBe('TECHNICAL');
    expect(statusChange?.contact).toEqual({
      name: 'Jane Recruiter',
      email: 'jane@example.com',
    });
  });
});
