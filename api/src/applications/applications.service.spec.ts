import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import type { Application } from './domain/application';
import { FakeApplicationRepository } from './test-utils/fakes/application.repository.fake';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('ApplicationsService', () => {
  let applicationService: ApplicationsService;
  let applicationRepository: FakeApplicationRepository;
  let companyRepository: FakeCompanyRepository;

  beforeEach(() => {
    companyRepository = new FakeCompanyRepository();
    applicationRepository = new FakeApplicationRepository(companyRepository);
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

    it('uses the existing Company for the given companyId, without creating a new Company', async () => {
      const existingCompany = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const secondApplication = await applicationService.create({
        title: 'Staff Engineer',
        companyName: 'Should be ignored',
        companyId: existingCompany.companyId,
        userId: 'user-1',
      });

      expect(secondApplication.companyId).toBe(existingCompany.companyId);
      const savedCompany =
        await companyRepository.findByNormalizedName('Should Be Ignored');
      expect(savedCompany).toBeNull();
    });

    it('throws a NotFoundException when the given companyId does not match any existing Company', async () => {
      await expect(
        applicationService.create({
          title: 'Senior Backend Engineer',
          companyName: 'Acme Corp',
          companyId: 'nonexistent-company-id',
          userId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundException);
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

  describe('getDetailById', () => {
    it('returns the Application and its company name for the given id', async () => {
      const newApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const detail = await applicationService.getDetailById(
        newApplication.id,
        'user-1',
      );

      expect(detail.application.id).toBe(newApplication.id);
      expect(detail.companyName).toBe('Acme Corp');
    });

    it('throws a NotFoundException when no Application matches the given id', async () => {
      await expect(
        applicationService.getDetailById('nonexistent-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws a NotFoundException when the Application belongs to a different user', async () => {
      const newApplication = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      await expect(
        applicationService.getDetailById(newApplication.id, 'user-2'),
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
      expect(result.items[0].application.id).toBe(firstApplication.id);
      expect(result.items[1].application.id).toBe(secondApplication.id);
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
      expect(result.items[0].application.title).toBe('Senior Backend Engineer');
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
      expect(result.items[0].application.id).toBe(firstApplication.id);
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
      expect(result.items.map((a) => a.application.id)).toEqual(
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

  describe('getRecentActivity', () => {
    it('returns an empty array when the user has no status changes', async () => {
      const activity = await applicationService.getRecentActivity(
        'user-without-applications',
      );

      expect(activity).toEqual([]);
    });

    it('returns the application title, company name, status, and event date for each status change', async () => {
      const application = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const activity = await applicationService.getRecentActivity('user-1');

      expect(activity).toEqual([
        {
          statusChangeId: application.statusHistory[0].id,
          applicationId: application.id,
          applicationTitle: 'Senior Backend Engineer',
          companyName: 'Acme Corp',
          status: 'APPLIED',
          eventDate: application.statusHistory[0].eventDate,
        },
      ]);
    });

    it('orders items by most recent eventDate first', async () => {
      const older = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });
      const newer = await applicationService.create({
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      await applicationService.changeStatus(older.id, 'user-1', {
        status: 'WAITING_FEEDBACK',
        eventDate: inOneDay,
      });
      await applicationService.changeStatus(newer.id, 'user-1', {
        status: 'WAITING_FEEDBACK',
        eventDate: inTwoDays,
      });

      const activity = await applicationService.getRecentActivity('user-1');

      expect(activity[0].applicationId).toBe(newer.id);
      expect(activity[0].eventDate).toEqual(inTwoDays);
    });

    it('does not include status changes belonging to a different user', async () => {
      await applicationService.create({
        title: 'Should not appear',
        companyName: 'Acme Corp',
        userId: 'user-2',
      });

      const activity = await applicationService.getRecentActivity('user-1');

      expect(activity).toEqual([]);
    });

    it('limits results to the given limit', async () => {
      for (let i = 0; i < 15; i++) {
        await applicationService.create({
          title: `Application ${i}`,
          companyName: 'Acme Corp',
          userId: 'user-1',
        });
      }

      const activity = await applicationService.getRecentActivity('user-1', 5);

      expect(activity).toHaveLength(5);
    });
  });

  describe('getApplicationsOverTime', () => {
    it("returns 12 weekly buckets based on the user's application createdAt dates", async () => {
      await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      const buckets =
        await applicationService.getApplicationsOverTime('user-1');

      expect(buckets).toHaveLength(12);
      expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(1);
    });

    it('does not include applications belonging to a different user', async () => {
      await applicationService.create({
        title: 'Should not count',
        companyName: 'Acme Corp',
        userId: 'user-2',
      });

      const buckets =
        await applicationService.getApplicationsOverTime('user-1');

      expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(0);
    });
  });

  describe('getUpcomingInterviews', () => {
    let application: Application;

    beforeEach(async () => {
      application = await applicationService.create({
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });
    });

    it('includes application title, company name, event date, and interview category for a scheduled interview', async () => {
      const eventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const updatedApplication = await applicationService.changeStatus(
        application.id,
        'user-1',
        {
          status: 'INTERVIEW_SCHEDULED',
          eventDate,
          interviewCategory: 'TECHNICAL',
        },
      );

      const interviews =
        await applicationService.getUpcomingInterviews('user-1');

      expect(interviews).toEqual([
        {
          statusChangeId: updatedApplication.statusHistory[1].id,
          applicationId: application.id,
          applicationTitle: 'Senior Backend Engineer',
          companyName: 'Acme Corp',
          eventDate,
          interviewCategory: 'TECHNICAL',
        },
      ]);
    });

    it('orders interviews by soonest eventDate first', async () => {
      const later = await applicationService.create({
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        userId: 'user-1',
      });

      await applicationService.changeStatus(later.id, 'user-1', {
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        interviewCategory: 'TECHNICAL',
      });
      await applicationService.changeStatus(application.id, 'user-1', {
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        interviewCategory: 'NON_TECHNICAL',
      });

      const interviews =
        await applicationService.getUpcomingInterviews('user-1');

      expect(interviews.map((i) => i.applicationId)).toEqual([
        application.id,
        later.id,
      ]);
    });

    it('does not include past interview dates', async () => {
      await applicationService.changeStatus(application.id, 'user-1', {
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        interviewCategory: 'TECHNICAL',
      });

      const interviews =
        await applicationService.getUpcomingInterviews('user-1');

      expect(interviews).toEqual([]);
    });

    it('does not include status changes that are not INTERVIEW_SCHEDULED', async () => {
      await applicationService.changeStatus(application.id, 'user-1', {
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const interviews =
        await applicationService.getUpcomingInterviews('user-1');

      expect(interviews).toEqual([]);
    });

    it('does not include interviews belonging to a different user', async () => {
      const otherUsersApplication = await applicationService.create({
        title: 'Should not appear',
        companyName: 'Acme Corp',
        userId: 'user-2',
      });
      await applicationService.changeStatus(
        otherUsersApplication.id,
        'user-2',
        {
          status: 'INTERVIEW_SCHEDULED',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          interviewCategory: 'TECHNICAL',
        },
      );

      const interviews =
        await applicationService.getUpcomingInterviews('user-1');

      expect(interviews).toEqual([]);
    });
  });
});
