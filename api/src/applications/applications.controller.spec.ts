import type { Request } from 'express';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { FakeApplicationRepository } from './test-utils/fakes/application.repository.fake';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('ApplicationsController', () => {
  let applicationsController: ApplicationsController;
  let applicationsService: ApplicationsService;

  beforeEach(() => {
    const companyRepository = new FakeCompanyRepository();
    applicationsService = new ApplicationsService(
      new FakeApplicationRepository(companyRepository),
      companyRepository,
    );
    applicationsController = new ApplicationsController(applicationsService);
  });

  describe('create', () => {
    it('creates an Application for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      const newApplication = await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      expect(newApplication.userId).toBe('user-1');
    });
  });

  describe('findAll', () => {
    it('returns all Applications for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      const result = await applicationsController.findAll(
        { page: 1, pageSize: 10 },
        mockRequest,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Senior Backend Engineer');
      expect(result.items[0].companyName).toBe('Acme Corp');
      expect(result.items[0].availableTransitions).toEqual([
        'WAITING_FEEDBACK',
        'ASSIGNMENT',
        'INTERVIEW_SCHEDULED',
        'OFFER',
        'REJECTED',
      ]);
    });

    it('includes the latest status change date on each item', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      const newApplication = await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      const result = await applicationsController.findAll(
        { page: 1, pageSize: 10 },
        mockRequest,
      );

      expect(result.items[0].updatedAt).toEqual(
        newApplication.statusHistory[0].eventDate,
      );
    });
  });

  describe('findOne', () => {
    it('returns the Application for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      const newApplication = await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      const application = await applicationsController.findOne(
        newApplication.id,
        mockRequest,
      );

      expect(application.id).toBe(newApplication.id);
    });
  });

  describe('changeStatus', () => {
    it('changes the status of the Application for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      const newApplication = await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      const updatedApplication = await applicationsController.changeStatus(
        newApplication.id,
        { status: 'WAITING_FEEDBACK', eventDate: new Date().toISOString() },
        mockRequest,
      );

      expect(updatedApplication.currentStatus).toBe('WAITING_FEEDBACK');
    });
  });

  describe('getStats', () => {
    it('returns the stats for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      const stats = await applicationsController.getStats(mockRequest);

      expect(stats).toEqual({
        total: 1,
        inProgress: 1,
        offers: 0,
        rejections: 0,
      });
    });
  });

  describe('getRecentActivity', () => {
    it('returns the recent activity for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      const application = await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      const activity = await applicationsController.getRecentActivity(
        {},
        mockRequest,
      );

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
  });

  describe('getApplicationsOverTime', () => {
    it('returns 12 weekly buckets for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );

      const buckets =
        await applicationsController.getApplicationsOverTime(mockRequest);

      expect(buckets).toHaveLength(12);
      expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(1);
    });
  });

  describe('getUpcomingInterviews', () => {
    it('returns upcoming interviews for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;

      const application = await applicationsController.create(
        { title: 'Senior Backend Engineer', companyName: 'Acme Corp' },
        mockRequest,
      );
      await applicationsController.changeStatus(
        application.id,
        {
          status: 'INTERVIEW_SCHEDULED',
          eventDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          interviewCategory: 'TECHNICAL',
        },
        mockRequest,
      );

      const interviews =
        await applicationsController.getUpcomingInterviews(mockRequest);

      expect(interviews).toHaveLength(1);
      expect(interviews[0]).toMatchObject({
        applicationId: application.id,
        applicationTitle: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        interviewCategory: 'TECHNICAL',
      });
    });
  });
});
