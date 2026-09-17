import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { FakeApplicationRepository } from './test-utils/fakes/application.repository.fake';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('ApplicationsService', () => {
  let applicationService: ApplicationsService;
  let applicationRepository: FakeApplicationRepository;
  let companyRepository: FakeCompanyRepository;

  beforeEach(() => {
    applicationRepository = new FakeApplicationRepository();
    companyRepository = new FakeCompanyRepository();
    applicationService = new ApplicationsService(
      applicationRepository,
      companyRepository,
    );
  });

  describe('create', () => {
    it('creates a new Company when none exists for the given name, then creates the Application', async () => {
      const newApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      expect(newApplication.title).toBe('Senior Backend Engineer');
      expect(newApplication.companyId).toEqual(expect.any(String));
      expect(newApplication.companyId).not.toBe('');

      const savedCompany =
        await companyRepository.findByNormalizedName('Acme Corp');
      expect(savedCompany?.id).toBe(newApplication.companyId);
    });

    it('reuses an existing Company instead of creating a duplicate, when one already matches the normalized name', async () => {
      const existingCompany =
        await companyRepository.findByNormalizedName('Acme Corp');
      expect(existingCompany).toBeNull();

      const firstApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const secondApplication = await applicationService.create({
        title: 'Staff Engineer',
        companyName: 'acme corp',
        userId: 'user-1',
      });

      expect(secondApplication.companyId).toBe(firstApplication.companyId);
    });
  });

  describe('findById', () => {
    it('returns the Application when one exists for the given id', async () => {
      const newApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const application = await applicationService.findById(newApplication.id);

      expect(application.id).toBe(newApplication.id);
      expect(application.title).toBe('Senior Backend Engineer');
    });

    it('throws a NotFoundException when no Application matches the given id', async () => {
      await expect(
        applicationService.findById('nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('changes the status of an existing Application and persists the update', async () => {
      const newApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const updatedApplication = await applicationService.changeStatus(
        newApplication.id,
        { status: 'WAITING_FEEDBACK', eventDate: new Date() },
      );

      expect(updatedApplication.currentStatus).toBe('WAITING_FEEDBACK');

      const persistedApplication = await applicationRepository.findById(
        newApplication.id,
      );
      expect(persistedApplication?.currentStatus).toBe('WAITING_FEEDBACK');
    });

    it('throws a NotFoundException when no Application matches the given id', async () => {
      await expect(
        applicationService.changeStatus('nonexistent-id', {
          status: 'WAITING_FEEDBACK',
          eventDate: new Date(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByUser', () => {
    it('returns all Applications belonging to the given user', async () => {
      const firstApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const secondApplication = await applicationService.create({
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      await applicationService.create({
        title: 'Should not appear',
        companyName: 'Acme Corp',
        userId: 'user-2',
      });

      const applications = await applicationService.findAllByUser('user-1');

      expect(applications).toHaveLength(2);
      expect(applications[0].id).toBe(firstApplication.id);
      expect(applications[1].id).toBe(secondApplication.id);
    });

    it('returns an empty array when the user has no Applications', async () => {
      const applications = await applicationService.findAllByUser(
        'user-without-applications',
      );

      expect(applications).toEqual([]);
    });
  });
});
