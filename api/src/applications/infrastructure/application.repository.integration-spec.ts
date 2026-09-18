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
    await prisma.statusChange.deleteMany({
      where: { application: { userId: { in: ['user-1', 'user-2'] } } },
    });
    await prisma.application.deleteMany({
      where: { userId: { in: ['user-1', 'user-2'] } },
    });
    await prisma.company.deleteMany({ where: { name: 'Acme Corp' } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.statusChange.deleteMany({
      where: { application: { userId: { in: ['user-1', 'user-2'] } } },
    });
    await prisma.application.deleteMany({
      where: { userId: { in: ['user-1', 'user-2'] } },
    });
    await prisma.company.deleteMany({ where: { name: 'Acme Corp' } });
  });

  describe('save', () => {
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

  describe('findById', () => {
    it('returns null when no Application matches the given id', async () => {
      const foundApplication =
        await applicationRepository.findById('nonexistent-id');

      expect(foundApplication).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('returns all Applications belonging to the given user', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const firstApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(firstApplication);

      const secondApplication = Application.create({
        title: 'Staff Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(secondApplication);

      const otherUserApplication = Application.create({
        title: 'Should not appear',
        companyId: company.id,
        userId: 'user-2',
      });
      await applicationRepository.save(otherUserApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((a) => a.id)).toEqual(
        expect.arrayContaining([firstApplication.id, secondApplication.id]),
      );
    });

    it('returns Applications ordered by most recently created first', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const olderApplication = Application.create({
        title: 'Older Application',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(olderApplication);
      await prisma.application.update({
        where: { id: olderApplication.id },
        data: { createdAt: new Date('2026-01-01T00:00:00.000Z') },
      });

      const newerApplication = Application.create({
        title: 'Newer Application',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(newerApplication);
      await prisma.application.update({
        where: { id: newerApplication.id },
        data: { createdAt: new Date('2026-01-02T00:00:00.000Z') },
      });

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items[0].id).toBe(newerApplication.id);
      expect(result.items[1].id).toBe(olderApplication.id);
    });

    it('returns an empty result when the user has no Applications', async () => {
      const result = await applicationRepository.findAllByUser(
        'user-without-applications',
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns only the requested page, while total reflects all matching Applications', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      for (let i = 0; i < 3; i++) {
        const application = Application.create({
          title: `Application ${i}`,
          companyId: company.id,
          userId: 'user-1',
        });
        await applicationRepository.save(application);
      }

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 2,
        pageSize: 2,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(3);
    });
  });
});
