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

      const application = await applicationService.findById(
        newApplication.id,
        'user-1',
      );

      expect(application.id).toBe(newApplication.id);
      expect(application.title).toBe('Senior Backend Engineer');
    });

    it('throws a NotFoundException when no Application matches the given id', async () => {
      await expect(
        applicationService.findById('nonexistent-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws a NotFoundException when the Application belongs to a different user', async () => {
      const newApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      await expect(
        applicationService.findById(newApplication.id, 'user-2'),
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
        'user-1',
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
        applicationService.changeStatus('nonexistent-id', 'user-1', {
          status: 'WAITING_FEEDBACK',
          eventDate: new Date(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws a NotFoundException when the Application belongs to a different user', async () => {
      const newApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      await expect(
        applicationService.changeStatus(newApplication.id, 'user-2', {
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

      const result = await applicationService.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(firstApplication.id);
      expect(result.items[1].id).toBe(secondApplication.id);
    });

    it('returns an empty result when the user has no Applications', async () => {
      const result = await applicationService.findAllByUser(
        'user-without-applications',
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns only the requested page of results', async () => {
      for (let i = 0; i < 3; i++) {
        await applicationService.create({
          title: `Application ${i}`,
          companyName: 'Acme Corp',
          userId: 'user-1',
        });
      }

      const result = await applicationService.findAllByUser('user-1', {
        page: 2,
        pageSize: 2,
      });

      expect(result.items).toHaveLength(1);
    });

    it('returns the total count of matching Applications, not just the current page', async () => {
      for (let i = 0; i < 3; i++) {
        await applicationService.create({
          title: `Application ${i}`,
          companyName: 'Acme Corp',
          userId: 'user-1',
        });
      }

      const result = await applicationService.findAllByUser('user-1', {
        page: 1,
        pageSize: 2,
      });

      expect(result.total).toBe(3);
    });

    it('returns only Applications whose title matches the search term', async () => {
      await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });
      await applicationService.create({
        title: 'Frontend Developer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const result = await applicationService.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        search: 'backend',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Senior Backend Engineer');
    });
    it('returns all Applications when no search term is provided', async () => {
      await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });
      await applicationService.create({
        title: 'Frontend Developer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const result = await applicationService.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(2);
    });
    it('returns an empty result when no Application matches the search term', async () => {
      await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const result = await applicationService.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        search: 'nonexistent',
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns only Applications matching the given status', async () => {
      const firstApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });
      await applicationService.create({
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      await applicationService.changeStatus(firstApplication.id, 'user-1', {
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });

      const result = await applicationService.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        status: 'WAITING_FEEDBACK',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(firstApplication.id);
    });
    it('returns all Applications when no status filter is provided', async () => {
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

      await applicationService.changeStatus(firstApplication.id, 'user-1', {
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });

      const result = await applicationService.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((a) => a.id)).toEqual(
        expect.arrayContaining([firstApplication.id, secondApplication.id]),
      );
    });
  });

  describe('getStats', () => {
    it('returns all zeros when the user has no Applications', async () => {
      const stats = await applicationService.getStats(
        'user-without-applications',
      );

      expect(stats).toEqual({
        total: 0,
        inProgress: 0,
        offers: 0,
        rejections: 0,
      });
    });
    it('returns the correct total and bucketed counts based on the Applications statuses', async () => {
      await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const offerApplication = await applicationService.create({
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });
      await applicationService.changeStatus(offerApplication.id, 'user-1', {
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      await applicationService.changeStatus(offerApplication.id, 'user-1', {
        status: 'ASSIGNMENT',
        eventDate: new Date(),
      });
      await applicationService.changeStatus(offerApplication.id, 'user-1', {
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(),
        interviewCategory: 'TECHNICAL',
      });
      await applicationService.changeStatus(offerApplication.id, 'user-1', {
        status: 'OFFER',
        eventDate: new Date(),
      });

      const rejectedApplication = await applicationService.create({
        title: 'Platform Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });
      await applicationService.changeStatus(rejectedApplication.id, 'user-1', {
        status: 'REJECTED',
        eventDate: new Date(),
      });

      const stats = await applicationService.getStats('user-1');

      expect(stats).toEqual({
        total: 3,
        inProgress: 1,
        offers: 1,
        rejections: 1,
      });
    });
  });
});
