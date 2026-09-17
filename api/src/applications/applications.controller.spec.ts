import type { Request } from 'express';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { FakeApplicationRepository } from './test-utils/fakes/application.repository.fake';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('ApplicationsController', () => {
  let applicationsController: ApplicationsController;
  let applicationsService: ApplicationsService;

  beforeEach(() => {
    applicationsService = new ApplicationsService(
      new FakeApplicationRepository(),
      new FakeCompanyRepository(),
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

      const applications = await applicationsController.findAll(mockRequest);

      expect(applications).toHaveLength(1);
      expect(applications[0].userId).toBe('user-1');
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
});
